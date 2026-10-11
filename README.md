# Secret Room — Ephemeral Chat

Chat rahasia tanpa akun. Buat room, bagikan kodenya, ngobrol — begitu room idle atau lewat TTL, semua obrolan hilang permanen karena **tidak pernah disimpan ke database**, hanya di-broadcast langsung antar koneksi WebSocket yang aktif.

## Fitur

- Buat room instan, dapat kode unik 6 karakter (tanpa 0/O/1/I biar gampang dibaca)
- Join room pakai kode, tanpa registrasi/login
- Chat real-time via Socket.io
- Indikator jumlah member online + notifikasi join/leave
- Typing indicator
- Auto-expire: room dihapus kalau kosong > 5 menit, atau sudah berumur > 1 jam (lihat `src/config.js`)
- Rate limiting per koneksi (anti-spam) + rate limiting HTTP level

## Tech Stack

- **Express** — HTTP server & static file serving
- **Socket.io** — komunikasi real-time bidirectional
- **In-memory store** (`Map`) untuk state room — sengaja tidak pakai database supaya "ephemeral" itu nyata, bukan cuma klaim

## Menjalankan Lokal

```bash
npm install
npm run dev     # auto-restart saat file berubah
# atau
npm start
```

Buka `http://localhost:3000`.

## Struktur Project

```
src/
  server.js              Bootstrap Express + Socket.io + middleware
  config.js              Konstanta (TTL, rate limit, ukuran room)
  rooms/
    roomStore.js         In-memory room state + sweep room expired
    roomManager.js        Business logic: create/join/leave room
  socket/
    socketHandlers.js     Event handler Socket.io (join, message, typing, disconnect)
    messageRateLimiter.js Rate limit per socket (sliding window)
public/
  index.html, style.css, app.js   Frontend vanilla JS
```

## Catatan Desain

- **Tidak ada database** — kalau server restart, semua room hilang. Ini bukan bug, melainkan bagian dari jaminan "rahasia".
- **Room TTL dicek via interval sweep**, bukan lazy-check per-request, supaya room yang idle tidak nyangkut di memori selamanya.
- Untuk production dengan >1 instance server, `roomStore.js` perlu diganti ke Redis (key TTL native Redis pas banget buat use case ini) + `socket.io-redis` adapter supaya broadcast lintas instance tetap jalan.

## Roadmap (belum diimplementasi)

- Burn-after-read per pesan
- Room dengan password opsional
- Tombol "Hapus Room Sekarang" (self-destruct manual)
