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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CreateIcon from "@mui/icons-material/Create";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import MicIcon from "@mui/icons-material/Mic";
import PhoneIcon from "@mui/icons-material/Phone";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useEffect, useMemo, useRef, useState } from "react";
import { contacts, stringAvatar } from "../data/contacts";
import { useFooter } from "../contexts/FooterContext";
import MessageInputFooter from "../components/MessageInputFooter";

// Convert contacts to chats with initial messages
const initialChats = contacts.map((contact, index) => ({
  id: contact.id,
  name: contact.name,
  lastMessage: index === 0 ? "Hello there!" : index === 1 ? "How are you doing?" : "Thanks for the update",
  lastMessageTime: index === 0 ? "17:13" : index === 1 ? "12:54" : "Tue",
  unreadCount: index === 1 ? 2 : index === 4 ? 1 : 0,
}));

export default function MessagesPage() {
  const [chats, setChats] = useState(initialChats);
  const [selectedChatId, setSelectedChatId] = useState(initialChats[0]?.id || null);
  const [messagesByChat, setMessagesByChat] = useState({
    1: [{ id: 1, text: "Hello there!", author: contacts[0].name, timestamp: new Date(Date.now() - 3600000) }],
    2: [{ id: 1, text: "How are you doing?", author: contacts[1].name, timestamp: new Date(Date.now() - 7200000) }],
    3: [{ id: 1, text: "Thanks for the update", author: contacts[2].name, timestamp: new Date(Date.now() - 86400000) }],
    4: [{ id: 1, text: "See you tomorrow", author: contacts[3].name, timestamp: new Date(Date.now() - 172800000) }],
    5: [{ id: 1, text: "Great meeting today!", author: contacts[4].name, timestamp: new Date(Date.now() - 259200000) }],
    6: [{ id: 1, text: "Looking forward to it", author: contacts[5].name, timestamp: new Date(Date.now() - 345600000) }],
  });
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  const { setFooterContent } = useFooter();

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) || chats[0],
    [chats, selectedChatId]
  );

  const messages = messagesByChat[selectedChat?.id] || [];

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(query) ||
        chat.lastMessage.toLowerCase().includes(query)
    );
  }, [chats, searchQuery]);

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
  };

  const handleSend = useMemo(() => {
    return () => {
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
  }, [input, selectedChat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChat?.id]);

  // Set footer content when component mounts/updates
  useEffect(() => {
    setFooterContent(
      <MessageInputFooter
        input={input}
        setInput={setInput}
        onSend={handleSend}
      />
    );
    
    // Cleanup: clear footer when leaving this page
    return () => setFooterContent(null);
  }, [input, setFooterContent, handleSend]);

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
          height: "calc(100vh - 64px)",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: 'grey.100',
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
        bgcolor: 'background.paper',
      }}
    >
      {/* Left Panel - Chat List */}
      <Box
        sx={{
          width: "400px",
          borderRight: 1,
          borderColor: 'divider',
          display: "flex",
          flexDirection: "column",
          bgcolor: 'grey.50',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Chats
          </Typography>
          <IconButton>
            <CreateIcon />
          </IconButton>
        </Box>

        {/* Search Bar */}
        <Box sx={{ p: 1.5, bgcolor: 'background.paper' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search (⌘K)"
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

        {/* Chat List */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
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
                    bgcolor: 'action.selected',
                    "&:hover": {
                      bgcolor: 'action.hover',
                    },
                  },
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
                        }}
                      >
                        {chat.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary", ml: 1 }}
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
                          color: "text.secondary",
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
                          color="primary"
                          sx={{
                            height: "20px",
                            minWidth: "20px",
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
          bgcolor: 'background.paper',
        }}
      >
        {/* Conversation Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
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
                color: "text.secondary",
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
                          variant="filled"
                          sx={{
                            bgcolor: 'action.selected',
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
                          bgcolor: isOwnMessage
                            ? 'primary.main'
                            : 'grey.200',
                          color: 'text.primary',
                          borderRadius: 2,
                          borderTopLeftRadius: isOwnMessage ? 2 : 0,
                          borderTopRightRadius: isOwnMessage ? 0 : 2,
                        }}
                      >
                        {!isOwnMessage && (
                          <Typography
                            variant="caption"
                            sx={{
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
                            wordBreak: "break-word",
                          }}
                        >
                          {message.text}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
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
    </Container>
  );
}

