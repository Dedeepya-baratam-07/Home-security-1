/**
 * Home Security App — Emergency / SOS Controller
 * Manages 2-step SOS activation, siren states, responder quick-actions, and emergency dispatch history.
 */

const EmergencyPage = {
  activeSosEvent: null,

  init() {
    Auth.guardProtectedPage();
    this.checkActiveSos();
    this.bindSosButton();
    this.bindDisarmButton();
    this.renderResponders();
    this.renderSosHistory();
    this.bindStorageEvents();
  },

  bindStorageEvents() {
    window.addEventListener('security-storage-update', () => {
      this.checkActiveSos();
      this.renderResponders();
      this.renderSosHistory();
    });
  },

  checkActiveSos() {
    const sosEvents = window.securityStorage.getSosEvents();
    const active = sosEvents.find(s => s.status === 'Active');
    const banner = document.getElementById('active-alarm-banner');
    const bannerInfo = document.getElementById('alarm-banner-details');

    if (active) {
      this.activeSosEvent = active;
      if (banner) {
        banner.classList.add('active');
        if (bannerInfo) {
          bannerInfo.textContent = `Triggered on ${active.date} at ${active.time} — High Priority Dispatch Mode`;
        }
      }
    } else {
      this.activeSosEvent = null;
      if (banner) {
        banner.classList.remove('active');
      }
    }
  },

  bindSosButton() {
    const sosBtn = document.getElementById('main-sos-button');
    if (sosBtn) {
      sosBtn.addEventListener('click', () => {
        UI.openModal('sos-confirm-modal');
      });
    }

    const confirmForm = document.getElementById('sos-confirm-form');
    if (confirmForm) {
      confirmForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const reason = document.getElementById('sos-reason-input').value.trim() || 'Simulated Emergency Button Activated';
        
        UI.closeModal('sos-confirm-modal');
        const sosEvent = window.securityStorage.triggerSos(reason);
        this.activeSosEvent = sosEvent;

        UI.showToast('🚨 CRITICAL EMERGENCY SOS ACTIVATED! Siren sounding.', 'error', 5000);
        this.checkActiveSos();
        this.renderSosHistory();
      });
    }
  },

  bindDisarmButton() {
    const disarmBtn = document.getElementById('disarm-alarm-btn');
    if (disarmBtn) {
      disarmBtn.addEventListener('click', () => {
        if (confirm('Disarm the active emergency alarm and return system to normal SAFE status?')) {
          if (this.activeSosEvent) {
            window.securityStorage.disarmSos(this.activeSosEvent.id);
          }
          // Resolve any active alerts to bring system back to SAFE
          const activeAlerts = window.securityStorage.getActiveAlerts();
          activeAlerts.forEach(a => {
            window.securityStorage.resolveAlert(a.id);
          });

          this.checkActiveSos();
          this.renderSosHistory();
          UI.showToast('Alarm Disarmed. System returned to SAFE status.', 'success');
        }
      });
    }
  },

  renderResponders() {
    const container = document.getElementById('emergency-responders-list');
    if (!container) return;

    const contacts = window.securityStorage.getContacts();

    if (contacts.length === 0) {
      container.innerHTML = `
        <p style="color: var(--text-muted); font-size: 0.88rem;">No emergency contacts configured. <a href="contacts.html">Add contacts here</a>.</p>
      `;
      return;
    }

    let html = '';
    contacts.forEach(contact => {
      html += `
        <div class="responder-card">
          <div class="responder-info">
            <h4>${contact.name} ${contact.isPrimary ? '<span class="badge badge-info" style="font-size: 0.65rem;">Primary</span>' : ''}</h4>
            <span>${contact.relationship} &bull; ${contact.phone}</span>
          </div>
          <div class="responder-actions">
            <button class="btn btn-outline btn-sm sim-call-btn" data-name="${contact.name}">
              <i data-lucide="phone-call"></i> Call
            </button>
            <button class="btn btn-outline btn-sm sim-sms-btn" data-name="${contact.name}">
              <i data-lucide="message-square"></i> SMS
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.sim-call-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        UI.showToast(`Simulated Call placed to: ${name} (Connecting...)`, 'info');
      });
    });

    container.querySelectorAll('.sim-sms-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        UI.showToast(`Simulated SOS Emergency Alert SMS sent to: ${name}`, 'success');
      });
    });

    UI.renderIcons();
  },

  renderSosHistory() {
    const container = document.getElementById('sos-history-list');
    if (!container) return;

    const sosEvents = window.securityStorage.getSosEvents();

    if (sosEvents.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 24px;">
          <p>No historical SOS triggers logged. System has maintained peace.</p>
        </div>
      `;
      return;
    }

    let html = '';
    sosEvents.forEach(event => {
      const isDisarmed = event.status === 'Disarmed';
      html += `
        <div class="alert-feed-item" style="border-left: 4px solid ${isDisarmed ? 'var(--color-safe)' : 'var(--color-alert)'};">
          <div class="alert-item-left">
            <div class="alert-item-icon" style="background: ${isDisarmed ? 'var(--color-safe-bg)' : 'var(--color-alert-bg)'}; color: ${isDisarmed ? 'var(--color-safe)' : 'var(--color-alert)'};">
              <i data-lucide="${isDisarmed ? 'shield-check' : 'alert-octagon'}"></i>
            </div>
            <div class="alert-item-info">
              <h4>${event.type} — <span style="font-weight: 500; font-family: monospace;">${event.id}</span></h4>
              <div class="alert-item-meta">
                <span>${event.date} at ${event.time}</span>
                <span class="badge badge-${isDisarmed ? 'safe' : 'critical'}">${event.status}</span>
                <span>${event.notes}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    UI.renderIcons();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  EmergencyPage.init();
});
