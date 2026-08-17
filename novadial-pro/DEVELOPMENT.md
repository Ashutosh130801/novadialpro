# NovaDial Pro - Development Guide

## Project Overview

NovaDial Pro is a modern dialer application built for the Dinstar ecosystem, featuring:
- Softphone capabilities (SIP/WebRTC)
- Auto-dialer engine (Preview, Power, Progressive, Predictive)
- AI copilot (transcription, sentiment, suggestions)
- Dinstar gateway integration (SIM intelligence, SMS, USSD)
- CRM integrations
- Supervisor wallboard

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     NovaDial Pro Clients                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Desktop   │  │    Web      │  │   Mobile    │              │
│  │  (Electron) │  │  (WebRTC)   │  │(React Native)│             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
│                    WebSocket/SIP                                 │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                      Backend Server                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express.js API + Socket.IO + SIP.js                     │   │
│  │  - Authentication (JWT)                                   │   │
│  │  - Call Management                                        │   │
│  │  - Campaign Engine                                        │   │
│  │  - Gateway Integration                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                       │
│         ┌────────────────┼────────────────┐                     │
│         ▼                ▼                ▼                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │ PostgreSQL │  │   Redis    │  │  AMI/SIP   │                 │
│  │   (Data)   │  │  (Cache)   │  │  (Dinstar) │                 │
│  └────────────┘  └────────────┘  └────────────┘                 │
└──────────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL 14+
- Redis 7+
- Dinstar UC2000/UC8000 or DWG2000/DAG2000 (for hardware integration)

### Installation

```bash
cd novadial-pro

# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspaces

# Copy environment file
cp .env.example .env

# Start development servers
npm run dev
```

### Development Commands

```bash
# Root level
npm run dev          # Start all dev servers
npm run build        # Build all workspaces
npm run test         # Run tests
npm run lint         # Lint code

# Server only
cd server && npm run dev

# Web client only
cd client/web && npm run dev

# Desktop client only
cd client/desktop && npm run dev
```

## Feature Implementation Status

### M1 - Accounts & Provisioning ✅
- [x] Multi-SIP accounts state management
- [x] Auth slice with SIP account support
- [ ] QR-code provisioning UI
- [ ] SSO integration

### M2 - Core Calling ✅
- [x] Call state management (Redux slices)
- [x] Dialer UI components
- [x] Call controls (mute, hold, transfer)
- [ ] SIP.js integration
- [ ] WebRTC setup

### M3 - Contacts & History ✅
- [x] Contact state management
- [x] Call history tracking
- [x] Blacklist/DNC support
- [ ] CSV/vCard import
- [ ] LDAP sync

### M4 - Auto-Dialer Engine ✅
- [x] Campaign data models
- [x] Dial mode support (manual, preview, power, progressive, predictive)
- [x] Lead management
- [ ] Dialer engine implementation
- [ ] AMD (Answering Machine Detection)

### M5 - Dinstar Gateway Integration ✅
- [x] Gateway state management
- [x] SIM port monitoring models
- [x] SMS/USSD API routes
- [ ] Real gateway API integration
- [ ] SIM rotation policies

### M6 - Agent Workspace ✅
- [x] Hero Dialer UI
- [x] Disposition buttons
- [x] Quick actions
- [ ] AI copilot integration
- [ ] Dynamic scripts

### M7 - Supervisor & QA ✅
- [x] Wallboard UI
- [x] KPI metrics display
- [x] Agent status grid
- [ ] Listen/Whisper/Barge
- [ ] QA scorecards

### M8 - CRM & Integrations
- [ ] Salesforce integration
- [ ] HubSpot integration
- [ ] Webhook system
- [ ] Browser extension

### M9 - Admin & Security ✅
- [x] JWT authentication
- [x] RBAC models
- [ ] Audit logging
- [ ] GDPR tools

### M10 - Mobile App
- [ ] React Native setup
- [ ] Mobile dialer UI
- [ ] Push notifications
- [ ] Offline mode

## Next Steps

1. **Install Dependencies**: Run `npm install` in root and all workspaces
2. **Setup Database**: Configure PostgreSQL and run migrations
3. **Configure Dinstar**: Set up your Dinstar gateway credentials
4. **Start Development**: Run `npm run dev` to start all services
5. **Build SIP Integration**: Implement SIP.js for calling
6. **Implement Dialer Engine**: Build the auto-dialer logic
7. **Add AI Features**: Integrate transcription and sentiment analysis

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| POST | /api/auth/register | User registration |
| GET | /api/auth/me | Get current user |
| POST | /api/calls/outbound | Initiate outbound call |
| GET | /api/calls/history | Get call history |
| GET | /api/campaigns | List campaigns |
| POST | /api/campaigns | Create campaign |
| GET | /api/contacts | List contacts |
| POST | /api/contacts | Create contact |
| GET | /api/gateways/status | Get gateway status |
| POST | /api/gateways/sms/send | Send SMS |
| POST | /api/gateways/ussd | Execute USSD |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

Confidential - All rights reserved
