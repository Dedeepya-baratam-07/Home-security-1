/**
 * Home Security App — Shared UI Utilities
 * Manages toasts, theme toggles, audio feedback, modals, header clock, and navigation shell.
 */

const UI = {
  /**
   * Initializes theme, header clock, sidebar handlers, and icons
   */
  init() {
    this.initTheme();
    this.initClock();
    this.initSidebar();
    this.initHeaderStatus();
    this.renderIcons();

    // Listen to storage changes to keep header status pill in sync
    window.addEventListener('security-storage-update', () => {
      this.updateHeaderStatus();
    });
  },

  /**
   * Safe Lucide icon renderer
   */
  renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  },

  /**
   * Web Audio API Chime generator
   */
  playSound(type = 'safe') {
    const settings = window.securityStorage?.getSettings();
    if (settings && settings.soundAlerts === false) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'alert' || type === 'danger' || type === 'critical') {
        // Warning 2-tone beep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Gentle success/neutral chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.26);
      }
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  },

  /**
   * Displays a floating toast notification
   * @param {string} message 
   * @param {'success'|'error'|'warning'|'info'} type 
   * @param {number} duration 
   */
  showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';
    if (type === 'warning') iconName = 'alert-circle';

    toast.innerHTML = `
      <div class="toast-icon"><i data-lucide="${iconName}"></i></div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    container.appendChild(toast);
    this.renderIcons();

    if (type === 'error' || type === 'warning') {
      this.playSound('alert');
    } else {
      this.playSound('safe');
    }

    const removeToast = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    };

    toast.querySelector('.toast-close').addEventListener('click', removeToast);
    setTimeout(removeToast, duration);
  },

  /**
   * Theme Initialization & Toggle
   */
  initTheme() {
    const settings = window.securityStorage ? window.securityStorage.getSettings() : { theme: 'dark' };
    const savedTheme = settings.theme || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => this.toggleTheme());
    });
  },

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);

    if (window.securityStorage) {
      window.securityStorage.updateSettings({ theme: newTheme });
    }
    this.renderIcons();
    this.showToast(`Theme switched to ${newTheme} mode`, 'info', 2000);
  },

  /**
   * Header Live Clock
   */
  initClock() {
    const clockEl = document.querySelector('.header-clock');
    if (!clockEl) return;

    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      clockEl.innerHTML = `<i data-lucide="clock"></i> <span>${timeStr}</span>`;
      this.renderIcons();
    };

    updateTime();
    setInterval(updateTime, 1000);
  },

  /**
   * Mobile Sidebar Drawer
   */
  initSidebar() {
    const toggleBtn = document.querySelector('.menu-toggle-btn');
    const sidebar = document.querySelector('.app-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (!toggleBtn || !sidebar) return;

    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    });

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
  },

  /**
   * Header Security Status Pill
   */
  initHeaderStatus() {
    this.updateHeaderStatus();
  },

  updateHeaderStatus() {
    const statusPill = document.querySelector('.header-status-pill');
    if (!statusPill || !window.securityStorage) return;

    const overview = window.securityStorage.getSecurityOverview();
    if (overview.status === 'SAFE') {
      statusPill.className = 'header-status-pill status-pill-safe';
      statusPill.innerHTML = '<span class="status-dot"></span> <span>System Safe</span>';
    } else {
      statusPill.className = 'header-status-pill status-pill-alert';
      statusPill.innerHTML = `<span class="status-dot"></span> <span>Alert Active (${overview.activeCount})</span>`;
    }

    // Update active badge in sidebar navigation if exists
    const navBadge = document.querySelector('.nav-item-badge');
    if (navBadge) {
      if (overview.activeCount > 0) {
        navBadge.style.display = 'inline-block';
        navBadge.textContent = overview.activeCount;
      } else {
        navBadge.style.display = 'none';
      }
    }
  },

  /**
   * Modal Management
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    this.renderIcons();
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  },

  setupModalDismissals() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });

    document.querySelectorAll('.modal-close-btn, [data-modal-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
          modal.classList.remove('active');
          document.body.style.overflow = '';
        });
      }
    });
  }
};

// Initialize UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  UI.init();
  UI.setupModalDismissals();
});
