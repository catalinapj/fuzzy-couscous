import {
  Badge,
  Box,
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
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CreateIcon from "@mui/icons-material/Create";
import PhoneIcon from "@mui/icons-material/Phone";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { stringAvatar } from "../data/contacts";
import { useFooter } from "../contexts/FooterContext";
import MessageInputFooter from "../components/MessageInputFooter";

const API_BASE = "http://127.0.0.1:8080";

function getToken() {
  return localStorage.getItem("access_token");
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}

export default function MessagesPage() {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const { setFooterContent } = useFooter();

  const fetchConversations = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setError("No token found. Please log in first.");
      setLoadingUsers(false);
      return;
    }

    try {
      const meResp = await fetch(`${API_BASE}/users/me`, {
        headers: authHeaders(),
      });
      if (meResp.ok) {
        const me = await meResp.json();
        setCurrentUserId(me.id);
      }

      const response = await fetch(`${API_BASE}/messages/conversations`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to fetch conversations");
      }

      const data = await response.json();
      const userChats = data.map((convo) => ({
        id: convo.user.id,
        name: convo.user.username,
        lastMessage: convo.last_message.content,
        lastMessageTime: new Date(convo.last_message.created_at).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        unreadCount: convo.unread_count,
      }));

      setChats(userChats);
      if (!selectedChatId && userChats.length > 0) {
        setSelectedChatId(userChats[0].id);
      }
    } catch (err) {
      setError(err.message || "Unexpected error while fetching conversations");
    } finally {
      setLoadingUsers(false);
    }
  }, [selectedChatId]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const ws = new WebSocket(`ws://127.0.0.1:8080/ws/chat?token=${token}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== "new_message") return;

      const msg = data.message;

      setMessages((prev) => {
        if (msg.sender_id === selectedChatId || msg.receiver_id === selectedChatId) {
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
                  lastMessageTime: new Date(msg.created_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  unreadCount: partnerId === selectedChatId ? 0 : c.unreadCount + 1,
                }
              : c
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
            lastMessageTime: new Date(msg.created_at).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
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
          { headers: authHeaders() }
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
    [chats, selectedChatId]
  );

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter((chat) => chat.name.toLowerCase().includes(query));
  }, [chats, searchQuery]);

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );
  };

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
            : chat
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
      />
    );
    return () => setFooterContent(null);
  }, [input, setFooterContent, handleSend]);

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!selectedChat) {
    return (
      <Box
        sx={{
          height: "calc(100vh - 64px)",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "grey.100",
        }}
      >
        <Typography>Select a chat to start messaging</Typography>
      </Box>
    );
  }

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
          <IconButton>
            <CreateIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 1.5, bgcolor: "background.paper" }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search"
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
          <List disablePadding>
            {filteredChats.map((chat) => (
              <ListItemButton
                key={chat.id}
                selected={chat.id === selectedChat.id}
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
                        sx={{ color: chat.unreadCount > 0 ? "primary.main" : "text.secondary", ml: 1 }}
                      >
                        {chat.lastMessageTime}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      sx={{
                        color: chat.unreadCount > 0 ? "text.primary" : "text.secondary",
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
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
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
                        color: isOwn ? "primary.contrastText" : "text.primary",
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
      </Box>
    </Container>
  );
}
