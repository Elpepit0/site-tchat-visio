import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

export default function Home() {
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/me', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.username) {
          setPseudo(data.username);
        } else {
          setPseudo(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setPseudo(null);
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('http://localhost:5000/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setPseudo(null);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl">
        Chargement...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200 flex items-center">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-12">
          {/* Texte */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6 text-indigo-700">
              {pseudo ? (
                <>
                  Bienvenue, <span className="text-indigo-500">{pseudo}</span>
                </>
              ) : (
                <>Rejoins notre plateforme <br /> de tchat et visio</>
              )}
            </h1>

            <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-xl mx-auto md:mx-0">
              {pseudo
                ? "Choisis ton activité et commence à discuter ou passer des appels vidéos."
                : "Connecte-toi ou crée un compte pour commencer à discuter avec le monde entier."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              {pseudo ? (
                <>
                  <button
                    onClick={() => navigate('/chat')}
                    className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-md transition"
                  >
                    Accéder au Tchat
                  </button>
                  <button
                    onClick={() => navigate('/video')}
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-md transition"
                  >
                    Accéder à la Visio
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 rounded-lg border border-red-500 text-red-500 font-semibold hover:bg-red-50 transition"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-md transition"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-6 py-3 rounded-lg border border-gray-400 text-gray-700 font-semibold hover:bg-gray-100 transition"
                  >
                    Créer un compte
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Image décorative */}
          <div className="w-full md:w-1/2 relative">
            <div className="relative z-10 rounded-xl overflow-hidden shadow-xl transform hover:scale-[1.02] transition duration-300">
              <img
                src="https://static.vecteezy.com/system/resources/previews/005/877/721/non_2x/video-chatting-modern-flat-concept-for-web-banner-design-group-of-friends-communicate-in-online-call-write-messages-remote-employees-confer-online-illustration-with-isolated-people-scene-vector.jpg"
                alt="Chat app UI"
                className="w-full h-auto object-cover rounded-xl"
              />
            </div>
            <div className="absolute -right-6 -bottom-6 w-64 h-64 rounded-full bg-blue-100 -z-10"></div>
            <div className="absolute -left-6 -top-6 w-40 h-40 rounded-full bg-indigo-300/30 -z-10"></div>
          </div>
        </div>
      </div>
    </div>

  );
}
