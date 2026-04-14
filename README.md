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
