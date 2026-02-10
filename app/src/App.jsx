import { useEffect, useMemo, useRef, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  List,
  ListItem,
  ListItemText,
  TextField,
  IconButton,
  Stack,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  const ws = useMemo(() => new WebSocket("ws://127.0.0.1:8080/ws"), []);

  useEffect(() => {
    ws.onmessage = (e) => setMessages((m) => [...m, e.data]);
    ws.onclose = () => console.log("ws closed");
    ws.onerror = (err) => console.log("ws error", err);
    return () => ws.close();
  }, [ws]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const v = text.trim();
    if (!v) return;
    ws.send(v);
    setText("");
  };

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Chat
          </Typography>
          <Typography variant="body2">WS: 127.0.0.1:8080</Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Paper variant="outlined" sx={{ height: 420, display: "flex", flexDirection: "column" }}>
          <List sx={{ flex: 1, overflowY: "auto" }}>
            {messages.map((m, i) => (
              <ListItem key={i} divider>
                <ListItemText primary={m} />
              </ListItem>
            ))}
            <div ref={bottomRef} />
          </List>

          <Stack direction="row" spacing={1} sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            />
            <IconButton color="primary" onClick={send} aria-label="send">
              <SendIcon />
            </IconButton>
          </Stack>
        </Paper>
      </Container>
    </>
  );
}

