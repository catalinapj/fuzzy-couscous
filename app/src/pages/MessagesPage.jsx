import { Container } from "@mui/material";

import ChatSidebar from "./messages/ChatSidebar";
import ConversationPanel from "./messages/ConversationPanel";
import { formatChatTime } from "./messages/chatHelpers";
import { useMessagesPage } from "./messages/useMessagesPage";

export default function MessagesPage() {
  const {
    messagesEndRef,
    loadingUsers,
    error,
    chats,
    searchQuery,
    setSearchQuery,
    filteredChats,
    directoryCandidates,
    directoryLoading,
    selectedChat,
    handleSelectChat,
    handleOpenDirectoryUser,
    openUsers,
    handleStartCall,
    callLoading,
    messages,
    currentUserId,
  } = useMessagesPage();

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        height: "calc(100vh - 64px)",
        width: "100vw",
        display: "flex",
        bgcolor: "background.paper",
      }}
    >
      <ChatSidebar
        loadingUsers={loadingUsers}
        error={error}
        chats={chats}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredChats={filteredChats}
        directoryCandidates={directoryCandidates}
        directoryLoading={directoryLoading}
        selectedChat={selectedChat}
        onSelectChat={handleSelectChat}
        onOpenDirectoryUser={handleOpenDirectoryUser}
        onOpenUsers={openUsers}
      />

      <ConversationPanel
        selectedChat={selectedChat}
        navigateToUsers={openUsers}
        handleStartCall={handleStartCall}
        callLoading={callLoading}
        messages={messages}
        currentUserId={currentUserId}
        formatTime={formatChatTime}
        messagesEndRef={messagesEndRef}
      />
    </Container>
  );
}
