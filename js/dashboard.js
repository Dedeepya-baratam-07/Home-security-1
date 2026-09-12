/**
 * Home Security App — Dashboard Controller
 * Powers dynamic security status, stat metrics, quick simulation triggers, and recent alerts feed.
 */

const Dashboard = {
  init() {
    Auth.guardProtectedPage();
    this.renderDashboard();
    this.bindQuickActions();
    this.bindStorageEvents();
  },

  bindStorageEvents() {
    window.addEventListener('security-storage-update', () => {
      this.renderDashboard();
    });
  },

  /**
   * Re-computes and renders all dashboard widgets
   */
  renderDashboard() {
    if (!window.securityStorage) return;

    const overview = window.securityStorage.getSecurityOverview();
    const user = window.securityStorage.getCurrentUser();

    // Update greeting and resident name
    const greetingEl = document.getElementById('dashboard-greeting');
    if (greetingEl && user) {
      greetingEl.textContent = `Welcome back, ${user.name.split(' ')[0]}`;
    }

    // 1. Render Hero Security Status Banner
    this.renderStatusHero(overview);

    // 2. Render Metric Statistics
    this.renderMetrics(overview);

    // 3. Render Recent Security Alerts Feed
    this.renderRecentAlerts();

    // Re-trigger Lucide icons
    UI.renderIcons();
  },

  /**
   * Hero Security Status Banner (SAFE vs ALERT)
   */
  renderStatusHero(overview) {
    const heroCard = document.getElementById('status-hero-card');
    const heroBadge = document.getElementById('status-hero-badge');
    const heroTitle = document.getElementById('status-hero-title');
    const heroDesc = document.getElementById('status-hero-desc');
    const lastChecked = document.getElementById('status-last-checked');

    if (!heroCard) return;

    if (overview.status === 'SAFE') {
      heroCard.className = 'status-hero-card status-safe';
      heroBadge.innerHTML = '<i data-lucide="shield-check"></i>';
      heroTitle.innerHTML = '🟢 System Status: SAFE';
      heroDesc.textContent = 'All perimeter zones, sensors, and entrance monitors are secured. No active threats detected.';
    } else {
      heroCard.className = 'status-hero-card status-alert';
      heroBadge.innerHTML = '<i data-lucide="shield-alert"></i>';
      heroTitle.innerHTML = `🔴 System Status: SECURITY ALERT (${overview.activeCount} Active)`;
      const latestAlert = overview.activeAlerts[0];
      heroDesc.textContent = latestAlert 
        ? `Breach detected: ${latestAlert.type} in ${latestAlert.location}. Immediate review required.`
        : 'One or more security alerts require your attention.';
    }

    if (lastChecked) {
      lastChecked.textContent = overview.lastChecked;
    }
  },

  /**
   * Stat Metric Cards
   */
  renderMetrics(overview) {
    const activeEl = document.getElementById('stat-active-alerts');
    const todayEl = document.getElementById('stat-today-events');
    const resolvedEl = document.getElementById('stat-resolved-alerts');
    const contactsEl = document.getElementById('stat-emergency-contacts');

    if (activeEl) activeEl.textContent = overview.activeCount;
    if (todayEl) todayEl.textContent = overview.todayCount;
    if (resolvedEl) resolvedEl.textContent = overview.resolvedCount;
    if (contactsEl) contactsEl.textContent = overview.contactsCount;
  },

  /**
   * Quick Simulation Triggers
   */
  bindQuickActions() {
    // 1. Motion Detected
    const motionBtn = document.getElementById('sim-motion-btn');
    if (motionBtn) {
      motionBtn.addEventListener('click', () => {
        window.securityStorage.addAlert({
          type: 'Motion Detected',
          location: 'Living Room',
          severity: 'Medium',
          notes: 'Simulated infrared PIR motion sensor tripped in central living room.',
          icon: 'activity'
        });
        UI.showToast('🚨 Alert Triggered: Motion Detected in Living Room!', 'error');
      });
    }

    // 2. Door Opened
    const doorBtn = document.getElementById('sim-door-btn');
    if (doorBtn) {
      doorBtn.addEventListener('click', () => {
        window.securityStorage.addAlert({
          type: 'Door Opened',
          location: 'Main Entrance',
          severity: 'High',
          notes: 'Magnetic contact sensor disengaged at main front entrance door.',
          icon: 'door-open'
        });
        UI.showToast('🚨 Alert Triggered: Main Entrance Door Opened!', 'error');
      });
    }

    // 3. Window Opened
    const windowBtn = document.getElementById('sim-window-btn');
    if (windowBtn) {
      windowBtn.addEventListener('click', () => {
        window.securityStorage.addAlert({
          type: 'Window Opened',
          location: 'Master Bedroom',
          severity: 'Medium',
          notes: 'Vibration & open contact sensor triggered at ground floor bedroom window.',
          icon: 'square'
        });
        UI.showToast('🚨 Alert Triggered: Window Opened in Master Bedroom!', 'warning');
      });
    }

    // 4. Emergency SOS
    const sosBtn = document.getElementById('sim-sos-btn');
    if (sosBtn) {
      sosBtn.addEventListener('click', () => {
        if (confirm('Simulate Critical Emergency SOS Alarm?')) {
          window.securityStorage.triggerSos('Quick Action Emergency SOS Triggered from Dashboard');
          UI.showToast('🚨 EMERGENCY SOS TRIGGERED! System in Critical Alarm.', 'error');
        }
      });
    }

    // 5. Reset Demo State Button
    const resetBtn = document.getElementById('demo-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset application data to initial demo state (0 active alerts / SAFE)?')) {
          window.securityStorage.resetToDemo();
          UI.showToast('Demo data reset to clean SAFE state.', 'info');
        }
      });
    }
  },

  /**
   * Recent Security Alerts Feed
   */
  renderRecentAlerts() {
    const listContainer = document.getElementById('recent-alerts-list');
    if (!listContainer) return;

    const alerts = window.securityStorage.getAlerts().slice(0, 5); // top 5

    if (alerts.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="shield-check"></i></div>
          <h3>All Systems Secure</h3>
          <p>No active or recent alerts recorded. Your residence is fully protected.</p>
          <button class="btn btn-sm btn-outline" id="empty-sim-btn">
            <i data-lucide="play"></i> Simulate an Alert
          </button>
        </div>
      `;
      const emptySim = document.getElementById('empty-sim-btn');
      if (emptySim) {
        emptySim.addEventListener('click', () => {
          document.getElementById('sim-motion-btn')?.click();
        });
      }
      return;
    }

    let html = '';
    alerts.forEach(alert => {
      const isActive = alert.status === 'Active';
      const severityClass = alert.severity.toLowerCase();

      html += `
        <div class="alert-feed-item ${isActive ? 'alert-active' : 'alert-resolved'}">
          <div class="alert-item-left">
            <div class="alert-item-icon">
              <i data-lucide="${isActive ? 'alert-triangle' : 'check-circle-2'}"></i>
            </div>
            <div class="alert-item-info">
              <h4>${alert.type} — <span style="font-weight: 500; color: var(--text-secondary);">${alert.location}</span></h4>
              <div class="alert-item-meta">
                <span><i data-lucide="clock" style="width: 13px; height: 13px; vertical-align: middle;"></i> ${alert.date} ${alert.time}</span>
                <span class="badge badge-${severityClass}">${alert.severity}</span>
                <span class="badge badge-${isActive ? 'alert' : 'safe'}">${alert.status}</span>
              </div>
            </div>
          </div>
          <div class="alert-item-actions">
            ${isActive ? `
              <button class="btn btn-sm btn-success resolve-alert-btn" data-id="${alert.id}">
                <i data-lucide="check"></i> Resolve
              </button>
            ` : `
              <span style="font-size: 0.8rem; color: var(--color-safe); font-weight: 500;">
                <i data-lucide="check-check" style="width: 14px; height: 14px; vertical-align: middle;"></i> Resolved
              </span>
            `}
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;

    // Bind resolve buttons
    listContainer.querySelectorAll('.resolve-alert-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        window.securityStorage.resolveAlert(id);
        UI.showToast(`Alert ${id} has been resolved.`, 'success');
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Dashboard.init();
});
