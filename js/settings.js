/**
 * Home Security App — Application Settings Controller
 * Manages system preferences, sound toggles, themes, demo reset, and password modification.
 */

const SettingsPage = {
  init() {
    Auth.guardProtectedPage();
    this.populateSettings();
    this.bindSettingsForm();
    this.bindPasswordForm();
    this.bindDemoReset();
    this.bindSoundTest();
  },

  populateSettings() {
    const settings = window.securityStorage.getSettings();
    document.getElementById('toggle-security-alerts').checked = settings.securityAlerts !== false;
    document.getElementById('toggle-emergency-alerts').checked = settings.emergencyAlerts !== false;
    document.getElementById('toggle-email-alerts').checked = settings.emailNotifications === true;
    document.getElementById('toggle-sound-alerts').checked = settings.soundAlerts !== false;
    document.getElementById('setting-theme-select').value = settings.theme || 'dark';
  },

  bindSoundTest() {
    const testBtn = document.getElementById('test-alarm-sound-btn');
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        UI.playSound('alert');
        UI.showToast('🚨 Playing test security alarm siren...', 'error', 2500);
      });
    }
  },

  bindSettingsForm() {
    const form = document.getElementById('settings-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const securityAlerts = document.getElementById('toggle-security-alerts').checked;
      const emergencyAlerts = document.getElementById('toggle-emergency-alerts').checked;
      const emailNotifications = document.getElementById('toggle-email-alerts').checked;
      const soundAlerts = document.getElementById('toggle-sound-alerts').checked;
      const theme = document.getElementById('setting-theme-select').value;

      window.securityStorage.updateSettings({
        securityAlerts,
        emergencyAlerts,
        emailNotifications,
        soundAlerts,
        theme
      });

      // Apply theme change immediately
      document.documentElement.setAttribute('data-theme', theme);

      UI.showToast('Application preferences saved.', 'success');
    });

    // Instant theme change when select changes
    const themeSelect = document.getElementById('setting-theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        document.documentElement.setAttribute('data-theme', theme);
        window.securityStorage.updateSettings({ theme });
      });
    }
  },

  bindPasswordForm() {
    const form = document.getElementById('change-password-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const current = document.getElementById('current-password').value;
      const newPass = document.getElementById('new-password').value;
      const confirmPass = document.getElementById('confirm-new-password').value;

      if (!current || !newPass || !confirmPass) {
        UI.showToast('Please fill in all password fields.', 'error');
        return;
      }

      if (newPass.length < 6) {
        UI.showToast('New password must be at least 6 characters.', 'error');
        return;
      }

      if (newPass !== confirmPass) {
        UI.showToast('New passwords do not match.', 'error');
        return;
      }

      form.reset();
      UI.showToast('Password changed successfully (Simulated).', 'success');
    });
  },

  bindDemoReset() {
    const resetBtn = document.getElementById('reset-demo-all-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('This will reset all alerts, history, and restore default demo configuration. Proceed?')) {
          window.securityStorage.resetToDemo();
          UI.showToast('All system simulation data reset to fresh SAFE state.', 'info');
          setTimeout(() => {
            window.location.reload();
          }, 800);
        }
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  SettingsPage.init();
});
