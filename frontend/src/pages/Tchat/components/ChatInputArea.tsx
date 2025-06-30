import EmojiInput from '../../../components/emojiinput';
import '../../../index.css'

interface ChatInputAreaProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendMessage: (recipient: string | null) => void; // Modified to accept recipient
  onTyping: () => void;
  privateChatRecipient: string | null; // Added privateChatRecipient
}

function ChatInputArea({ newMessage, setNewMessage, sendMessage, onTyping, privateChatRecipient }: ChatInputAreaProps) {
  return (
    <footer className="px-2 sm:px-6 py-3 border-t border-[#23272a] bg-[#36393f] flex items-center gap-2 sm:gap-3">
      <EmojiInput
        value={newMessage}
        onChange={setNewMessage}
        onEnter={() => sendMessage(privateChatRecipient)}
        onTyping={onTyping}
      />
      <button
        onClick={() => sendMessage(privateChatRecipient)}
        className="bg-indigo-600 text-white px-4 sm:px-5 py-2 sm:py-3 rounded-lg hover:bg-indigo-700 transition font-semibold text-sm"
      >
        Envoyer
      </button>
    </footer>
  );
}

export default ChatInputArea;