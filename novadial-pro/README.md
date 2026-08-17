# NovaDial Pro

The modern dialer built for the Dinstar ecosystem — softphone + auto‑dialer + AI copilot in one beautiful app.

## Project Structure

```
novadial-pro/
├── client/                 # Client applications
│   ├── desktop/           # Electron-based desktop app (Windows, macOS, Linux)
│   ├── mobile/            # React Native mobile app (Android, iOS)
│   └── web/               # WebRTC web client
├── server/                # Backend services
│   ├── api/               # REST API endpoints
│   ├── services/          # Business logic services
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   └── utils/             # Utilities and helpers
├── shared/                # Shared code between client and server
├── docs/                  # Documentation
└── assets/                # Static assets
```

## Tech Stack

### Client
- **Desktop**: Electron + React + TypeScript
- **Mobile**: React Native + TypeScript
- **Web**: React + TypeScript + WebRTC

### Server
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + Redis
- **SIP**: SIP.js / PJSIP
- **WebSocket**: Socket.io

## Features (MVP - P0)

### M1 - Accounts & Provisioning
- [ ] Multi-SIP accounts (up to 10)
- [ ] QR-code & URL zero-touch provisioning
- [ ] SSO (SAML/OIDC), MFA, RBAC
- [ ] Config backup/restore

### M2 - Core Calling
- [ ] Place/answer/end, mute, hold/resume, DTMF
- [ ] Blind + attended transfer, conference, park/pickup
- [ ] Codecs: G.711a/µ, G.722, G.729, Opus, AMR
- [ ] NAT traversal (STUN/TURN/ICE), TLS/SRTP
- [ ] Auto-answer, DND, intercom/paging
- [ ] Global hotkeys + headset hook-switch

### M3 - Contacts & History
- [ ] Local contacts + vCard/CSV import
- [ ] Unified history (device + server CDR)
- [ ] Blacklist/DNC enforcement

### M4 - Auto-Dialer Engine
- [ ] Dial modes: Preview, Power, Progressive
- [ ] Campaign manager
- [ ] Lead lists import & management
- [ ] Retry logic & auto-redial
- [ ] Answering-Machine Detection (AMD)
- [ ] Agent state machine
- [ ] Disposition codes
- [ ] Callback scheduler

### M5 - Dinstar Gateway / SIM Intelligence
- [ ] Live port dashboard
- [ ] SIM rotation policies
- [ ] SMS via SIM ports
- [ ] Alerts system

### M6 - Agent Workspace
- [ ] Screen pop with CRM data
- [ ] Dynamic scripts
- [ ] Notes & disposition
- [ ] Wrap-up timer

### M7 - Supervisor & QA
- [ ] Realtime wallboard
- [ ] Listen / Whisper / Barge
- [ ] Scheduled reports

### M8 - CRM & Integrations
- [ ] Native CRM integrations
- [ ] REST webhooks
- [ ] Browser extension

### M9 - Admin, Security & Compliance
- [ ] RBAC, audit logs, MFA
- [ ] GDPR/TCPA compliance tools

### M10 - Mobile App
- [ ] Full agent flows
- [ ] Push notifications
- [ ] Offline mode

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
# Install dependencies
npm install

# Setup database
npm run db:migrate

# Start development servers
npm run dev
```

## License

Confidential - All rights reserved
