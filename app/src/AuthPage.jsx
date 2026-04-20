import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { API_BASE } from "./config";

function formatErrorDetail(detail) {
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (typeof e === "object" && e.msg ? e.msg : String(e)))
      .join(" ");
  }
  return "Something went wrong";
}

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChangeTab = (_event, newValue) => {
    setMode(newValue);
    setError("");
  };

  const loginRequest = async () => {
    const params = new URLSearchParams();
    params.set("username", email.trim());
    params.set("password", password);

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(formatErrorDetail(data.detail));
    }

    if (!data.access_token) {
      throw new Error("Invalid response from server");
    }

    return data.access_token;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!API_BASE) {
      setError(
        "VITE_API_URL is not set. Add it to .env or .env.local (e.g. http://localhost:8080)."
      );
      return;
    }

    const isRegister = mode === "register";

    if (isRegister) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (username.trim().length < 3) {
        setError("Username must be at least 3 characters.");
        return;
      }
    }

    setSubmitting(true);

    try {
      if (isRegister) {
        const registerRes = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            username: username.trim(),
            password,
          }),
        });
        const registerData = await registerRes.json().catch(() => ({}));

        if (!registerRes.ok) {
          throw new Error(formatErrorDetail(registerData.detail));
        }
      }

      const token = await loginRequest();
      onAuthSuccess(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const isRegister = mode === "register";

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Container maxWidth="xs">
          <Paper
            elevation={4}
            sx={{
              width: "100%",
              p: 3,
            }}
          >
            <Tabs
              value={mode}
              onChange={handleChangeTab}
              variant="fullWidth"
              sx={{ mb: 2 }}
            >
              <Tab label="Login" value="login" />
              <Tab label="Register" value="register" />
            </Tabs>

            <Typography variant="h6" gutterBottom>
              {isRegister ? "Create account" : "Welcome back"}
            </Typography>

            {error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : null}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {isRegister ? (
                <TextField
                  label="Username"
                  autoComplete="username"
                  fullWidth
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  helperText="3–50 characters"
                />
              ) : null}

              <TextField
                label="Password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText={isRegister ? "At least 8 characters" : undefined}
              />

              {isRegister ? (
                <TextField
                  label="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  fullWidth
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              ) : null}
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                sx={{ mt: 1 }}
                fullWidth
              >
                {submitting ? "Please wait…" : isRegister ? "Register" : "Login"}
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Container>
  );
}
