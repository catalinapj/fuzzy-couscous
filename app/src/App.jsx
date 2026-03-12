import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FooterProvider } from "./contexts/FooterContext";
import Layout from "./components/Layout";
import MessagesPage from "./pages/MessagesPage";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // if (!isAuthenticated) {
  //   return <AuthPage onAuthSuccess={() => setIsAuthenticated(true)} />;
  // }

  // unread messages
  const unreadCount = 3; 

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
