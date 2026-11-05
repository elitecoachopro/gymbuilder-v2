export interface ChatMessage {
  id: string;
  sender_type: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export function mergeChatMessages(previous: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map(previous.map(message => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  const merged = [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const unchanged = merged.length === previous.length && merged.every((message, index) => {
    const old = previous[index];
    return message.id === old.id && message.content === old.content && message.created_at === old.created_at
      && message.sender_type === old.sender_type && message.sender_name === old.sender_name;
  });
  return unchanged ? previous : merged;
}
