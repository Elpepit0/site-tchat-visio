import AvatarUpload from '../../../components/avatarChanger';
import '../../../index.css'

interface User {
  username: string;
  connected_at: string;
  avatar_url?: string;
}

interface ChatSidebarProps {
  pseudo: string | null;
  uniqueUsers: User[];
  handleLogout: () => void;
  setSidebarOpen: (open: boolean) => void;
  onSelectPrivateChat: (username: string) => void;
  sidebarOpen: boolean;
}

function ChatSidebar({ pseudo, uniqueUsers, handleLogout, setSidebarOpen, onSelectPrivateChat, sidebarOpen }: ChatSidebarProps) {
  return (
    <aside
      className={`
        fixed z-40 top-0 left-0 h-full w-72 bg-[#2f3136] flex flex-col border-r border-[#23272a] transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} /* This will be controlled by a prop */
        md:static md:translate-x-0 md:w-64 md:z-0
      `}
      style={{ maxWidth: "90vw" }}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 border-b border-[#23272a]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-indigo-400 text-center w-full">Mon avatar</h3>
            <button
              className="md:hidden text-gray-400 hover:text-red-500 transition"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fermer le menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <AvatarUpload
          />
        </div>
        <div className="px-4 py-4">
          <h2 className="text-gray-400 text-xs font-bold uppercase mb-2">En ligne</h2>
          <ul className="space-y-2">
            {uniqueUsers.map((user) => (
              <li key={user.username} className="flex items-center gap-2 group">
                <img
                  src={user.avatar_url || '/default-avatar.jpg'}
                  alt="avatar"
                  className="w-7 h-7 rounded-full border"
                />
                <span className="relative flex w-3 h-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-white text-sm">{user.username}</span>
                {user.username !== pseudo && (
                  <button
                    onClick={() => onSelectPrivateChat(user.username)}
                    className={` ${sidebarOpen ? 'ml-auto text-gray-400 hover:text-indigo-400 opacity-100 transition-opacity' : 'ml-auto text-gray-400 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity'}`}
                    title="Démarrer un message privé"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.547 12.456 2 10.74 2 9c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9a1 1 0 100-2 1 1 0 000 2zm7-2a1 1 0 10-2 0 1 1 0 002 0zm-7 4a1 1 0 100-2 1 1 0 000 2zm7-2a1 1 0 10-2 0 1 1 0 002 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="p-4 border-t border-[#23272a] flex items-center gap-2">
        <img
          src={uniqueUsers.find(u => u.username === pseudo)?.avatar_url || '/default-avatar.jpg'}
          alt="avatar"
          className="w-8 h-8 rounded-full border"
        />
        <span className="text-white font-semibold">{pseudo}</span>
        <button
          onClick={handleLogout}
          className="ml-auto text-gray-400 hover:text-red-500 transition"
          title="Déconnexion"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

export default ChatSidebar;