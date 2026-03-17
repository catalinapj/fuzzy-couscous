import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { stringAvatar } from "../data/contacts";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("No token found. Please log in first.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8080/users/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.detail || "Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err.message || "Unexpected error while fetching users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Users
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && (
          <Typography sx={{ px: 2, py: 2, color: "error.main" }}>
            {error}
          </Typography>
        )}

        {!loading && !error && users.length === 0 && (
          <Typography sx={{ px: 2, py: 2, color: "text.secondary" }}>
            No users found.
          </Typography>
        )}

        {!loading && !error && users.length > 0 && (
          <List disablePadding>
            {users.map((user) => (
              <ListItem
                key={user.id}
                sx={{
                  px: 2,
                  py: 1.5,
                  "&:hover": { bgcolor: "action.hover" },
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
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
