import '../../../index.css'

interface VideoChatHeaderProps {
  handleLogout: () => void;
  navigate: (path: string) => void;
}

function VideoChatHeader({ handleLogout, navigate }: VideoChatHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center gap-4 px-6 py-4 border-b border-[#23272a] bg-[#36393f]">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-400 drop-shadow-md text-center md:text-left">
        <span className="text-gray-400 mr-2">📹</span>Visio Groupe
      </h1>
      <div className="flex flex-wrap justify-center md:justify-end gap-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-red-500 px-3 py-2 rounded-lg hover:bg-red-900/20 transition font-semibold text-sm sm:text-base"
          title="Se déconnecter"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
          </svg>
          Déconnexion
        </button>
        <button
          onClick={() => navigate('/chat')}
          className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold text-sm sm:text-base"
          title="Accéder au tchat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A2 2 0 0122 9.618v4.764a2 2 0 01-2.447 1.894L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
          </svg>
          Tchat
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 bg-gray-700 text-gray-200 px-3 py-2 rounded-lg hover:bg-gray-600 transition font-semibold text-sm sm:text-base"
          title="Retour à l'accueil"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
          </svg>
          Accueil
        </button>
      </div>
    </header>
  );
}

export default VideoChatHeader;