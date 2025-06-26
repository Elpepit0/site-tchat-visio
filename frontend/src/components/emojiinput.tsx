import { useState, useRef } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

// Fonction de recherche custom :
function searchEmojis(query: string, max = 6) {
  if (!query) return [];
  const q = query.toLowerCase();
  // @ts-ignore
  return Object.values(data.emojis)
    .filter((emoji: any) =>
      emoji.id.includes(q) ||
      (emoji.keywords && emoji.keywords.some((k: string) => k.includes(q)))
    )
    .slice(0, max);
}

interface EmojiInputProps {
  value: string;
  onChange: (val: string) => void;
  onEnter: () => void;
}

export default function EmojiInput({ value, onChange, onEnter }: EmojiInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [emojiSuggestions, setEmojiSuggestions] = useState<any[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recherche d'emojis pour l'autocomplete
  const getSuggestions = (query: string) => searchEmojis(query, 6);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let text = e.target.value;
    onChange(text);

    // Cherche un :mot en cours de frappe (au moins 1 lettre après :)
    const match = /:([a-zA-Z0-9_+-]{1,})$/.exec(text);
    if (match && match[1].length > 0) {
      const suggestions = getSuggestions(match[1]);
      setEmojiSuggestions(suggestions);
      setSuggestionIndex(0);
    } else {
      setEmojiSuggestions([]);
    }
  };

  // Gestion des flèches et entrée dans l'autocomplete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (emojiSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIndex((i) => (i + 1) % emojiSuggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIndex((i) => (i - 1 + emojiSuggestions.length) % emojiSuggestions.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const suggestion = emojiSuggestions[suggestionIndex];
        if (suggestion) {
          // Remplace le :mot par l'emoji
          const newValue = value.replace(/:([a-zA-Z0-9_+-]{1,})$/, suggestion.skins ? suggestion.skins[0].native : suggestion.native);
          onChange(newValue);
          setEmojiSuggestions([]);
        }
      } else if (e.key === "Escape") {
        setEmojiSuggestions([]);
      }
    } else if (e.key === "Enter") {
      onEnter();
    }
  };

  // Gestion du clic sur une suggestion
  const handleSuggestionClick = (i: number) => {
    const emoji = emojiSuggestions[i];
    const newValue = value.replace(/:([a-zA-Z0-9_+-]{1,})$/, emoji.skins ? emoji.skins[0].native : emoji.native);
    onChange(newValue);
    setEmojiSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Écris ton message... (utilise :smile: ou clique sur 😃)"
        className="flex-grow border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
        autoComplete="off"
      />
      <button
        type="button"
        className="ml-2"
        onClick={() => setShowPicker(v => !v)}
        tabIndex={-1}
        title="Ajouter un emoji"
      >
        😃
      </button>
      {showPicker && (
        <div className="absolute bottom-12 right-0 z-10">
          <Picker
            data={data}
            onEmojiSelect={(emoji: any) => {
              onChange(value + (emoji.native || emoji.emoji));
              setShowPicker(false);
              inputRef.current?.focus();
            }}
            previewPosition="none"
            skinTonePosition="none"
          />
        </div>
      )}
      {/* Menu déroulant d'autocomplete */}
      {emojiSuggestions.length > 0 && (
        <ul
          className="absolute left-0 bottom-14 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-30 max-h-72 overflow-auto animate-fade-in"
          style={{ minWidth: "18rem" }}
          role="listbox"
        >
          {emojiSuggestions.map((emoji, i) => (
            <li
              key={emoji.id}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors duration-100 ${
                i === suggestionIndex
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-indigo-50"
              }`}
              onMouseDown={e => {
                e.preventDefault();
                handleSuggestionClick(i);
              }}
              onMouseEnter={() => setSuggestionIndex(i)}
              role="option"
              aria-selected={i === suggestionIndex}
              tabIndex={-1}
            >
              <span className="text-3xl">{emoji.skins ? emoji.skins[0].native : emoji.native}</span>
              <div className="flex flex-col">
                <span className="font-semibold text-base">
                  :{emoji.id}:
                </span>
                {emoji.keywords && (
                  <span className="text-xs text-gray-400">
                    {emoji.keywords.slice(0, 3).join(", ")}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
