# Technical & Functional Requirements — Home Security App

**Version:** 1.0  
**Project Classification:** Web-based Home Security Monitoring & Simulation System  
**Phase:** Phase 1 (Frontend MVP) → Phase 2 (Firebase Full-Stack)  

---

## 1. Technology Stack & Dependencies

### Phase 1: Frontend Simulation
* **Markup:** Semantic HTML5 (`<header>`, `<nav>`, `<aside>`, `<main>`, `<section>`, `<article>`)
* **Styling:** Vanilla CSS3 with CSS Custom Properties (Variables), Flexbox, CSS Grid, media queries, and animations.
* **Scripting:** Vanilla JavaScript (ES6+ standard modules, `localStorage` API, custom event dispatching, DOM manipulation).
* **Iconography:** Lucide Icons (CDN lightweight SVG icons) + custom SVG security symbols.
* **Fonts:** Inter & System Sans font stack via Google Fonts.
* **No external build tools required** — 100% native browser support for static preview and deployment.

### Phase 2: Backend & Cloud Services (Planned)
* **Authentication:** Firebase Auth (Email/Password & Google OAuth).
* **Database:** Cloud Firestore (Real-time collections for users, alerts, logs, contacts, settings).
* **Hosting:** Firebase Hosting / GitHub Pages.
* **Storage (Optional):** Firebase Cloud Storage (Resident profile pictures).

---

## 2. System Architecture & Data Models

### 2.1 User Session Model
```json
{
  "id": "usr_1001",
  "name": "Alex Mercer",
  "email": "alex.mercer@homeguard.io",
  "phone": "+1 (555) 234-5678",
  "address": "742 Evergreen Terrace, Springfield",
  "emergencyInfo": "Blood Type: O+, Gate Code: #4821",
  "profilePicture": "assets/images/default-avatar.png",
  "isAuthenticated": true
}
```

### 2.2 Security Alert Model
```json
{
  "id": "ALT-8021",
  "type": "Motion Detected",
  "icon": "activity",
  "location": "Living Room",
  "date": "2026-09-12",
  "time": "17:35:10",
  "severity": "Medium",
  "status": "Active",
  "notes": "Simulated infrared motion sensor trigger in central living area",
  "createdAt": 1789214710000,
  "resolvedAt": null
}
```

### 2.3 Emergency Contact Model
```json
{
  "id": "CNT-301",
  "name": "Sarah Connor",
  "relationship": "Family / Spouse",
  "phone": "+1 (555) 902-1144",
  "email": "sarah.connor@example.com",
  "isPrimary": true
}
```

### 2.4 Emergency SOS Event Model
```json
{
  "id": "SOS-9001",
  "date": "2026-09-12",
  "time": "17:36:00",
  "type": "Emergency SOS Alarm Triggered",
  "status": "Triggered",
  "triggeredBy": "Resident Alex Mercer",
  "disarmedAt": null
}
```

### 2.5 Settings & Preferences Model
```json
{
  "securityAlerts": true,
  "emergencyAlerts": true,
  "emailNotifications": false,
  "soundAlerts": true,
  "theme": "dark"
}
```

---

## 3. Feature Breakdown & Scope Classification

### 3.1 Required Features (Baseline PRD)
1. **Authentication (Mock/Frontend):**
   * Login with email & password validation, remember me, password visibility toggle.
   * Signup with name, email, phone, password strength, and password confirmation check.
   * Auto-redirect to dashboard when logged in, route protection for dashboard pages.
2. **Dynamic Dashboard:**
   * Dynamic **Home Security Status** (🟢 SAFE if active alerts == 0; 🔴 SECURITY ALERT if active alerts > 0).
   * 4 Dynamic Stats: Active Alerts count, Today's Events count, Resolved Alerts count, Emergency Contacts count.
   * 4 Instant One-Click Simulation buttons: Motion Detection, Door Opening, Window Opening, Emergency SOS.
   * Real-time "Recent Alerts" feed with immediate "Resolve" action.
