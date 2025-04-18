import React, { useRef, useState, useEffect } from "react";
import Box from "@mui/joy/Box";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import IconButton from "@mui/joy/IconButton";
// import Textarea from "@mui/joy/Textarea";
// import SendIcon from "@mui/icons-material/Send";
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
// const VITE_CANVAS_MODE_PROMPT = import.meta.env.VITE_CANVAS_MODE_PROMPT || '';

type MessagesPaneProps = {
  chat: ChatProps;
  handleNewMessage: (message: MessageProps) => void;
  handleNewFTMessage: (message: MessageProps) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  writerModelProps: string;
  researchModelProps: string;
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
    writerModelProps,
    researchModelProps
  } = props;

  
  const [chatMessages, setChatMessages] = useState<MessageProps[]>([]);
  const [ftChatMessages, setftChatMessages] = useState<MessageProps[]>([]);
  const [textAreaValue, setTextAreaValue] = useState("");
  const [emptyTextAreaValue, setEmptyTextAreaValue] = useState("");
  const [researchPrompts, setResearchPrompts] = useState<Record<string, string>>({});
  const [writerPrompts, setWriterPrompts] = useState<Record<string, string>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const abortControllerRefFT = useRef<AbortController | null>(null);
  
  const [researchCollapsed, setResearchCollapsed] = useState(true);
  const [writerCollapsed, setWriterCollapsed] = useState(true);
  const [editorContent, setEditorContent] = useState("");
  const [editorVisible, setEditorVisible] = useState(false);
  const [canvasMode, setCanvasMode] = useState(false);
  
  const { settings } = useSettings();
  const [sessionSettings,setSessionSettings] = useState(getSettings(chat.id));

  const sessionId = chat.id || 'default';

  const [researchModel, setResearchModel] = useState<string>(props?.researchModelProps);
  const [writerModel, setWriterModel] = useState<string>(props?.writerModelProps);

  const convertToMessageProps = (messages: Array<{ id: number; role: string; content: string; created_at: string }>, isFT: boolean = false): MessageProps[] => {
    if (!messages || messages.length === 0) {
      return [];
    }
    return messages.map(msg => ({
      id: msg.id.toString(),
      sender: msg.role === 'user' ? "You" as const : {
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

  const fetchSessionMessages = async (sessionId: string) => {
    try {
      const { data: researchMessages, error: researchError } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .eq('interface', 0)
        .order('created_at', { ascending: true });

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

  const fetchAllSessionMessages = async (sessions: ChatProps[]) => {
    try {
      const sessionIds = sessions.map(session => session.id);
      
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select('*')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching all messages:', error);
        return {};
      }

      const messagesBySession: Record<string, { 
        messages: Array<{ id: number; role: string; content: string; created_at: string }>, 
        messagesFT: Array<{ id: number; role: string; content: string; created_at: string }> 
      }> = {};
      
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

  useEffect(() => {
    setWriterModel(props.writerModelProps);
    setResearchModel(props.researchModelProps);
  },[props.researchModelProps,props.writerModelProps,chat])

  useEffect(() => {
    const loadSessionMessages = async () => {
      try {
        // Get research messages (interface: 0)
        const { data: researchMessages, error: researchError } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', chat.id)
          .eq('interface', 0)
          .order('created_at', { ascending: true });

        if (researchError) {
          console.error('Error fetching research messages:', researchError);
        }

        // Get writer messages (interface: 1)
        const { data: writerMessages, error: writerError } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', chat.id)
          .eq('interface', 1)
          .order('created_at', { ascending: true });

        if (writerError) {
          console.error('Error fetching writer messages:', writerError);
        }

        // Format messages as before
        const formattedResearchMessages = (researchMessages || []).map(msg => ({
          id: msg.id.toString(),
          sender: msg.role === 'user' ? "You" as const : {
            name: "Assistant",
            username: new Date(msg.created_at).toLocaleString(),
            avatar: "/static/images/avatar/1.jpg",
            online: true
          } as UserProps,
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
        }));

        const formattedWriterMessages = (writerMessages || []).map(msg => ({
          id: msg.id.toString(),
          sender: msg.role === 'user' ? "You" as const : {
            name: "Assistant",
            username: new Date(msg.created_at).toLocaleString(),
            avatar: "/static/images/avatar/1.jpg",
            online: true
          } as UserProps,
          content: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          canvasMode: msg.canvasMode || false
        }));

        // Get existing sessions from localStorage
        const savedSession = localStorage.getItem('chat_sessions');
        if (savedSession) {
          const sessions = JSON.parse(savedSession);
          // Only update the current session's messages
          const updatedSessions = sessions.map((session: any) => {
            if (session.id === chat.id) {
              return {
                ...session,
                messages: formattedResearchMessages,
                messagesFT: formattedWriterMessages,
                textAreaValue: "",
                emptyTextAreaValue: "",
                editorContent: ""
              };
            }
            // Keep other sessions unchanged
            return session;
          });
          localStorage.setItem('chat_sessions', JSON.stringify(updatedSessions));
        }

        // Update state only for current session's messages
        if (chat.id) {
          setChatMessages(formattedResearchMessages);
          setftChatMessages(formattedWriterMessages);
        }

        // Update editor content if there are writer messages and last message is from assistant
        const lastWriterMessage = formattedWriterMessages[formattedWriterMessages.length - 1];
        if (lastWriterMessage && lastWriterMessage.sender !== 'You') {
          setEditorContent(lastWriterMessage.content);
        } else {
          setEditorContent("");
        }
        
        // Reset text areas for current session
        setTextAreaValue("");
        setEmptyTextAreaValue("");

      } catch (error) {
        console.error('Error loading session messages:', error);
        // Only clear current session's messages on error
        if (chat.id) {
        setChatMessages([]);
        setftChatMessages([]);
          setEditorContent("");
          setTextAreaValue("");
          setEmptyTextAreaValue("");
        }
      }
    };

    if (chat.id) {
      loadSessionMessages();
    }

    // const store = localStorage.getItem('settings');
    // if (store) {
    //   const settings = JSON.parse(store)[chat.id];
    //   setResearchModel(settings.researchModel);
    //   setWriterModel(settings.writerModel);
    // }
  }, [chat.id]);

  useEffect(() => {
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
    if (!textAreaValue.trim()) return;
      setIsLoading(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Save user message to Supabase with canvasMode: false
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert([{
          role: 'user',
          content: textAreaValue,
          session_id: chat.id,
          interface: 0,
          canvas_mode: false,  // default false for research interface
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (userMessageError) {
        console.error('Error saving user message:', userMessageError);
      }

      // Add user message to state immediately
      const newMessage: MessageProps = {
        id: Date.now().toString(),
        sender: "You" as const,
        content: textAreaValue,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      };
      setChatMessages(prev => [...prev, newMessage]);

      const systemPrompt = researchPrompts[settings.researchModel] || settings.researchPrompts[settings.researchModel] || '';
      const messages: ChatMessage[] = [];
      messages.push({ role: "system", content: systemPrompt });
      
      chatMessages.forEach(msg => {
        if (msg.sender === "You") {
          messages.push({ role: "user", content: msg.content });
        } else if (msg.sender !== "System" && typeof msg.sender !== "string") {
          messages.push({ role: "assistant", content: msg.content });
        }
      });
      messages.push({ role: "user", content: textAreaValue });

      const modelToken = settings.modelTokens[settings.researchModel] || import.meta.env.VITE_OPEN_AI_KEY;
      const response = await createChatCompletion(settings.researchModel, messages, modelToken);

      let fullMessage = "";
      const assistantMessage = {
        id: (chatMessages.length + 2).toString(),
        sender: {
          name: "Assistant",
          username: new Date().toLocaleString(),
          avatar: "/static/images/avatar/1.jpg",
          online: true
        },
        content: "",
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      };

      // Add initial empty assistant message
      setChatMessages(prev => [...prev, assistantMessage]);

      for await (const chunk of response) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        fullMessage += chunk.choices[0].delta.content || '';
        // Update the last message with new content
        setChatMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: fullMessage
          };
          return newMessages;
        });
      }
      setTextAreaValue("");

      // Save assistant message to Supabase with canvasMode: false
      const { error: assistantMessageError } = await supabase
        .from('messages')
        .insert([{
          role: 'assistant',
          content: fullMessage,
          session_id: chat.id,
          interface: 0,
          canvas_mode: false,  // default false for research interface
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (assistantMessageError) {
        console.error('Error saving assistant message:', assistantMessageError);
      }
    } catch (error) {
      console.error('Error in completion:', error);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCompletionFT = async () => {
    if (!emptyTextAreaValue.trim()) return;
      setIsLoading(true);
    const abortController = new AbortController();
    abortControllerRefFT.current = abortController;
    const canvasMode = JSON.parse(localStorage.getItem('canvasMode') || 'false');
    // const isCanvasMode = JSON.parse() || false;
    // const sessionSettings = storedSettings[chat.id] || {};
    // const  = sessionSettings.canvasMode || false;
    try {
      // Save user message to Supabase with current canvasMode value
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert([{
          role: 'user',
          content: emptyTextAreaValue,
          session_id: chat.id,
          interface: 1,
          canvas_mode: canvasMode,  // use current canvasMode state
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (userMessageError) {
        console.error('Error saving user message:', userMessageError);
      }

      // Add user message to state immediately
      const newMessage: MessageProps = {
        id: Date.now().toString(),
        sender: "You" as const,
        content: emptyTextAreaValue,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      };
      setftChatMessages(prev => [...prev, newMessage]);

      // Get the correct prompt for the selected writer model
      let systemPrompt = writerPrompts[settings.writerModel] || settings.writerPrompts[settings.writerModel] || '';
      
      // Append canvas mode prompt if canvas mode is on
      if (canvasMode) {
        systemPrompt = `${systemPrompt}\n\n${settings.canvasModePrompt}`;
      }
      
      const messages: ChatMessage[] = [];
      messages.push({ role: "system", content: systemPrompt });
      
      ftChatMessages.forEach(msg => {
        if (msg.sender === "You") {
          messages.push({ role: "user", content: msg.content });
        } else if (msg.sender !== "System" && typeof msg.sender !== "string") {
          messages.push({ role: "assistant", content: msg.content });
        }
      });
      
      let currentMessage = emptyTextAreaValue;
      if (canvasMode) {
        currentMessage = `User Message: 
        ${emptyTextAreaValue}
        --------------------------
        Current Canvas Output:
        ${editorContent}`;
      }
      messages.push({ role: "user", content: currentMessage });

      const modelToken = settings.modelTokens[settings.writerModel] || import.meta.env.VITE_OPEN_AI_KEY;
      const response = await createChatCompletion(settings.writerModel, messages, modelToken);

      let fullMessage = "";
      const assistantMessage = {
        id: (ftChatMessages.length + 2).toString(),
        sender: {
          name: "Assistant",
          username: new Date().toLocaleString(),
          avatar: "/static/images/avatar/1.jpg",
          online: true
        },
        content: "",
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        canvas_mode: canvasMode
      };

      // Add initial empty assistant message
      setftChatMessages(prev => [...prev, assistantMessage]);

      for await (const chunk of response) {
        if (abortControllerRefFT.current?.signal.aborted) {
          break;
        }
        fullMessage += chunk.choices[0].delta.content || '';
        // Update the last message with new content
        setftChatMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            ...newMessages[newMessages.length - 1],
            content: fullMessage
          };
          return newMessages;
        });
      }
      setEmptyTextAreaValue("");
      setEditorContent(fullMessage);
      // Save assistant message to Supabase with current canvasMode value
      const { error: assistantMessageError } = await supabase
        .from('messages')
        .insert([{
          role: 'assistant',
          content: fullMessage,
          session_id: chat.id,
          interface: 1,
          canvas_mode: canvasMode,  // use current canvasMode state
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (assistantMessageError) {
        console.error('Error saving assistant message:', assistantMessageError);
      }
    } catch (error) {
      console.error('Error in completion:', error);
    } finally {
      setIsLoading(false);
      abortControllerRefFT.current = null;
    }
  };

  const handleOpenEditor = (content: string) => {
    if (!content && ftChatMessages.length > 0) {
      const lastMessage = ftChatMessages[ftChatMessages.length - 1];
      if (lastMessage.sender !== "You") {
        content = lastMessage.content;
      }
    }
    
    setEditorContent(content);
    setEditorVisible(true);
    setResearchCollapsed(true);
  };

  useEffect(() => {
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
      height: '95vh',
      overflow: 'hidden'
    }}>
      <Sheet
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.level1",
          width: researchCollapsed ? "60px" : (editorVisible ? "550px" : "50%"),
          overflow: 'hidden',
          transition: 'width 0.3s ease',
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
              ml: researchCollapsed ? 0 : 0
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
                    {getModelDisplayName(researchModel || settings.researchModel)}
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
                    ml: -2,
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
                mr: researchCollapsed ? -1 : 0,
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
                overflowY: "auto",
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
            {abortControllerRef.current &&
            !abortControllerRef.current.signal.aborted ? (
              <Button
                size="sm"
                color="danger"
                sx={{ alignSelf: "center", borderRadius: "sm", mb: 2 }}
                endDecorator={<StopIcon />}
                onClick={handleAbortRequest}
              >
                Stop
              </Button>
            ) : (
              <MessageInput
                textAreaValue={textAreaValue}
                setTextAreaValue={setTextAreaValue}
                onSubmit={handleCompletion}
                modelId={settings.researchModel}
                modelName={getModelDisplayName(researchModel || settings.researchModel)}
              />
            )}
          </>
        )}
      </Sheet>

      <Sheet
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.level1",
          width: writerCollapsed ? "120px" : (editorVisible ? "550px" : "50%"),
          overflow: 'hidden',
          transition: 'width 0.3s ease',
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
              ml: writerCollapsed ? 0 : 0
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
                    {getModelDisplayName(writerModel || settings.writerModel)}
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
                    ml: -2,
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
                mr: writerCollapsed ? -1 : 0,
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
                overflowY: "auto",
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

            {abortControllerRefFT.current &&
            !abortControllerRefFT.current.signal.aborted ? (
              <Button
                size="sm"
                color="danger"
                sx={{ alignSelf: "center", borderRadius: "sm", mb: 2 }}
                endDecorator={<StopIcon />}
                onClick={handleAbortRequestFT}
              >
                Stop
              </Button>
            ) : (
              <MessageInput
                textAreaValue={emptyTextAreaValue}
                setTextAreaValue={setEmptyTextAreaValue}
                onSubmit={handleCompletionFT}
                modelId={settings.writerModel}
                modelName={getModelDisplayName( writerModel || settings.writerModel)}
              />
            )}
          </>
        )}
      </Sheet>

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
            width: writerCollapsed ? '70%' : '50%',
            transition: 'width 0.3s ease',
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
