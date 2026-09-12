/**
 * Home Security App — Resident Profile Controller
 * Manages user profile updates, medical/emergency access info, and local persistence.
 */

const ProfilePage = {
  init() {
    Auth.guardProtectedPage();
    this.populateProfile();
    this.bindProfileForm();
  },

  populateProfile() {
    const user = window.securityStorage.getCurrentUser();
    if (!user) return;

    document.getElementById('profile-name').value = user.name || '';
    document.getElementById('profile-email').value = user.email || '';
    document.getElementById('profile-phone').value = user.phone || '';
    document.getElementById('profile-address').value = user.address || '';
    document.getElementById('profile-emergency-info').value = user.emergencyInfo || '';

    // Update avatar initials
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const avatarEl = document.getElementById('profile-avatar-display');
    if (avatarEl) {
      avatarEl.textContent = initials || 'US';
    }

    const nameDisplay = document.getElementById('profile-name-display');
    if (nameDisplay) {
      nameDisplay.textContent = user.name;
    }
  },

  bindProfileForm() {
    const form = document.getElementById('profile-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('profile-name').value.trim();
      const phone = document.getElementById('profile-phone').value.trim();
      const address = document.getElementById('profile-address').value.trim();
      const emergencyInfo = document.getElementById('profile-emergency-info').value.trim();

      if (!name) {
        UI.showToast('Name is required.', 'error');
        return;
      }

      const currentUser = window.securityStorage.getCurrentUser() || {};
      const updated = {
        ...currentUser,
        name,
        phone,
        address,
        emergencyInfo
      };

      window.securityStorage.setCurrentUser(updated);
      UI.showToast('Profile information updated successfully!', 'success');
      this.populateProfile();
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ProfilePage.init();
});
