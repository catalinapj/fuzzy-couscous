import {
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
  Chip,
  Badge,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CreateIcon from "@mui/icons-material/Create";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import MicIcon from "@mui/icons-material/Mic";
import PhoneIcon from "@mui/icons-material/Phone";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonIcon from "@mui/icons-material/Person";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import SettingsIcon from "@mui/icons-material/Settings";
import { useEffect, useMemo, useRef, useState } from "react";
import { colors, commonStyles } from "./theme";

// Convert savedPeople to actual chats with initial messages
const initialChats = [
  {
    id: 1,
    name: "Boris Johnson",
    lastMessage: "Hello there!",
    lastMessageTime: "17:13",
    unreadCount: 0,
  },
  {
    id: 2,
    name: "Donald Trump",
    lastMessage: "How are you doing?",
    lastMessageTime: "12:54",
    unreadCount: 2,
  },
  {
    id: 3,
    name: "Joe Biden",
    lastMessage: "Thanks for the update",
    lastMessageTime: "Tue",
    unreadCount: 0,
  },
  {
    id: 4,
    name: "Barack Obama",
    lastMessage: "See you tomorrow",
    lastMessageTime: "Mon",
    unreadCount: 0,
  },
  {
    id: 5,
    name: "Maia Sandu",
    lastMessage: "Great meeting today!",
    lastMessageTime: "Sun",
    unreadCount: 1,
  },
  {
    id: 6,
    name: "Emmanuel Macron",
    lastMessage: "Looking forward to it",
    lastMessageTime: "17 Feb",
    unreadCount: 0,
  },
];

function stringToColor(string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

function stringAvatar(name) {
  const parts = name.split(" ");
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";

  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: `${first}${second}`.toUpperCase(),
  };
}

export default function DesktopChatPage({ onNavigate }) {
  const [chats, setChats] = useState(initialChats);
  const [selectedChatId, setSelectedChatId] = useState(initialChats[0]?.id || null);
  const [messagesByChat, setMessagesByChat] = useState({
    1: [{ id: 1, text: "Hello there!", author: "Boris Johnson", timestamp: new Date(Date.now() - 3600000) }],
    2: [{ id: 1, text: "How are you doing?", author: "Donald Trump", timestamp: new Date(Date.now() - 7200000) }],
    3: [{ id: 1, text: "Thanks for the update", author: "Joe Biden", timestamp: new Date(Date.now() - 86400000) }],
    4: [{ id: 1, text: "See you tomorrow", author: "Barack Obama", timestamp: new Date(Date.now() - 172800000) }],
    5: [{ id: 1, text: "Great meeting today!", author: "Maia Sandu", timestamp: new Date(Date.now() - 259200000) }],
    6: [{ id: 1, text: "Looking forward to it", author: "Emmanuel Macron", timestamp: new Date(Date.now() - 345600000) }],
  });
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentNav, setCurrentNav] = useState("messages");
  const bottomRef = useRef(null);
  const messagesEndRef = useRef(null);

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) || chats[0],
    [chats, selectedChatId]
  );

  const messages = messagesByChat[selectedChat?.id] || [];

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter((chat) =>
      chat.name.toLowerCase().includes(query) ||
      chat.lastMessage.toLowerCase().includes(query)
    );
  }, [chats, searchQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChat?.id]);

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !selectedChat?.id) return;
    
    const newMessage = {
      id: Date.now(),
      text: trimmed,
      author: "You",
      timestamp: new Date(),
    };

    setMessagesByChat((prev) => ({
      ...prev,
      [selectedChat.id]: [...(prev[selectedChat.id] || []), newMessage],
    }));

    // Update chat's last message
    setChats((prevChats) =>
      prevChats.map((chat) =>
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
      )
    );

    setInput("");
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      });
    }
  };

  if (!selectedChat) {
    return (
      <Box
        sx={{
          ...commonStyles.container,
          alignItems: "center",
          justifyContent: "center",
          bgcolor: colors.backgroundTertiary,
        }}
      >
        <Typography>Select a chat to start messaging</Typography>
      </Box>
    );
  }

  // Calculate unread count
  const unreadCount = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={commonStyles.container}
    >
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Panel - Chat List */}
        <Box
          sx={{
            width: "400px",
            borderRight: `1px solid ${colors.border}`,
            ...commonStyles.panel,
          }}
        >
        {/* Header */}
        <Box
          sx={{
            ...commonStyles.header,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: colors.textPrimary }}>
            Chats
          </Typography>
          <IconButton sx={commonStyles.iconButton}>
            <CreateIcon />
          </IconButton>
        </Box>

        {/* Search Bar */}
        <Box sx={{ p: 1.5, bgcolor: colors.background }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search (⌘K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: colors.textSecondary }} />
                </InputAdornment>
              ),
            }}
            sx={commonStyles.searchInput}
          />
        </Box>

        {/* Chat List */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <List disablePadding>
            {filteredChats.map((chat) => (
              <ListItemButton
                key={chat.id}
                selected={chat.id === selectedChat.id}
                onClick={() => handleSelectChat(chat.id)}
                sx={{
                  ...commonStyles.listItem,
                  "&.Mui-selected": commonStyles.listItemSelected,
                }}
              >
                <ListItemAvatar>
                  <Avatar {...stringAvatar(chat.name)} />
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
                        sx={{
                          fontWeight: chat.unreadCount > 0 ? 600 : 400,
                          color: colors.textPrimary,
                        }}
                      >
                        {chat.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: colors.textSecondary, ml: 1 }}
                      >
                        {chat.lastMessageTime}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: 0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: colors.textSecondary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {chat.lastMessage}
                      </Typography>
                      {chat.unreadCount > 0 && (
                        <Chip
                          label={chat.unreadCount}
                          size="small"
                          sx={{
                            height: "20px",
                            minWidth: "20px",
                            bgcolor: colors.badge,
                            color: "white",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            ml: 1,
                          }}
                        />
                      )}
                    </Box>
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
          bgcolor: colors.background,
        }}
      >
        {/* Conversation Header */}
        <Box
          sx={{
            ...commonStyles.header,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar {...stringAvatar(selectedChat.name)} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: colors.textPrimary }}>
                {selectedChat.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: colors.textSecondary }}
              >
                last seen recently
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <IconButton sx={commonStyles.iconButton}>
              <PhoneIcon />
            </IconButton>
            <IconButton sx={commonStyles.iconButton}>
              <SearchIcon />
            </IconButton>
            <IconButton sx={commonStyles.iconButton}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Messages Area */}
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
                  color: colors.textSecondary,
                }}
              >
              <Typography variant="body2" sx={{ mb: 1 }}>
                {new Date().toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                })}
              </Typography>
              <Typography variant="caption">
                {selectedChat.name} joined Telegram
              </Typography>
            </Box>
          ) : (
            <>
              {messages.map((message, index) => {
                const isOwnMessage = message.author === "You";
                const showDate =
                  index === 0 ||
                  new Date(message.timestamp).toDateString() !==
                    new Date(messages[index - 1].timestamp).toDateString();

                return (
                  <Box key={message.id}>
                    {showDate && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          my: 2,
                        }}
                      >
                        <Chip
                          label={formatTime(message.timestamp)}
                          size="small"
                          sx={{
                            bgcolor: colors.hover,
                            color: colors.textSecondary,
                            fontSize: "0.75rem",
                          }}
                        />
                      </Box>
                    )}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: isOwnMessage ? "flex-end" : "flex-start",
                        mb: 1,
                      }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          maxWidth: "60%",
                          ...(isOwnMessage ? commonStyles.messageBubbleOwn : commonStyles.messageBubbleOther),
                        }}
                      >
                        {!isOwnMessage && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: colors.textPrimary,
                              fontWeight: 600,
                              display: "block",
                              mb: 0.5,
                            }}
                          >
                            {message.author}
                          </Typography>
                        )}
                        <Typography
                          variant="body1"
                          sx={{
                            color: isOwnMessage ? "white" : colors.textPrimary,
                            wordBreak: "break-word",
                          }}
                        >
                          {message.text}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: isOwnMessage ? "rgba(255, 255, 255, 0.7)" : colors.textSecondary,
                            display: "block",
                            textAlign: "right",
                            mt: 0.5,
                            fontSize: "0.7rem",
                          }}
                        >
                          {new Date(message.timestamp).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </Typography>
                      </Paper>
                    </Box>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>
      </Box>
      </Box>

      {/* Footer */}
      <Box sx={commonStyles.footer}>
        {/* Left Side - Navigation Icons */}
        <Box
          sx={{
            width: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            borderRight: `1px solid ${colors.border}`,
            bgcolor: colors.backgroundSecondary,
          }}
        >
          <IconButton
            onClick={() => {
              setCurrentNav("contacts");
              onNavigate?.("contacts");
            }}
            sx={{
              ...commonStyles.iconButton,
              color: currentNav === "contacts" ? colors.primary : colors.textSecondary,
            }}
          >
            <PersonIcon sx={{ fontSize: 28 }} />
          </IconButton>
          <IconButton
            onClick={() => {
              setCurrentNav("calls");
              onNavigate?.("calls");
            }}
            sx={{
              ...commonStyles.iconButton,
              color: currentNav === "calls" ? colors.primary : colors.textSecondary,
            }}
          >
            <PhoneIcon sx={{ fontSize: 28 }} />
          </IconButton>
          <IconButton
            onClick={() => {
              setCurrentNav("messages");
              onNavigate?.("messages");
            }}
            sx={{
              ...commonStyles.iconButton,
              color: currentNav === "messages" ? colors.primary : colors.textSecondary,
            }}
          >
            {unreadCount > 0 ? (
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{
                  "& .MuiBadge-badge": {
                    bgcolor: colors.badgeError,
                    color: "white",
                  },
                }}
              >
                <ChatBubbleIcon sx={{ fontSize: 28 }} />
              </Badge>
            ) : (
              <ChatBubbleIcon sx={{ fontSize: 28 }} />
            )}
          </IconButton>
          <IconButton
            onClick={() => {
              setCurrentNav("settings");
              onNavigate?.("settings");
            }}
            sx={{
              ...commonStyles.iconButton,
              color: currentNav === "settings" ? colors.primary : colors.textSecondary,
            }}
          >
            <SettingsIcon sx={{ fontSize: 28 }} />
          </IconButton>
        </Box>

        {/* Right Side - Message Input */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            bgcolor: colors.background,
          }}
        >
          <IconButton sx={commonStyles.iconButton}>
            <AttachFileIcon />
          </IconButton>
          <TextField
            fullWidth
            placeholder="Write a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.shiftKey && handleSend()
            }
            multiline
            maxRows={4}
            sx={commonStyles.input}
          />
          <IconButton sx={commonStyles.iconButton}>
            <EmojiEmotionsIcon />
          </IconButton>
          <IconButton sx={commonStyles.iconButton}>
            <MicIcon />
          </IconButton>
        </Box>
      </Box>
    </Container>
  );
}


