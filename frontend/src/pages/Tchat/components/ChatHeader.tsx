import '../../../index.css'

interface ChatHeaderProps {
  setSidebarOpen: (open: boolean) => void;
  handleClearChat: () => void;
  handleNavigate: (path: string) => void;
  privateChatRecipient: string | null;
  setPrivateChatRecipient: (recipient: string | null) => void;
  isAdmin: boolean;
}

function ChatHeader({ setSidebarOpen, handleClearChat, handleNavigate, privateChatRecipient, setPrivateChatRecipient, isAdmin }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#23272a] bg-[#36393f]">
      <div className="flex items-center gap-3">
        {/* Burger menu button for mobile */}
        <button
          className="md:hidden text-gray-400 hover:text-indigo-400 transition mr-2"
          onClick={() => setSidebarOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-gray-400 text-xl">#</span>
        <h1 className="text-white text-xl font-bold">
          {privateChatRecipient ? `Discussion privée avec ${privateChatRecipient}` : "Tchat"}
        </h1>
        {privateChatRecipient && (
          <button
            onClick={() => setPrivateChatRecipient(null)}
            className="text-gray-400 hover:text-red-500 transition ml-2"
            title="Quitter la discussion privée"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex gap-2">
        {isAdmin && (
          <>
            <span className='text-red-500 font-bold'>ATTENTION : Cette action est irréversible ! -- Et pour TOUT le monde</span>
            <button
              onClick={handleClearChat}
              className="text-gray-400 hover:text-red-500 transition"
              title="Vider le chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </>
        )}
        
        <button
          onClick={() => handleNavigate('/')}
          className="text-gray-400 hover:text-indigo-400 transition"
          title="Accueil"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default ChatHeader;