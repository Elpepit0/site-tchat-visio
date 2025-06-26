import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../index.css';

export default function Home() {
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVisitors, setActiveVisitors] = useState(0);
  const navigate = useNavigate();

  function fetchActiveVisitors() {
    fetch('/active_visitors', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        setActiveVisitors(data.active_visitors);
      })
      .catch(err => console.error('Erreur fetch active visitors:', err));
  }

  useEffect(() => {
    fetchActiveVisitors();
    const interval = setInterval(fetchActiveVisitors, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function sendPing() {
      fetch('/ping', { method: 'POST', credentials: 'include' }).catch(() => {});
    }
    sendPing();
    const intervalPing = setInterval(sendPing, 2000);
    return () => clearInterval(intervalPing);
  }, []);

  useEffect(() => {
    fetch('/me', {
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
    await fetch('/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setPseudo(null);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl bg-[#23272a] text-gray-200">
        Chargement...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#23272a] flex items-center overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-16 md:gap-22">

          {/* Texte d'accueil */}
          <motion.div
            className="w-full md:w-1/2 text-center md:text-left"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6 text-indigo-400">
              {pseudo ? (
                <>Bienvenue, <span className="text-indigo-300">{pseudo}</span></>
              ) : (
                <>Rejoins notre plateforme <br /> de tchat et visio</>
              )}
            </h1>

            <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-xl mx-auto md:mx-0">
              {pseudo
                ? "Choisis ton activité et commence à discuter ou passer des appels vidéos."
                : "Connecte-toi ou crée un compte pour commencer à discuter avec le monde entier."}
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center md:justify-start z-10">
              {pseudo ? (
                <>
                  <button
                    onClick={() => navigate('/chat')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-sm hover:shadow-lg hover:bg-indigo-700 transition-all duration-200"
                    title="Accéder au Tchat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V10a2 2 0 012-2h2m4-4v4m0 0l-2-2m2 2l2-2" />
                    </svg>
                    Accéder au Tchat
                  </button>
                  <button
                    onClick={() => navigate('/video')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:shadow-lg hover:bg-blue-700 transition-all duration-200"
                    title="Accéder à la Visio"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A2 2 0 0122 9.618v4.764a2 2 0 01-2.447 1.894L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                    </svg>
                    Accéder à la Visio
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border border-red-500 text-red-400 font-semibold hover:bg-red-900/20 hover:shadow-sm transition-all duration-200"
                    title="Déconnexion"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                    </svg>
                    Déconnexion
                  </button>
                  {/* Indicateur de connexion */}
                  <div className="flex items-center space-x-2 mt-4 animate-fade-in w-full sm:w-auto">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <p className="text-sm text-gray-300 font-medium">
                      {activeVisitors} visiteur{activeVisitors > 1 ? 's' : ''} actuellement sur le site
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-sm hover:shadow-lg hover:bg-indigo-700 transition-all duration-200"
                    title="Connexion"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
                    </svg>
                    Connexion
                  </button>

                  <button
                    onClick={() => navigate('/register')}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-400 text-gray-200 font-semibold hover:bg-gray-700 hover:shadow-sm transition-all duration-200"
                    title="Créer un compte"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Créer un compte
                  </button>
                  {/* Indicateur de connexion */}
                  <div className="flex items-center space-x-2 mt-4 animate-fade-in w-full sm:w-auto">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <p className="text-sm text-gray-300 font-medium">
                      {activeVisitors} visiteur{activeVisitors > 1 ? 's' : ''} actuellement sur le site
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Image animée */}
          <motion.div
            className="w-full md:w-1/2 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="relative z-10 rounded-xl overflow-hidden shadow-xl transform hover:scale-[1.02] transition duration-300">
              <img
                src="https://static.vecteezy.com/system/resources/previews/005/877/721/non_2x/video-chatting-modern-flat-concept-for-web-banner-design-group-of-friends-communicate-in-online-call-write-messages-remote-employees-confer-online-illustration-with-isolated-people-scene-vector.jpg"
                alt="Chat app UI"
                className="w-full h-auto object-cover rounded-xl"
              />
            </div>
            <div className="absolute -right-6 -bottom-6 w-64 h-64 rounded-full bg-blue-900/20 -z-10"></div>
            <div className="absolute -left-6 -top-6 w-40 h-40 rounded-full bg-indigo-700/20 -z-10"></div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
