import * as React from "react";
import Sheet from "@mui/joy/Sheet";
import MessagesPane from "./MessagesPane";
import ChatsPane from "./ChatsPane";
import { ChatProps, MessageProps } from "../components/types";
import { useSettings } from "../contexts/SettingsContext";
import { useAuth } from "../hooks/useAuth";
import { createSession, getSessions, updateSession, deleteSession, sessionToChatProps } from "../services/SessionService";
import { loadAllSessionSettings } from "../services/SettingsService";
import { supabase } from "../lib/supabase";

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

export default function MyMessages(props: { writerModel: string, researchModel: string }) {
  const { settings } = useSettings();
  const { user } = useAuth();
  const [sessions, setSessions] = React.useState<ChatProps[]>([]);
  const [selectedChat, setSelectedChat] = React.useState<ChatProps | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const hasCreatedInitialSession = React.useRef(false);

  React.useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        const dbSessions = await getSessions();
        const chatSessions = dbSessions.map(sessionToChatProps);
        
        // Load settings for all sessions
        await loadAllSessionSettings(chatSessions.map(session => session.id));
        
        if (chatSessions.length > 0) {
          setSessions(chatSessions);
          setSelectedChat(chatSessions[0]);
          // Save selected chat ID to localStorage
          localStorage.setItem('selectedChatId', chatSessions[0].id);
          // Save all chat sessions to localStorage
          localStorage.setItem('chat_sessions', JSON.stringify(chatSessions));
        } else if (isInitialLoad && !hasCreatedInitialSession.current) {
          // Only create a new session on initial load if no sessions exist and we haven't created one yet
          hasCreatedInitialSession.current = true;
          const newSession = await createSession('New Session');
          const newChat = sessionToChatProps(newSession);
          const newSessions = [newChat];
          setSessions(newSessions);
          setSelectedChat(newChat);
          // Save new session to localStorage
          localStorage.setItem('chat_sessions', JSON.stringify(newSessions));
          localStorage.setItem('selectedChatId', newChat.id);
          // Load settings for the new session
          await loadAllSessionSettings([newChat.id]);
          setIsInitialLoad(false);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, []);
  
  const handleNewSession = async () => {
    try {
      // Create new session
      const savedSessions = localStorage.getItem('chat_sessions');
      const currentSessions = savedSessions ? JSON.parse(savedSessions) : [];
      const newSession = await createSession(`Session ${currentSessions.length + 1}`);

      // Convert new session to chat props
      const newChatSession = sessionToChatProps(newSession);

      // Add new session while preserving existing ones
      const updatedSessions = [
        newChatSession,
        ...currentSessions
      ];

      // Update localStorage with all sessions
      localStorage.setItem('chat_sessions', JSON.stringify(updatedSessions));

      // Update state
      setSessions(updatedSessions);
      setSelectedChat(newChatSession);

    } catch (error) {
      console.error('Error in handleNewSession:', error);
    }
    
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      // Get current sessions from localStorage
      const savedSessions = localStorage.getItem('chat_sessions');
      const currentSessions = savedSessions ? JSON.parse(savedSessions) : [];
      
      // Keep a copy of the sessions before deletion
      const sessionsBeforeDeletion = [...currentSessions];

      // Delete from database
      try {
        await deleteSession(sessionId);
      } catch (error) {
        console.error('Error deleting session:', error);
        return;
      }

      // Filter out deleted session but keep its data in localStorage
      const updatedSessions = currentSessions.filter((session: ChatProps) => session.id !== sessionId);
      localStorage.setItem('chat_sessions', JSON.stringify(updatedSessions));

      // Update state but preserve the messages data
      setSessions(updatedSessions);

      // If the deleted session was selected, select another one
      if (selectedChat && selectedChat.id === sessionId) {
        const nextSession = updatedSessions[0];
        if (nextSession) {
          setSelectedChat(nextSession);
        } else {
          setSelectedChat(null);
        }
      }

      // Store the deleted session's data separately for persistence
      const deletedSession = sessionsBeforeDeletion.find((session: ChatProps) => session.id === sessionId);
      if (deletedSession) {
        const deletedSessions = JSON.parse(localStorage.getItem('deleted_sessions') || '[]');
        deletedSessions.push(deletedSession);
        localStorage.setItem('deleted_sessions', JSON.stringify(deletedSessions));
      }

    } catch (error) {
      console.error('Error in handleDeleteSession:', error);
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
    <>
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
          writerModelProps={props.writerModel}
          researchModelProps={props.researchModel}
        />
      )}
    </Sheet>
    </>
  );
}
