# HomeGuard — Interactive Home Security Monitoring & Simulation Web App

**Version:** 1.0  
**Stack:** Vanilla HTML5, CSS3, JavaScript (ES6+), LocalStorage  
**Design Standard:** Dark Security Theme + Light Mode, Responsive UI, Zero External Dependencies/Frameworks  

---

## 🚀 Live Demo & Presentation Quick Start

### 1. How to Launch
Simply open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Safari, Firefox) or serve via VS Code Live Server / static server.

### 2. Default Demo Login Credentials
* **Email:** `alex.mercer@homeguard.io`
* **Password:** `Password123!`
*(Credentials are pre-filled on the login page for convenience)*

---

## 🎯 Core Demo Acceptance Scenario

To demonstrate the full security workflow in 60 seconds:

1. **Initial State (🟢 SAFE):**
   * Log into `dashboard.html`.
   * Observe the status banner is `🟢 System Status: SAFE` with `0 Active Alerts`.
2. **Trigger Simulated Breach:**
   * Under **Quick Event Simulation**, click **Motion Detection**.
   * Instant audio chime/warning beep sounds and visual toast appears.
   * Status banner immediately transitions to `🔴 System Status: SECURITY ALERT (1 Active)`.
   * Active Alerts stat updates to `1` and the new incident appears in the recent feed.
3. **Resolve Breach:**
   * Click **Resolve** either directly on the dashboard feed or go to **Security Alerts** (`alerts.html`).
   * Alert is marked as `Resolved`.
   * Status automatically flips back to `🟢 System Status: SAFE`.
4. **Inspect Audit History:**
   * Navigate to **Security History** (`history.html`).
   * The motion event and its resolution timestamp are permanently recorded in the audit log.
5. **Emergency SOS Testing:**
   * Open **Emergency / SOS** (`emergency.html`).
   * Click the pulsing red **SOS** button $\rightarrow$ Confirm prompt $\rightarrow$ Siren banner sounds $\rightarrow$ Dispatch responder mock alerts.
   * Click **Disarm & Stand Down Alarm** to restore safety.

---

## 📂 Project Architecture

```text
Home-security@1/
│
├── index.html          # Login Page (Validation, Session Authentication)
├── signup.html         # User Registration Page
├── dashboard.html      # Central Command Dashboard (Status, Metrics, Triggers)
├── alerts.html         # Security Alerts Hub (Multi-filter, Simulate Modal, Resolve)
├── history.html        # Audit Log Ledger (Search, Filter, Export JSON)
├── emergency.html      # Emergency SOS Command Center (2-step modal, Siren Banner)
├── contacts.html       # Emergency Responders Management (CRUD, Mock Call/SMS)
├── profile.html        # Resident Profile & Emergency Responder Medical Notes
├── settings.html       # Preferences (Theme, Sound, Notifications, Demo Reset)
│
├── css/
│   ├── style.css       # Design tokens, custom properties, animations, toasts
│   ├── layout.css      # Header, sidebar navigation, responsive layout drawer
│   ├── components.css  # Buttons, badges, stat cards, modals, tables, forms
│   ├── auth.css        # Authentication cards and glowing backdrop
│   ├── dashboard.css   # Hero status banner, quick action cards, feed
│   ├── alerts.css      # Alert cards, filter toolbar
│   └── emergency.css   # SOS button, pulsing rings, siren banner
│
├── js/
│   ├── storage.js      # Centralized Data Layer (localStorage, Business Logic)
│   ├── ui.js           # Shared UI (Toasts, Web Audio chimes, Theme, Modals)
│   ├── auth.js         # Authentication session guard, login, register, logout
│   ├── dashboard.js    # Dashboard telemetry & simulation triggers
│   ├── alerts.js       # Alerts hub controller & simulation modal
│   ├── history.js      # Audit log search & JSON export controller
│   ├── emergency.js    # SOS activation, siren banner, responder simulation
│   ├── contacts.js     # Contacts CRUD controller
│   ├── profile.js      # Profile & emergency info controller
│   └── settings.js     # Preferences & factory reset controller
│
├── design.md           # UI/UX Specification Document
├── requirements.md     # Technical & Functional Requirements
└── tasks.md            # Implementation Roadmap & Verification Checklist
```

---

## 🔄 Phase 2: Firebase Integration Roadmap

Because all application data operations are abstracted into `js/storage.js`, migrating to Firebase full-stack in Phase 2 requires only updating the storage adapter to:
1. `firebase.auth()` $\rightarrow$ Replacing mock login/signup in `js/auth.js`.
2. `firebase.firestore()` $\rightarrow$ Syncing `alerts`, `history`, `contacts`, and `settings` collections in real-time.
3. `firebase.storage()` $\rightarrow$ Uploading resident profile images.
