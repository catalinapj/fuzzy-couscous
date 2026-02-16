import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  TextField,
  Button,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useEffect, useMemo, useRef, useState } from "react";

const initialChats = [
  { id: "general", name: "General", lastMessage: "Welcome to General" },
  { id: "settings", name: "Settings", lastMessage: "" },
];

export default function DesktopChatPage() {
  const [chats] = useState(initialChats);
  const [selectedChatId, setSelectedChatId] = useState("general");
  const [messagesByChat, setMessagesByChat] = useState({});
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) || chats[0],
    [chats, selectedChatId]
  );

  const messages = messagesByChat[selectedChat.id] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChat.id]);

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !selectedChat.id) return;
    setMessagesByChat((prev) => ({
      ...prev,
      [selectedChat.id]: [
        ...(prev[selectedChat.id] || []),
        { id: Date.now(), author: "You", text: trimmed },
      ],
    }));
    setInput("");
  };

  return (
    <>
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Chats
          </Typography>
        </Toolbar>
      </AppBar>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flex: 1,
            overflow: "hidden",
            p: 2,
          }}
        >
          {/* Chat list (menu) */}
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <Box sx={{ p: 1.5 }}>
              <Typography variant="subtitle1">All Chats</Typography>
            </Box>
            <Divider />
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              <List>
                {chats.map((chat) => (
                  <ListItemButton
                    key={chat.id}
                    selected={chat.id === selectedChat.id}
                    divider
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <ListItemText
                      primary={chat.name}
                      secondary={chat.lastMessage}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          </Box>

          {/* Chat detail view */}
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <Box sx={{ p: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle1">{selectedChat.name}</Typography>
            </Box>

            <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
              {messages.map((m) => (
                <Box key={m.id} sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {m.author}
                  </Typography>
                  <Typography variant="body1">{m.text}</Typography>
                  <Divider sx={{ mt: 0.5 }} />
                </Box>
              ))}
              <div ref={bottomRef} />
            </Box>

            <Box
              sx={{
                borderTop: "1px solid",
                borderColor: "divider",
                p: 1.5,
              }}
            >
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder={`Message ${selectedChat.name}…`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSend()
                  }
                />
                <Button
                  variant="contained"
                  onClick={handleSend}
                  startIcon={<SendIcon />}
                >
                  Send
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
    </Container>
    </>
  );
}

