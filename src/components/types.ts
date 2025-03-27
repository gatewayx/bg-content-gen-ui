export type UserProps = {
  name: string;
  username: string;
  avatar: string;
  online: boolean;
};

export type MessageProps = {
  id: string;
  sender: "You" | "System" | UserProps;
  content: string;
  timestamp: string;
};

export type ChatProps = {
  id: string;
  messages: MessageProps[];
  messagesFT: MessageProps[];
}; 