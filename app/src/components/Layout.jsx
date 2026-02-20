import { Box, Badge, IconButton } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate, useLocation } from "react-router-dom";
import { colors, commonStyles } from "../theme";
import { useFooter } from "../contexts/FooterContext";

export default function Layout({ children, unreadCount = 0 }) {
  const { footerContent } = useFooter();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: "contacts", path: "/contacts", icon: PersonIcon, label: "Contacts" },
    { id: "calls", path: "/calls", icon: PhoneIcon, label: "Calls" },
    { id: "messages", path: "/chat", icon: ChatBubbleIcon, label: "Messages", badge: unreadCount },
    { id: "settings", path: "/settings", icon: SettingsIcon, label: "Settings" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        {children}
      </Box>
      
      {/* Footer Navigation */}
      <Box sx={commonStyles.footer}>
        {/* Left Side - Navigation Icons */}
        <Box
          sx={{
            width: "400px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            borderRight: `1px solid ${colors.border}`,
            bgcolor: colors.backgroundSecondary,
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const iconColor = active ? colors.primary : colors.textSecondary;

            return (
              <IconButton
                key={item.id}
                onClick={() => navigate(item.path)}
                sx={{
                  ...commonStyles.iconButton,
                  color: iconColor,
                }}
              >
                {item.badge !== undefined && item.badge > 0 ? (
                  <Badge
                    badgeContent={item.badge}
                    color="error"
                    sx={{
                      "& .MuiBadge-badge": {
                        bgcolor: colors.badgeError,
                        color: "white",
                      },
                    }}
                  >
                    <Icon sx={{ fontSize: 28 }} />
                  </Badge>
                ) : (
                  <Icon sx={{ fontSize: 28 }} />
                )}
              </IconButton>
            );
          })}
        </Box>

        {/* Right Side - Footer content (e.g., message input on chat page) */}
        <Box
          sx={{
            flex: 1,
            bgcolor: colors.background,
          }}
        >
          {footerContent}
        </Box>
      </Box>
    </Box>
  );
}
