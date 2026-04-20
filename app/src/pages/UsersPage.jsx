import { useCallback, useEffect, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { stringAvatar } from "../data/contacts";
import { API_BASE } from "../config";

const PER_PAGE = 20;

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const observer = useRef(null);

  const fetchUsers = useCallback(async (pageToFetch) => {
    setLoading(true);
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("No token found. Please log in first.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/users/?page=${pageToFetch}&per_page=${PER_PAGE}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to fetch users");
      }

      const data = await response.json();
      setUsers((prev) => [...prev, ...data.users]);
      setHasMore(pageToFetch * PER_PAGE < data.total);
    } catch (err) {
      setError(err.message || "Unexpected error while fetching users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page);
  }, [page, fetchUsers]);

  const lastUserRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

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
        {error && (
          <Typography sx={{ px: 2, py: 2, color: "error.main" }}>
            {error}
          </Typography>
        )}

        {!error && users.length === 0 && !loading && (
          <Typography sx={{ px: 2, py: 2, color: "text.secondary" }}>
            No users found.
          </Typography>
        )}

        <List disablePadding>
          {users.map((user, index) => {
            const isLast = index === users.length - 1;
            return (
              <ListItem
                key={user.id}
                ref={isLast ? lastUserRef : null}
                sx={{
                  px: 2,
                  py: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ListItemAvatar>
                  <Avatar {...stringAvatar(user.username)} />
                </ListItemAvatar>
                <ListItemText
                  sx={{ flex: "1 1 auto", minWidth: 0 }}
                  primary={
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {user.username}
                    </Typography>
                  }
                  secondary={user.email}
                />
                <Button
                  component={RouterLink}
                  to={`/chat?with=${user.id}&name=${encodeURIComponent(user.username)}`}
                  state={{ startChat: { id: user.id, username: user.username } }}
                  variant="outlined"
                  size="small"
                  type="button"
                >
                  Message
                </Button>
              </ListItem>
            );
          })}
        </List>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
