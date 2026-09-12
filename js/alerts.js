/**
 * Home Security App — Security Alerts Controller
 * Manages alert listing, multi-filter search, custom alert simulation modal, and resolution actions.
 */

const AlertsPage = {
  currentFilter: 'all',
  currentSeverity: 'all',
  searchQuery: '',

  init() {
    Auth.guardProtectedPage();
    this.renderAlerts();
    this.bindSearchAndFilters();
    this.bindSimulationModal();
    this.bindStorageEvents();
  },

  bindStorageEvents() {
    window.addEventListener('security-storage-update', () => {
      this.renderAlerts();
    });
  },

  /**
   * Filter and Search listeners
   */
  bindSearchAndFilters() {
    const searchInput = document.getElementById('alerts-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderAlerts();
      });
    }

    const filterBtns = document.querySelectorAll('.filter-tab-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.getAttribute('data-filter');
        this.renderAlerts();
      });
    });

    const severitySelect = document.getElementById('alerts-severity-filter');
    if (severitySelect) {
      severitySelect.addEventListener('change', (e) => {
        this.currentSeverity = e.target.value;
        this.renderAlerts();
      });
    }
  },

  /**
   * Modal Simulation Form
   */
  bindSimulationModal() {
    const openModalBtn = document.getElementById('open-simulate-modal-btn');
    if (openModalBtn) {
      openModalBtn.addEventListener('click', () => {
        UI.openModal('simulate-alert-modal');
      });
    }

    const simForm = document.getElementById('simulate-alert-form');
    if (simForm) {
      simForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('sim-event-type').value;
        const location = document.getElementById('sim-event-location').value.trim();
        const severity = document.getElementById('sim-event-severity').value;
        const notes = document.getElementById('sim-event-notes').value.trim();

        if (!type || !location) {
          UI.showToast('Please specify both event type and location.', 'error');
          return;
        }

        let icon = 'alert-triangle';
        if (type.includes('Motion')) icon = 'activity';
        if (type.includes('Door')) icon = 'door-open';
        if (type.includes('Window')) icon = 'square';
        if (type.includes('Smoke')) icon = 'flame';

        const newAlert = window.securityStorage.addAlert({
          type,
          location,
          severity,
          notes,
          icon
        });

        UI.closeModal('simulate-alert-modal');
        simForm.reset();
        UI.showToast(`Simulated Alert Created: ${newAlert.id}`, 'error');
      });
    }
  },

  /**
   * Main Alert Grid Render Engine
   */
  renderAlerts() {
    const listContainer = document.getElementById('alerts-grid-container');
    const countBadge = document.getElementById('alerts-total-count');
    if (!listContainer) return;

    let alerts = window.securityStorage.getAlerts();

    // 1. Status Filter
    if (this.currentFilter === 'active') {
      alerts = alerts.filter(a => a.status === 'Active');
    } else if (this.currentFilter === 'resolved') {
      alerts = alerts.filter(a => a.status === 'Resolved');
    }

    // 2. Severity Filter
    if (this.currentSeverity !== 'all') {
      alerts = alerts.filter(a => a.severity.toLowerCase() === this.currentSeverity.toLowerCase());
    }

    // 3. Search Query Filter
    if (this.searchQuery) {
      alerts = alerts.filter(a => 
        a.type.toLowerCase().includes(this.searchQuery) ||
        a.location.toLowerCase().includes(this.searchQuery) ||
        a.id.toLowerCase().includes(this.searchQuery) ||
        (a.notes && a.notes.toLowerCase().includes(this.searchQuery))
      );
    }

    if (countBadge) {
      countBadge.textContent = `${alerts.length} Alert${alerts.length === 1 ? '' : 's'}`;
    }

    if (alerts.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon"><i data-lucide="shield-check"></i></div>
          <h3>No Alerts Matching Criteria</h3>
          <p>Try adjusting your search query, status tabs, or severity filters.</p>
          <button class="btn btn-primary btn-sm" onclick="UI.openModal('simulate-alert-modal')">
            <i data-lucide="plus-circle"></i> Simulate New Alert
          </button>
        </div>
      `;
      UI.renderIcons();
      return;
    }

    let html = '';
    alerts.forEach(alert => {
      const isActive = alert.status === 'Active';
      const severityClass = alert.severity.toLowerCase();

      html += `
        <div class="card alert-card ${isActive ? 'alert-card-active' : 'alert-card-resolved'}">
          <div class="alert-card-header">
            <div class="alert-type-group">
              <div class="alert-card-icon">
                <i data-lucide="${isActive ? 'alert-triangle' : 'check-circle-2'}"></i>
              </div>
              <div>
                <h3 class="alert-title">${alert.type}</h3>
                <span class="alert-id-tag">${alert.id}</span>
              </div>
            </div>
            <div class="alert-badges">
              <span class="badge badge-${severityClass}">${alert.severity}</span>
              <span class="badge badge-${isActive ? 'alert' : 'safe'}">${alert.status}</span>
            </div>
          </div>

          <div class="alert-card-body">
            <div class="alert-detail-row">
              <span class="detail-label"><i data-lucide="map-pin"></i> Location:</span>
              <span class="detail-value"><strong>${alert.location}</strong></span>
            </div>
            <div class="alert-detail-row">
              <span class="detail-label"><i data-lucide="clock"></i> Detected:</span>
              <span class="detail-value">${alert.date} at ${alert.time}</span>
            </div>
            ${alert.resolvedAt ? `
              <div class="alert-detail-row">
                <span class="detail-label"><i data-lucide="check-check"></i> Resolved:</span>
                <span class="detail-value">${new Date(alert.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            ` : ''}
            <p class="alert-notes-text">${alert.notes || 'No additional remarks logged.'}</p>
          </div>

          <div class="alert-card-footer">
            ${isActive ? `
              <button class="btn btn-success btn-sm btn-full resolve-btn" data-id="${alert.id}">
                <i data-lucide="check"></i> Resolve Alert
              </button>
            ` : `
              <div class="resolved-status-indicator">
                <i data-lucide="shield-check"></i> Resolved & Logged to History
              </div>
            `}
          </div>
        </div>
      `;
    });

    listContainer.innerHTML = html;

    // Bind resolve triggers
    listContainer.querySelectorAll('.resolve-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        window.securityStorage.resolveAlert(id);
        UI.showToast(`Alert ${id} resolved successfully!`, 'success');
      });
    });

    UI.renderIcons();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AlertsPage.init();
});
