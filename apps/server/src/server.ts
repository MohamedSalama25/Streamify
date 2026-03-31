import { createServer } from "node:http";

import { Server } from "socket.io";

import { logger } from "./common/logger/logger";
import type { AppSocketServer } from "./common/types/socket";
import { env } from "./config/env";
import { createApp } from "./app";
import { ChatService } from "./features/chat/services/chat-service";
import { RoomService } from "./features/rooms/services/room-service";
import { InMemoryRoomStore } from "./features/rooms/store/in-memory-room-store";
import { RtcConfigService } from "./features/rtc/services/rtc-config-service";
import { UserIdentityService } from "./features/users/services/user-identity-service";
import { SOCKET_NAMESPACES } from "./socket/namespaces";
import { registerSocketHandlers } from "./socket/register-handlers";

const rtcConfigService = new RtcConfigService();
const roomService = new RoomService(new InMemoryRoomStore());
const chatService = new ChatService();
const userIdentityService = new UserIdentityService();

const app = createApp(rtcConfigService, roomService);
const httpServer = createServer(app);
const io: AppSocketServer = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    credentials: true,
  },
});

io.of(SOCKET_NAMESPACES.app).on("connection", (socket) => {
  registerSocketHandlers({
    io,
    socket,
    roomService,
    chatService,
    userIdentityService,
  });
});

httpServer.listen(env.PORT, () => {
  logger.info(`Server listening on http://localhost:${env.PORT}`);
});
