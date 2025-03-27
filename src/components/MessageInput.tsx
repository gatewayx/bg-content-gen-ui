import * as React from "react";
import Box from "@mui/joy/Box";
import Textarea from "@mui/joy/Textarea";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";

interface MessageInputProps {
  textAreaValue: string;
  setTextAreaValue: (value: string) => void;
  onSubmit: () => void;
  modelId: string;
  modelName: string;
}

export default function MessageInput(props: MessageInputProps) {
  const { textAreaValue, setTextAreaValue, onSubmit, modelName } = props;

  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <Typography level="body-sm" color="neutral" sx={{ ml: 1 }}>
          {modelName}
        </Typography>
        <Textarea
          minRows={3}
          maxRows={5}
          value={textAreaValue}
          onChange={(e) => setTextAreaValue(e.target.value)}
          placeholder="Type in here…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
              setTextAreaValue("");
            }
          }}
          sx={{
            fontSize: "sm",
            lineHeight: "1.5",
            "&::before": {
              display: "none",
            },
            "&:focus-within": {
              outline: "2px solid",
              outlineColor: "primary.500",
            },
          }}
        />
        <Button
          type="submit"
          disabled={!textAreaValue.trim()}
          sx={{ alignSelf: "flex-end" }}
        >
          Send
        </Button>
      </form>
    </Box>
  );
}
