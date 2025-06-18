import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const res = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('username', data.username);
      navigate('/');
    } else {
      setError(data.error || 'Erreur de connexion');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">Connexion</h1>

        <div className="space-y-4">
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Se connecter
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-center mt-4">{error}</p>
        )}

        <p className="text-center mt-6 text-gray-600">
          Pas encore inscrit ?{' '}
          <a href="/register" className="text-blue-500 hover:underline">
            S'inscrire
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
