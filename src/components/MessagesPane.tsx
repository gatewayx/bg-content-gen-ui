import * as React from "react";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import AvatarWithStatus from "./AvatarWithStatus";
import ChatBubble from "./ChatBubble";
import MessageInput from "./MessageInput";
import MessagesPaneHeader from "./MessagesPaneHeader";
import { ChatProps, MessageProps } from "../components/types";
import { OpenAI } from "openai";

type MessagesPaneProps = {
  chat: ChatProps;
  handleNewMessage: Function;
};

export default function MessagesPane(props: MessagesPaneProps) {
  const { chat, handleNewMessage } = props;
  const [chatMessages, setChatMessages] = React.useState(chat.messages);
  const [textAreaValue, setTextAreaValue] = React.useState("");

  React.useEffect(() => {
    setChatMessages(chat.messages);
  }, [chat.messages]);

  const handleCompletion = async (model = "o1") => {
    setChatMessages([
      ...chatMessages,
      {
        id: (chatMessages.length + 1).toString(),
        sender: "You",
        content: textAreaValue,
        timestamp: "Just now",
      },
      {
        id: (chatMessages.length + 2).toString(),
        sender: {
          name: "Session 1",
          username: "12/23/2023 12:09:40 PM",
          avatar: "/static/images/avatar/3.jpg",
          online: true,
        },
        content: "",
        timestamp: "Just now",
      },
    ]);

    handleNewMessage({
      id: (chatMessages.length + 1).toString(),
      sender: "You",
      content: textAreaValue,
      timestamp: "Just now",
    });

    const client = new OpenAI({
      apiKey:
        "<KEY_HERE>",
      dangerouslyAllowBrowser: true,
    });

    const response = await client.chat.completions.create(
      {
        messages: [{ role: "user", content: textAreaValue }],
        model: model,
        stream: true,
      },
      { maxRetries: 5 }
    );

    console.log("\nAI Response:\n");

    let fullMessage = ""; // Store the full AI response

    let newId = chatMessages.length + 1;

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        setChatMessages((prevChatMessages) => {
          let updatedMessages = [...prevChatMessages];
          let lastMessage = updatedMessages[updatedMessages.length - 1];

          lastMessage = updatedMessages[updatedMessages.length - 1];

          if (lastMessage?.sender !== "You") {
            // Append AI response to the existing AI message
            updatedMessages[updatedMessages.length - 1] = {
              ...lastMessage,
              content: lastMessage.content + content,
            };
          } else {
            // If last message is from "You", add AI's response as a new message
            updatedMessages.push({
              id: newId.toString(),
              sender: {
                name: "Session 1",
                username: "12/23/2023 12:09:40 PM",
                avatar: "/static/images/avatar/3.jpg",
                online: true,
              },
              content: content,
              timestamp: "Just now",
            });
          }

          return updatedMessages;
        });
        fullMessage += content;
        console.log("GPT Response", content); // Print response in real-time
      }
    }

    // 🛑 Full AI Response after loop ends
    console.log("Complete GPT Response:", fullMessage);

    handleNewMessage({
      id: newId.toString(),
      sender: {
        name: "Session 1",
        username: "12/23/2023 12:09:40 PM",
        avatar: "/static/images/avatar/3.jpg",
        online: true,
      },
      content: fullMessage,
      timestamp: "Just now",
    });

  };

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      {/* First Chat Box */}
      <Sheet
        sx={{
          height: { xs: "calc(100dvh - var(--Header-height))", md: "100dvh" },
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.level1",
          width: "100%",
        }}
      >
        <MessagesPaneHeader sender={chat.sender} />
        <Box
          sx={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            px: 2,
            py: 3,
            overflowY: "scroll",
            flexDirection: "column-reverse",
          }}
        >
          <Stack spacing={2} sx={{ justifyContent: "flex-end" }}>
            {chatMessages.map((message: MessageProps, index: number) => {
              const isYou = message.sender === "You";
              return (
                <Stack
                  key={index}
                  direction="row"
                  spacing={2}
                  sx={{ flexDirection: isYou ? "row-reverse" : "row" }}
                >
                  {message.sender !== "You" && (
                    <AvatarWithStatus
                      online={message.sender.online}
                      src={message.sender.avatar}
                    />
                  )}
                  <ChatBubble
                    variant={isYou ? "sent" : "received"}
                    {...message}
                  />
                </Stack>
              );
            })}
          </Stack>
        </Box>
        <MessageInput
          textAreaValue={textAreaValue}
          setTextAreaValue={setTextAreaValue}
          onSubmit={handleCompletion}
        />
      </Sheet>
    </Box>
  );
}
