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
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PhoneIcon from "@mui/icons-material/Phone";
import CallMadeIcon from "@mui/icons-material/CallMade";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import CallMissedIcon from "@mui/icons-material/CallMissed";
import { useState, useMemo } from "react";
import { contacts, stringAvatar } from "../data/contacts";

// Generate call history
const generateCallHistory = () => {
  const callTypes = ["outgoing", "incoming", "missed"];
  const now = new Date();

  return contacts.map((contact, index) => {
    const callType = callTypes[index % callTypes.length];
    const hoursAgo = index + 1;
    const timestamp = new Date(now.getTime() - hoursAgo * 3600000);

    return {
      id: contact.id,
      contact: contact,
      type: callType,
      timestamp: timestamp,
      duration: callType === "missed" ? null : Math.floor(Math.random() * 300) + 60, // 1-5 minutes
    };
  });
};

const callHistory = generateCallHistory();

export default function CallsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCalls = useMemo(() => {
    if (!searchQuery.trim()) return callHistory;
    const query = searchQuery.toLowerCase();
    return callHistory.filter(
      (call) =>
        call.contact.name.toLowerCase().includes(query) ||
        call.contact.phone.includes(query)
    );
  }, [searchQuery]);

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
      return "Just now";
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getCallIcon = (type) => {
    switch (type) {
      case "outgoing":
        return <CallMadeIcon sx={{ color: "#0088cc" }} />;
      case "incoming":
        return <CallReceivedIcon sx={{ color: "#4caf50" }} />;
      case "missed":
        return <CallMissedIcon sx={{ color: "#f44336" }} />;
      default:
        return <PhoneIcon />;
    }
  };

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        height: "calc(100vh - 64px)",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#ffffff",
        color: "text.primary",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
          bgcolor: "#ffffff",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
          Calls
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ p: 1.5, bgcolor: "#ffffff" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search calls..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "#ffffff",
              color: "text.primary",
              "& fieldset": {
                borderColor: "rgba(0, 0, 0, 0.12)",
              },
              "&:hover fieldset": {
                borderColor: "rgba(0, 0, 0, 0.23)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#0088cc",
              },
            },
            "& .MuiInputBase-input::placeholder": {
              color: "text.secondary",
            },
          }}
        />
      </Box>

      {/* Calls List */}
      <Box sx={{ flex: 1, overflowY: "auto", bgcolor: "#f8f9fa" }}>
        <List disablePadding>
          {filteredCalls.map((call) => (
            <ListItemButton
              key={call.id}
              sx={{
                px: 2,
                py: 1.5,
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <ListItemAvatar>
                <Avatar {...stringAvatar(call.contact.name)} />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 400,
                        color: "text.primary",
                      }}
                    >
                      {call.contact.name}
                    </Typography>
                    {getCallIcon(call.type)}
                  </Box>
                }
                secondary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.secondary",
                      }}
                    >
                      {formatTime(call.timestamp)}
                    </Typography>
                    {call.duration && (
                      <>
                        <Typography sx={{ color: "text.secondary" }}>•</Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.secondary",
                          }}
                        >
                          {formatDuration(call.duration)}
                        </Typography>
                      </>
                    )}
                  </Box>
                }
              />
              <IconButton
                sx={{
                  color: "#0088cc",
                  "&:hover": { bgcolor: "rgba(0, 136, 204, 0.1)" },
                }}
              >
                <PhoneIcon />
              </IconButton>
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Container>
  );
}
