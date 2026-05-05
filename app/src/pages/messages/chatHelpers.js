import { API_BASE } from "../../config";

export function getToken() {
  return localStorage.getItem("access_token");
}

export function authHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}

export function websocketUrl(base, pathWithQuery) {
  if (!base) return "";
  try {
    const u = new URL(base);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    return `${u.origin}${pathWithQuery}`;
  } catch {
    return "";
  }
}

export function buildPendingChatFromRoute(startChat, qWith, qName) {
  let id;
  let username = "";

  if (startChat != null && startChat.id != null) {
    id = Number(startChat.id);
    username = typeof startChat.username === "string" ? startChat.username : "";
  } else if (qWith) {
    id = Number(qWith);
    username = qName ? decodeURIComponent(qName) : "";
  } else {
    return null;
  }

  if (!Number.isFinite(id)) return null;
  return { id, name: username || `User ${id}` };
}

export function mergeChatsWithPending(userChats, pending) {
  if (!pending) return userChats;
  if (userChats.some((c) => c.id === pending.id)) return userChats;
  return [
    ...userChats,
    {
      id: pending.id,
      name: pending.name,
      lastMessage: "",
      lastMessageTime: "",
      unreadCount: 0,
    },
  ];
}

export function formatChatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function postMessage(receiverId, content) {
  const response = await fetch(`${API_BASE}/messages/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      receiver_id: receiverId,
      content,
    }),
  });
  return response;
}

export async function createCall(receiverId) {
  const response = await fetch(`${API_BASE}/calls/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ receiver_id: receiverId }),
  });
  return response;
}

/** GET /calls/{id} — room_id + room_url + token for the authenticated user only. */
export async function fetchCallJoin(callId) {
  return fetch(`${API_BASE}/calls/${callId}`, {
    headers: authHeaders(),
  });
}
