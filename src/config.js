export const config = {
  port: process.env.PORT || 3000,
  roomCodeLength: 6,
  maxRoomSize: 8,
  // Room dihapus kalau tidak ada penghuni sama sekali selama ini (ms).
  idleTimeoutMs: 5 * 60 * 1000,
  // Umur maksimum room walau terus dipakai (ms) — batas atas "rahasia" tidak bisa hidup selamanya.
  roomTtlMs: 60 * 60 * 1000,
  // Interval sweep untuk membuang room yang sudah lewat idle/TTL.
  sweepIntervalMs: 30 * 1000,
  rateLimit: {
    windowMs: 10 * 1000,
    maxMessages: 20,
  },
};
