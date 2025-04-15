import React, { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import ListItemDecorator from "@mui/joy/ListItemDecorator";
import ListItemContent from "@mui/joy/ListItemContent";
import Typography from "@mui/joy/Typography";
import Avatar from "@mui/joy/Avatar";
import AvatarGroup from "@mui/joy/AvatarGroup";
import IconButton from "@mui/joy/IconButton";
import FormControl from "@mui/joy/FormControl";
import FormHelperText from "@mui/joy/FormHelperText";
import Textarea from "@mui/joy/Textarea";
import SendIcon from "@mui/icons-material/Send";
import StopIcon from "@mui/icons-material/Stop";
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import ChatBubble from "./ChatBubble";
import MessageInput from "./MessageInput";
import AvatarWithStatus from "./AvatarWithStatus";
import { ChatProps, MessageProps, UserProps } from "../components/types";
import { logError } from "../services/LoggerService";
import Button from "@mui/joy/Button";
import SimpleEditor from "./SimpleEditor";
import EditIcon from "@mui/icons-material/Edit";
import Link from "@mui/joy/Link";
import { useSettings } from "../contexts/SettingsContext";
import { supabase } from "../lib/supabase";
import { createChatCompletion } from "../services/OpenAIService";
import { getSettings } from "../services/SettingsService";
import { getModelDisplayName } from "../constants";
// Import VITE_CANVAS_MODE_PROMPT from environment variables
const VITE_CANVAS_MODE_PROMPT = import.meta.env.VITE_CANVAS_MODE_PROMPT || '';

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
  const [researchPrompts, setResearchPrompts] = React.useState<Record<string, string>>({});
  const [writerPrompts, setWriterPrompts] = React.useState<Record<string, string>>({});
  const abortControllerRef = useRef<AbortController>(null);
  const abortControllerRefFT = useRef<AbortController>(null);
  
  // Add state to track collapsed status of each panel
  const [researchCollapsed, setResearchCollapsed] = React.useState(true);
  const [writerCollapsed, setWriterCollapsed] = React.useState(true);
  const [editorContent, setEditorContent] = React.useState("");
  // Track if editor is visible
  const [editorVisible, setEditorVisible] = React.useState(false);

  // Get settings from context
  const { settings } = useSettings();

  // Get session ID from chat object
  const sessionId = chat.id || 'default';

  // Convert database messages to MessageProps format
  const convertToMessageProps = (messages: any[], isFT: boolean = false): MessageProps[] => {
    if (!messages || messages.length === 0) {
      return [];
    }
    return messages.map(msg => ({
      id: msg.id.toString(),
      sender: msg.role === 'user' ? 'You' : {
        name: "Session 1",
        username: new Date(msg.created_at).toLocaleString(),
        avatar: "/static/images/avatar/3.jpg",
        online: true,
      },
      content: msg.content,
      timestamp: new Date(msg.created_at).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      canvasMode: isFT ? editorVisible : false
    }));
  };

  // Function to fetch messages for a session
  const fetchSessionMessages = async (sessionId: string) => {
    try {
      // Fetch research messages (interface: 0)
      const { data: researchMessages, error: researchError } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('interface', 0)
        .order('created_at', { ascending: true });

      // Fetch writer messages (interface: 1)
      const { data: writerMessages, error: writerError } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('interface', 1)
        .order('created_at', { ascending: true });

      if (researchError || writerError) {
        console.error('Error fetching messages:', researchError || writerError);
        return { messages: [], messagesFT: [] };
      }

      return {
        messages: convertToMessageProps(researchMessages || []),
        messagesFT: convertToMessageProps(writerMessages || [], true)
      };
    } catch (error) {
      console.error('Error in fetchSessionMessages:', error);
      return { messages: [], messagesFT: [] };
    }
  };

  // Function to fetch messages for all sessions
  const fetchAllSessionMessages = async (sessions: ChatProps[]) => {
    try {
      // Get all session IDs
      const sessionIds = sessions.map(session => session.id);
      
      // Fetch all messages for these sessions
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select('*')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching all messages:', error);
        return {};
      }

      // Group messages by session_id and interface
      const messagesBySession: Record<string, { messages: any[], messagesFT: any[] }> = {};
      
      allMessages?.forEach(msg => {
        if (!messagesBySession[msg.session_id]) {
          messagesBySession[msg.session_id] = { messages: [], messagesFT: [] };
        }
        
        if (msg.interface === 0) {
          messagesBySession[msg.session_id].messages.push(msg);
        } else {
          messagesBySession[msg.session_id].messagesFT.push(msg);
        }
      });

      // Convert messages to MessageProps format for each session
      const convertedMessages: Record<string, { messages: MessageProps[], messagesFT: MessageProps[] }> = {};
      
      Object.entries(messagesBySession).forEach(([sessionId, msgs]) => {
        convertedMessages[sessionId] = {
          messages: convertToMessageProps(msgs.messages),
          messagesFT: convertToMessageProps(msgs.messagesFT, true)
        };
      });

      return convertedMessages;
    } catch (error) {
      console.error('Error in fetchAllSessionMessages:', error);
      return {};
    }
  };

  // Load session state from local storage on component mount or when session changes
  React.useEffect(() => {
    const loadSessions = async () => {
      const savedSession = localStorage.getItem(`chat_sessions`);
      
      if (savedSession) {
        try {
          const sessionState = JSON.parse(savedSession);
          const selected = sessionState.filter((obj:ChatProps) => obj.id == chat.id)[0];
          console.log('selected session', chat.id);
          
          // Update selectedChatId in localStorage
          localStorage.setItem('selectedChatId', chat.id);
          
          // Only fetch messages if they don't exist in the session
          if (!selected.messages || !selected.messagesFT) {
            // Fetch messages for all sessions
            const allMessages = await fetchAllSessionMessages(sessionState);
            
            // Update each session with its messages
            const updatedSessions = sessionState.map((session: ChatProps) => {
              const sessionMessages = allMessages[session.id] || { messages: [], messagesFT: [] };
              return {
                ...session,
                messages: sessionMessages.messages,
                messagesFT: sessionMessages.messagesFT,
                textAreaValue: session.textAreaValue || "",
                emptyTextAreaValue: session.emptyTextAreaValue || "",
                editorContent: session.editorContent || ""
              };
            });
            
            // Save updated sessions back to localStorage
            localStorage.setItem(`chat_sessions`, JSON.stringify(updatedSessions));
            
            // Update local state with selected session's messages
            const selectedMessages = allMessages[chat.id] || { messages: [], messagesFT: [] };
            setChatMessages(selectedMessages.messages);
            setftChatMessages(selectedMessages.messagesFT);
          } else {
            // Use existing messages from the session
            setChatMessages(selected.messages);
            setftChatMessages(selected.messagesFT);
          }
          
          // find the last message from the selected session, sender is not you
          const lastMessage = selected.messagesFT[selected.messagesFT.length - 1];
          if (lastMessage && lastMessage.sender !== "You") {
            setEditorContent(lastMessage.content);
          } else {
            setEditorContent("");
          }
          
          setTextAreaValue(selected.textAreaValue || ""); // Load research textarea value
          setEmptyTextAreaValue(selected.emptyTextAreaValue || ""); // Load write textarea value

          // Load saved prompts for current models
          const settings = JSON.parse(localStorage.getItem('settings') || '{}');
          const sessionSettings = settings[chat.id] || {};
          
          if (sessionSettings.researchPrompts && sessionSettings.researchModel) {
            const researchPrompt = sessionSettings.researchPrompts[sessionSettings.researchModel];
            if (researchPrompt) {
              setResearchPrompts(prev => ({
                ...prev,
                [sessionSettings.researchModel]: researchPrompt
              }));
            }
          }

          if (sessionSettings.writerPrompts && sessionSettings.writerModel) {
            const writerPrompt = sessionSettings.writerPrompts[sessionSettings.writerModel];
            if (writerPrompt) {
              setWriterPrompts(prev => ({
                ...prev,
                [sessionSettings.writerModel]: writerPrompt
              }));
            }
          }
        } catch (error) {
          console.error('Error loading session state:', error);
          // Reset to empty arrays if there's an error
          setChatMessages([]);
          setftChatMessages([]);
          setEditorContent(""); // Reset editor content
          setTextAreaValue(""); // Reset research textarea
          setEmptyTextAreaValue(""); // Reset write textarea
        }
      } else {
        // Reset to empty arrays for new sessions
        setChatMessages([]);
        setftChatMessages([]);
        setEditorContent(""); // Reset editor content
        setTextAreaValue(""); // Reset research textarea
        setEmptyTextAreaValue(""); // Reset write textarea
      }
    };

    loadSessions();
  }, [chat.id]);

  // Save editor content and textarea values to session state when they change
  React.useEffect(() => {
    const savedSession = localStorage.getItem(`chat_sessions`);
    if (savedSession) {
      try {
        const sessionState = JSON.parse(savedSession);
        const updatedSessions = sessionState.map((session: ChatProps) => 
          session.id === chat.id 
            ? { 
                ...session, 
                editorContent,
                textAreaValue,
                emptyTextAreaValue
              } 
            : session
        );
        localStorage.setItem(`chat_sessions`, JSON.stringify(updatedSessions));
      } catch (error) {
        console.error('Error saving session state:', error);
      }
    }
  }, [editorContent, textAreaValue, emptyTextAreaValue, chat.id]);

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
      const settings = await getSettings(chat.id);

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

      // Save user message to database
      try {
        const { error: userMessageError } = await supabase
          .from('messages')
          .insert([
            {
              role: 'user',
              content: textAreaValue,
              session_id: chat.id,
              interface: 0, // Research interface
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);

        if (userMessageError) {
          console.error('Error saving user message:', userMessageError);
        }
      } catch (error) {
        console.error('Error saving user message:', error);
      }

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

      // Save assistant message to database
      try {
        const { error: assistantMessageError } = await supabase
          .from('messages')
          .insert([
            {
              role: 'assistant',
              content: fullMessage,
              session_id: chat.id,
              interface: 0, // Research interface
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);

        if (assistantMessageError) {
          console.error('Error saving assistant message:', assistantMessageError);
        }
      } catch (error) {
        console.error('Error saving assistant message:', error);
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

      setEditorContent("");
      setTextAreaValue(""); // Clear research textarea
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
      const settings = await getSettings(chat.id);

      const newId = ftChatMessages.length;
      const initialMessages: MessageProps[] = [
        ...ftChatMessages,
        {
          id: (newId + 1).toString(),
          sender: "You" as const,
          content: emptyTextAreaValue,
          timestamp: getFormattedTime(),
          canvasMode: editorVisible, // Set canvasMode based on editor visibility
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

      // Save user message to database
      try {
        const { error: userMessageError } = await supabase
          .from('messages')
          .insert([
            {
              role: 'user',
              content: emptyTextAreaValue,
              session_id: chat.id,
              interface: 1, // Writer interface
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);

        if (userMessageError) {
          console.error('Error saving user message:', userMessageError);
        }
      } catch (error) {
        console.error('Error saving user message:', error);
      }

      handleNewFTMessage({
        id: (newId + 1).toString(),
        sender: "You" as const,
        content: emptyTextAreaValue,
        timestamp: getFormattedTime(),
      });

      const messages: ChatMessage[] = [];
      
      // Get system message from settings for the current model
      const canvasMode:boolean = JSON.parse(localStorage.getItem('canvasMode') || 'false');
      let system = settings.writerPrompts[getModelDisplayName(settings.writerModel)] || '';

      if (canvasMode) {
        // Get canvas mode prompt from localStorage or use default
        const canvasModePrompt = localStorage.getItem('canvasModePrompt') || VITE_CANVAS_MODE_PROMPT;
        system = `${system}\n\n${canvasModePrompt}`;
      }
      
      
      // Add all previous messages to the context
      ftChatMessages.forEach(msg => {
        if (msg.sender === "You") {
          let content = msg.content;
          messages.push({ role: "user", content: content });
        } else if (msg.sender !== "System" && typeof msg.sender !== "string") {
          messages.push({ role: "assistant", content: msg.content });
        }
      });

      // Add current user message
      let currentMessage = emptyTextAreaValue;
      if (canvasMode) {
        currentMessage = `User Message: 
        ${emptyTextAreaValue}
        --------------------------
        Current Canvas Output:
        ${editorContent}`;
      }
      messages.push({ role: "user", content: currentMessage });

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

      // Save assistant message to database
      try {
        const { error: assistantMessageError } = await supabase
          .from('messages')
          .insert([
            {
              role: 'assistant',
              content: fullMessage,
              session_id: chat.id,
              interface: 1, // Writer interface
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);

        if (assistantMessageError) {
          console.error('Error saving assistant message:', assistantMessageError);
        }
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }

      // Save the final state of messages after completion
      setftChatMessages((prevMessages) => {
        const finalMessages = [...prevMessages];
        const lastMessage = finalMessages[finalMessages.length - 1];
        if (lastMessage && typeof lastMessage.sender !== "string") {
          lastMessage.content = fullMessage;
          lastMessage.canvasMode = canvasMode; // Ensure canvasMode is set
        }
        handleNewFTMessage(lastMessage);
        return finalMessages;
      });
      // Set the editor content to the full message
      setEditorContent(fullMessage);
      setEmptyTextAreaValue(""); // Clear write textarea
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

  // Function to handle opening editor with content
  const handleOpenEditor = (content: string) => {
    // If no specific content is provided, try to get the last message's content
    if (!content && ftChatMessages.length > 0) {
      const lastMessage = ftChatMessages[ftChatMessages.length - 1];
      // Only use content if the message is not from "You"
      if (lastMessage.sender !== "You") {
        content = lastMessage.content;
      }
    }
    
    setEditorContent(content);
    setEditorVisible(true);
    // Collapse both panels when editor opens
    setResearchCollapsed(true);
    // setWriterCollapsed(true);
  };

  // Effect to expand collapsed panels when editor is closed
  React.useEffect(() => {
    if (!editorVisible) {
      setResearchCollapsed(false);
      setWriterCollapsed(false);
    }
    localStorage.setItem('canvasMode',JSON.stringify(editorVisible));
  }, [editorVisible]);

  return (
    <Box sx={{ 
      display: "flex", 
      gap: 1,
      height: '95vh', // Fill entire viewport height
      overflow: 'hidden' // Prevent outer scrolling
    }}>
      {/* First Chat Box (Research) */}
      <Sheet
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.level1",
          width: researchCollapsed ? "60px" : (editorVisible ? "550px" : "50%"), // Take 50% width when editor is hidden
          overflow: 'hidden', // Prevent sheet from scrolling
          transition: 'width 0.3s ease', // Add smooth transition
          position: 'relative',
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
            alignItems: "center",
          }}
        >
          <Stack
            direction="row"
            spacing={{ xs: 1, md: 2 }}
            sx={{ 
              alignItems: "center",
              ml: researchCollapsed ? 0 : 0 // Add negative margin when collapsed
            }}
          >
            <div>
              {!researchCollapsed ? (
                <>
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
                </>
              ) : (
                <Typography
                  sx={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'primary.main',
                    letterSpacing: '1px',
                    padding: '5px',
                    ml: -2, // Move text more to the left
                  }}
                >
                  R
                </Typography>
              )}
            </div>
          </Stack>
          <Stack direction="row" spacing={1}>
            <IconButton
              size="sm"
              variant="outlined"
              color="primary"
              sx={{
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                mr: researchCollapsed ? -1 : 0, // Adjust margin when collapsed
                '&:hover': {
                  backgroundColor: 'primary.100'
                }
              }}
              onClick={() => setResearchCollapsed(!researchCollapsed)}
            >
              {researchCollapsed ? <OpenInFullIcon /> : <CloseFullscreenIcon />}
            </IconButton>
          </Stack>
        </Stack>
        {!researchCollapsed && (
          <>
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
                  <Typography level="h4" sx={{ mb: 1 }}>
                    Xpress
                    <Typography
                      component="span"
                      sx={{
                        fontSize: "0.7em",
                        verticalAlign: "sub",
                        ml: 0.5,
                        color: "neutral.500",
                      }}
                    >
                      by{" "}
                      <Link
                        href="https://www.gateway.xyz/"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: "primary.500",
                          textDecoration: "none",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        Gateway X
                      </Link>
                    </Typography>
                  </Typography>
                  <Typography level="body-sm">
                    Call Transcript → Email Newsletter <br />
                    Step 1: Paste the call transcript, then **extract key stories**.
                  </Typography>
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
          </>
        )}
      </Sheet>

      {/* Second Chat Box (Write) */}
      <Sheet
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.level1",
          width: writerCollapsed ? "120px" : (editorVisible ? "550px" : "50%"), // Take 50% width when editor is hidden
          overflow: 'hidden', // Prevent sheet from scrolling
          transition: 'width 0.3s ease', // Add smooth transition
          position: 'relative',
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
            alignItems: "center",
          }}
        >
          <Stack
            direction="row"
            spacing={{ xs: 1, md: 2 }}
            sx={{ 
              alignItems: "center",
              ml: writerCollapsed ? 0 : 0 // Add negative margin when collapsed
            }}
          >
            <div>
              {!writerCollapsed ? (
                <>
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
                </>
              ) : (
                <Typography
                  sx={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'primary.main',
                    letterSpacing: '1px',
                    padding: '5px',
                    ml: -2, // Move text more to the left
                  }}
                >
                  W
                </Typography>
              )}
            </div>
          </Stack>
          <Stack direction="row" spacing={1}>
            {!editorVisible && (
              <IconButton
                size="sm"
                variant="outlined"
                color="primary"
                sx={{
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  '&:hover': {
                    backgroundColor: 'primary.100'
                  }
                }}
                onClick={() => {
                  handleOpenEditor('');
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton
              size="sm"
              variant="outlined"
              color="primary"
              sx={{
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                mr: writerCollapsed ? -1 : 0, // Adjust margin when collapsed
                '&:hover': {
                  backgroundColor: 'primary.100'
                }
              }}
              onClick={() => setWriterCollapsed(!writerCollapsed)}
            >
              {writerCollapsed ? <OpenInFullIcon /> : <CloseFullscreenIcon />}
            </IconButton>
          </Stack>
        </Stack>
        {!writerCollapsed && (
          <>
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
                          onEdit={handleOpenEditor}
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
          </>
        )}
      </Sheet>

      {/* Editor component taking most of the space */}
      {editorVisible && (
        <Sheet
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "background.level1",
            flex: 1,
            overflow: 'hidden',
            mt: 1,
            width: writerCollapsed ? '70%' : '50%', // Adjust width based on writer collapse state
            transition: 'width 0.3s ease', // Add smooth transition
          }}
        >
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <SimpleEditor 
              initialContent={editorContent} 
              onSave={(content) => {
                setEditorContent(content);
              }}
              onClose={() => setEditorVisible(false)}
            />
          </Box>
        </Sheet>
      )}
    </Box>
  );
}
