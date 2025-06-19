import { useVideoChat } from '../hooks/useVideoChat';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function VideoChat() {
  const roomId = 'default-room'; // à rendre dynamique si besoin
  const navigate = useNavigate();

  const {
    startCall,
    endCall,
    localVideoRef,
    remoteVideoRef,
    inCall,
    connected,
  } = useVideoChat(roomId);

  const [pseudo, setPseudo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Vérifie l'utilisateur connecté
  useEffect(() => {
    fetch('http://localhost:5000/me', { credentials: 'include' })
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

  const handleLogout = async () => {
    await fetch('http://localhost:5000/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setPseudo(null);
    navigate('/');
  };

  if (loading) {
    return <div>Chargement en cours...</div>;
  }

  if (!pseudo) {
    return null;
  }

  if (!connected) {
    return (
      <div className="text-red-600 text-center p-4">
        Déconnecté du serveur de signalement
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-10 min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 py-16 px-4">
      <div className="flex justify-between items-center mb-8 px-25 max-w-5xl mx-auto w-full">
        <h1 className="text-4xl font-extrabold text-indigo-700 drop-shadow-md">Visio</h1>

        <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleLogout}
              className="text-red-500 px-4 py-2  hover:text-red-700 transition"
            >
              Déconnexion
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Accéder au tchat
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Retour à l'accueil
            </button>
          </div>
      </div>

      <div className="flex space-x-10">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          className="w-96 h-72 rounded-3xl border border-gray-300 shadow-lg transition-transform duration-300 ease-in-out hover:scale-[1.05] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-indigo-400"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-90 h-72 rounded-3xl border border-gray-300 shadow-lg transition-transform duration-300 ease-in-out hover:scale-[1.05] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-indigo-400"
        />
      </div>

      <div>
        {!inCall ? (
          <button
            onClick={startCall}
            className="bg-green-600 text-white px-12 py-4 rounded-2xl font-semibold hover:bg-green-700 shadow-md transition"
          >
            Démarrer l'appel
          </button>
        ) : (
          <button
            onClick={endCall}
            className="bg-red-600 text-white px-12 py-4 rounded-2xl font-semibold hover:bg-red-700 shadow-md transition"
          >
            Terminer l'appel
          </button>
        )}
      </div>
    </div>
  );
}
