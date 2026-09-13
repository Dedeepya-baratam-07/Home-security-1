/**
 * Home Security App — Centralized Storage & Business Logic Engine
 * Provides unified localStorage abstraction and business rules.
 */

const STORAGE_KEYS = {
  USER: 'home_security_user',
  USERS_DB: 'home_security_users_db',
  ALERTS: 'home_security_alerts',
  HISTORY: 'home_security_history',
  CONTACTS: 'home_security_contacts',
  SETTINGS: 'home_security_settings',
  SOS_EVENTS: 'home_security_sos_events'
};

// Initial Seed Data for Demo & College Project Presentation
const SEED_DATA = {
  user: {
    id: 'usr_1001',
    name: 'Alex Mercer',
    email: 'alex.mercer@homeguard.io',
    phone: '+1 (555) 234-5678',
    address: '742 Evergreen Terrace, Springfield',
    emergencyInfo: 'Blood Type: O+, Gate Access: #4821',
    profilePicture: '',
    isAuthenticated: false
  },
  settings: {
    securityAlerts: true,
    emergencyAlerts: true,
    emailNotifications: false,
    soundAlerts: true,
    theme: 'dark'
  },
  contacts: [
    {
      id: 'CNT-101',
      name: 'Sarah Connor',
      relationship: 'Spouse / Family',
      phone: '+1 (555) 902-1144',
      email: 'sarah.connor@example.com',
      isPrimary: true
    },
    {
      id: 'CNT-102',
      name: 'James Rodriguez',
      relationship: 'Neighbor',
      phone: '+1 (555) 438-9921',
      email: 'james.r@neighborhood.net',
      isPrimary: false
    },
    {
      id: 'CNT-103',
      name: 'Central District Police',
      relationship: 'Local Emergency Dispatch (Mock)',
      phone: '911',
      email: 'dispatch@localgov.mock',
      isPrimary: false
    }
  ],
  // Starts clean (0 active alerts) to satisfy acceptance requirement: initial state == SAFE
  alerts: [],
  history: [
    {
      id: 'HIST-1001',
      type: 'Routine Perimeter Diagnostic',
      location: 'System Core',
      date: new Date(Date.now() - 3600000 * 6).toISOString().split('T')[0],
      time: '11:30:00',
      severity: 'Low',
      status: 'Resolved',
      notes: 'Automated sensor heartbeat check completed successfully.',
      createdAt: Date.now() - 3600000 * 6,
      resolvedAt: Date.now() - 3600000 * 6
    },
    {
      id: 'HIST-1002',
      type: 'Door Sensor Test',
      location: 'Main Entrance',
      date: new Date(Date.now() - 3600000 * 12).toISOString().split('T')[0],
      time: '05:30:00',
      severity: 'Low',
      status: 'Resolved',
      notes: 'Scheduled door opening sensor test.',
      createdAt: Date.now() - 3600000 * 12,
      resolvedAt: Date.now() - 3600000 * 12
    }
  ],
  sosEvents: []
};

class SecurityStorage {
  constructor() {
    this.initStorage();
  }

