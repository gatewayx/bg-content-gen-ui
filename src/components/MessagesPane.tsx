import * as React from "react";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import AvatarWithStatus from "./AvatarWithStatus";
import ChatBubble from "./ChatBubble";
import MessageInput from "./MessageInput";
import { ChatProps, MessageProps, UserProps } from "../components/types";
import Typography from "@mui/joy/Typography";
import { logError } from "../services/LoggerService";
import { useRef } from "react";
import Button from "@mui/joy/Button";
import StopIcon from "@mui/icons-material/Stop";
import { getSettings } from "../services/SettingsService";
import { getModelDisplayName } from "../constants";
import { createChatCompletion } from "../services/OpenAIService";

type MessagesPaneProps = {
  chat: ChatProps;
  handleNewMessage: (message: MessageProps) => void;
  handleNewFTMessage: (message: MessageProps) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

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

function isUserProps(sender: MessageProps["sender"]): sender is UserProps {
  return typeof sender === "object" && "online" in sender && "avatar" in sender;
}

export default function MessagesPane(props: MessagesPaneProps) {
  const {
    chat,
    handleNewMessage,
    handleNewFTMessage,
    setIsLoading,
  } = props;

  // Initialize with empty arrays for new sessions
  const [chatMessages, setChatMessages] = React.useState<MessageProps[]>([]);
  const [ftChatMessages, setftChatMessages] = React.useState<MessageProps[]>([]);
  const [textAreaValue, setTextAreaValue] = React.useState("");
  const [emptyTextAreaValue, setEmptyTextAreaValue] = React.useState("");
  const abortControllerRef = useRef<AbortController>(null);
  const abortControllerRefFT = useRef<AbortController>(null);

  // Get current settings and update when they change
  const [settings, setSettings] = React.useState(getSettings());

  // Update settings when they change
  React.useEffect(() => {
    const handleSettingsChange = () => {
      setSettings(getSettings());
    };

    // Listen for storage changes
    window.addEventListener('storage', handleSettingsChange);
    
    // Also check for settings changes periodically
    const interval = setInterval(handleSettingsChange, 1000);

    return () => {
      window.removeEventListener('storage', handleSettingsChange);
      clearInterval(interval);
    };
  }, []);

  // Get session ID from chat object
  const sessionId = chat.id || 'default';

  // Load session state from local storage on component mount or when session changes
  React.useEffect(() => {
    alert(`session_${sessionId}`)
    const savedSession = localStorage.getItem(`chat_sessions`);
    
    if (savedSession) {
      try {
        const sessionState = JSON.parse(savedSession);
        const selected = sessionState.filter((obj:ChatProps) => obj.id == chat.id)[0];
        // console.log(selected);
        
        setChatMessages(selected.messages);
        setftChatMessages(selected.messagesFT);
      } catch (error) {
        console.error('Error loading session state:', error);
        // Reset to empty arrays if there's an error
        setChatMessages([]);
        setftChatMessages([]);
      }
    } else {
      // Reset to empty arrays for new sessions
      setChatMessages([]);
      setftChatMessages([]);
    }
  }, [sessionId]);

  // Save entire session state to local storage whenever messages change
  // React.useEffect(() => {
  //   const sessionState = {
  //     chatMessages,
  //     ftChatMessages,
  //     timestamp: new Date().toISOString(),
  //     sessionId,
  //   };
  //   localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionState));
  // }, [chatMessages, ftChatMessages, sessionId]);

  const handleAbortRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();

      if (
        chatMessages[chatMessages.length - 1] &&
        chatMessages[chatMessages.length - 1].sender != "You" &&
        chatMessages[chatMessages.length - 1].content.length == 0
      ) {
        setChatMessages((prevMessages) => {
          const newMessages = prevMessages.slice(0, -1);
          return newMessages;
        });
      }

      console.log("Aborting", abortControllerRef);
    } else {
      console.log("No abort controller to abort.");
    }
  };

  const handleAbortRequestFT = () => {
    if (abortControllerRefFT.current) {
      abortControllerRefFT.current.abort();
      if (
        ftChatMessages[ftChatMessages.length - 1] &&
        ftChatMessages[ftChatMessages.length - 1].sender != "You" &&
        ftChatMessages[ftChatMessages.length - 1].content.length == 0
      ) {
        setftChatMessages((prevMessages) => {
          const newMessages = prevMessages.slice(0, -1);
          return newMessages;
        });
      }
    } else {
      console.log("No abort controller to abort.");
    }
  };

  const handleCompletion = async () => {
    try {
      setIsLoading(true);
      const newAbortController = new AbortController();
      abortControllerRef.current = newAbortController;

      // Get settings for research model and prompt
      const settings = getSettings();

      const newId = chatMessages.length;
      const initialMessages: MessageProps[] = [
        ...chatMessages,
        {
          id: (newId + 1).toString(),
          sender: "You" as const,
          content: textAreaValue,
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
      ];

      setChatMessages(initialMessages);

      handleNewMessage({
        id: (newId + 1).toString(),
        sender: "You" as const,
        content: textAreaValue,
        timestamp: getFormattedTime(),
      });

      const messages: ChatMessage[] = [];
      
      // Get system message from settings for the current model
      messages.push({ 
        role: "system", 
        content: settings.researchPrompts[settings.researchModel] || '' 
      });
      
      // Add all previous messages to the context
      chatMessages.forEach(msg => {
        if (msg.sender === "You") {
          messages.push({ role: "user", content: msg.content });
        } else if (msg.sender !== "System" && typeof msg.sender !== "string") {
          messages.push({ role: "assistant", content: msg.content });
        }
      });
      
      // Add current user message
      messages.push({ role: "user", content: textAreaValue });

      // Get the token for the selected model
      const modelToken = settings.modelTokens[settings.researchModel] || import.meta.env.VITE_OPEN_AI_KEY;
      const response = await createChatCompletion(settings.researchModel, messages, modelToken);

      let fullMessage = ""; // Store the full AI response

      for await (const chunk of response) {
        if (chunk.choices[0]?.delta?.content) {
          fullMessage += chunk.choices[0].delta.content;
          setChatMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            if (lastMessage && typeof lastMessage.sender !== "string") {
              lastMessage.content = fullMessage;
            }
            return updatedMessages;
          });
        }
      }

      // Save the final state of messages after completion
      setChatMessages((prevMessages) => {
        const finalMessages = [...prevMessages];
        const lastMessage = finalMessages[finalMessages.length - 1];
        if (lastMessage && typeof lastMessage.sender !== "string") {
          lastMessage.content = fullMessage;
        }
        handleNewMessage(lastMessage);
        return finalMessages;
      });

      handleAbortRequest();
      setIsLoading(false);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "Request was aborted.") {
        console.warn("Request was aborted by the user.");
        return;
      }

      logError(error);
      setIsLoading(false);
      handleAbortRequest();
      alert("Ooooops! Something went wrong !");
    }
  };

  const handleCompletionFT = async () => {
    try {
      setIsLoading(true);
      const newAbortController = new AbortController();
      abortControllerRefFT.current = newAbortController;

      // Get settings for writer model and prompt
      const settings = getSettings();

      const newId = ftChatMessages.length;
      const initialMessages: MessageProps[] = [
        ...ftChatMessages,
        {
          id: (newId + 1).toString(),
          sender: "You" as const,
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
      ];

      setftChatMessages(initialMessages);

      handleNewFTMessage({
        id: (newId + 1).toString(),
        sender: "You" as const,
        content: emptyTextAreaValue,
        timestamp: getFormattedTime(),
      });

      const messages: ChatMessage[] = [];
      
      // Get system message from settings for the current model
      messages.push({ 
        role: "system", 
        content: settings.writerPrompts[settings.writerModel] || '' 
      });
      
      // Add all previous messages to the context
      ftChatMessages.forEach(msg => {
        if (msg.sender === "You") {
          messages.push({ role: "user", content: msg.content });
        } else if (msg.sender !== "System" && typeof msg.sender !== "string") {
          messages.push({ role: "assistant", content: msg.content });
        }
      });
      
      // Add current user message
      messages.push({ role: "user", content: emptyTextAreaValue });

      // Get the token for the selected model
      const modelToken = settings.modelTokens[settings.writerModel] || import.meta.env.VITE_OPEN_AI_KEY;
      const response = await createChatCompletion(settings.writerModel, messages, modelToken);

      let fullMessage = ""; // Store the full AI response

      for await (const chunk of response) {
        if (chunk.choices[0]?.delta?.content) {
          fullMessage += chunk.choices[0].delta.content;
          setftChatMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            if (lastMessage && typeof lastMessage.sender !== "string") {
              lastMessage.content = fullMessage;
            }
            return updatedMessages;
          });
        }
      }

      // Save the final state of messages after completion
      setftChatMessages((prevMessages) => {
        const finalMessages = [...prevMessages];
        const lastMessage = finalMessages[finalMessages.length - 1];
        if (lastMessage && typeof lastMessage.sender !== "string") {
          lastMessage.content = fullMessage;
        }
        handleNewFTMessage(lastMessage);
        return finalMessages;
      });

      handleAbortRequestFT();
      setIsLoading(false);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "Request was aborted.") {
        console.warn("Request was aborted by the user.");
        return;
      }

      logError(error);
      setIsLoading(false);
      handleAbortRequestFT();
      alert("Ooooops! Something went wrong !");
    }
  };

  return (
    <Box sx={{ 
      display: "flex", 
      gap: 1,
      height: '100vh', // Fill entire viewport height
      overflow: 'hidden' // Prevent outer scrolling
    }}>

      {/* First Chat Box (Research) */}
      <Sheet
        sx={{
          height: { xs: "calc(100dvh - var(--Header-height))", md: "100dvh" },
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.level1",
          width: "50%",
          overflow: 'hidden', // Prevent sheet from scrolling
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
              <Typography level="body-sm" color="neutral">
                {getModelDisplayName(settings.researchModel)}
              </Typography>
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
            overflowY: "auto", // Changed from scroll to auto
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
            {chatMessages && chatMessages.map((message: MessageProps, index: number) => {
              const isYou = message.sender === "You";
              return (
                <Stack
                  key={index}
                  direction="row"
                  spacing={2}
                  sx={{ flexDirection: isYou ? "row-reverse" : "row" }}
                >
                  {isUserProps(message.sender) && (
                    <AvatarWithStatus
                      online={message.sender.online}
                      src={message.sender.avatar}
                    />
                  )}
                  <ChatBubble
                    
                    {...message}
                  />
                </Stack>
              );
            })}
          </Stack>
        </Box>
        {/* Conditionally render Stop button or MessageInput */}
        {abortControllerRef.current &&
        !abortControllerRef.current.signal.aborted ? (
          <Button
            size="sm"
            color="danger"
            sx={{ alignSelf: "center", borderRadius: "sm", mb: 2 }} // Add margin bottom (mb)
            endDecorator={<StopIcon />}
            onClick={handleAbortRequest}
          >
            Stop
          </Button> // Show Stop button if abortController exists
        ) : (
          <MessageInput
            textAreaValue={textAreaValue}
            setTextAreaValue={setTextAreaValue}
            onSubmit={handleCompletion}
            modelId={settings.researchModel}
            modelName={getModelDisplayName(settings.researchModel)}
          />
        )}
      </Sheet>

      {/* Second Chat Box (Write) */}
      <Sheet
        sx={{
          height: { xs: "calc(100dvh - var(--Header-height))", md: "100dvh" },
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.level1",
          width: "50%",
          overflow: 'hidden', // Prevent sheet from scrolling
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
              <Typography level="body-sm" color="neutral">
                {getModelDisplayName(settings.writerModel)}
              </Typography>
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
            overflowY: "auto", // Changed from scroll to auto
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
              Step 2: Use the extracted info to generate and refine your
              newsletter.
            </Box>
          )}
          <Stack spacing={2} sx={{ justifyContent: "flex-end" }}>
            {ftChatMessages &&
              ftChatMessages.map((message: MessageProps, index: number) => {
                const isYouFT = message.sender === "You";
                return (
                  <Stack 
                    key={index} 
                    direction="row" 
                    spacing={2}
                    sx={{ 
                      flexDirection: isYouFT ? "row-reverse" : "row",
                      justifyContent: isYouFT ? "flex-start" : "flex-start"
                    }}
                  >
                    <ChatBubble
                    
                      {...message}
                    />
                  </Stack>
                );
              })}
          </Stack>
        </Box>

        {/* Message input always stays at the bottom */}
        {abortControllerRefFT.current &&
        !abortControllerRefFT.current.signal.aborted ? (
          <Button
            size="sm"
            color="danger"
            sx={{ alignSelf: "center", borderRadius: "sm", mb: 2 }} // Add margin bottom (mb)
            endDecorator={<StopIcon />}
            onClick={handleAbortRequestFT}
          >
            Stop
          </Button> // Show Stop button if abortController exists
        ) : (
          <MessageInput
            textAreaValue={emptyTextAreaValue}
            setTextAreaValue={setEmptyTextAreaValue}
            onSubmit={handleCompletionFT}
            modelId={settings.writerModel}
            modelName={getModelDisplayName(settings.writerModel)}
          />
        )}
      </Sheet>
    </Box>
  );
}
