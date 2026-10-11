import {
  createNewRoom,
  joinRoom,
  leaveRoom,
  getRoomMembers,
  RoomFullError,
  RoomNotFoundError,
} from "../rooms/roomManager.js";
import { isRateLimited, clearRateLimit } from "./messageRateLimiter.js";

function sanitizeNickname(raw) {
  const trimmed = String(raw ?? "").trim().slice(0, 24);
  return trimmed.length > 0 ? trimmed : "Anonim";
}

function sanitizeText(raw) {
  return String(raw ?? "").trim().slice(0, 2000);
}

export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    socket.on("room:create", (_payload, ack) => {
      const room = createNewRoom();
      ack?.({ ok: true, code: room.code });
    });

    socket.on("room:join", ({ code, nickname } = {}, ack) => {
      const roomCode = String(code ?? "").trim().toUpperCase();
      const cleanNickname = sanitizeNickname(nickname);

      try {
        joinRoom(roomCode, socket.id, cleanNickname);
      } catch (err) {
        if (err instanceof RoomNotFoundError) {
          return ack?.({ ok: false, error: "ROOM_NOT_FOUND" });
        }
        if (err instanceof RoomFullError) {
          return ack?.({ ok: false, error: "ROOM_FULL" });
        }
        throw err;
      }

      socket.data.roomCode = roomCode;
      socket.data.nickname = cleanNickname;
      socket.join(roomCode);

      socket.to(roomCode).emit("room:memberJoined", { nickname: cleanNickname });
      io.to(roomCode).emit("room:memberCount", { count: getRoomMembers(roomCode).length });

      ack?.({ ok: true, members: getRoomMembers(roomCode) });
    });

    socket.on("message:send", ({ text } = {}) => {
      const { roomCode, nickname } = socket.data;
      if (!roomCode) return;

      if (isRateLimited(socket.id)) {
        socket.emit("message:error", { error: "RATE_LIMITED" });
        return;
      }

      const cleanText = sanitizeText(text);
      if (!cleanText) return;

      io.to(roomCode).emit("message:new", {
        from: nickname,
        text: cleanText,
        at: Date.now(),
      });
    });

    socket.on("typing", ({ isTyping } = {}) => {
      const { roomCode, nickname } = socket.data;
      if (!roomCode) return;
      socket.to(roomCode).emit("typing", { nickname, isTyping: Boolean(isTyping) });
    });

    socket.on("disconnect", () => {
      const { roomCode, nickname } = socket.data;
      clearRateLimit(socket.id);
      if (!roomCode) return;

      leaveRoom(roomCode, socket.id);
      socket.to(roomCode).emit("room:memberLeft", { nickname });
      io.to(roomCode).emit("room:memberCount", { count: getRoomMembers(roomCode).length });
    });
  });
}
