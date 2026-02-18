import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangeTab = (_event, newValue) => {
    setMode(newValue);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (onAuthSuccess) {
      onAuthSuccess();
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

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
          >
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {isRegister && (
              <TextField
                label="Confirm password"
                type="password"
                fullWidth
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            )}
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 1 }}
              fullWidth
            >
              {isRegister ? "Register" : "Login"}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
    </Container>
  );
}
