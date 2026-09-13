/**
 * Home Security App — Firebase Authentication Controller
 * Web SDK Version: 12.19.0
 * Manages Signup, Login, Logout, Session Persistence, and Protected Page Guards.
 */

import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence 
} from './firebase-config.js';

const Auth = {
  currentUser: null,
  isAuthResolved: false,
  authListeners: [],

  init() {
    this.listenAuthState();
    this.bindLoginForm();
    this.bindSignupForm();
    this.bindPasswordToggles();
    this.bindLogoutButtons();
  },

  /**
   * Checks if current page is public (login or signup)
   */
  isPublicPage() {
    const path = window.location.pathname.toLowerCase();
    return path.endsWith('index.html') || 
           path.endsWith('signup.html') || 
           path === '/' || 
           path.endsWith('/');
  },

  /**
   * Listens to Firebase Authentication state changes across all pages
   */
  listenAuthState() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.isAuthResolved = true;

      if (user) {
        // Sync resident profile with storage.js for backward compatibility without passwords
        if (window.securityStorage) {
          const stored = window.securityStorage.getCurrentUser() || {};
          window.securityStorage.setCurrentUser({
            ...stored,
            id: user.uid,
            name: user.displayName || stored.name || user.email.split('@')[0],
            email: user.email,
            isAuthenticated: true
          });
        }

        // Update top header profile & greeting
        this.updateHeaderProfile(user);

        // Notify any callbacks waiting for auth state
        this.notifyAuthListeners(user);
      } else {
        if (window.securityStorage) {
          window.securityStorage.logoutUser();
        }

        this.notifyAuthListeners(null);

        // If on a protected page and auth resolved to unauthenticated, redirect to index.html
        if (!this.isPublicPage()) {
          window.location.href = 'index.html';
        }
      }
    });
  },

  /**
   * Allows page controllers to execute once Firebase Auth state is resolved
   */
  onUserReady(callback) {
    if (this.isAuthResolved) {
      callback(this.currentUser);
    } else {
      this.authListeners.push(callback);
    }
  },

  notifyAuthListeners(user) {
    while (this.authListeners.length > 0) {
      const cb = this.authListeners.shift();
      try { cb(user); } catch (e) { console.error('Auth listener error:', e); }
    }
  },

  /**
   * Guards protected pages (invoked by page controllers during init)
   */
  guardProtectedPage() {
    if (!this.isPublicPage()) {
      if (this.isAuthResolved && !this.currentUser) {
        window.location.href = 'index.html';
      }
    }
  },

  /**
   * Updates resident profile display in top navigation header and dashboard greeting
   */
  updateHeaderProfile(user) {
    const nameEl = document.querySelector('.user-meta .user-name');
    const avatarEl = document.querySelector('.user-profile-summary .user-avatar, #header-avatar');
    const greetingEl = document.getElementById('dashboard-greeting');
    
    if (user) {
      const displayName = user.displayName || user.email.split('@')[0];
      if (nameEl) nameEl.textContent = displayName;
      if (avatarEl) {
        const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        avatarEl.textContent = initials || 'US';
      }
      if (greetingEl) {
        greetingEl.textContent = `Welcome back, ${displayName.split(' ')[0]}`;
      }
    }
  },

  /**
   * Map Firebase error codes to friendly human messages
   */
  getFriendlyErrorMessage(code, defaultMsg) {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email address already exists. Please sign in.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up first.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please verify your credentials.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please verify your credentials.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again in a few moments.';
      case 'auth/network-request-failed':
        return 'Network connection error. Please check your internet connection.';
      default:
        return defaultMsg || 'Authentication failed. Please try again.';
    }
  },

  /**
   * Binds Login Form on index.html with Firebase Auth
   */
  bindLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const remember = document.getElementById('login-remember')?.checked;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (!email || !password) {
        UI.showToast('Please fill in both email and password.', 'error');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        UI.showToast('Please enter a valid email address.', 'error');
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Signing in...';
        }

        // Apply persistence based on Remember Me checkbox
        if (remember) {
          await setPersistence(auth, browserLocalPersistence);
        } else {
          await setPersistence(auth, browserSessionPersistence);
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const displayName = user.displayName || email.split('@')[0];

        // Sync with storage.js (NO password stored)
        if (window.securityStorage) {
          const stored = window.securityStorage.getCurrentUser() || {};
          window.securityStorage.setCurrentUser({
            ...stored,
            id: user.uid,
            name: displayName,
            email: user.email,
            isAuthenticated: true
          });
        }

        UI.showToast(`Welcome back, ${displayName}!`, 'success');

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 600);
      } catch (err) {
        console.error('Firebase Login Error:', err);
        const friendlyMsg = this.getFriendlyErrorMessage(err.code, err.message);
        UI.showToast(friendlyMsg, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i data-lucide="log-in"></i> Sign In to Dashboard';
          UI.renderIcons();
        }
      }
    });
  },

  /**
   * Binds Registration Form on signup.html with Firebase Auth
   */
  bindSignupForm() {
    const signupForm = document.getElementById('signup-form');
    if (!signupForm) return;

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const phone = document.getElementById('signup-phone').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;
      const submitBtn = document.getElementById('signup-submit-btn');

      if (!name || !email || !phone || !password || !confirmPassword) {
        UI.showToast('All fields are required.', 'error');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        UI.showToast('Please enter a valid email address.', 'error');
        return;
      }

      if (password.length < 6) {
        UI.showToast('Password must be at least 6 characters long.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        UI.showToast('Passwords do not match.', 'error');
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Creating Account...';
        }

        // 1. Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Set Firebase user displayName to entered Full Name
        await updateProfile(user, { displayName: name });

        // 3. Update localStorage profile WITHOUT storing the password
        if (window.securityStorage) {
          window.securityStorage.setCurrentUser({
            id: user.uid,
            name: name,
            email: email,
            phone: phone,
            address: '742 Evergreen Terrace, Springfield',
            emergencyInfo: 'None provided',
            profilePicture: '',
            isAuthenticated: true
          });
        }

        UI.showToast(`Account created successfully! Welcome, ${name}.`, 'success');

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 700);
      } catch (err) {
        console.error('Firebase Signup Error:', err);
        const friendlyMsg = this.getFriendlyErrorMessage(err.code, err.message);
        UI.showToast(friendlyMsg, 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i data-lucide="user-check"></i> <span>Create Account & Enter Dashboard</span>';
          UI.renderIcons();
        }
      }
    });
  },

  /**
   * Password Visibility Toggles
   */
  bindPasswordToggles() {
    const toggles = document.querySelectorAll('.password-toggle-btn');
    toggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;

        if (input.type === 'password') {
          input.type = 'text';
          btn.innerHTML = '<i data-lucide="eye-off"></i>';
        } else {
          input.type = 'password';
          btn.innerHTML = '<i data-lucide="eye"></i>';
        }
        UI.renderIcons();
      });
    });
  },

  /**
   * Global Logout Button handlers with Firebase signOut()
   */
  bindLogoutButtons() {
    const logoutBtns = document.querySelectorAll('.logout-trigger-btn');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to log out of Home Security?')) {
          try {
            await signOut(auth);
            if (window.securityStorage) {
              window.securityStorage.logoutUser();
            }
            UI.showToast('Logged out successfully.', 'info');
            setTimeout(() => {
              window.location.href = 'index.html';
            }, 500);
          } catch (err) {
            console.error('Logout error:', err);
            UI.showToast('Failed to log out. Please try again.', 'error');
          }
        }
      });
    });
  }
};

// Safely expose globally for other scripts
window.Auth = Auth;

// Initialize when module loads
Auth.init();

export { Auth };