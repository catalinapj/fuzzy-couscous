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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PhoneIcon from "@mui/icons-material/Phone";
import { useState, useMemo } from "react";
import { contacts, stringAvatar } from "../data/contacts";

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.phone.includes(query)
    );
  }, [searchQuery]);

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
          Contacts
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ p: 1.5, bgcolor: "#ffffff" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search contacts..."
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

      {/* Contacts List */}
      <Box sx={{ flex: 1, overflowY: "auto", bgcolor: "#f8f9fa" }}>
        <List disablePadding>
          {filteredContacts.map((contact) => (
            <ListItemButton
              key={contact.id}
              sx={{
                px: 2,
                py: 1.5,
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <ListItemAvatar>
                <Avatar {...stringAvatar(contact.name)} />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 400,
                      color: "text.primary",
                    }}
                  >
                    {contact.name}
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                    }}
                  >
                    {contact.phone}
                  </Typography>
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
