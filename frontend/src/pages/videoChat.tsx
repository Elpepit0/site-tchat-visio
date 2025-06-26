import { useGroupVideoChat } from '../hooks/useVideoChat';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Composant principal de la page d'appel vidéo
export default function VideoChat() {
  const roomId = 'default-room'; // À rendre dynamique si besoin
  const navigate = useNavigate();

  // Utilisation de ton hook personnalisé pour la visio
  const {
    localVideoRef,
    peers,
    startCall,
    endCall,
    inCall,
    connected,
  } = useGroupVideoChat(roomId);

  // Authentification
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.username) {
          setPseudo(data.username);
        } else {
          navigate('/');
        }
        setLoading(false);
      })
      .catch(() => {
        navigate('/');
      });
  }, [navigate]);

  // Déconnexion
  const handleLogout = async () => {
    await fetch('/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setPseudo(null);
    navigate('/');
  };

  if (loading) return <div className="text-gray-300 bg-[#23272a] h-screen flex items-center justify-center">Chargement en cours...</div>;

  if (!pseudo) return null;

  if (!connected) {
    return (
      <div className="text-red-600 text-center p-4 bg-[#23272a] min-h-screen flex items-center justify-center">
        Déconnecté du serveur de signalement
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#23272a]">
      {/* Header */}
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

      {/* Vidéos */}
      <main className="flex-1 flex flex-col items-center justify-center px-2 py-8 sm:py-12 bg-[#23272a]">
        <div className="flex flex-wrap gap-6 w-full max-w-5xl justify-center items-center">
          {/* Local video */}
          <div className="flex flex-col items-center">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-40 h-40 sm:w-56 sm:h-56 rounded-3xl border-2 border-indigo-600 shadow-lg bg-black object-cover"
            />
            <span className="mt-2 text-indigo-300 text-xs font-semibold">Moi</span>
          </div>
          {/* Remote videos */}
          {peers.map(peer => (
            <video
              key={peer.peerId}
              ref={el => {
                if (el && peer.stream) el.srcObject = peer.stream;
              }}
              autoPlay
              playsInline
              className="w-40 h-40 sm:w-56 sm:h-56 rounded-3xl border-2 border-[#36393f] shadow-lg bg-black object-cover"
            />
          ))}
        </div>

        {/* Boutons d'appel */}
        <div className="pt-8 flex gap-4">
          {!inCall ? (
            <button
              onClick={startCall}
              className="bg-green-600 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-green-700 shadow-md transition text-base"
            >
              Démarrer l'appel
            </button>
          ) : (
            <button
              onClick={endCall}
              className="bg-red-600 text-white px-8 py-3 rounded-2xl font-semibold hover:bg-red-700 shadow-md transition text-base"
            >
              Terminer l'appel
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
