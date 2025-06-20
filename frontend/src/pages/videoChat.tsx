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
    <div className="flex flex-col items-center space-y-10 min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 py-16 px-4">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 max-w-5xl mx-auto w-full px-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-700 drop-shadow-md text-center md:text-left">
          Visio
        </h1>
        <div className="flex flex-wrap justify-center md:justify-end gap-2">
          <button onClick={handleLogout} className="text-red-500 px-4 py-2 hover:text-red-700 transition">
            Déconnexion
          </button>
          <button onClick={() => navigate('/chat')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
            Accéder au tchat
          </button>
          <button onClick={() => navigate('/')} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
            Retour à l'accueil
          </button>
        </div>
      </div>

      {/* Vidéos */}
      <div className="flex flex-col md:flex-row items-center gap-6">
        <video ref={localVideoRef} autoPlay playsInline className="w-full md:w-96 h-64 rounded-3xl border border-gray-300 shadow-lg" />
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full md:w-96 h-64 rounded-3xl border border-gray-300 shadow-lg" />
      </div>

      {/* Boutons d'appel */}
      <div>
        {!inCall ? (
          <button onClick={startCall} className="bg-green-600 text-white px-10 py-4 rounded-2xl font-semibold hover:bg-green-700 shadow-md transition">
            Démarrer l'appel
          </button>
        ) : (
          <button onClick={endCall} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-semibold hover:bg-red-700 shadow-md transition">
            Terminer l'appel
          </button>
        )}
      </div>
    </div>
  );
}
