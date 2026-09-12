/**
 * Home Security App — Shared UI Utilities
 * Manages toasts, theme toggles, audio alarms, modals, header clock, and navigation shell.
 */

const UI = {
  audioCtx: null,
  alertLoopInterval: null,

  /**
   * Initializes theme, header clock, sidebar handlers, icons, and audio context unlocker
   */
  init() {
    this.initTheme();
    this.initClock();
    this.initSidebar();
    this.initHeaderStatus();
    this.initAudioContext();
    this.renderIcons();

    // Listen to storage changes to keep header status pill in sync
    window.addEventListener('security-storage-update', () => {
      this.updateHeaderStatus();
      this.syncAlertAudioLoop();
    });

    // Initial check for active alerts on page load
    setTimeout(() => {
      this.syncAlertAudioLoop();
    }, 500);
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
   * Gets or creates a live, running AudioContext
   */
  getAudioContext() {
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.audioCtx = new AudioCtx();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch (e) {
      console.warn('AudioContext initialization notice:', e);
      return null;
    }
  },

  /**
   * Unlocks audio on any user touch/click
   */
  initAudioContext() {
    const unlock = () => {
      this.getAudioContext();
    };

    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
  },

  /**
   * Plays a loud, realistic Security Alarm Siren / Chime
   */
  playSound(type = 'alert') {
    const settings = window.securityStorage?.getSettings();
    if (settings && settings.soundAlerts === false) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (type === 'alert' || type === 'critical' || type === 'alarm' || type === 'error') {
        // High-pitch dual-tone emergency security siren
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';

        // Frequency sweep (Security alarm warble)
        const duration = 0.65; // seconds
        osc1.frequency.setValueAtTime(880, now); // A5
        osc1.frequency.linearRampToValueAtTime(587.33, now + 0.18); // D5
        osc1.frequency.linearRampToValueAtTime(987.77, now + 0.36); // B5
        osc1.frequency.linearRampToValueAtTime(659.25, now + 0.52); // E5
        osc1.frequency.linearRampToValueAtTime(880, now + duration);

        osc2.frequency.setValueAtTime(440, now); // Sub-harmonic
        osc2.frequency.linearRampToValueAtTime(550, now + 0.3);
        osc2.frequency.linearRampToValueAtTime(440, now + duration);

        // Punchy volume envelope
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.setValueAtTime(0.35, now + duration - 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);

      } else if (type === 'warning') {
        // Double warning alert beep
        const playBeep = (time, freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, time);
          gain.gain.setValueAtTime(0.28, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(time);
          osc.stop(time + 0.19);
        };

        playBeep(now, 800);
        playBeep(now + 0.22, 950);

      } else {
        // Uplifting Safe / Resolution chord
        const playNote = (time, freq, dur) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);
          gain.gain.setValueAtTime(0.2, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(time);
          osc.stop(time + dur);
        };

        playNote(now, 523.25, 0.25);        // C5
        playNote(now + 0.09, 659.25, 0.25); // E5
        playNote(now + 0.18, 783.99, 0.4);  // G5
      }
    } catch (e) {
      console.warn('Audio playback notice:', e);
    }
  },

  /**
   * Periodic reminder chime when an active alert is currently active in the house
   */
  syncAlertAudioLoop() {
    if (!window.securityStorage) return;
    const overview = window.securityStorage.getSecurityOverview();

    if (overview.status === 'ALERT' && overview.activeCount > 0) {
      if (!this.alertLoopInterval) {
        // Play once immediately, then repeat every 7 seconds while breach is unresolved
        this.playSound('alert');
        this.alertLoopInterval = setInterval(() => {
          const check = window.securityStorage.getSecurityOverview();
          if (check.status === 'ALERT' && check.activeCount > 0) {
            this.playSound('alert');
          } else {
            clearInterval(this.alertLoopInterval);
            this.alertLoopInterval = null;
          }
        }, 7000);
      }
    } else {
      if (this.alertLoopInterval) {
        clearInterval(this.alertLoopInterval);
        this.alertLoopInterval = null;
      }
    }
  },

  /**
   * Displays a floating toast notification and triggers audio feedback
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

    // Trigger audio feedback based on toast type
    if (type === 'error') {
      this.playSound('alert');
    } else if (type === 'warning') {
      this.playSound('warning');
    } else if (type === 'success') {
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
