import { supabase } from '../lib/supabase';
import { ChatProps } from '../components/types';

export interface Session {
  id: string;
  user_id: string;
  label: string;
  created_at: string;
  updated_at: string;
  editorContent: string;
  is_archived: boolean;
  // chatMessages: any[];
  // ftChatMessages: any[];
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
        is_archived: false,
        // chatMessages: [],
        // ftChatMessages: []
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getSessions = async (): Promise<Session[]> => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(session => ({
    ...session,
    chatMessages: session.chatMessages || [],
    ftChatMessages: session.ftChatMessages || []
  }));
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
    title: session.label,
    // messages: session.chatMessages || [],
    // messagesFT: session.ftChatMessages || [],
    editorContent: session.editor_draft || '',
    sender: {
      name: session.label,
      username: new Date(session.created_at).toLocaleString(),
      avatar: "/static/images/avatar/5.jpg",
      online: false,
    }
  };
};

export const chatPropsToSessionData = (chat: ChatProps): Partial<Session> => {
  return {
    label: chat.title,
    editor_draft: chat.editorContent,
    chatMessages: chat.messages,
    ftChatMessages: chat.messagesFT
  };
};
