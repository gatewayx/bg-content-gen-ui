import * as React from "react";
import Box from "@mui/joy/Box";
import Stack from "@mui/joy/Stack";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Skeleton from "@mui/joy/Skeleton";
import { MessageProps } from "../components/types";
import { IconButton } from "@mui/joy";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DoneIcon from "@mui/icons-material/Done";
import ReactMarkdown from 'react-markdown';

type ChatBubbleProps = MessageProps & {
  variant: "sent" | "received";
  is_loading?: boolean;
};

export default function ChatBubble({
  content = "",
  variant,
  timestamp = "",
  sender = "You",
  is_loading = false,
}: ChatBubbleProps) {
  const isSent = sender === "You";
  const [isCopied, setIsCopied] = React.useState(false);

  // Get sender name based on type
  const senderName = typeof sender === "string" 
    ? sender 
    : sender.name || "Assistant";

  // Function to handle copy with markdown formatting
  const handleCopy = () => {
    try {
      // Use the original content with markdown formatting
      navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: "85%",
        minWidth: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: isSent ? "flex-end" : "flex-start",
      }}
    >
      {/* Message Bubble */}
      <Box sx={{ width: "100%" }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: "space-between", mb: 0.25 }}
        >
          <Typography level="body-xs">{senderName}</Typography>
          <Typography level="body-xs">{timestamp}</Typography>
        </Stack>

        <Box sx={{ position: "relative" }}>
          <Sheet
            color={isSent ? "primary" : "neutral"}
            variant={isSent ? "solid" : "soft"}
            sx={{
              p: 1.25,
              borderRadius: "lg",
              borderTopRightRadius: isSent ? 0 : "lg",
              borderTopLeftRadius: isSent ? "lg" : 0,
              backgroundColor: isSent
                ? "var(--joy-palette-primary-solidBg)"
                : "background.body",
              maxWidth: "100%",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              overflowWrap: "break-word",
            }}
          >
            {content.length === 0 ? (
              <Skeleton
                variant="rectangular"
                width="100%"
                height={40}
                sx={{
                  borderRadius: "lg",
                  borderTopRightRadius: isSent ? 0 : "lg",
                  borderTopLeftRadius: isSent ? "lg" : 0,
                }}
              />
            ) : (
              <ReactMarkdown
                components={{
                  // Style markdown elements
                  h1: ({ children }) => (
                    <Typography level="h1" sx={{ color: isSent ? "white" : "inherit" }}>
                      {children}
                    </Typography>
                  ),
                  h2: ({ children }) => (
                    <Typography level="h2" sx={{ color: isSent ? "white" : "inherit" }}>
                      {children}
                    </Typography>
                  ),
                  h3: ({ children }) => (
                    <Typography level="h3" sx={{ color: isSent ? "white" : "inherit" }}>
                      {children}
                    </Typography>
                  ),
                  p: ({ children }) => (
                    <Typography level="body-sm" sx={{ color: isSent ? "white" : "inherit" }}>
                      {children}
                    </Typography>
                  ),
                  ul: ({ children }) => (
                    <Box component="ul" sx={{ color: isSent ? "white" : "inherit" }}>
                      {children}
                    </Box>
                  ),
                  ol: ({ children }) => (
                    <Box component="ol" sx={{ color: isSent ? "white" : "inherit" }}>
                      {children}
                    </Box>
                  ),
                  li: ({ children }) => (
                    <Box component="li" sx={{ color: isSent ? "white" : "inherit" }}>
                      {children}
                    </Box>
                  ),
                  code: ({ children }) => (
                    <Typography
                        component="code"
                        sx={{
                          backgroundColor: isSent ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                          padding: "0.2em 0.4em",
                          borderRadius: "3px",
                          color: isSent ? "white" : "inherit",
                        }}
                      >
                        {children}
                      </Typography>
                  ),
                  blockquote: ({ children }) => (
                    <Box
                      component="blockquote"
                      sx={{
                        borderLeft: `4px solid ${isSent ? "white" : "inherit"}`,
                        paddingLeft: "1em",
                        marginLeft: 0,
                        color: isSent ? "white" : "inherit",
                      }}
                    >
                      {children}
                    </Box>
                  ),
                  table: ({ children }) => (
                    <Box
                      component="table"
                      sx={{
                        borderCollapse: "collapse",
                        width: "100%",
                        margin: "1em 0",
                        color: isSent ? "white" : "inherit",
                      }}
                    >
                      {children}
                    </Box>
                  ),
                  th: ({ children }) => (
                    <Box
                      component="th"
                      sx={{
                        border: `1px solid ${isSent ? "white" : "inherit"}`,
                        padding: "0.5em",
                        textAlign: "left",
                        color: isSent ? "white" : "inherit",
                      }}
                    >
                      {children}
                    </Box>
                  ),
                  td: ({ children }) => (
                    <Box
                      component="td"
                      sx={{
                        border: `1px solid ${isSent ? "white" : "inherit"}`,
                        padding: "0.5em",
                        color: isSent ? "white" : "inherit",
                      }}
                    >
                      {children}
                    </Box>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </Sheet>
        </Box>
      </Box>

      {/* Copy Icon Below Chat Bubble */}
      {content.length > 0 && (
        <IconButton
          variant={isCopied ? "soft" : "plain"}
          color={isCopied ? "success" : "neutral"}
          size="sm"
          onClick={handleCopy}
          sx={{ mt: 1 }}
        >
          {isCopied ? <DoneIcon /> : <ContentCopyIcon />}
        </IconButton>
      )}
    </Box>
  );
}
