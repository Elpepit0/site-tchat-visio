import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import '../../../index.css'
import { useRef, useState, useEffect } from 'react';

interface ChatMessageProps {
  message: {
    id: string;
    pseudo: string;
    texts: string[];
    reactions?: { [emoji: string]: string[] };
  };
  pseudo: string | null;
  avatarUrl: string;
  handleReact: (messageId: string, emoji: string) => void;
  setReactingTo: (id: string | null) => void;
  reactingTo: string | null;
  isMobile: boolean;
  handleTouchStart: (id: string) => void;
  handleTouchEnd: () => void;
  replaceEmojis: (text: string) => string;
}

interface EmojiMartData {
  native: string;
}

function ChatMessage({
  message,
  pseudo,
  avatarUrl,
  handleReact,
  setReactingTo,
  reactingTo,
  isMobile,
  handleTouchStart,
  handleTouchEnd,
  replaceEmojis,
}: ChatMessageProps) {
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [pickerClasses, setPickerClasses] = useState('absolute z-40 opacity-0 transition-opacity duration-150');

  const PICKER_HEIGHT = 435; // Approximate height of the picker
  const PICKER_WIDTH = 352;  // Approximate width of the picker

  useEffect(() => {
    if (reactingTo === message.id && messageContainerRef.current) {
      const rect = messageContainerRef.current.getBoundingClientRect();
      
      let verticalClass = 'top-full mt-2';
      // Check if there's enough space below, but more space above
      if ((window.innerHeight - rect.bottom) < PICKER_HEIGHT && rect.top > PICKER_HEIGHT) {
        verticalClass = 'bottom-full mb-2';
      }

      let horizontalClass = 'left-1/2 -translate-x-1/2';
      const pickerHalfWidth = PICKER_WIDTH / 2;
      const containerCenter = rect.left + rect.width / 2;

      // Check for horizontal overflow
      if (containerCenter - pickerHalfWidth < 0) {
        horizontalClass = 'left-0';
      } else if (containerCenter + pickerHalfWidth > window.innerWidth) {
        horizontalClass = 'right-0';
      }

      // Use a timeout to allow the DOM to update and apply transition
      setTimeout(() => setPickerClasses(`absolute z-40 ${verticalClass} ${horizontalClass} opacity-100`), 0);
    } else {
      setPickerClasses('absolute z-40 opacity-0 transition-opacity duration-150');
    }
  }, [reactingTo, message.id]);

  return (
    <div
      ref={messageContainerRef}
      key={message.id}
      className="flex items-start gap-2 sm:gap-4 group relative"
      onTouchStart={isMobile ? () => handleTouchStart(message.id) : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      <img
        src={avatarUrl}
        alt="avatar"
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border mt-1"
      />
      <div className="flex-1 min-w-0">
        <div className="bg-[#40444b] rounded-lg px-3 py-2 sm:px-4 sm:py-3 shadow-sm border border-[#23272a] relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-indigo-200 text-sm sm:text-base">{message.pseudo}</span>
          </div>
          {message.texts.map((text, i) => (
            <div
              key={i}
              className="text-gray-100 break-words whitespace-pre-wrap text-sm sm:text-base"
              style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
            >
              {replaceEmojis(text)}
            </div>
          ))}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
              {Object.entries(message.reactions).map(([emoji, users]) => (
                <button
                  key={emoji}
                  className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full shadow border text-base font-medium transition-all duration-100
                    ${
                      users.includes(pseudo!)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-[#36393f] text-gray-200 border-[#23272a] hover:bg-indigo-700 hover:text-white"
                    }`}
                  onClick={() => handleReact(message.id, emoji)}
                  title={users.join(", ")}
                >
                  <span className="text-lg sm:text-xl">{emoji}</span>
                  <span className="text-xs">{users.length}</span>
                </button>
              ))}
            </div>
          )}
          {reactingTo === message.id && (
            <>
              {/* Overlay to close picker on click outside */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setReactingTo(null)}
              ></div>
              <div 
                className={pickerClasses}
                onClick={(e) => e.stopPropagation()}
              >
                <Picker
                  data={data}
                  onEmojiSelect={(emoji: EmojiMartData) => handleReact(message.id, emoji.native)}
                  previewPosition="none"
                  skinTonePosition="none"
                  theme="dark"
                />
              </div>
            </>
          )}
          {!isMobile && (
            <button
              className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#36393f] border border-[#23272a] rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-indigo-700 hover:text-white text-indigo-400"
              onClick={() => setReactingTo(reactingTo === message.id ? null : message.id)}
              title="Ajouter une réaction"
            >
              <span className="text-xl font-bold">+</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
