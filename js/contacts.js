/**
 * Home Security App — Emergency Contacts Controller
 * Manages full CRUD (Add, Edit, Delete) for trusted emergency contacts.
 */

const ContactsPage = {
  editingContactId: null,

  init() {
    Auth.guardProtectedPage();
    this.renderContacts();
    this.bindContactModal();
    this.bindStorageEvents();
  },

  bindStorageEvents() {
    window.addEventListener('security-storage-update', () => {
      this.renderContacts();
    });
  },

  bindContactModal() {
    const openAddBtn = document.getElementById('open-add-contact-btn');
    if (openAddBtn) {
      openAddBtn.addEventListener('click', () => {
        this.editingContactId = null;
        document.getElementById('contact-modal-title').textContent = 'Add Emergency Contact';
        document.getElementById('contact-form').reset();
        document.getElementById('contact-id-hidden').value = '';
        UI.openModal('contact-modal');
      });
    }

    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('contact-id-hidden').value;
        const name = document.getElementById('contact-name').value.trim();
        const relationship = document.getElementById('contact-relationship').value.trim();
        const phone = document.getElementById('contact-phone').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const isPrimary = document.getElementById('contact-is-primary').checked;

        if (!name || !phone || !relationship) {
          UI.showToast('Please provide name, relationship, and phone number.', 'error');
          return;
        }

        if (id) {
          // Update existing
          window.securityStorage.updateContact(id, { name, relationship, phone, email, isPrimary });
          UI.showToast(`Contact updated: ${name}`, 'success');
        } else {
          // Create new
          window.securityStorage.addContact({ name, relationship, phone, email, isPrimary });
          UI.showToast(`New emergency contact added: ${name}`, 'success');
        }

        UI.closeModal('contact-modal');
        this.renderContacts();
      });
    }
  },

  renderContacts() {
    const container = document.getElementById('contacts-grid');
    const totalCount = document.getElementById('contacts-total-count');
    if (!container) return;

    const contacts = window.securityStorage.getContacts();

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
      html += `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div class="user-avatar" style="width: 44px; height: 44px; font-size: 1.1rem; background: #3b82f6;">
                  ${contact.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
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
              ${contact.email ? `
                <div style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary);">
                  <i data-lucide="mail" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
                  <span>${contact.email}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-color); padding-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-outline btn-sm call-contact-btn" data-name="${contact.name}" title="Simulate Call">
                <i data-lucide="phone-call"></i> Call
              </button>
              <button class="btn btn-outline btn-sm sms-contact-btn" data-name="${contact.name}" title="Simulate SMS">
                <i data-lucide="message-square"></i> SMS
              </button>
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

    // Call / SMS triggers
    container.querySelectorAll('.call-contact-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        UI.showToast(`Simulated Call connecting to ${name}...`, 'info');
      });
    });

    container.querySelectorAll('.sms-contact-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        UI.showToast(`Simulated SMS Alert sent to ${name}.`, 'success');
      });
    });

    // Edit contact trigger
    container.querySelectorAll('.edit-contact-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const contact = contacts.find(c => c.id === id);
        if (!contact) return;

        this.editingContactId = id;
        document.getElementById('contact-modal-title').textContent = 'Edit Emergency Contact';
        document.getElementById('contact-id-hidden').value = contact.id;
        document.getElementById('contact-name').value = contact.name;
        document.getElementById('contact-relationship').value = contact.relationship;
        document.getElementById('contact-phone').value = contact.phone;
        document.getElementById('contact-email').value = contact.email || '';
        document.getElementById('contact-is-primary').checked = !!contact.isPrimary;

        UI.openModal('contact-modal');
      });
    });

    // Delete contact trigger
    container.querySelectorAll('.delete-contact-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        if (confirm(`Are you sure you want to remove ${name} from emergency contacts?`)) {
          window.securityStorage.deleteContact(id);
          UI.showToast(`Emergency contact ${name} deleted.`, 'info');
          this.renderContacts();
        }
      });
    });

    UI.renderIcons();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ContactsPage.init();
});
