import * as React from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import Textarea from '@mui/joy/Textarea';
import { Stack } from '@mui/joy';

import SendRoundedIcon from '@mui/icons-material/SendRounded';

export type MessageInputProps = {
  textAreaValue: string;
  setTextAreaValue: (value: string) => void;
  onSubmit: () => void;
};

export default function MessageInput(props: MessageInputProps) {
  const { textAreaValue, setTextAreaValue, onSubmit } = props;
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea height
  const handleInput = () => {
    const textArea = textAreaRef.current;
    if (textArea) {
      textArea.style.height = 'auto'; // Reset height to auto to calculate the new height
      textArea.style.height = `${Math.min(textArea.scrollHeight, 600)}px`; // Set height to scrollHeight but limit to 600px
    }
  };

  const handleClick = () => {
    if (textAreaValue.trim() !== '') {
      onSubmit();
      setTextAreaValue('');
    }
  };

  return (
    <Box sx={{ px: 2, pb: 3 }}>
      <FormControl>
        <Textarea
          placeholder="Type something here…"
          aria-label="Message"
          // ref={textAreaRef}
          onChange={(event) => setTextAreaValue(event.target.value)}
          value={textAreaValue}
          minRows={1}
          maxRows={5} // Set a maximum number of rows
          endDecorator={
            <Stack
              direction="row"
              sx={{
                justifyContent: 'space-between',
                alignItems: 'center',
                flexGrow: 1,
                py: 1,
                pr: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <div>
                {/* Optional: Add any other toolbar icons here */}
              </div>
              <Button
                size="sm"
                color="primary"
                sx={{ alignSelf: 'center', borderRadius: 'sm' }}
                endDecorator={<SendRoundedIcon />}
                onClick={handleClick}
              >
                Send
              </Button>
            </Stack>
          }
          onInput={handleInput} // Adjust height on input
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              handleClick();
            }
          }}
          sx={{
            '& textarea': {
              minHeight: 90,
              maxHeight: 600, // Set maximum height to 600px
              overflowY: 'auto', // Enable scrolling once the height exceeds 600px
            },
          }}
        />
      </FormControl>
    </Box>
  );
}
