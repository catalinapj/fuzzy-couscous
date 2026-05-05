import {
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  ListSubheader,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CreateIcon from "@mui/icons-material/Create";

import { stringAvatar } from "../../data/contacts";

export default function ChatSidebar({
  loadingUsers,
  error,
  chats,
  searchQuery,
  setSearchQuery,
  filteredChats,
  directoryCandidates,
  directoryLoading,
  selectedChat,
  onSelectChat,
  onOpenDirectoryUser,
  onOpenUsers,
}) {
  return (
    <Box
      sx={{
        width: "400px",
        borderRight: 1,
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        bgcolor: "grey.50",
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Chats
        </Typography>
        <IconButton aria-label="Find people to message" onClick={onOpenUsers}>
          <CreateIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 1.5, bgcolor: "background.paper" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search chats & people (directory)"
          type="search"
          autoComplete="off"
          inputProps={{ "aria-label": "Search chats and people" }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {loadingUsers && (
          <Typography sx={{ px: 2, py: 1.5, color: "text.secondary" }}>
            Loading users...
          </Typography>
        )}
        {error && (
          <Typography sx={{ px: 2, py: 1.5, color: "red" }}>
            {error}
          </Typography>
        )}
        {!loadingUsers && !error && chats.length === 0 && !searchQuery.trim() ? (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No conversations yet. People from the directory only appear here
              after you exchange messages.
            </Typography>
            <Button variant="contained" onClick={onOpenUsers}>
              Open people
            </Button>
          </Box>
        ) : null}
        {!loadingUsers &&
        !error &&
        searchQuery.trim() &&
        !directoryLoading &&
        filteredChats.length === 0 &&
        directoryCandidates.length === 0 ? (
          <Typography sx={{ px: 2, py: 2 }} color="text.secondary">
            {`Nothing matches "${searchQuery.trim()}". Try another name, email, or id.`}
          </Typography>
        ) : null}
        <List disablePadding>
          {searchQuery.trim() && filteredChats.length > 0 ? (
            <ListSubheader
              component="div"
              sx={{
                bgcolor: "grey.50",
                py: 0.5,
                typography: "overline",
                fontWeight: 700,
                color: "text.secondary",
                lineHeight: 1.75,
              }}
            >
              Chats
            </ListSubheader>
          ) : null}
          {filteredChats.map((chat) => (
            <ListItemButton
              key={chat.id}
              selected={Boolean(selectedChat) && chat.id === selectedChat.id}
              onClick={() => onSelectChat(chat.id)}
              sx={{
                px: 2,
                py: 1.5,
                "&.Mui-selected": {
                  bgcolor: "action.selected",
                  "&:hover": { bgcolor: "action.hover" },
                },
              }}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent={chat.unreadCount}
                  color="primary"
                  overlap="circular"
                >
                  <Avatar {...stringAvatar(chat.name)} />
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: chat.unreadCount > 0 ? 700 : 400 }}
                    >
                      {chat.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          chat.unreadCount > 0 ? "primary.main" : "text.secondary",
                        ml: 1,
                      }}
                    >
                      {chat.lastMessageTime}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        chat.unreadCount > 0 ? "text.primary" : "text.secondary",
                      fontWeight: chat.unreadCount > 0 ? 600 : 400,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      mt: 0.5,
                    }}
                  >
                    {chat.lastMessage}
                  </Typography>
                }
              />
            </ListItemButton>
          ))}
          {searchQuery.trim() && (directoryCandidates.length > 0 || directoryLoading) ? (
            <ListSubheader
              component="div"
              sx={{
                bgcolor: "grey.50",
                py: 0.5,
                typography: "overline",
                fontWeight: 700,
                color: "text.secondary",
                lineHeight: 1.75,
              }}
            >
              People
            </ListSubheader>
          ) : null}
          {directoryLoading && searchQuery.trim() ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={22} />
            </Box>
          ) : null}
          {directoryCandidates.map((user) => (
            <ListItemButton
              key={`dir-${user.id}`}
              selected={Boolean(selectedChat) && user.id === selectedChat.id}
              onClick={() => onOpenDirectoryUser(user)}
              sx={{
                px: 2,
                py: 1.5,
                "&.Mui-selected": {
                  bgcolor: "action.selected",
                  "&:hover": { bgcolor: "action.hover" },
                },
              }}
            >
              <ListItemAvatar>
                <Avatar {...stringAvatar(user.username)} />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {user.username}
                  </Typography>
                }
                secondary={user.email}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  );
}
