import ChatMessage from './ChatMessage';
import React from 'react';
import '../../../index.css'


interface User {
  username: string;
  connected_at: string;
  avatar_url?: string;
}

interface MessageListProps {
  groupedMessages: {
    id: string;
    pseudo: string;
    texts: string[];
    reactions?: { [emoji: string]: string[] };
    recipient?: string; // Add recipient field
  }[];
  pseudo: string | null;
  uniqueUsers: User[];
  avatarCache: { [username: string]: string };
  handleReact: (messageId: string, emoji: string) => void;
  setReactingTo: (id: string | null) => void;
  reactingTo: string | null;
  isMobile: boolean;
  handleTouchStart: (id: string) => void;
  handleTouchEnd: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  replaceEmojis: (text: string) => string;
  privateChatRecipient: string | null; // Add privateChatRecipient
}

function MessageList({
  groupedMessages,
  pseudo,
  uniqueUsers,
  avatarCache,
  handleReact,
  setReactingTo,
  reactingTo,
  isMobile,
  handleTouchStart,
  handleTouchEnd,
  messagesEndRef,
  replaceEmojis,
  privateChatRecipient,
}: MessageListProps) {
  const filteredMessages = groupedMessages.filter(msg => {
    if (!privateChatRecipient) {
      return !msg.recipient; // Public messages
    } else {
      // Private messages between pseudo and privateChatRecipient
      const isSender = msg.pseudo === pseudo && msg.recipient === privateChatRecipient;
      const isReceiver = msg.pseudo === privateChatRecipient && msg.recipient === pseudo;
      return isSender || isReceiver;
    }
  });

  return (
    <section className="flex-1 overflow-y-auto px-2 sm:px-6 py-2 sm:py-4 space-y-4 sm:space-y-6">
      {filteredMessages.length === 0 ? (
        <p className="text-gray-400 italic">Aucun message pour le moment</p>
      ) : (
        filteredMessages.map((message) => {
          const userObj = uniqueUsers.find(u => u.username === message.pseudo);
          const avatarUrl = userObj?.avatar_url || avatarCache[message.pseudo] || '/default-avatar.jpg';
          return (
            <ChatMessage
              key={message.id}
              message={message}
              pseudo={pseudo}
              avatarUrl={avatarUrl}
              handleReact={handleReact}
              setReactingTo={setReactingTo}
              reactingTo={reactingTo}
              isMobile={isMobile}
              handleTouchStart={handleTouchStart}
              handleTouchEnd={handleTouchEnd}
              replaceEmojis={replaceEmojis}
            />
          );
        })
      )}
      <div ref={messagesEndRef} />
    </section>
  );
}

export default MessageList;