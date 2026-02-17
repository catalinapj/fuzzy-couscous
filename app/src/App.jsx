
import { useState } from "react";
import DesktopChatPage from "./DesktopChatPage";
import AuthPage from "./AuthPage";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return isAuthenticated ? (
    <DesktopChatPage />
  ) : (
    <AuthPage onAuthSuccess={() => setIsAuthenticated(true)} />
  );
}
