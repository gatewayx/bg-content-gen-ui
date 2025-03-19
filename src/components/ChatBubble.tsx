import * as React from "react";
import Avatar from "@mui/joy/Avatar";
import Box from "@mui/joy/Box";
import Stack from "@mui/joy/Stack";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import Skeleton from "@mui/joy/Skeleton";
import { MessageProps } from "../components/types";
import { IconButton } from "@mui/joy";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DoneIcon from "@mui/icons-material/Done";

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
          <Typography level="body-xs">{isSent ? sender : sender.name}</Typography>
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
              maxWidth: "100%", // Ensures no overflow on width
              wordBreak: "break-word", // Breaks long words into multiple lines
              whiteSpace: "pre-wrap", // Wraps text that exceeds available space
              overflowWrap: "break-word", // Allows breaking of long words to avoid overflow
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
              <Typography
                level="body-sm"
                sx={{
                  color: isSent
                    ? "var(--joy-palette-common-white)"
                    : "var(--joy-palette-text-primary)",
                }}
              >
                {content}
              </Typography>
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
          onClick={() => {
            try {
              navigator.clipboard.writeText(content);
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            } catch (err) {
              console.error("Failed to copy text:", err);
            }
          }}
          sx={{ mt: 1 }}
        >
          {isCopied ? <DoneIcon /> : <ContentCopyIcon />}
        </IconButton>
      )}
    </Box>
  );
}
