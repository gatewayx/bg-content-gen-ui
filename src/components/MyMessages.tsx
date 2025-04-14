import * as React from "react";
import Sheet from "@mui/joy/Sheet";
import MessagesPane from "./MessagesPane";
import ChatsPane from "./ChatsPane";
import { ChatProps, MessageProps } from "../components/types";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../contexts/AuthContext";
import { createSession, getSessions, updateSession, deleteSession, sessionToChatProps } from "../services/SessionService";

function getFormattedTime() {
  const now = new Date();
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
  const time = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return `${day} ${time}`;
}

export default function MyMessages() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const [sessions, setSessions] = React.useState<ChatProps[]>([]);
  const [selectedChat, setSelectedChat] = React.useState<ChatProps | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  // Load sessions from database on mount
  React.useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        const dbSessions = await getSessions();
        const chatSessions = dbSessions.map(sessionToChatProps);
        
        if (chatSessions.length > 0) {
          setSessions(chatSessions);
          setSelectedChat(chatSessions[0]);
        } else if (isInitialLoad) {
          // Only create a new session on initial load if no sessions exist
          const newSession = await createSession('New Session');
          const newChat = sessionToChatProps(newSession);
          setSessions([newChat]);
          setSelectedChat(newChat);
          setIsInitialLoad(false);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [isInitialLoad]);

  const handleNewSession = async () => {
    try {
      setIsLoading(true);
      const newSession = await createSession(`Session ${sessions.length + 1}`);
      const newChat = sessionToChatProps(newSession);
      
      setSessions((prev) => [...prev, newChat]);
      setSelectedChat(newChat);
    } catch (error) {
      console.error('Error creating new session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (sessions.length === 1) {
      alert("You cannot delete the last or only remaining session.");
      return;
    }

    try {
      setIsLoading(true);
      await deleteSession(sessionId);
      
      // Update local state after successful deletion
      const updatedSessions = sessions.filter(session => session.id !== sessionId);
      setSessions(updatedSessions);
      
      // Select the first available session
      if (selectedChat?.id === sessionId) {
        setSelectedChat(updatedSessions[0]);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMessage = async (newMessage: MessageProps) => {
    if (!selectedChat) return;

    try {
      const updatedMessages = selectedChat.messages.some(msg => msg.id === newMessage.id)
        ? selectedChat.messages.map(msg => msg.id === newMessage.id ? newMessage : msg)
        : [...selectedChat.messages, newMessage];

      const updatedChat = {
        ...selectedChat,
        messages: updatedMessages
      };

      await updateSession(selectedChat.id, {
        messages: updatedMessages
      });

      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === selectedChat.id ? updatedChat : session
        )
      );
    } catch (error) {
      console.error('Error updating session with new message:', error);
    }
  };

  const handleNewFTMessage = async (newFTMessage: MessageProps) => {
    if (!selectedChat) return;

    try {
      const updatedMessagesFT = selectedChat.messagesFT.some(msg => msg.id === newFTMessage.id)
        ? selectedChat.messagesFT.map(msg => msg.id === newFTMessage.id ? newFTMessage : msg)
        : [...selectedChat.messagesFT, newFTMessage];

      const updatedChat = {
        ...selectedChat,
        messagesFT: updatedMessagesFT
      };

      await updateSession(selectedChat.id, {
        messagesFT: updatedMessagesFT
      });

      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === selectedChat.id ? updatedChat : session
        )
      );
    } catch (error) {
      console.error('Error updating session with new FT message:', error);
    }
  };

  return (
    <Sheet
      sx={{
        flex: 1,
        width: "100%",
        mx: "auto",
        pt: { xs: "var(--Header-height)", md: 0 },
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "minmax(min-content, min(25%, 300px)) 1fr",
        },
      }}
    >
      <Sheet
        sx={{
          position: { xs: "fixed", sm: "sticky" },
          transform: {
            xs: "translateX(calc(100% * (var(--MessagesPane-slideIn, 0) - 1)))",
            sm: "none",
          },
          transition: "transform 0.4s, width 0.4s",
          zIndex: 100,
          width: "100%",
          top: 52,
        }}
      >
        {sessions.length > 0 && selectedChat && (
          <ChatsPane
            chats={sessions}
            selectedChatId={selectedChat.id}
            setSelectedChat={setSelectedChat}
            handleNewSession={handleNewSession}
            handleDeleteSession={handleDeleteSession}
            isLoading={isLoading}
          />
        )}
      </Sheet>

      {selectedChat && (
        <MessagesPane
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          handleNewMessage={handleNewMessage}
          chat={selectedChat}
          handleNewFTMessage={handleNewFTMessage}
        />
      )}
    </Sheet>
  );
}
