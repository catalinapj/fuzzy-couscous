import { Box, TextField, IconButton } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SendIcon from '@mui/icons-material/Send';

export default function MessageInputFooter({ input, setInput, onSend }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2 }}>
      <IconButton>
        <AttachFileIcon />
      </IconButton>
      <TextField
        fullWidth
        placeholder="Write a message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        multiline
        maxRows={4}
      />
      <IconButton>
        <SendIcon />
      </IconButton>
    </Box>
  );
}
