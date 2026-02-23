import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  Divider,
  Avatar,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LockIcon from "@mui/icons-material/Lock";
import LanguageIcon from "@mui/icons-material/Language";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LogoutIcon from "@mui/icons-material/Logout";
import { useState } from "react";

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

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
          Settings
        </Typography>
      </Box>

      {/* Profile Section */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
        }}
      >
        <Avatar
          sx={{
            width: 80,
            height: 80,
            bgcolor: "#0088cc",
            mb: 2,
          }}
        >
          U
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          User
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          user@example.com
        </Typography>
      </Box>

      {/* Settings List */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <List disablePadding>
          <ListItem
            sx={{
              px: 2,
              py: 1.5,
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <ListItemIcon>
              <PersonIcon sx={{ color: "text.secondary" }} />
            </ListItemIcon>
            <ListItemText
              primary="Profile"
              secondary="Update your profile information"
            />
          </ListItem>

          <Divider />

          <ListItem
            sx={{
              px: 2,
              py: 1.5,
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <ListItemIcon>
              <NotificationsIcon sx={{ color: "text.secondary" }} />
            </ListItemIcon>
            <ListItemText
              primary="Notifications"
              secondary="Manage notification settings"
            />
            <Switch
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              color="primary"
            />
          </ListItem>

          <Divider />

          <ListItem
            sx={{
              px: 2,
              py: 1.5,
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <ListItemIcon>
              <LockIcon sx={{ color: "text.secondary" }} />
            </ListItemIcon>
            <ListItemText
              primary="Privacy & Security"
              secondary="Manage your privacy settings"
            />
          </ListItem>

          <Divider />

          <ListItem
            sx={{
              px: 2,
              py: 1.5,
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <ListItemIcon>
              <LanguageIcon sx={{ color: "text.secondary" }} />
            </ListItemIcon>
            <ListItemText
              primary="Language"
              secondary="English"
            />
          </ListItem>

          <Divider />

          <ListItem
            sx={{
              px: 2,
              py: 1.5,
              "&:hover": {
                bgcolor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <ListItemIcon>
              <DarkModeIcon sx={{ color: "text.secondary" }} />
            </ListItemIcon>
            <ListItemText
              primary="Dark Mode"
              secondary="Toggle dark theme"
            />
            <Switch
              checked={darkModeEnabled}
              onChange={(e) => setDarkModeEnabled(e.target.checked)}
              color="primary"
            />
          </ListItem>

          <Divider />

          <ListItem
            sx={{
              px: 2,
              py: 1.5,
              color: "#f44336",
              "&:hover": {
                bgcolor: "rgba(244, 67, 54, 0.1)",
              },
            }}
          >
            <ListItemIcon>
              <LogoutIcon sx={{ color: "#f44336" }} />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                sx: { color: "#f44336", fontWeight: 500 },
              }}
            />
          </ListItem>
        </List>
      </Box>
    </Container>
  );
}
