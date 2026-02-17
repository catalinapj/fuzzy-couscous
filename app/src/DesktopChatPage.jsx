import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  TextField,
  Button,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useEffect, useMemo, useRef, useState } from "react";

const initialChats = [
  { id: "general", name: "General", lastMessage: "Welcome to General" },
  { id: "settings", name: "Settings", lastMessage: "" },
  { id: "logout", name: "Logout", lastMessage: "" },
];

const savedPeople = [
  { id: 1, name: "Boris Johnson" },
  { id: 2, name: "Donald Trump" },
  { id: 3, name: "Joe Biden" },
  { id: 4, name: "Barack Obama" },
  { id: 5, name: "Maia Sandu" },
  { id: 6, name: "Emmanuel Macron" },
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
            <Box>
              <Typography variant="subtitle1">All Chats</Typography>
            </Box>
            <Divider />
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              <List>
                {chats.map((chat) => (
                  <Box key={chat.id}>
                    <ListItemButton
                      selected={chat.id === selectedChat.id}
                      divider
                      onClick={() => handleSelectChat(chat.id)}
                    >
                      <ListItemText
                        primary={chat.name}
                        secondary={chat.lastMessage}
                      />
                    </ListItemButton>

                    {chat.id === "general" && selectedChat.id === "general" && (
                      <List disablePadding>
                        {savedPeople.map((person) => (
                          <ListItemButton key={person.id} sx={{ pl: 4 }}>
                            <ListItemAvatar>
                              <Avatar {...stringAvatar(person.name)} />
                            </ListItemAvatar>
                            <ListItemText primary={person.name} />
                          </ListItemButton>
                        ))}
                      </List>
                    )}
                  </Box>
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

