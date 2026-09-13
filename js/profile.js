/**
 * Home Security App — Resident Profile Controller
 * Connected to Cloud Firestore under users/{uid}
 */

import { 
  auth, 
  db, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  updateProfile 
} from './firebase-config.js';
import { Auth } from './auth.js';

const ProfilePage = {
  currentUser: null,
  currentProfile: null,

  init() {
    Auth.guardProtectedPage();

    Auth.onUserReady(async (user) => {
      if (!user) return;
      this.currentUser = user;
      await this.loadProfileFromFirestore(user);
      this.bindProfileForm();
    });
  },

  /**
   * Loads or creates the user's profile document from Cloud Firestore: users/{uid}
   */
  async loadProfileFromFirestore(user) {
    if (!user) return;
    const uid = user.uid;
    const userDocRef = doc(db, 'users', uid);

    try {
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        this.currentProfile = snap.data();
      } else {
        // Document does not exist yet; initialize it in Firestore
        const defaultName = user.displayName || user.email.split('@')[0];
        const initialProfile = {
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

        await setDoc(userDocRef, initialProfile);
        this.currentProfile = initialProfile;
      }

      this.populateUI(this.currentProfile, user);
    } catch (err) {
      console.error('Error loading profile from Firestore:', err);
      UI.showToast('Could not load profile from Firestore.', 'error');

      // Fallback display using local cache / auth user
      const fallback = window.securityStorage?.getCurrentUser() || {};
      this.populateUI({
        name: user.displayName || fallback.name || '',
        email: user.email || '',
        phone: fallback.phone || '',
        address: fallback.address || '',
        emergencyInfo: fallback.emergencyInfo || ''
      }, user);
    }
  },

  /**
   * Populates form inputs and avatar/name indicators
   */
  populateUI(profile, user) {
    const name = profile.name || user.displayName || '';
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

    // Update avatar initials
    const displayName = name || email.split('@')[0] || 'Resident';
    const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    const avatarEl = document.getElementById('profile-avatar-display');
    if (avatarEl) {
      avatarEl.textContent = initials || 'US';
    }

    const nameDisplay = document.getElementById('profile-name-display');
    if (nameDisplay) {
      nameDisplay.textContent = displayName;
    }

    // Sync header profile and storage.js
    Auth.updateHeaderProfile(user);

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

    UI.renderIcons();
  },

  /**
   * Handles saving updated profile fields to Cloud Firestore
   */
  bindProfileForm() {
    const form = document.getElementById('profile-form');
    if (!form) return;

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
        name: name,
        phone: phone,
        address: address,
        emergencyInfo: emergencyInfo,
        updatedAt: serverTimestamp()
      };

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Saving...';
        }

        // 1. Save to Cloud Firestore using updateDoc (with fallback to setDoc merge if needed)
        try {
          await updateDoc(userDocRef, updatePayload);
        } catch (updateErr) {
          // If document was deleted or missing, recreate it with merge
          await setDoc(userDocRef, {
            ...updatePayload,
            uid: uid,
            email: this.currentUser.email || '',
            profilePicture: '',
            createdAt: serverTimestamp()
          }, { merge: true });
        }

        // 2. Update Firebase Auth displayName if changed
        if (name !== this.currentUser.displayName) {
          try {
            await updateProfile(this.currentUser, { displayName: name });
          } catch (profileErr) {
            console.warn('Notice: Firebase Auth displayName sync:', profileErr);
          }
        }

        // 3. Update memory state & UI
        this.currentProfile = {
          ...this.currentProfile,
          ...updatePayload,
          email: this.currentUser.email
        };

        this.populateUI(this.currentProfile, this.currentUser);

        UI.showToast('Profile information saved to Cloud Firestore!', 'success');
      } catch (err) {
        console.error('Error saving profile to Firestore:', err);
        UI.showToast(err.message || 'Failed to update profile in Cloud Firestore.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i data-lucide="save"></i> Save Profile Details';
          UI.renderIcons();
        }
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ProfilePage.init();
});

export { ProfilePage };