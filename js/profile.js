/**
 * Home Security App — Resident Profile Controller
 * Directly integrated with Cloud Firestore under users/{uid}
 */

import { 
  auth, 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  updateProfile,
  onAuthStateChanged 
} from './firebase-config.js';

const ProfilePage = {
  currentUser: null,
  currentProfile: null,

  init() {
    this.bindProfileForm();

    // Direct Firebase Auth listener guarantees immediate & accurate user state
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Not authenticated; redirect to login
        window.location.href = 'index.html';
        return;
      }

      this.currentUser = user;
      await this.loadProfile(user);
    });
  },

  /**
   * Loads or auto-initializes the profile from Firestore path: users/{uid}
   */
  async loadProfile(user) {
    if (!user) return;
    const uid = user.uid;
    const userDocRef = doc(db, 'users', uid);

    try {
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        this.currentProfile = snap.data();
      } else {
        // Document does not exist yet; create it in Firestore
        const defaultName = user.displayName || (user.email ? user.email.split('@')[0] : 'Resident');
        const initialData = {
          uid: uid,
          name: defaultName,
          email: user.email || '',
          phone: '',
          address: '',
          emergencyInfo: '',
          profilePicture: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await setDoc(userDocRef, initialData);
        this.currentProfile = initialData;
      }

      this.populateUI(this.currentProfile, user);
    } catch (err) {
      console.error('Firestore Profile Load Error:', err);

      // Gracefully fall back to Firebase Auth user credentials
      const fallbackName = user.displayName || (user.email ? user.email.split('@')[0] : 'Resident');
      this.populateUI({
        uid: uid,
        name: fallbackName,
        email: user.email || '',
        phone: '',
        address: '',
        emergencyInfo: ''
      }, user);

      if (err.message && err.message.includes('API has not been used')) {
        UI.showToast('Please enable Cloud Firestore in your Firebase Console to sync data.', 'warning', 6000);
      } else {
        UI.showToast('Could not load profile from Cloud Firestore.', 'error');
      }
    }
  },

  /**
   * Populates form inputs and dynamic UI elements
   */
  populateUI(profile, user) {
    const name = profile.name || user.displayName || (user.email ? user.email.split('@')[0] : '');
    const email = user.email || profile.email || '';
    const phone = profile.phone || '';
    const address = profile.address || '';
    const emergencyInfo = profile.emergencyInfo || '';

    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');
    const addressInput = document.getElementById('profile-address');
    const emergencyInput = document.getElementById('profile-emergency-info');

    if (nameInput) nameInput.value = name;
    if (emailInput) emailInput.value = email;
    if (phoneInput) phoneInput.value = phone;
    if (addressInput) addressInput.value = address;
    if (emergencyInput) emergencyInput.value = emergencyInfo;

    // Compute display initials
    const displayName = name || (email ? email.split('@')[0] : 'Resident');
    const initials = displayName
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'US';

    // Update Profile Card Avatar & Display Name
    const avatarEl = document.getElementById('profile-avatar-display');
    if (avatarEl) avatarEl.textContent = initials;

    const nameDisplay = document.getElementById('profile-name-display');
    if (nameDisplay) nameDisplay.textContent = displayName;

    // Update Top Navigation Header
    const headerName = document.querySelector('.user-meta .user-name');
    if (headerName) headerName.textContent = displayName;

    const headerAvatar = document.querySelector('.user-profile-summary .user-avatar, #header-avatar');
    if (headerAvatar) headerAvatar.textContent = initials;

    // Update Cloud Status Badge
    const badgeEl = document.getElementById('profile-badge');
    if (badgeEl) {
      badgeEl.innerHTML = '<i data-lucide="cloud-check" style="width: 12px; height: 12px; vertical-align: middle;"></i> Cloud Firestore Connected';
    }

    // Keep memory cache updated for storage.js
    if (window.securityStorage) {
      const stored = window.securityStorage.getCurrentUser() || {};
      window.securityStorage.setCurrentUser({
        ...stored,
        id: user.uid,
        name: displayName,
        email: email,
        phone: phone,
        address: address,
        emergencyInfo: emergencyInfo,
        isAuthenticated: true
      });
    }

    if (window.UI && typeof window.UI.renderIcons === 'function') {
      window.UI.renderIcons();
    }
  },

  /**
   * Binds Profile Form submission to Cloud Firestore
   */
  bindProfileForm() {
    const form = document.getElementById('profile-form');
    if (!form || form._isBound) return;
    form._isBound = true;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.currentUser) {
        UI.showToast('You must be signed in to save profile details.', 'error');
        return;
      }

      const name = document.getElementById('profile-name').value.trim();
      const phone = document.getElementById('profile-phone').value.trim();
      const address = document.getElementById('profile-address').value.trim();
      const emergencyInfo = document.getElementById('profile-emergency-info').value.trim();
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!name) {
        UI.showToast('Full name is required.', 'error');
        return;
      }

      const uid = this.currentUser.uid;
      const userDocRef = doc(db, 'users', uid);

      const updatePayload = {
        uid: uid,
        name: name,
        email: this.currentUser.email || '',
        phone: phone,
        address: address,
        emergencyInfo: emergencyInfo,
        profilePicture: '',
        updatedAt: serverTimestamp()
      };

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Saving...';
        }

        // 1. Save to Cloud Firestore using setDoc with merge: true
        await setDoc(userDocRef, updatePayload, { merge: true });

        // 2. Sync Firebase Auth displayName if changed
        if (name !== this.currentUser.displayName) {
          try {
            await updateProfile(this.currentUser, { displayName: name });
          } catch (authErr) {
            console.warn('Firebase Auth displayName update warning:', authErr);
          }
        }

        // 3. Update active in-memory profile and UI immediately
        this.currentProfile = {
          ...this.currentProfile,
          ...updatePayload
        };

        this.populateUI(this.currentProfile, this.currentUser);
        UI.showToast('Profile information saved successfully to Cloud Firestore!', 'success');
      } catch (err) {
        console.error('Error saving profile to Firestore:', err);
        UI.showToast(err.message || 'Failed to save profile details to Firestore.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i data-lucide="save"></i> Save Profile Details';
          if (window.UI && typeof window.UI.renderIcons === 'function') {
            window.UI.renderIcons();
          }
        }
      }
    });
  }
};

// Guarantee execution regardless of script loading timing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ProfilePage.init());
} else {
  ProfilePage.init();
}

export { ProfilePage };