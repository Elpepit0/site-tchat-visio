import '../../../index.css'

interface TypingIndicatorProps {
  typingUsers: string[];
}

function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;
  const displayUsers = typingUsers.filter((u: string) => u !== ""); // Filter out empty strings if any 

  if (displayUsers.length === 0) return null;

  return (
    <div className="text-sm text-white italic px-4 sm:px-6 pb-2">
      {displayUsers
        .map((u: string, i: number) => (
          i === displayUsers.length - 1 && i !== 0
            ? `et ${u}`
            : u
        ))
        .join(displayUsers.length > 2 ? ', ' : ' ')}
      {displayUsers.length === 1 ? ' est' : ' sont'} en train d’écrire...
    </div>
  );
}

export default TypingIndicator;