3. **Security Alerts Hub:**
   * Full alert list rendering with severity indicators (Low, Medium, High, Critical).
   * "+ Simulate New Alert" modal form with customizable type, location, severity, and description.
   * Real-time search filter and multi-facet filtering (by Status, Severity, Event Type).
   * Single-click alert resolution updating system status and audit logs immediately.
4. **Security History / Audit Log:**
   * Permanent chronological log of all historical security incidents and resolved events.
   * Search and filter by event category, severity, or date.
5. **Simulated Emergency / SOS:**
   * Large visual SOS button with 2-step confirmation modal to prevent accidental triggers.
   * Simulated alarm mode triggering dispatch status, logging SOS incident, and presenting quick responder action list.
   * Disarm / reset mechanism to restore system safety.
   * Explicit notice: *"Simulated Educational Tool — Does NOT dial real 911 / emergency dispatch"*.
6. **Emergency Contacts Management:**
   * Full CRUD: Add contact, edit contact, delete contact with confirmation.
   * Action buttons for mock calling and mock SMS alerts with visual feedback.
7. **Resident Profile:**
   * View & edit profile details (Name, phone, email, home address, medical/emergency notes).
   * Instant local persistence and toast confirmation.
8. **Settings & Themes:**
   * Dark / Light mode toggle persisting across all pages.
   * Notification preference toggles.
   * "Reset Demo Data / Seed Sample Data" utility for reproducible demonstrations.

### 3.2 Recommended UX Improvements (Included in Phase 1)
* **Audible / Visual Security Alarm Pulse:** Subtle visual flashing header badge and optional pleasant synthetic audio chime (HTML5 Web Audio API) when an alert is triggered (can be muted in Settings).
* **Toast Notification System:** Non-blocking floating status toasts (e.g. *"Alert ALT-8021 resolved successfully"*, *"Contact deleted"*).
* **Demo Quick-Reset Floating Widget / Seed Data Switch:** Allows the presenter to reset the state to 🟢 SAFE with 1-click during live demonstrations.
* **Smooth Micro-Interactions & Keyboard Accessibility:** Keyboard Escape to dismiss modals, Enter to submit forms.

### 3.3 Future Enhancements (Phase 2 & Beyond)
* Real Firebase Authentication & Firestore real-time listener syncing across browser tabs.
* Real-time push notifications using Firebase Cloud Messaging (FCM).
* Real IoT hardware MQTT / WebSockets broker connection (Raspberry Pi / ESP32 sensors).

---

## 4. Acceptance Criteria & Core Demo Verification

### Primary Acceptance Scenario
```text
1. User lands on Dashboard:
   - Status Badge displays: 🟢 SAFE
   - Active Alerts: 0
2. User clicks "Simulate Motion Detection" Quick Action:
   - System registers new alert: "Motion Detected — Living Room"
   - Dashboard instantly updates Status Badge to: 🔴 SECURITY ALERT
   - Active Alerts count updates to: 1
   - Today's Events count increments
   - Recent Alerts list shows new active alert
3. User navigates to "Security Alerts" or clicks "Resolve" directly:
   - User clicks "Resolve" button on the alert
   - Alert status changes to "Resolved"
   - Dashboard returns to: 🟢 SAFE
   - Active Alerts count drops back to: 0
   - Resolved Alerts count increments
4. User opens "Security History":
   - The resolved motion event is permanently recorded with creation & resolution timestamps.
```

### Secondary Emergency Acceptance Scenario
```text
1. User navigates to Emergency / SOS page.
2. User presses the SOS button.
3. Confirmation modal appears: "Confirm Emergency Alert?".
4. User clicks "Confirm SOS".
5. Status switches to Critical Alarm mode, SOS event is recorded in History, and primary emergency contacts are highlighted.
6. User clicks "Disarm Alarm" to return to normal state.
```
