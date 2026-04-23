import {
  Badge,
  Box,
  Button,
  Container,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  ListSubheader,
  Paper,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CreateIcon from "@mui/icons-material/Create";
import PhoneIcon from "@mui/icons-material/Phone";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { stringAvatar } from "../data/contacts";
import { useFooter } from "../contexts/FooterContext";
import MessageInputFooter from "../components/MessageInputFooter";
import { API_BASE } from "../config";

function getToken() {
  return localStorage.getItem("access_token");
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}

function websocketUrl(base, pathWithQuery) {
  if (!base) return "";
  try {
    const u = new URL(base);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    return `${u.origin}${pathWithQuery}`;
  } catch {
    return "";
  }
}

/** Pending DM from `/users` via router `state` and/or `?with=&name=`. */
function buildPendingChatFromRoute(startChat, qWith, qName) {
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

function mergeChatsWithPending(userChats, pending) {
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

export default function MessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [directoryHits, setDirectoryHits] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const { setFooterContent } = useFooter();

  /** Latest route compose inputs (avoid stale closures vs in-flight fetch). */
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
        lastMessageTime: new Date(
          convo.last_message.created_at,
        ).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
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

  /** Debounced directory search (/users?q=) for starting chats with people not yet in the list. */
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
                  lastMessageTime: new Date(msg.created_at).toLocaleTimeString(
                    "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  ),
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
            lastMessageTime: new Date(msg.created_at).toLocaleTimeString(
              "en-US",
              {
                hour: "2-digit",
                minute: "2-digit",
              },
            ),
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

  /** Directory users not already shown as chats (same search box). */
  const directoryCandidates = useMemo(() => {
    const chatIds = new Set(chats.map((c) => c.id));
    return directoryHits.filter((u) => {
      if (currentUserId != null && u.id === currentUserId) return false;
      return !chatIds.has(u.id);
    });
  }, [directoryHits, chats, currentUserId]);

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat,
      ),
    );
  };

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
      const response = await fetch(`${API_BASE}/messages/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          receiver_id: selectedChat.id,
          content: trimmed,
        }),
      });

      if (!response.ok) return;

      const saved = await response.json();
      setMessages((prev) => [...prev, saved]);

      setChats((prev) => {
        const updated = prev.map((chat) =>
          chat.id === selectedChat.id
            ? {
                ...chat,
                lastMessage: trimmed,
                lastMessageTime: new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChat?.id]);

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

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        height: "calc(100vh - 64px)",
        width: "100vw",
        display: "flex",
        bgcolor: "background.paper",
      }}
    >
      {/* Left Panel - Chat List */}
      <Box
        sx={{
          width: "400px",
          borderRight: 1,
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          bgcolor: "grey.50",
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Chats
          </Typography>
          <IconButton
            aria-label="Find people to message"
            onClick={() => navigate("/users")}
          >
            <CreateIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 1.5, bgcolor: "background.paper" }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search chats & people (directory)"
            type="search"
            autoComplete="off"
            inputProps={{ "aria-label": "Search chats and people" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {loadingUsers && (
            <Typography sx={{ px: 2, py: 1.5, color: "text.secondary" }}>
              Loading users...
            </Typography>
          )}
          {error && (
            <Typography sx={{ px: 2, py: 1.5, color: "red" }}>
              {error}
            </Typography>
          )}
          {!loadingUsers &&
          !error &&
          chats.length === 0 &&
          !searchQuery.trim() ? (
            <Box sx={{ px: 2, py: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No conversations yet. People from the directory only appear here
                after you exchange messages.
              </Typography>
              <Button variant="contained" onClick={() => navigate("/users")}>
                Open people
              </Button>
            </Box>
          ) : null}
          {!loadingUsers &&
          !error &&
          searchQuery.trim() &&
          !directoryLoading &&
          filteredChats.length === 0 &&
          directoryCandidates.length === 0 ? (
            <Typography sx={{ px: 2, py: 2 }} color="text.secondary">
              {`Nothing matches "${searchQuery.trim()}". Try another name, email, or id.`}
            </Typography>
          ) : null}
          <List disablePadding>
            {searchQuery.trim() && filteredChats.length > 0 ? (
              <ListSubheader
                component="div"
                sx={{
                  bgcolor: "grey.50",
                  py: 0.5,
                  typography: "overline",
                  fontWeight: 700,
                  color: "text.secondary",
                  lineHeight: 1.75,
                }}
              >
                Chats
              </ListSubheader>
            ) : null}
            {filteredChats.map((chat) => (
              <ListItemButton
                key={chat.id}
                selected={Boolean(selectedChat) && chat.id === selectedChat.id}
                onClick={() => handleSelectChat(chat.id)}
                sx={{
                  px: 2,
                  py: 1.5,
                  "&.Mui-selected": {
                    bgcolor: "action.selected",
                    "&:hover": { bgcolor: "action.hover" },
                  },
                }}
              >
                <ListItemAvatar>
                  <Badge
                    badgeContent={chat.unreadCount}
                    color="primary"
                    overlap="circular"
                  >
                    <Avatar {...stringAvatar(chat.name)} />
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: chat.unreadCount > 0 ? 700 : 400 }}
                      >
                        {chat.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color:
                            chat.unreadCount > 0
                              ? "primary.main"
                              : "text.secondary",
                          ml: 1,
                        }}
                      >
                        {chat.lastMessageTime}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      sx={{
                        color:
                          chat.unreadCount > 0
                            ? "text.primary"
                            : "text.secondary",
                        fontWeight: chat.unreadCount > 0 ? 600 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        mt: 0.5,
                      }}
                    >
                      {chat.lastMessage}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
            {searchQuery.trim() &&
            (directoryCandidates.length > 0 || directoryLoading) ? (
              <ListSubheader
                component="div"
                sx={{
                  bgcolor: "grey.50",
                  py: 0.5,
                  typography: "overline",
                  fontWeight: 700,
                  color: "text.secondary",
                  lineHeight: 1.75,
                }}
              >
                People
              </ListSubheader>
            ) : null}
            {directoryLoading && searchQuery.trim() ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={22} />
              </Box>
            ) : null}
            {directoryCandidates.map((user) => (
              <ListItemButton
                key={`dir-${user.id}`}
                selected={Boolean(selectedChat) && user.id === selectedChat.id}
                onClick={() => handleOpenDirectoryUser(user)}
                sx={{
                  px: 2,
                  py: 1.5,
                  "&.Mui-selected": {
                    bgcolor: "action.selected",
                    "&:hover": { bgcolor: "action.hover" },
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar {...stringAvatar(user.username)} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {user.username}
                    </Typography>
                  }
                  secondary={user.email}
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Box>

      {/* Right Panel - Conversation */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
        }}
      >
        {!selectedChat ? (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              px: 3,
              textAlign: "center",
              bgcolor: "grey.50",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Select a chat to start messaging
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your sidebar lists people you have already talked to. New accounts
              start with an empty list — open People, pick someone, and send a
              first message from their profile.
            </Typography>
            <Button variant="contained" onClick={() => navigate("/users")}>
              Go to people
            </Button>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar {...stringAvatar(selectedChat.name)} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {selectedChat.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    last seen recently
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <IconButton>
                  <PhoneIcon />
                </IconButton>
                <IconButton>
                  <SearchIcon />
                </IconButton>
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              </Box>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                p: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {messages.length === 0 ? (
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.secondary",
                  }}
                >
                  <Typography variant="body2">
                    No messages yet. Say hello!
                  </Typography>
                </Box>
              ) : (
                <>
                  {messages.map((message) => {
                    const isOwn = message.sender_id === currentUserId;
                    return (
                      <Box
                        key={message.id}
                        sx={{
                          display: "flex",
                          justifyContent: isOwn ? "flex-end" : "flex-start",
                          mb: 0.5,
                        }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            maxWidth: "60%",
                            bgcolor: isOwn ? "primary.main" : "grey.200",
                            color: isOwn
                              ? "primary.contrastText"
                              : "text.primary",
                            borderRadius: 2,
                            borderTopLeftRadius: isOwn ? 16 : 0,
                            borderTopRightRadius: isOwn ? 0 : 16,
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{ wordBreak: "break-word" }}
                          >
                            {message.content}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              textAlign: "right",
                              mt: 0.5,
                              fontSize: "0.7rem",
                              opacity: 0.7,
                            }}
                          >
                            {formatTime(message.created_at)}
                          </Typography>
                        </Paper>
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
}
