# Streamify

Streamify is a real-time collaboration and video calling MVP built as a `pnpm monorepo`. It uses WebRTC for peer-to-peer media transport and Socket.IO for signaling.

## 🚀 Key Features

- **Video Calls**: Peer-to-peer video/audio using WebRTC Mesh.
- **Screen Sharing**: Integrated screen sharing with automatic content pinning.
- **Real-time Chat**: Instant messaging within rooms.
- **Presence**: Real-time participant tracking and connection status.
- **Modern UI**: Responsive interface built with Next.js 16, Tailwind CSS, and shadcn/ui.

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide, Socket.io-client.
- **Backend**: Express.js, Socket.IO, TypeScript, Zod.
- **Shared Layer**: A dedicated package for types, events, and schemas shared between client and server.

## 📁 Project Structure

- `apps/web`: Next.js frontend application (feature-based architecture).
- `apps/server`: Node.js signaling and signaling server.
- `packages/shared`: Common types, constants, and Zod schemas.

```text
streamify/
├── apps/
│   ├── server/ (Express + Socket.io)
│   └── web/    (Next.js + Tailwind)
├── packages/
│   └── shared/ (Common types & schemas)
├── package.json
├── pnpm-workspace.yaml
└── README.md
```


## ⚙️ Setup and Usage

### Prerequisites
- Node.js 20+
- pnpm 10+

### Installation
```bash
# Install dependencies
pnpm install

# Setup environment variables
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env.local
```

### Running Locally
```bash
# Run both frontend and backend
pnpm dev

# Check types and linting
pnpm typecheck
pnpm lint
```

## 🌍 Deployment Notes (Vercel / Prod)

If the web app is deployed on HTTPS (e.g. Vercel), make sure:

- `apps/web` has `NEXT_PUBLIC_SOCKET_URL` set to your **public** signaling server URL (must be `https://...`).
- `apps/server` has `CLIENT_URL` set to your deployed web URL (so CORS + Socket.IO allow it).

If either is wrong, `/health` and Socket.IO will fail in production even if local works.

## 🔊 Fixing “No Audio Across Different Networks” (TURN)

WebRTC **STUN-only** works on many networks, but can fail behind symmetric NATs / restrictive firewalls (common with mobile hotspots, enterprise Wi‑Fi, some ISPs). For **reliable audio/video between different networks**, configure a **TURN** server (e.g. coturn) and set these in `apps/server/.env`:

- `RTC_TURN_URLS` (comma-separated, include UDP + TCP, and optionally TLS)
- `RTC_TURN_USERNAME`
- `RTC_TURN_CREDENTIAL`
- (optional) `RTC_ICE_TRANSPORT_POLICY=relay` to force TURN-only in restrictive environments

This repo includes a minimal coturn compose file:

```bash
TURN_EXTERNAL_IP=<your_public_ip> TURN_USERNAME=streamify TURN_CREDENTIAL=streamify docker compose -f docker-compose.turn.yml up -d
```

Then set (example):

```bash
RTC_TURN_URLS=turn:<your_public_ip>:3478?transport=udp,turn:<your_public_ip>:3478?transport=tcp
RTC_TURN_USERNAME=streamify
RTC_TURN_CREDENTIAL=streamify
```

## ⚠️ Current Limitations (WebRTC Mesh)
- **Scale**: Limited to **4 participants** per room due to P2P Mesh architecture.
- **Persistence**: Rooms and chats are ephemeral (no database integration yet).
- **Authentication**: Uses local storage for identity; no formal auth system.

## 🔮 Future Roadmap
- Transition to **SFU (Selective Forwarding Unit)** for larger room support.
- Database integration for persistent rooms and message history.
- Advanced moderation tools and host controls.
- Optimized reconnection strategies and network quality indicators.

---
Built with a production-minded architecture for easy scaling and future migrations.
