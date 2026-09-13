/**
 * Home Security App — Emergency Contacts Controller
 * Firestore integration: users/{uid}/contacts/{contactId}
 * Manages real CRUD (Add, Edit, Delete) for trusted emergency contacts.
 * Call: tel:<phone>   |   Email: mailto:<email>
 */

import {
  app,
  auth,
  onAuthStateChanged
} from './firebase-config.js';

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

// Initialize Firestore from the shared Firebase app instance
const db = getFirestore(app);

// In-memory snapshot of contacts (kept in sync by onSnapshot)
let contactsCache = [];
// Unsubscribe function for the Firestore listener
let unsubscribeContacts = null;

const ContactsPage = {
  currentUser: null,

  init() {
    this.bindContactModal();

    // Wait for Firebase Auth state before touching Firestore
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = 'index.html';
        return;
      }
      this.currentUser = user;
      this.subscribeContacts(user.uid);
    });
  },

  /**
   * Subscribe to real-time Firestore updates for this user's contacts.
   * Any add / edit / delete automatically refreshes the UI.
   */
  subscribeContacts(uid) {
    // Unsubscribe any previous listener to avoid duplicates
    if (unsubscribeContacts) {
      unsubscribeContacts();
    }

    const contactsRef = collection(db, 'users', uid, 'contacts');
    const q = query(contactsRef, orderBy('createdAt', 'asc'));

    unsubscribeContacts = onSnapshot(q, (snapshot) => {
      contactsCache = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      // Sync to localStorage cache so dashboard stats & SOS page stay accurate
      if (window.securityStorage && typeof window.securityStorage.setContacts === 'function') {
        window.securityStorage.setContacts(contactsCache);
      }

      this.renderContacts(contactsCache);
    }, (err) => {
      console.error('Firestore contacts listener error:', err);
      if (window.UI) UI.showToast('Could not load contacts from Cloud Firestore.', 'error');
    });
  },

  bindContactModal() {
    const openAddBtn = document.getElementById('open-add-contact-btn');
    if (openAddBtn) {
      openAddBtn.addEventListener('click', () => {
        document.getElementById('contact-modal-title').textContent = 'Add Emergency Contact';
        document.getElementById('contact-form').reset();
        document.getElementById('contact-id-hidden').value = '';
        UI.openModal('contact-modal');
      });
    }

    const contactForm = document.getElementById('contact-form');
    if (contactForm && !contactForm._firestoreBound) {
      contactForm._firestoreBound = true;
      contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleFormSubmit();
      });
    }
  },

  async handleFormSubmit() {
    if (!this.currentUser) {
      UI.showToast('You must be signed in.', 'error');
      return;
    }

    const id           = document.getElementById('contact-id-hidden').value.trim();
    const name         = document.getElementById('contact-name').value.trim();
    const relationship = document.getElementById('contact-relationship').value.trim();
    const phone        = document.getElementById('contact-phone').value.trim();
    const email        = document.getElementById('contact-email').value.trim();
    const isPrimary    = document.getElementById('contact-is-primary').checked;

    if (!name || !relationship || !phone) {
      UI.showToast('Please provide name, relationship, and phone number.', 'error');
      return;
    }

    const submitBtn = document.querySelector('#contact-form button[type="submit"]');
    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Saving...';
      }

      const uid = this.currentUser.uid;

      if (id) {
        // EDIT — update existing document
        const contactRef = doc(db, 'users', uid, 'contacts', id);
        await updateDoc(contactRef, {
          name,
          relationship,
          phone,
          email,
          isPrimary,
          updatedAt: serverTimestamp()
        });
        UI.showToast(`Contact updated: ${name}`, 'success');
      } else {
        // ADD — create new document
        const contactsRef = collection(db, 'users', uid, 'contacts');
        await addDoc(contactsRef, {
          name,
          relationship,
          phone,
          email,
          isPrimary,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        UI.showToast(`Emergency contact added: ${name}`, 'success');
      }

      UI.closeModal('contact-modal');
    } catch (err) {
      console.error('Firestore contacts save error:', err);
      UI.showToast(err.message || 'Failed to save contact.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="save"></i> Save Contact';
        if (window.UI && typeof window.UI.renderIcons === 'function') window.UI.renderIcons();
      }
    }
  },

  async deleteContact(id, name) {
    if (!this.currentUser) return;
    if (!confirm(`Are you sure you want to remove ${name} from emergency contacts?`)) return;

    try {
      const contactRef = doc(db, 'users', this.currentUser.uid, 'contacts', id);
      await deleteDoc(contactRef);
      UI.showToast(`Emergency contact ${name} deleted.`, 'info');
    } catch (err) {
      console.error('Firestore contact delete error:', err);
      UI.showToast('Failed to delete contact.', 'error');
    }
  },

  /**
   * Normalise a phone number for use in a tel: link.
   * Keeps leading + and digits; strips spaces, dashes, parens.
   */
  normalizePhone(phone) {
    return phone.replace(/[^\d+]/g, '');
  },

  renderContacts(contacts) {
    const container  = document.getElementById('contacts-grid');
    const totalCount = document.getElementById('contacts-total-count');
    if (!container) return;

    if (totalCount) {
      totalCount.textContent = `${contacts.length} Contact${contacts.length === 1 ? '' : 's'}`;
    }

    if (contacts.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon"><i data-lucide="users"></i></div>
          <h3>No Emergency Contacts Added</h3>
          <p>Register trusted family members, neighbors, or emergency services for quick SOS response.</p>
          <button class="btn btn-primary" onclick="document.getElementById('open-add-contact-btn').click()">
            <i data-lucide="user-plus"></i> Add First Contact
          </button>
        </div>
      `;
      UI.renderIcons();
      return;
    }

    let html = '';
    contacts.forEach(contact => {
      const initials   = (contact.name || '?').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const safePhone  = this.normalizePhone(contact.phone || '');
      const hasPhone   = safePhone.length > 0;
      const hasEmail   = (contact.email || '').trim().length > 0;
      const emailFull  = encodeURIComponent(
        'mailto:' + contact.email + '?subject=Home Security Emergency Alert&body=This is a message from the Home Security application.'
      );

      html += `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div class="user-avatar" style="width: 44px; height: 44px; font-size: 1.1rem; background: #3b82f6;">
                  ${initials}
                </div>
                <div>
                  <h3 style="font-size: 1.05rem; font-weight: 600;">${contact.name}</h3>
                  <span class="badge badge-info" style="font-size: 0.72rem; margin-top: 2px;">${contact.relationship}</span>
                </div>
              </div>
              ${contact.isPrimary ? '<span class="badge badge-safe" style="font-size: 0.7rem;">Primary</span>' : ''}
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; font-size: 0.88rem;">
              <div style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary);">
                <i data-lucide="phone" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
                <span style="color: var(--text-primary);">${contact.phone}</span>
              </div>
              ${hasEmail ? `
                <div style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary);">
                  <i data-lucide="mail" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
                  <span>${contact.email}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
            <div style="display: flex; gap: 6px;">
              ${hasPhone ? `
                <a href="tel:${safePhone}"
                   class="btn btn-outline btn-sm call-contact-btn"
                   title="Call ${contact.name}"
                   onclick="UI.showToast('Opening phone dialer for ${contact.name}...', 'info')">
                  <i data-lucide="phone-call"></i> Call
                </a>
              ` : `
                <button class="btn btn-outline btn-sm" disabled title="No phone number" style="opacity: 0.45; cursor: not-allowed;">
                  <i data-lucide="phone-call"></i> Call
                </button>
              `}
              ${hasEmail ? `
                <a href="mailto:${contact.email}?subject=Home%20Security%20Emergency%20Alert&body=This%20is%20a%20message%20from%20the%20Home%20Security%20application."
                   class="btn btn-outline btn-sm email-contact-btn"
                   title="Email ${contact.name}"
                   onclick="UI.showToast('Opening email composer for ${contact.name}...', 'info')">
                  <i data-lucide="mail"></i> Email
                </a>
              ` : `
                <button class="btn btn-outline btn-sm" disabled title="No email address" style="opacity: 0.45; cursor: not-allowed;">
                  <i data-lucide="mail"></i> Email
                </button>
              `}
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-ghost btn-sm edit-contact-btn" data-id="${contact.id}" title="Edit contact">
                <i data-lucide="edit-3"></i>
              </button>
              <button class="btn btn-ghost btn-sm delete-contact-btn" data-id="${contact.id}" data-name="${contact.name}" title="Delete contact" style="color: var(--color-alert);">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Edit triggers
    container.querySelectorAll('.edit-contact-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id      = btn.getAttribute('data-id');
        const contact = contactsCache.find(c => c.id === id);
        if (!contact) return;

        document.getElementById('contact-modal-title').textContent = 'Edit Emergency Contact';
        document.getElementById('contact-id-hidden').value          = contact.id;
        document.getElementById('contact-name').value               = contact.name;
        document.getElementById('contact-relationship').value       = contact.relationship;
        document.getElementById('contact-phone').value              = contact.phone;
        document.getElementById('contact-email').value              = contact.email || '';
        document.getElementById('contact-is-primary').checked       = !!contact.isPrimary;

        UI.openModal('contact-modal');
      });
    });

    // Delete triggers
    container.querySelectorAll('.delete-contact-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id   = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        this.deleteContact(id, name);
      });
    });

    UI.renderIcons();
  }
};

// Kick off on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ContactsPage.init());
} else {
  ContactsPage.init();
}

export { ContactsPage };
