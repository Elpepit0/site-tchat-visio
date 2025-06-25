import { useVideoChat } from '../hooks/useVideoChat';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Composant principal de la page d'appel vidéo
export default function VideoChat() {
  const roomId = 'default-room'; // À rendre dynamique si besoin
  const navigate = useNavigate();

  // Utilisation de ton hook personnalisé pour la visio
  const {
    localVideoRef,
    remoteVideoRef,
    startCall,
    endCall,
    inCall,
    connected,
  } = useVideoChat(roomId);

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

  if (loading) return <div>Chargement en cours...</div>;

  if (!pseudo) return null;

  if (!connected) {
    return (
      <div className="text-red-600 text-center p-4">
        Déconnecté du serveur de signalement
      </div>
    );
  }

  return (
   <div className="flex flex-col items-center space-y-8 sm:space-y-10 min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 py-10 sm:py-16 px-4">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 sm:mb-8 max-w-5xl mx-auto w-full px-2 sm:px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-indigo-700 drop-shadow-md text-center md:text-left">
          Visio
        </h1>
        <div className="flex flex-wrap justify-center md:justify-end gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition font-semibold text-sm sm:text-base"
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
    className="flex items-center gap-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition font-semibold text-sm sm:text-base"
    title="Retour à l'accueil"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
    </svg>
    Accueil
  </button>
</div>
      </div>

      {/* Vidéos */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-4xl px-2 sm:px-0">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          className="w-full sm:w-[90%] md:w-1/2 h-56 sm:h-64 rounded-3xl border border-gray-300 shadow-lg"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full sm:w-[90%] md:w-1/2 h-56 sm:h-64 rounded-3xl border border-gray-300 shadow-lg"
        />
      </div>

      {/* Boutons d'appel */}
      <div className="pt-4">
        {!inCall ? (
          <button
            onClick={startCall}
            className="bg-green-600 text-white px-6 sm:px-10 py-3 sm:py-4 text-sm sm:text-base rounded-2xl font-semibold hover:bg-green-700 shadow-md transition"
          >
            Démarrer l'appel
          </button>
        ) : (
          <button
            onClick={endCall}
            className="bg-red-600 text-white px-6 sm:px-10 py-3 sm:py-4 text-sm sm:text-base rounded-2xl font-semibold hover:bg-red-700 shadow-md transition"
          >
            Terminer l'appel
          </button>
        )}
      </div>
    </div>

  );
}
