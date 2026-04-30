import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import MessageInputFooter from "../../components/MessageInputFooter";
import { useFooter } from "../../contexts/FooterContext";
import { API_BASE } from "../../config";
import {
  authHeaders,
  buildPendingChatFromRoute,
  createCall,
  fetchCallJoin,
  formatChatTime,
  getToken,
  mergeChatsWithPending,
  postMessage,
  websocketUrl,
} from "./chatHelpers";

/** State, effects, and handlers for MessagesPage. */
export function useMessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setFooterContent } = useFooter();

  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [directoryHits, setDirectoryHits] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [callLoading, setCallLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const composeRouteRef = useRef({ location, searchParams });
  composeRouteRef.current = { location, searchParams };

  const directoryFetchAbortRef = useRef(null);

  const fetchConversations = useCallback(async (signal) => {
    const token = getToken();
    if (!token) {
      setError("No token found. Please log in first.");
      setLoadingUsers(false);
      return;
    }

    try {
      const meResp = await fetch(`${API_BASE}/users/me`, {
        headers: authHeaders(),
        signal,
      });
      if (signal?.aborted) return;
      if (meResp.ok) {
        const me = await meResp.json();
        setCurrentUserId(me.id);
      }

      const response = await fetch(`${API_BASE}/messages/conversations`, {
        headers: authHeaders(),
        signal,
      });

      if (signal?.aborted) return;

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to fetch conversations");
      }

      const data = await response.json();
      const userChats = data.map((convo) => ({
        id: convo.user.id,
        name: convo.user.username,
        lastMessage: convo.last_message.content,
        lastMessageTime: formatChatTime(convo.last_message.created_at),
        unreadCount: convo.unread_count,
      }));

      const { location: loc, searchParams: sp } = composeRouteRef.current;
      const pending = buildPendingChatFromRoute(
        loc.state?.startChat,
        sp.get("with"),
        sp.get("name"),
      );
      const merged = mergeChatsWithPending(userChats, pending);

      setChats(merged);
      setSelectedChatId((prev) => {
        if (pending && merged.some((c) => c.id === pending.id)) {
          return pending.id;
        }
        if (!prev && merged.length > 0) return merged[0].id;
        return prev;
      });
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Unexpected error while fetching conversations");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetchConversations(ac.signal);
    return () => ac.abort();
  }, [fetchConversations, location.key]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || !API_BASE) {
      directoryFetchAbortRef.current?.abort();
      directoryFetchAbortRef.current = null;
      setDirectoryHits([]);
      setDirectoryLoading(false);
      return undefined;
    }

    directoryFetchAbortRef.current?.abort();

    const timer = window.setTimeout(() => {
      const abortController = new AbortController();
      directoryFetchAbortRef.current = abortController;
      setDirectoryLoading(true);

      const run = async () => {
        try {
          const url = `${API_BASE}/users/?page=1&per_page=50&q=${encodeURIComponent(q)}`;
          const res = await fetch(url, {
            headers: authHeaders(),
            signal: abortController.signal,
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.detail || "Directory search failed");
          }
          const data = await res.json();
          setDirectoryHits(data.users ?? []);
        } catch (e) {
          if (e.name !== "AbortError") setDirectoryHits([]);
        } finally {
          setDirectoryLoading(false);
        }
      };
      run();
    }, 280);

    return () => {
      window.clearTimeout(timer);
      directoryFetchAbortRef.current?.abort();
      directoryFetchAbortRef.current = null;
    };
  }, [searchQuery]);

  useEffect(() => {
    const token = getToken();
    if (!token || !API_BASE) return;

    const url = websocketUrl(
      API_BASE,
      `/ws/chat?token=${encodeURIComponent(token)}`,
    );
    if (!url) return;

    const ws = new WebSocket(url);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== "new_message") return;

      const msg = data.message;

      setMessages((prev) => {
        if (
          msg.sender_id === selectedChatId ||
          msg.receiver_id === selectedChatId
        ) {
          return [...prev, msg];
        }
        return prev;
      });

      setChats((prev) => {
        const partnerId = msg.sender_id;
        const existing = prev.find((c) => c.id === partnerId);
        if (existing) {
          const updated = prev.map((c) =>
            c.id === partnerId
              ? {
                  ...c,
                  lastMessage: msg.content,
                  lastMessageTime: formatChatTime(msg.created_at),
                  unreadCount:
                    partnerId === selectedChatId ? 0 : c.unreadCount + 1,
                }
              : c,
          );
          const idx = updated.findIndex((c) => c.id === partnerId);
          if (idx > 0) {
            const [moved] = updated.splice(idx, 1);
            updated.unshift(moved);
          }
          return updated;
        }
        return [
          {
            id: partnerId,
            name: `user-${partnerId}`,
            lastMessage: msg.content,
            lastMessageTime: formatChatTime(msg.created_at),
            unreadCount: 1,
          },
          ...prev,
        ];
      });
    };

    return () => ws.close();
  }, [selectedChatId]);

  useEffect(() => {
    if (!selectedChatId) return;

    const fetchConversation = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/messages/conversation/${selectedChatId}`,
          { headers: authHeaders() },
        );
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages);
        }
      } catch {
        setMessages([]);
      }
    };

    fetchConversation();
  }, [selectedChatId]);

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) || chats[0],
    [chats, selectedChatId],
  );

  const filteredChats = useMemo(() => {
    const raw = searchQuery.trim();
    if (!raw) return chats;

    const query = raw.toLowerCase();
    const idMatch = /^\d+$/.test(raw.trim()) ? raw.trim() : null;

    return chats.filter((chat) => {
      const name = String(chat.name ?? "").toLowerCase();
      const last = String(chat.lastMessage ?? "").toLowerCase();
      if (name.includes(query) || last.includes(query)) return true;
      if (idMatch != null && String(chat.id) === idMatch) return true;
      return false;
    });
  }, [chats, searchQuery]);

  const directoryCandidates = useMemo(() => {
    const chatIds = new Set(chats.map((c) => c.id));
    return directoryHits.filter((u) => {
      if (currentUserId != null && u.id === currentUserId) return false;
      return !chatIds.has(u.id);
    });
  }, [directoryHits, chats, currentUserId]);

  const handleSelectChat = useCallback((chatId) => {
    setSelectedChatId(chatId);
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat,
      ),
    );
  }, []);

  const handleOpenDirectoryUser = useCallback((user) => {
    setChats((prev) => {
      if (prev.some((c) => c.id === user.id)) return prev;
      return [
        ...prev,
        {
          id: user.id,
          name: user.username,
          lastMessage: "",
          lastMessageTime: "",
          unreadCount: 0,
        },
      ];
    });
    setSelectedChatId(user.id);
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !selectedChat?.id) return;

    try {
      const response = await postMessage(selectedChat.id, trimmed);

      if (!response.ok) return;

      const saved = await response.json();
      setMessages((prev) => [...prev, saved]);

      setChats((prev) => {
        const updated = prev.map((chat) =>
          chat.id === selectedChat.id
            ? {
                ...chat,
                lastMessage: trimmed,
                lastMessageTime: formatChatTime(new Date().toISOString()),
              }
            : chat,
        );
        const idx = updated.findIndex((c) => c.id === selectedChat.id);
        if (idx > 0) {
          const [moved] = updated.splice(idx, 1);
          updated.unshift(moved);
        }
        return updated;
      });

      setInput("");
    } catch {
      // silently fail for now
    }
  }, [input, selectedChat?.id]);

  const handleStartCall = useCallback(async () => {
    if (!selectedChat?.id || callLoading) return;

    setCallLoading(true);
    try {
      const createResponse = await createCall(selectedChat.id);

      if (!createResponse.ok) {
        const data = await createResponse.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to start call");
      }

      const createdCall = await createResponse.json();
      const joinResponse = await fetchCallJoin(createdCall.id);
      if (!joinResponse.ok) {
        const data = await joinResponse.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to join call");
      }

      const joinData = await joinResponse.json();
      const joinUrl = `${joinData.room_url}?t=${encodeURIComponent(joinData.token)}`;
      window.open(joinUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e.message || "Failed to start call");
    } finally {
      setCallLoading(false);
    }
  }, [selectedChat?.id, callLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChat?.id]);

  const openUsers = useCallback(() => navigate("/users"), [navigate]);

  useEffect(() => {
    setFooterContent(
      <MessageInputFooter
        input={input}
        setInput={setInput}
        onSend={handleSend}
        disabled={!selectedChat}
      />,
    );
    return () => setFooterContent(null);
  }, [input, setFooterContent, handleSend, selectedChat]);

  return {
    messagesEndRef,
    loadingUsers,
    error,
    chats,
    searchQuery,
    setSearchQuery,
    filteredChats,
    directoryCandidates,
    directoryLoading,
    selectedChat,
    handleSelectChat,
    handleOpenDirectoryUser,
    openUsers,
    handleStartCall,
    callLoading,
    messages,
    currentUserId,
  };
}
