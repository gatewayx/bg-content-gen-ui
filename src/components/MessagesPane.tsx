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
import Typography from "@mui/joy/Typography";
import { logError } from "../services/LoggerService";

type MessagesPaneProps = {
  chat: ChatProps;
  // messagesFT:ChatProps;
  handleNewMessage: Function;
  handleNewFTMessage: Function;
  isLoading: boolean;
  setIsLoading: Function;
};

function getFormattedTime() {
  const now = new Date();

  const day = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(now);
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${day} ${time}`;
}

export default function MessagesPane(props: MessagesPaneProps) {
  const {
    chat,
    handleNewMessage,
    handleNewFTMessage,
    isLoading,
    setIsLoading,
  } = props;
  const [chatMessages, setChatMessages] = React.useState(chat.messages);
  const [textAreaValue, setTextAreaValue] = React.useState("");
  const [ftChatMessages, setftChatMessages] = React.useState<MessageProps[]>(
    chat.messagesFT
  );
  const [emptyTextAreaValue, setEmptyTextAreaValue] = React.useState("");

  const key: string = import.meta.env.VITE_OPEN_AI_KEY;

  React.useEffect(() => {
    setChatMessages(chat.messages);
    setftChatMessages(chat.messagesFT);
  }, [chat.messages, chat.messagesFT]);

  const handleCompletion = async (model = "o1") => {
    try {
      setIsLoading(true);
      setChatMessages([
        ...chatMessages,
        {
          id: (chatMessages.length + 1).toString(),
          sender: "You",
          content: textAreaValue,
          timestamp: getFormattedTime(),
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
          timestamp: getFormattedTime(),
        },
      ]);

      handleNewMessage({
        id: (chatMessages.length + 1).toString(),
        sender: "You",
        content: textAreaValue,
        timestamp: getFormattedTime(),
      });

      const client = new OpenAI({
        apiKey: key,
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
                timestamp: getFormattedTime(),
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
        timestamp: getFormattedTime(),
      });
      setIsLoading(false);
    } catch (error) {
      logError(error);
      setIsLoading(false);
      alert("Ooooops! Something went wrong !");
    }
  };

  const handleCompletionFT = async (
    model = "ft:gpt-4o-2024-08-06:gateway-x:jp-linkedin-top-30-likes-2025-03-10:B9jJFWXa"
  ) => {
    try {
      setIsLoading(true);

      let newId = ftChatMessages.length;
      setftChatMessages((prevMessages) => [
        ...prevMessages,
        {
          id: (newId + 1).toString(),
          sender: "You",
          content: emptyTextAreaValue,
          timestamp: getFormattedTime(),
        },
        {
          id: (newId + 2).toString(),
          sender: {
            name: "Session 1",
            username: new Date().toLocaleString(),
            avatar: "/static/images/avatar/3.jpg",
            online: true,
          },
          content: "",
          timestamp: getFormattedTime(),
        },
      ]);

      handleNewFTMessage({
        id: (newId + 1).toString(),
        sender: "You",
        content: emptyTextAreaValue,
        timestamp: getFormattedTime(),
      });

      const client = new OpenAI({
        apiKey: key,
        dangerouslyAllowBrowser: true,
      });

      const response = await client.chat.completions.create(
        {
          messages: [{ role: "user", content: emptyTextAreaValue }],
          model:
            "ft:gpt-4o-2024-08-06:gateway-x:jp-linkedin-top-30-likes-2025-03-10:B9jJFWXa",
          stream: true,
        },
        { maxRetries: 5 }
      );

      console.log("\nAI Response:\n");

      let fullMessage = "";

      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          setftChatMessages((prevChatMessages) => {
            const updatedMessages = [...prevChatMessages];
            let lastMessage = updatedMessages[updatedMessages.length - 1];

            if (lastMessage?.sender == "You") {
              updatedMessages.push({
                id: (newId + 1).toString(),
                sender: {
                  name: "Session 1",
                  username: new Date().toLocaleString(),
                  avatar: "/static/images/avatar/3.jpg",
                  online: true,
                },
                content: content,
                timestamp: getFormattedTime(),
              });
            } else {
              updatedMessages[updatedMessages.length - 1] = {
                ...lastMessage,
                content: lastMessage.content + content,
              };
            }

            return updatedMessages;
          });

          fullMessage += content;
          console.log("GPT Response", content);
        }
      }

      handleNewFTMessage({
        id: (newId + 2).toString(),
        sender: {
          name: "Session 1",
          username: "12/23/2023 12:09:40 PM",
          avatar: "/static/images/avatar/3.jpg",
          online: true,
        },
        content: fullMessage,
        timestamp: getFormattedTime(),
      });
      setIsLoading(false);

      console.log("Complete GPT Response:", fullMessage);
    } catch (error) {
      alert("Error fetching AI response:");
      logError(error);
      setIsLoading(false);
    }
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
          width: "50%",
        }}
      >
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            py: { xs: 2, md: 2 },
            px: { xs: 1, md: 2 },
            borderBottom: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.body",
          }}
        >
          <Stack
            direction="row"
            spacing={{ xs: 1, md: 2 }}
            sx={{ alignItems: "center" }}
          >
            <div>
              <Typography
                component="h2"
                noWrap
                sx={{ fontWeight: "lg", fontSize: "lg" }}
              >
                Research
              </Typography>
              <Typography level="body-sm"></Typography>
            </div>
          </Stack>
        </Stack>
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
          {(!chatMessages || chatMessages.length === 0) && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "gray",
                fontSize: "15px",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Call Transcript → Email Newsletter <br />
              Step 1: Paste the call transcript, then **extract key stories**.
            </Box>
          )}
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
      <Sheet
        sx={{
          height: { xs: "calc(100dvh - var(--Header-height))", md: "100dvh" },
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.level1",
          width: "50%",
        }}
      >
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            py: { xs: 2, md: 2 },
            px: { xs: 1, md: 2 },
            borderBottom: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.body",
          }}
        >
          <Stack
            direction="row"
            spacing={{ xs: 1, md: 2 }}
            sx={{ alignItems: "center" }}
          >
            <div>
              <Typography
                component="h2"
                noWrap
                sx={{ fontWeight: "lg", fontSize: "lg" }}
              >
                Write
              </Typography>
              <Typography level="body-sm"></Typography>
            </div>
          </Stack>
        </Stack>
        <Box
          sx={{
            display: "flex",
            flex: 1,
            minHeight: 0,
            px: 2,
            py: 3,
            overflowY: "scroll",
            flexDirection: "column-reverse",
            position: "relative",
          }}
        >
          {(!ftChatMessages || ftChatMessages.length === 0) && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "gray",
                fontSize: "15px",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Step 2: Use the extracted info to generate and refine your newsletter.
            </Box>
          )}
          <Stack spacing={2} sx={{ justifyContent: "flex-end" }}>
            {ftChatMessages &&
              ftChatMessages.map((message: MessageProps, index: number) => {
                const isYouFT = message.sender === "You";
                return (
                  <Stack key={index} direction="row" spacing={2}>
                    <ChatBubble
                      variant={isYouFT ? "sent" : "received"}
                      {...message}
                    />
                  </Stack>
                );
              })}
          </Stack>
        </Box>

        {/* Message input always stays at the bottom */}
        <MessageInput
          textAreaValue={emptyTextAreaValue}
          setTextAreaValue={setEmptyTextAreaValue}
          onSubmit={handleCompletionFT}
        />
      </Sheet>
    </Box>
  );
}
