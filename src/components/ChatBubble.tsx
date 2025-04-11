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
import EditIcon from "@mui/icons-material/Edit";
import ReactMarkdown from 'react-markdown';
import Link from '@mui/joy/Link';
import remarkGfm from 'remark-gfm';

type ChatBubbleProps = MessageProps & {
  onEdit?: (content: string) => void;
};

export default function ChatBubble({
  content = "",
  timestamp = "",
  sender = "You",
  onEdit,
  canvasMode = false,
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
      navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // Function to handle edit button click
  const handleEdit = () => {
    if (onEdit) {
      onEdit(content);
    }
  };

  // Function to render content based on canvasMode
  const renderContent = () => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <Typography level="h1" sx={{ color: isSent ? "white" : "inherit", mb: 2, fontSize: "1.5em" }}>
              {children}
            </Typography>
          ),
          h2: ({ children }) => (
            <Typography level="h2" sx={{ color: isSent ? "white" : "inherit", mb: 2, fontSize: "1.3em" }}>
              {children}
            </Typography>
          ),
          h3: ({ children }) => (
            <Typography level="h3" sx={{ color: isSent ? "white" : "inherit", mb: 2, fontSize: "1.1em" }}>
              {children}
            </Typography>
          ),
          // Paragraphs
          p: ({ children }) => (
            <Typography 
              level="body-sm" 
              sx={{ 
                color: isSent ? "white" : "inherit", 
                mb: 2,
                whiteSpace: "pre-wrap"
              }}
            >
              {children}
            </Typography>
          ),
          // Lists
          ul: ({ children }) => (
            <Box
              component="ul"
              sx={{
                color: isSent ? "white" : "inherit",
                mb: 2,
                pl: 3,
                listStyleType: "disc",
                '& li': {
                  mb: 1
                }
              }}
            >
              {children}
            </Box>
          ),
          ol: ({ children }) => (
            <Box
              component="ol"
              sx={{
                color: isSent ? "white" : "inherit",
                mb: 2,
                pl: 3,
                listStyleType: "decimal",
                '& li': {
                  mb: 1
                }
              }}
            >
              {children}
            </Box>
          ),
          li: ({ children }) => (
            <Box
              component="li"
              sx={{
                color: isSent ? "white" : "inherit",
                lineHeight: 1.5,
              }}
            >
              {children}
            </Box>
          ),
          // Code blocks
          code: ({ children, className }) => {
            const isInline = !className;
            
            return isInline ? (
              <Box
                component="code"
                sx={{
                  backgroundColor: isSent ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                  padding: "0.2em 0.4em",
                  borderRadius: "4px",
                  color: isSent ? "white" : "inherit",
                  fontFamily: "monospace",
                  fontSize: "0.9em",
                }}
              >
                {children}
              </Box>
            ) : (
              <Box
                component="pre"
                sx={{
                  backgroundColor: isSent ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                  padding: "1em",
                  borderRadius: "4px",
                  overflow: "auto",
                  color: isSent ? "white" : "inherit",
                  fontFamily: "monospace",
                  mb: 2,
                  fontSize: "0.9em",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word"
                }}
              >
                <Box component="code" className={className}>
                  {children}
                </Box>
              </Box>
            );
          },
          // Blockquotes
          blockquote: ({ children }) => (
            <Box
              component="blockquote"
              sx={{
                borderLeft: `4px solid ${isSent ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.2)"}`,
                paddingLeft: "1em",
                marginLeft: 0,
                marginRight: 0,
                color: isSent ? "white" : "inherit",
                mb: 2,
                fontStyle: "italic",
              }}
            >
              {children}
            </Box>
          ),
          // Tables
          table: ({ children }) => (
            <Box
              component="table"
              sx={{
                borderCollapse: "collapse",
                width: "100%",
                margin: "1em 0",
                color: isSent ? "white" : "inherit",
                mb: 2,
                fontSize: "0.9em"
              }}
            >
              {children}
            </Box>
          ),
          th: ({ children }) => (
            <Box
              component="th"
              sx={{
                border: `1px solid ${isSent ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
                padding: "0.5em",
                textAlign: "left",
                color: isSent ? "white" : "inherit",
                fontWeight: "bold",
                backgroundColor: isSent ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
              }}
            >
              {children}
            </Box>
          ),
          td: ({ children }) => (
            <Box
              component="td"
              sx={{
                border: `1px solid ${isSent ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
                padding: "0.5em",
                color: isSent ? "white" : "inherit",
              }}
            >
              {children}
            </Box>
          ),
          // Links
          a: ({ href, children }) => (
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: isSent ? "white" : "primary.main",
                textDecoration: "underline",
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            >
              {children}
            </Link>
          ),
          // Horizontal rules
          hr: () => (
            <Box
              component="hr"
              sx={{
                border: "none",
                borderTop: `1px solid ${isSent ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`,
                margin: "1.5em 0",
              }}
            />
          ),
          // Strong/bold text
          strong: ({ children }) => (
            <Box
              component="strong"
              sx={{
                fontWeight: "bold",
                color: isSent ? "white" : "inherit",
              }}
            >
              {children}
            </Box>
          ),
          // Emphasized/italic text
          em: ({ children }) => (
            <Box
              component="em"
              sx={{
                fontStyle: "italic",
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
    );
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
              whiteSpace: "normal",
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
              renderContent()
            )}
          </Sheet>
        </Box>
      </Box>

      {/* Action Buttons Below Chat Bubble */}
      {content.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <IconButton
            variant={isCopied ? "soft" : "plain"}
            color={isCopied ? "success" : "neutral"}
            size="sm"
            onClick={handleCopy}
          >
            {isCopied ? <DoneIcon /> : <ContentCopyIcon />}
          </IconButton>

          {!isSent && onEdit && (
            <IconButton
              variant="plain"
              color="neutral"
              size="sm"
              onClick={handleEdit}
            >
              <EditIcon />
            </IconButton>
          )}
        </Stack>
      )}
    </Box>
  );
}
