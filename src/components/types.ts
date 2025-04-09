export interface UserProps {
  name: string;
  username: string;
  avatar: string;
  online: boolean;
}

export interface MessageProps {
  id: string;
  sender: UserProps | "You" | "System";
  content: string;
  timestamp: string;
  unread?: boolean;
  canvasMode?: boolean;
}

export interface ChatProps {
  id: string;
  unread?: boolean;
  sender: UserProps;
  messages: MessageProps[];
  messagesFT: MessageProps[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface MessageInputProps {
  textAreaValue: string;
  setTextAreaValue: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: () => void;
  modelId: string;
  modelName: string;
} 