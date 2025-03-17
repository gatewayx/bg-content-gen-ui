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
     
    ],messagesFT: [
     
    ],
  }
];
