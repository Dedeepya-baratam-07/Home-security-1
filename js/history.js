/**
 * Home Security App — Security History & Audit Log Controller
 * Manages chronological event logging, multi-filter search, and history maintenance.
 */

const HistoryPage = {
  searchQuery: '',
  severityFilter: 'all',
  statusFilter: 'all',

  init() {
    Auth.guardProtectedPage();
    this.renderHistory();
    this.bindFilters();
    this.bindActions();
    this.bindStorageEvents();
  },

  bindStorageEvents() {
    window.addEventListener('security-storage-update', () => {
      this.renderHistory();
    });
  },

  bindFilters() {
    const searchInput = document.getElementById('history-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderHistory();
      });
    }

    const sevSelect = document.getElementById('history-severity-filter');
    if (sevSelect) {
      sevSelect.addEventListener('change', (e) => {
        this.severityFilter = e.target.value;
        this.renderHistory();
      });
    }

    const statSelect = document.getElementById('history-status-filter');
    if (statSelect) {
      statSelect.addEventListener('change', (e) => {
        this.statusFilter = e.target.value;
        this.renderHistory();
      });
    }
  },

  bindActions() {
    const clearBtn = document.getElementById('clear-history-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the security history audit log?')) {
          window.securityStorage.clearHistory();
          UI.showToast('Security history log cleared.', 'info');
        }
      });
    }

    const exportBtn = document.getElementById('export-history-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const history = window.securityStorage.getHistory();
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `security-history-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        UI.showToast('Audit log exported successfully.', 'success');
      });
    }
  },

  renderHistory() {
    const tableBody = document.getElementById('history-table-body');
    const totalBadge = document.getElementById('history-total-count');
    if (!tableBody) return;

    let history = window.securityStorage.getHistory();

    // 1. Filter Severity
    if (this.severityFilter !== 'all') {
      history = history.filter(h => h.severity && h.severity.toLowerCase() === this.severityFilter.toLowerCase());
    }

    // 2. Filter Status
    if (this.statusFilter !== 'all') {
      history = history.filter(h => h.status && h.status.toLowerCase() === this.statusFilter.toLowerCase());
    }

    // 3. Search Query
    if (this.searchQuery) {
      history = history.filter(h => 
        (h.type && h.type.toLowerCase().includes(this.searchQuery)) ||
        (h.location && h.location.toLowerCase().includes(this.searchQuery)) ||
        (h.id && h.id.toLowerCase().includes(this.searchQuery)) ||
        (h.notes && h.notes.toLowerCase().includes(this.searchQuery))
      );
    }

    if (totalBadge) {
      totalBadge.textContent = `${history.length} Event${history.length === 1 ? '' : 's'}`;
    }

    if (history.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 48px 16px;">
            <div class="empty-state">
              <div class="empty-state-icon"><i data-lucide="archive"></i></div>
              <h3>No History Records Found</h3>
              <p>Simulated events and resolved alerts will automatically be catalogued here.</p>
            </div>
          </td>
        </tr>
      `;
      UI.renderIcons();
      return;
    }

    let html = '';
    history.forEach(item => {
      const severityClass = (item.severity || 'low').toLowerCase();
      const isResolved = item.status === 'Resolved';

      html += `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="stat-icon-wrapper" style="width: 32px; height: 32px; font-size: 1rem; ${isResolved ? 'background: var(--color-safe-bg); color: var(--color-safe);' : 'background: var(--color-alert-bg); color: var(--color-alert);'}">
                <i data-lucide="${isResolved ? 'check-circle' : 'alert-triangle'}"></i>
              </div>
              <div>
                <strong>${item.type}</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">${item.id || item.alertId || 'LOG'}</div>
              </div>
            </div>
          </td>
          <td>
            <span style="font-weight: 500;"><i data-lucide="map-pin" style="width: 13px; height: 13px; vertical-align: middle; color: var(--text-muted);"></i> ${item.location || 'Residence'}</span>
          </td>
          <td>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">${item.date} <span style="color: var(--text-muted);">${item.time}</span></span>
          </td>
          <td>
            <span class="badge badge-${severityClass}">${item.severity || 'Normal'}</span>
          </td>
          <td>
            <span class="badge badge-${isResolved ? 'safe' : 'alert'}">${item.status || 'Logged'}</span>
          </td>
          <td>
            <span style="font-size: 0.82rem; color: var(--text-secondary);">${item.notes || 'System diagnostic entry'}</span>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
    UI.renderIcons();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  HistoryPage.init();
});
