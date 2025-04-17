import { supabase } from '../lib/supabase';
import { ChatProps, MessageProps } from '../components/types';

export interface Session {
  id: string;
  user_id: string;
  label: string;
  created_at: string;
  updated_at: string;
  editor_draft: string;
  is_archived: boolean;
  messages: MessageProps[];
  messagesFT: MessageProps[];
}

export interface ModelExtension {
  model_id: string;
  suffix: string;
  key: string;
}

export const createSession = async (label: string): Promise<Session> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');

  const now = new Date().toISOString().replace('Z', '+00:00');
  const { data, error } = await supabase
    .from('sessions')
    .insert([
      {
        user_id: user.id,
        label,
        created_at: now,
        updated_at: now,
        editor_draft: '',
        is_archived: false
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    messages: [],
    messagesFT: []
  };
};

export const fetchModelExtensions = async (): Promise<ModelExtension[]> => {
  const { data, error } = await supabase
    .from('system')
    .select('model_id, suffix, key')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching model extensions:', error);
    return [];
  }

  // Store in localStorage
  localStorage.setItem('model_extensions', JSON.stringify(data || []));
  return data || [];
};

export const getSessions = async (): Promise<Session[]> => {
  // Fetch model extensions first
  await fetchModelExtensions();

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch messages for all sessions
  const sessionIds = data.map(session => session.id);
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true });

  if (messagesError) throw messagesError;

  // Group messages by session and interface
  const messagesBySession: Record<string, { messages: any[], messagesFT: any[] }> = {};
  messages?.forEach(msg => {
    if (!messagesBySession[msg.session_id]) {
      messagesBySession[msg.session_id] = { messages: [], messagesFT: [] };
    }
    if (msg.interface === 0) {
      messagesBySession[msg.session_id].messages.push(msg);
    } else {
      messagesBySession[msg.session_id].messagesFT.push(msg);
    }
  });

  // Format messages and combine with sessions
  return data.map(session => {
    const sessionMessages = messagesBySession[session.id] || { messages: [], messagesFT: [] };
    return {
      ...session,
      messages: sessionMessages.messages.map(msg => ({
        id: msg.id.toString(),
        sender: msg.role === 'user' ? 'You' : {
          name: "Assistant",
          username: new Date(msg.created_at).toLocaleString(),
          avatar: "/static/images/avatar/1.jpg",
          online: true
        },
        content: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      })),
      messagesFT: sessionMessages.messagesFT.map(msg => ({
        id: msg.id.toString(),
        sender: msg.role === 'user' ? 'You' : {
          name: "Assistant",
          username: new Date(msg.created_at).toLocaleString(),
          avatar: "/static/images/avatar/1.jpg",
          online: true
        },
        content: msg.content,
        timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        canvasMode: msg.canvasMode || false
      }))
    };
  });
};

export const updateSession = async (sessionId: string, updates: Partial<Session>): Promise<Session> => {
  const now = new Date().toISOString().replace('Z', '+00:00');
  const { data, error } = await supabase
    .from('sessions')
    .update({
      ...updates,
      updated_at: now
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  const now = new Date().toISOString().replace('Z', '+00:00');
  const { error } = await supabase
    .from('sessions')
    .update({
      is_archived: true,
      updated_at: now
    })
    .eq('id', sessionId);

  if (error) throw error;
};

export const sessionToChatProps = (session: Session): ChatProps => {
  return {
    id: session.id,
    sender: {
      name: session.label,
      username: new Date(session.created_at).toLocaleString(),
      avatar: "/static/images/avatar/5.jpg",
      online: false,
    },
    messages: session.messages || [],
    messagesFT: session.messagesFT || [],
    editorContent: session.editor_draft || '',
  };
};

export const chatPropsToSessionData = (chat: ChatProps): Partial<Session> => {
  return {
    label: chat.sender.name,
    editor_draft: chat.editorContent || '',
    messages: chat.messages,
    messagesFT: chat.messagesFT
  };
};
