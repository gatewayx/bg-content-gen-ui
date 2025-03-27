import * as React from 'react';
import Box from '@mui/joy/Box';
import Sheet from '@mui/joy/Sheet';
import Stack from '@mui/joy/Stack';
import AvatarWithStatus from './AvatarWithStatus';
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import MessagesPaneHeader from './MessagesPaneHeader';
import { ChatProps, MessageProps } from '../components/types';
import { getSettings } from "../services/SettingsService";
import { getModelDisplayName } from "../constants";

type MessagesPaneProps = {
  chat: ChatProps;
};


function getFormattedTime() {
  const now = new Date();
  
  const day = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
  const time = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
  });

  return `${day} ${time}`;
}

export default function MessagesPane(props: MessagesPaneProps) {
  const { chat } = props;
  const [chatMessages, setChatMessages] = React.useState(chat.messages);
  const [textAreaValue, setTextAreaValue] = React.useState('');
  const [emptyTextAreaValue, setEmptyTextAreaValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const settings = getSettings();

  React.useEffect(() => {
    setChatMessages(chat.messages);
  }, [chat.messages]);

  return (
    <Sheet
      sx={{
        height: { xs: 'calc(100dvh - var(--Header-height))', md: '100dvh' },
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.level1',
        maxWidth: '50%',
        
      }}
    >
      <MessagesPaneHeader sender={chat.sender} />
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          px: 2,
          py: 3,
          overflowY: 'scroll',
          flexDirection: 'column-reverse',
        }}
      >
        <Stack spacing={2} sx={{ justifyContent: 'flex-end' }}>
          {chatMessages.map((message: MessageProps, index: number) => {
            const isYou = message.sender === 'You';
            return (
              <Stack
                key={index}
                direction="row"
                spacing={2}
                sx={{ flexDirection: isYou ? 'row-reverse' : 'row' }}
              >
                {message.sender !== 'You' && (
                  <AvatarWithStatus
                    online={true}
                    // src={message.sender.avatar}
                  />
                )}
                <ChatBubble variant={isYou ? 'sent' : 'received'} {...message} />
              </Stack>
            );
          })}
        </Stack>
      </Box>
      <MessageInput
        textAreaValue={textAreaValue}
        setTextAreaValue={setTextAreaValue}
        onSubmit={() => {
          const newId = chatMessages.length + 1;
          const newIdString = newId.toString();
          setChatMessages([
            ...chatMessages,
            {
              id: newIdString,
              sender: 'You',
              content: textAreaValue,
              timestamp: getFormattedTime(),
            },
          ]);
        }}
        modelId={settings.researchModel}
        modelName={getModelDisplayName(settings.researchModel)}
      />
    </Sheet>
  );
}
