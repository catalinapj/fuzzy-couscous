import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FooterProvider } from "./contexts/FooterContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import MessagesPage from "./pages/MessagesPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";
import AuthPage from "./AuthPage";

function AppRoutes() {
  const { isAuthenticated, login } = useAuth();

  // unread messages
  const unreadCount = 3;

  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={login} />;
  }

  return (
    <BrowserRouter>
      <FooterProvider>
        <Layout unreadCount={unreadCount}>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<MessagesPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </Layout>
      </FooterProvider>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
