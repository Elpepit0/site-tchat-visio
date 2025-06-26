import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    // Vérifie que le mot de passe respecte les critères
    const passwordIsValid = /^(?=.*[A-Z]).{5,}$/.test(password);

    if (!passwordIsValid) {
      setError("Le mot de passe doit contenir au moins 5 caractères et une majuscule.");
      return;
    }

    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('username', username);
      navigate('/chat');
    } else {
      setError(data.error || "Erreur lors de l'inscription");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#23272a]">
      <div className="w-full max-w-md bg-[#2f3136] shadow-2xl rounded-2xl p-8 border border-[#23272a]">
        <h1 className="text-3xl font-extrabold text-center mb-8 text-indigo-400 drop-shadow">Inscription</h1>

        <div className="space-y-5">
          <input
            className="w-full border border-[#36393f] bg-[#40444b] text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <input
            className="w-full border border-[#36393f] bg-[#40444b] text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
            placeholder="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleRegister}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition"
            aria-label="S'inscrire"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            S'inscrire
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-center mt-5">{error}</p>
        )}

        <p className="text-center mt-8 text-gray-400">
          Déjà un compte ?{' '}
          <a
            href="/login"
            className="inline-flex items-center gap-1 text-indigo-400 hover:underline hover:text-indigo-300 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
            </svg>
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;
