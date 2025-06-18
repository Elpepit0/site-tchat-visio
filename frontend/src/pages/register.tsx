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
    return; // Arrête la fonction si invalide
  }

  const res = await fetch('http://localhost:5000/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('username', username);
    navigate('/chat');
  } else {
    setError(data.error);
  }
};


  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 via-white to-green-200">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-600">Inscription</h1>

        <div className="space-y-4">
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleRegister}
            className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition"
          >
            S'inscrire
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-center mt-4">{error}</p>
        )}

        <p className="text-center mt-6 text-gray-600">
          Déjà un compte ?{' '}
          <a href="/" className="text-green-500 hover:underline">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;
