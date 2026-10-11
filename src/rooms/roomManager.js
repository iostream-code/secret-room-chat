import { customAlphabet } from "nanoid";
import { config } from "../config.js";
import * as store from "./roomStore.js";

// Tanpa 0/O/1/I biar kode gampang dibaca & diketik manual.
const generateCode = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", config.roomCodeLength);

export function createNewRoom() {
  let code = generateCode();
  while (store.roomExists(code)) {
    code = generateCode();
  }
  return store.createRoom(code);
}

export class RoomFullError extends Error {}
export class RoomNotFoundError extends Error {}

export function joinRoom(code, socketId, nickname) {
  const room = store.getRoom(code);
  if (!room) throw new RoomNotFoundError(`Room ${code} tidak ditemukan`);
  if (room.members.size >= config.maxRoomSize) throw new RoomFullError(`Room ${code} penuh`);
  return store.addMember(code, socketId, nickname);
}

export function leaveRoom(code, socketId) {
  store.removeMember(code, socketId);
}

export function getRoomMembers(code) {
  const room = store.getRoom(code);
  return room ? [...room.members.values()] : [];
}

export function startSweeper() {
  return setInterval(() => {
    const removed = store.sweepExpiredRooms();
    if (removed.length > 0) {
      console.log(`[sweep] removed ${removed.length} expired room(s): ${removed.join(", ")}`);
    }
  }, config.sweepIntervalMs);
}
