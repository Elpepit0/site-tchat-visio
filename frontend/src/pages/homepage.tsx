import { useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../index.css';







export default function Home() {
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVisitors, setActiveVisitors] = useState(0);
  const navigate = useNavigate();
  
  function fetchActiveVisitors() {
  fetch('http://localhost:5000/active_visitors', {
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
      fetch('http://localhost:5000/ping', { method: 'POST', credentials: 'include' }).catch(() => {});
    }

    sendPing();
    const intervalPing = setInterval(sendPing, 2000);

    return () => clearInterval(intervalPing);
  }, []);


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
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200 flex items-center overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-22">

          {/* Texte d'accueil */}
          <motion.div
            className="w-full md:w-1/2 text-center md:text-left"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6 text-indigo-700">
              {pseudo ? (
                <>Bienvenue, <span className="text-indigo-500">{pseudo}</span></>
              ) : (
                <>Rejoins notre plateforme <br /> de tchat et visio</>
              )}
            </h1>

            <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-xl mx-auto md:mx-0">
              {pseudo
                ? "Choisis ton activité et commence à discuter ou passer des appels vidéos."
                : "Connecte-toi ou crée un compte pour commencer à discuter avec le monde entier."}
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center md:justify-start">
              {pseudo ? (
                <>
                  <button
                    onClick={() => navigate('/chat')}
                    className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-sm hover:shadow-lg hover:bg-indigo-700 transition-all duration-200"
                  >
                    💬 Accéder au Tchat
                  </button>
                  <button
                    onClick={() => navigate('/video')}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:shadow-lg hover:bg-blue-700 transition-all duration-200"
                  >
                    📹 Accéder à la Visio
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 rounded-xl border border-red-500 text-red-600 font-semibold hover:bg-red-50 hover:shadow-sm transition-all duration-200"
                  >
                    🚪 Déconnexion
                  </button>
                  {/* Indicateur de connexion */}
                  <div className="flex items-center space-x-2 mt-4 animate-fade-in w-full sm:w-auto">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <p className="text-sm text-gray-700 font-medium">
                      {activeVisitors} visiteur{activeVisitors > 1 ? 's' : ''} actuellement sur le site
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-sm hover:shadow-lg hover:bg-indigo-700 transition-all duration-200"
                  >
                    🔐 Connexion
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-6 py-3 rounded-xl border border-gray-400 text-gray-700 font-semibold hover:bg-gray-100 hover:shadow-sm transition-all duration-200"
                  >
                    ✍️ Créer un compte
                  </button>
                  {/* Indicateur de connexion */}
                  <div className="flex items-center space-x-2 mt-4 animate-fade-in w-full sm:w-auto">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <p className="text-sm text-gray-700 font-medium">
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
            <div className="absolute -right-6 -bottom-6 w-64 h-64 rounded-full bg-blue-100 -z-10"></div>
            <div className="absolute -left-6 -top-6 w-40 h-40 rounded-full bg-indigo-300/30 -z-10"></div>
          </motion.div>

        </div>
      </div>

      {/* Vague décorative en bas */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
        <div className="relative w-[200%] h-[300px] animate-[waveSlide_10s_linear_infinite] flex">
          {[...Array(2)].map((_, i) => (
            <svg
              key={i}
              className="w-1/2 h-full"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#c7d2fe"
                d="M0,200
                        L60,190
                        C120,180,240,160,360,180
                        C480,200,600,240,720,220
                        C840,200,960,160,1080,180
                        C1200,200,1320,190,1380,200
                        L1440,200
                        V320
                        H0
                        Z"
              />
            </svg>
          ))}
        </div>
      </div>



    </div>

  );
}