  initStorage(forceReset = false) {
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.USER)) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(SEED_DATA.user));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(SEED_DATA.settings));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.CONTACTS)) {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(SEED_DATA.contacts));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.ALERTS)) {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(SEED_DATA.alerts));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.HISTORY)) {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(SEED_DATA.history));
    }
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.SOS_EVENTS)) {
      localStorage.setItem(STORAGE_KEYS.SOS_EVENTS, JSON.stringify(SEED_DATA.sosEvents));
    }
    // Clean up any legacy password storage in localStorage
    if (localStorage.getItem(STORAGE_KEYS.USERS_DB)) {
      localStorage.removeItem(STORAGE_KEYS.USERS_DB);
    }
  }

  // --- Helper Get/Set ---
  _getItem(key, fallback = []) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return fallback;
    }
  }

  _setItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Dispatch custom storage event for in-page updates
      window.dispatchEvent(new CustomEvent('security-storage-update', { detail: { key } }));
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
    }
  }

  // --- User & Auth ---
  getCurrentUser() {
    return this._getItem(STORAGE_KEYS.USER, null);
  }

  setCurrentUser(user) {
    this._setItem(STORAGE_KEYS.USER, user);
  }

  getRegisteredUsers() {
    return this._getItem(STORAGE_KEYS.USERS_DB, []);
  }

  registerUser(userData) {
    const users = this.getRegisteredUsers();
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('An account with this email address already exists.');
    }
    users.push(userData);
    this._setItem(STORAGE_KEYS.USERS_DB, users);
    
    // Set as active session
    const activeProfile = {
      id: 'usr_' + Math.floor(1000 + Math.random() * 9000),
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      address: userData.address || '742 Evergreen Terrace, Springfield',
      emergencyInfo: 'None provided',
      profilePicture: '',
      isAuthenticated: true
    };
    this.setCurrentUser(activeProfile);
    return activeProfile;
  }

  loginUser(email, password) {
    const users = this.getRegisteredUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!found) {
      throw new Error('Invalid email or password.');
    }
    const activeProfile = {
      id: 'usr_' + Math.floor(1000 + Math.random() * 9000),
      name: found.name,
      email: found.email,
      phone: found.phone || '',
      address: found.address || '742 Evergreen Terrace, Springfield',
      emergencyInfo: 'Blood Type: O+',
      profilePicture: '',
      isAuthenticated: true
    };
    this.setCurrentUser(activeProfile);
    return activeProfile;
  }

  logoutUser() {
    const user = this.getCurrentUser();
    if (user) {
      user.isAuthenticated = false;
      this.setCurrentUser(user);
    }
  }

  // --- Alerts ---
  getAlerts() {
    return this._getItem(STORAGE_KEYS.ALERTS, []);
  }

  getActiveAlerts() {
    return this.getAlerts().filter(a => a.status === 'Active');
  }

  getResolvedAlerts() {
    return this.getAlerts().filter(a => a.status === 'Resolved');
  }

  /**
   * Simulates/Creates a new security alert
   */
  addAlert({ type, location, severity = 'Medium', notes = '', icon = 'shield-alert' }) {
    const alerts = this.getAlerts();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    
    const newAlert = {
      id: 'ALT-' + Math.floor(1000 + Math.random() * 9000),
      type,
      location,
      severity,
      notes: notes || `Simulated ${type.toLowerCase()} event in ${location}.`,
      icon,
      date: dateStr,
      time: timeStr,
      status: 'Active',
      createdAt: now.getTime(),
      resolvedAt: null
    };

    alerts.unshift(newAlert);
    this._setItem(STORAGE_KEYS.ALERTS, alerts);

    // Audio Alert Sound
    if (window.UI && typeof window.UI.playSound === 'function') {
      window.UI.playSound(newAlert.severity === 'Low' ? 'warning' : 'alert');
    }

    // Also permanently log to History
    this.addHistoryEvent({
      id: 'HIST-' + Math.floor(10000 + Math.random() * 90000),
      alertId: newAlert.id,
      type: newAlert.type,
      location: newAlert.location,
      date: newAlert.date,
      time: newAlert.time,
      severity: newAlert.severity,
      status: 'Active',
      notes: newAlert.notes,
      createdAt: newAlert.createdAt,
      resolvedAt: null
    });

    return newAlert;
  }

  /**
   * Resolves an active alert by ID
   */
  resolveAlert(alertId) {
    const alerts = this.getAlerts();
    const alertIndex = alerts.findIndex(a => a.id === alertId);
    if (alertIndex === -1) return false;

    const now = new Date();
    alerts[alertIndex].status = 'Resolved';
    alerts[alertIndex].resolvedAt = now.getTime();
    this._setItem(STORAGE_KEYS.ALERTS, alerts);

    // Audio Resolution Chime
    if (window.UI && typeof window.UI.playSound === 'function') {
      window.UI.playSound('safe');
    }

    // Update corresponding entry in history
    const history = this.getHistory();
    const histIndex = history.findIndex(h => h.alertId === alertId || h.id === alertId);
    if (histIndex !== -1) {
      history[histIndex].status = 'Resolved';
      history[histIndex].resolvedAt = now.getTime();
      this._setItem(STORAGE_KEYS.HISTORY, history);
    } else {
      // Add resolution record if not linked
      this.addHistoryEvent({
        id: 'HIST-' + Math.floor(10000 + Math.random() * 90000),
        alertId: alerts[alertIndex].id,
        type: `${alerts[alertIndex].type} (Resolved)`,
        location: alerts[alertIndex].location,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        severity: alerts[alertIndex].severity,
        status: 'Resolved',
        notes: `Alert ${alertId} resolved by user.`,
        createdAt: alerts[alertIndex].createdAt,
        resolvedAt: now.getTime()
      });
    }

    return true;
  }

  // --- History ---
  getHistory() {
    return this._getItem(STORAGE_KEYS.HISTORY, []);
  }

  addHistoryEvent(event) {
    const history = this.getHistory();
    history.unshift(event);
    this._setItem(STORAGE_KEYS.HISTORY, history);
  }

  clearHistory() {
    this._setItem(STORAGE_KEYS.HISTORY, []);
  }

  // --- Contacts ---
  getContacts() {
    return this._getItem(STORAGE_KEYS.CONTACTS, []);
  }

  setContacts(contactsArray) {
    // Allows Firestore module to sync the authoritative contact list into the
    // localStorage cache so dashboard stats & SOS page stay consistent.
    try {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contactsArray));
      window.dispatchEvent(new CustomEvent('security-storage-update', { detail: { key: STORAGE_KEYS.CONTACTS } }));
    } catch (e) {
      console.error('Error syncing contacts to storage cache:', e);
    }
  }

  addContact(contact) {
    const contacts = this.getContacts();
    const newContact = {
      id: 'CNT-' + Math.floor(100 + Math.random() * 900),
      isPrimary: false,
      ...contact
    };
    contacts.push(newContact);
    this._setItem(STORAGE_KEYS.CONTACTS, contacts);
    return newContact;
  }

  updateContact(contactId, updatedData) {
    const contacts = this.getContacts();
    const index = contacts.findIndex(c => c.id === contactId);
    if (index === -1) return false;

    contacts[index] = { ...contacts[index], ...updatedData };
    this._setItem(STORAGE_KEYS.CONTACTS, contacts);
    return true;
  }

  deleteContact(contactId) {
    const contacts = this.getContacts();
    const filtered = contacts.filter(c => c.id !== contactId);
    this._setItem(STORAGE_KEYS.CONTACTS, filtered);
    return true;
  }

  // --- SOS Emergency Events ---
  getSosEvents() {
    return this._getItem(STORAGE_KEYS.SOS_EVENTS, []);
  }

  triggerSos(notes = 'Manual SOS button triggered from Emergency Hub') {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const sosEvent = {
      id: 'SOS-' + Math.floor(1000 + Math.random() * 9000),
      type: '🚨 Critical Emergency SOS Triggered',
      location: 'Primary Residence',
      date: dateStr,
      time: timeStr,
      severity: 'Critical',
      status: 'Active',
      notes,
      createdAt: now.getTime(),
      disarmedAt: null
    };

    // Add to SOS events list
    const sosEvents = this.getSosEvents();
    sosEvents.unshift(sosEvent);
    this._setItem(STORAGE_KEYS.SOS_EVENTS, sosEvents);

    // Also trigger an active high-severity alert so the dashboard reacts
    this.addAlert({
      type: '🚨 EMERGENCY SOS ALARM',
      location: 'Primary Residence',
      severity: 'Critical',
      notes: 'Emergency SOS activated. Immediate assistance required.',
      icon: 'alert-triangle'
    });

    return sosEvent;
  }

  disarmSos(sosId) {
    const now = new Date();
    const sosEvents = this.getSosEvents();
    const idx = sosEvents.findIndex(s => s.id === sosId);
    if (idx !== -1) {
      sosEvents[idx].status = 'Disarmed';
      sosEvents[idx].disarmedAt = now.getTime();
      this._setItem(STORAGE_KEYS.SOS_EVENTS, sosEvents);
    }
  }

  // --- Settings ---
  getSettings() {
    return this._getItem(STORAGE_KEYS.SETTINGS, SEED_DATA.settings);
  }

  updateSettings(newSettings) {
    const current = this.getSettings();
    const merged = { ...current, ...newSettings };
    this._setItem(STORAGE_KEYS.SETTINGS, merged);
    return merged;
  }

  // --- Status & Statistics Engine ---
  getSecurityOverview() {
    const alerts = this.getAlerts();
    const activeAlerts = alerts.filter(a => a.status === 'Active');
    const resolvedAlerts = alerts.filter(a => a.status === 'Resolved');
    const contacts = this.getContacts();
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEvents = alerts.filter(a => a.date === todayStr);

    const isAlert = activeAlerts.length > 0;
    const status = isAlert ? 'ALERT' : 'SAFE';

    const now = new Date();
    const lastChecked = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return {
      status, // 'SAFE' | 'ALERT'
      activeCount: activeAlerts.length,
      resolvedCount: resolvedAlerts.length,
      todayCount: todayEvents.length,
      contactsCount: contacts.length,
      activeAlerts,
      lastChecked
    };
  }

  // Reset demo state
  resetToDemo() {
    this.initStorage(true);
  }
}

// Instantiate global singleton
window.securityStorage = new SecurityStorage();
