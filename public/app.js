const socket = io();

const viewLanding = document.getElementById("view-landing");
const viewRoom = document.getElementById("view-room");
const landingError = document.getElementById("landing-error");

const btnCreate = document.getElementById("btn-create");
const btnJoin = document.getElementById("btn-join");
const inputNickname = document.getElementById("input-nickname");
const inputCode = document.getElementById("input-code");

const roomCodeEl = document.getElementById("room-code");
const btnCopyCode = document.getElementById("btn-copy-code");
const memberCountEl = document.getElementById("member-count");
const btnLeave = document.getElementById("btn-leave");
const messageList = document.getElementById("message-list");
const typingIndicator = document.getElementById("typing-indicator");
const formMessage = document.getElementById("form-message");
const inputMessage = document.getElementById("input-message");

let typingTimeout = null;

function showError(message) {
  landingError.textContent = message;
  landingError.hidden = false;
}

function clearError() {
  landingError.hidden = true;
}

function enterRoom(code) {
  roomCodeEl.textContent = code;
  viewLanding.hidden = true;
  viewRoom.hidden = false;
  messageList.innerHTML = "";
  inputMessage.focus();
}

function appendSystemMessage(text) {
  const li = document.createElement("li");
  li.className = "system";
  li.textContent = text;
  messageList.appendChild(li);
  messageList.scrollTop = messageList.scrollHeight;
}

function appendChatMessage({ from, text, at }) {
  const li = document.createElement("li");
  const time = new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  li.innerHTML = `<span class="meta">${from} · ${time}</span>`;
  const body = document.createElement("span");
  body.textContent = text;
  li.appendChild(body);
  messageList.appendChild(li);
  messageList.scrollTop = messageList.scrollHeight;
}

function joinRoom(code, nickname) {
  socket.emit("room:join", { code, nickname }, (res) => {
    if (!res.ok) {
      const messages = {
        ROOM_NOT_FOUND: "Room tidak ditemukan atau sudah expired.",
        ROOM_FULL: "Room sudah penuh.",
      };
      showError(messages[res.error] ?? "Gagal gabung room.");
      return;
    }
    clearError();
    enterRoom(code);
    appendSystemMessage(`Kamu bergabung sebagai "${nickname || "Anonim"}"`);
  });
}

btnCreate.addEventListener("click", () => {
  socket.emit("room:create", {}, (res) => {
    if (!res.ok) return showError("Gagal membuat room, coba lagi.");
    const nickname = inputNickname.value.trim();
    joinRoom(res.code, nickname);
  });
});

btnJoin.addEventListener("click", () => {
  const code = inputCode.value.trim().toUpperCase();
  const nickname = inputNickname.value.trim();
  if (!code) return showError("Masukkan kode room.");
  joinRoom(code, nickname);
});

btnCopyCode.addEventListener("click", () => {
  navigator.clipboard?.writeText(roomCodeEl.textContent);
});

btnLeave.addEventListener("click", () => {
  window.location.reload();
});

formMessage.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = inputMessage.value.trim();
  if (!text) return;
  socket.emit("message:send", { text });
  inputMessage.value = "";
  socket.emit("typing", { isTyping: false });
});

inputMessage.addEventListener("input", () => {
  socket.emit("typing", { isTyping: true });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => socket.emit("typing", { isTyping: false }), 1500);
});

socket.on("message:new", appendChatMessage);

socket.on("message:error", ({ error }) => {
  if (error === "RATE_LIMITED") {
    appendSystemMessage("Kamu mengirim pesan terlalu cepat, tunggu sebentar.");
  }
});

socket.on("room:memberJoined", ({ nickname }) => {
  appendSystemMessage(`${nickname} bergabung`);
});

socket.on("room:memberLeft", ({ nickname }) => {
  appendSystemMessage(`${nickname} keluar`);
});

socket.on("room:memberCount", ({ count }) => {
  memberCountEl.textContent = `${count} online`;
});

socket.on("typing", ({ nickname, isTyping }) => {
  typingIndicator.hidden = !isTyping;
  typingIndicator.textContent = isTyping ? `${nickname} sedang mengetik...` : "";
});
