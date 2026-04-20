import { Box, TextField, IconButton } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SendIcon from '@mui/icons-material/Send';

export default function MessageInputFooter({
  input,
  setInput,
  onSend,
  disabled = false,
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) onSend();
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2 }}>
      <IconButton disabled={disabled}>
        <AttachFileIcon />
      </IconButton>
      <TextField
        fullWidth
        placeholder={
          disabled ? "Choose someone to message first…" : "Write a message..."
        }
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        multiline
        maxRows={4}
        disabled={disabled}
      />
      <IconButton disabled={disabled} onClick={() => !disabled && onSend()}>
        <SendIcon />
      </IconButton>
    </Box>
  );
}
