import { ChatProps, UserProps } from './types';

export const users: UserProps[] = [
  {
    name: 'Session 1',
    username: '12/23/2023 12:09:40 PM',
    avatar: '/static/images/avatar/3.jpg',
    online: false,
  },
  {
    name: 'Session 2',
    username: '12/23/2023 12:10:40 PM',
    avatar: '/static/images/avatar/5.jpg',
    online: false,
  },
  {
    name: 'Session 3',
    username: '12/23/2023 12:11:40 PM',
    avatar: '/static/images/avatar/6.jpg',
    online: false,
  },
];

export const chats: ChatProps[] = [
  {
    id: '1',
    sender: users[0],
    messages: [
      {
        id: '1',
        content: 'Hello, this is Session 1.',
        timestamp: 'Wednesday 9:00am',
        sender: users[0],
      },
      {
        id: '2',
        content: 'How are you today?',
        timestamp: 'Wednesday 9:05am',
        sender: 'You',
      },
    ],
  },
  {
    id: '2',
    sender: users[1],
    messages: [
      {
        id: '1',
        content: 'This is Session 2. Let’s discuss our plans.',
        timestamp: '5 mins ago',
        sender: users[1],
      },
      {
        id: '2',
        content: 'Sure! What’s on your mind?',
        timestamp: 'Just now',
        sender: 'You',
      },
    ],
  },
  {
    id: '3',
    sender: users[2],
    messages: [
      {
        id: '1',
        content: 'Session 3 is now active.',
        timestamp: 'Just now',
        sender: users[2],
      },
    ],
  },
];
