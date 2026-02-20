import { Box, Badge } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import SettingsIcon from "@mui/icons-material/Settings";

export default function BottomNavigation({ currentPage, onNavigate, unreadCount = 0 }) {
  const navItems = [
    { id: "contacts", icon: PersonIcon, label: "Contacts" },
    { id: "calls", icon: PhoneIcon, label: "Calls" },
    { id: "messages", icon: ChatBubbleIcon, label: "Messages", badge: unreadCount },
    { id: "settings", icon: SettingsIcon, label: "Settings" },
  ];

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        bgcolor: "#2c2c2e",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        borderTopLeftRadius: "16px",
        borderTopRightRadius: "16px",
        zIndex: 1000,
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        const iconColor = isActive ? "#0088cc" : "rgba(255, 255, 255, 0.6)";

        return (
          <Box
            key={item.id}
            onClick={() => onNavigate(item.id)}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flex: 1,
              py: 1,
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.05)",
              },
            }}
          >
            {item.badge !== undefined && item.badge > 0 ? (
              <Badge
                badgeContent={item.badge}
                color="error"
                sx={{
                  "& .MuiBadge-badge": {
                    bgcolor: "#f44336",
                    color: "white",
                  },
                }}
              >
                <Icon sx={{ color: iconColor, fontSize: 28 }} />
              </Badge>
            ) : (
              <Icon sx={{ color: iconColor, fontSize: 28 }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
