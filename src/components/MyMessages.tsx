import * as React from "react";
import Sheet from "@mui/joy/Sheet";
import UserStory from "../components/story";
import MessagesPane from "./MessagesPane";
import ChatsPane from "./ChatsPane";
import { ChatProps, UserProps } from "../components/types";
import { chats } from "../components/data";

export default function MyProfile() {
  const [sessions, setSessions] = React.useState<ChatProps[]>(chats);
  const [selectedChat, setSelectedChat] = React.useState<ChatProps>(chats[1]);
  const handleNewSession = async () => {
    const newSession: ChatProps = {
      id: (sessions.length + 1).toString(),
      sender: {
        name: `Session ${sessions.length + 1}`,
        username: new Date().toLocaleString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
        avatar: "/static/images/avatar/5.jpg",
        online: false,
      },
      messages: [
        {
          id: "1",
          content: `Session ${sessions.length + 1} is now active.`,
          timestamp: "Just now",
          sender: {
            name: `Session ${sessions.length + 1}`,
            username: new Date().toLocaleString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            }),
            avatar: "/static/images/avatar/5.jpg",
            online: false,
          },
        },
      ],
    };

    setSessions((prevSessions) => [...prevSessions, newSession]);
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
        <ChatsPane
          chats={sessions}
          selectedChatId={selectedChat.id}
          setSelectedChat={setSelectedChat}
          handleNewSession={handleNewSession}
        />
      </Sheet>
      <MessagesPane chat={selectedChat} />
    </Sheet>
  );
}
