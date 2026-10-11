import { config } from "../config.js";

/**
 * @typedef {Object} Room
 * @property {string} code
 * @property {number} createdAt
 * @property {number} expiresAt      - hard TTL, tidak diperpanjang
 * @property {number} emptySince     - timestamp sejak room kosong, null kalau ada penghuni
 * @property {Map<string, string>} members - socketId -> nickname
 */

const rooms = new Map();

export function createRoom(code) {
  const now = Date.now();
  const room = {
    code,
    createdAt: now,
    expiresAt: now + config.roomTtlMs,
    emptySince: now,
    members: new Map(),
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code) {
  return rooms.get(code);
}

export function deleteRoom(code) {
  rooms.delete(code);
}

export function roomExists(code) {
  return rooms.has(code);
}

export function addMember(code, socketId, nickname) {
  const room = rooms.get(code);
  if (!room) return null;
  room.members.set(socketId, nickname);
  room.emptySince = null;
  return room;
}

export function removeMember(code, socketId) {
  const room = rooms.get(code);
  if (!room) return;
  room.members.delete(socketId);
  if (room.members.size === 0) {
    room.emptySince = Date.now();
  }
}

/** Buang room yang sudah lewat TTL atau kosong lebih dari idleTimeoutMs. */
export function sweepExpiredRooms() {
  const now = Date.now();
  const removed = [];
  for (const [code, room] of rooms) {
    const pastTtl = now >= room.expiresAt;
    const idleTooLong = room.emptySince !== null && now - room.emptySince >= config.idleTimeoutMs;
    if (pastTtl || idleTooLong) {
      rooms.delete(code);
      removed.push(code);
    }
  }
  return removed;
}

export function roomCount() {
  return rooms.size;
}
