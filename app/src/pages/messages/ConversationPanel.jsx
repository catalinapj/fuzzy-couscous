import {
  Avatar,
  Box,
  Button,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PhoneIcon from "@mui/icons-material/Phone";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import { stringAvatar } from "../../data/contacts";

export default function ConversationPanel({
  selectedChat,
  navigateToUsers,
  handleStartCall,
  callLoading,
  messages,
  currentUserId,
  formatTime,
  messagesEndRef,
}) {
  return (
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
            start with an empty list - open People, pick someone, and send a
            first message from their profile.
          </Typography>
          <Button variant="contained" onClick={navigateToUsers}>
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
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  last seen recently
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton
                onClick={handleStartCall}
                disabled={callLoading}
                aria-label="Start call"
              >
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
                <Typography variant="body2">No messages yet. Say hello!</Typography>
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
                        <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
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
  );
}
