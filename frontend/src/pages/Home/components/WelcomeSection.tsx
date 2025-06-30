import { motion } from 'framer-motion';
import ActiveVisitorsIndicator from './ActiveVisitorsIndicator';
import '../../../index.css';

interface WelcomeSectionProps {
  pseudo: string | null;
  navigate: (path: string) => void;
  handleLogout: () => void;
  activeVisitors: number;
}

function WelcomeSection({ pseudo, navigate, handleLogout, activeVisitors }: WelcomeSectionProps) {
  return (
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
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-red-500 text-red-400 font-semibold hover:bg-red-900/20 hover:shadow-sm transition-all duration-200"
              title="Déconnexion"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
              </svg>
              Déconnexion
            </button>
            <ActiveVisitorsIndicator activeVisitors={activeVisitors} />
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
            <ActiveVisitorsIndicator activeVisitors={activeVisitors} />
          </>
        )}
      </div>
    </motion.div>
  );
}

export default WelcomeSection;