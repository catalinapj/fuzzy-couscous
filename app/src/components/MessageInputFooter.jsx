import { Box, TextField, IconButton } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import MicIcon from "@mui/icons-material/Mic";
import { colors, commonStyles } from "../theme";

export default function MessageInputFooter({ input, setInput, onSend }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2 }}>
      <IconButton sx={commonStyles.iconButton}>
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
        sx={commonStyles.input}
      />
      <IconButton sx={commonStyles.iconButton}>
        <EmojiEmotionsIcon />
      </IconButton>
      <IconButton sx={commonStyles.iconButton}>
        <MicIcon />
      </IconButton>
    </Box>
  );
}
