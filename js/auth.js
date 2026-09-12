/**
 * Home Security App — Authentication Controller
 * Manages Login, Registration, Session Guards, and Logout workflows.
 */

const Auth = {
  init() {
    this.bindLoginForm();
    this.bindSignupForm();
    this.bindPasswordToggles();
    this.bindLogoutButtons();
  },

  /**
   * Guards protected pages (redirect to index.html if unauthenticated)
   */
  guardProtectedPage() {
    if (!window.securityStorage) return;
    const user = window.securityStorage.getCurrentUser();
    if (!user || user.isAuthenticated === false) {
      window.location.href = 'index.html';
    }
  },

  /**
   * Binds Login Form on index.html
   */
  bindLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const remember = document.getElementById('login-remember')?.checked;

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
        const user = window.securityStorage.loginUser(email, password);
        UI.showToast(`Welcome back, ${user.name}!`, 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 800);
      } catch (err) {
        UI.showToast(err.message || 'Login failed. Please check your credentials.', 'error');
      }
    });
  },

  /**
   * Binds Registration Form on signup.html
   */
  bindSignupForm() {
    const signupForm = document.getElementById('signup-form');
    if (!signupForm) return;

    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const phone = document.getElementById('signup-phone').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;

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
        const user = window.securityStorage.registerUser({
          name,
          email,
          phone,
          password
        });
        UI.showToast('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 900);
      } catch (err) {
        UI.showToast(err.message || 'Registration failed.', 'error');
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
   * Global Logout Button handlers
   */
  bindLogoutButtons() {
    const logoutBtns = document.querySelectorAll('.logout-trigger-btn');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to log out of Home Security?')) {
          if (window.securityStorage) {
            window.securityStorage.logoutUser();
          }
          UI.showToast('Logged out successfully.', 'info');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 600);
        }
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Auth.init();
});
