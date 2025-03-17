import * as React from "react";
import Sheet from "@mui/joy/Sheet";
import MessagesPane from "./MessagesPane";
import ChatsPane from "./ChatsPane";
import { ChatProps, MessageProps } from "../components/types";
import { chats } from "../components/data";
import ChatService from "../services/SessionService";
import { logError } from "../services/LoggerService";


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

export default function MyProfile() {
  const [sessions, setSessions] = React.useState<ChatProps[]>([]);
  const [selectedChat, setSelectedChat] = React.useState<ChatProps | null>(null);
  const [isLoading,setIsLoading] = React.useState(false);

  // Load stored sessions on mount
  React.useEffect(() => {
    const storedSessions = ChatService.getChatSessions();
    if (storedSessions?.length) {
      setSessions(storedSessions);
      setSelectedChat(storedSessions[0]);
    } else {
      setSessions(chats);
      setSelectedChat(chats[0]);
    }
  }, []);

  // Save sessions whenever they change
  React.useEffect(() => {
    if (sessions.length > 0) {
      ChatService.setChatSessions(sessions);
    }
  }, [sessions]);

  const handleNewSession = () => {

    const timestamp = new Date().toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const newSession: ChatProps = {
      id: performance.now().toString(36).replace('.', ''),
      sender: {
        name: `Session ${sessions.length + 1}`,
        username: timestamp,
        avatar: "/static/images/avatar/5.jpg",
        online: false,
      },
      messages: [
      
      ],
      messagesFT: [
        
      ],
    };

    setSessions((prev) => [...prev, newSession]);
    setSelectedChat(newSession);
  };


  const handleDeleteSession = (sessionId: string) => {
    if (sessions.length === 1) {
      alert("You cannot delete the last or only remaining session.");
      return;
    }
  
    // Check if the session exists
    const sessionExists = sessions.some(session => session.id === sessionId);
  
    if (!sessionExists) {
      alert("Session not found.");
      return;
    }
  
    // Proceed to delete the session
    setSessions((prev) => prev.filter(session => session.id !== sessionId));
    
    // Optionally, you can also handle the case where the deleted session was the selected chat
    setSelectedChat(sessions[0]); // Select the first session, or handle this based on your requirements
  };
  


  // Function to handle new message addition from child component
  const handleNewMessage = (newMessage: MessageProps) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === selectedChat?.id
          ? { ...session, messages: [...session.messages, newMessage] }
          : session
      )
    );
  };

  const handleNewFTMessage = (newFTMessage: MessageProps) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === selectedChat?.id
          ? { ...session, messagesFT: [...session.messagesFT, newFTMessage] }
          : session
      )
    );
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
          sm: "minmax(min-content, min(30%, 400px)) 1fr",
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

      {selectedChat && <MessagesPane isLoading={isLoading} setIsLoading={setIsLoading} handleNewMessage={handleNewMessage} chat={selectedChat} handleNewFTMessage={handleNewFTMessage} />}
    </Sheet>
  );
}
