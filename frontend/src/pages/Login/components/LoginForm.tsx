import '../../../index.css';
import { useState } from 'react';

interface LoginFormProps {
  onLoginSuccess: (username: string) => void;
  onLoginError: (error: string) => void;
}

/**
 * LoginForm component for user authentication.
 * All authentication logic, including username/password validation and rate limiting,
 * should be handled securely on the backend.
 */
function LoginForm({ onLoginSuccess, onLoginError }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      onLoginSuccess(data.username);
    } else {
      onLoginError(data.error || 'Erreur de connexion');
    }
  };

  return (
    <div className="space-y-5">
      <input
        className="w-full border border-[#36393f] bg-[#40444b] text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
        placeholder="Nom d'utilisateur"
        value={username}
        onChange={(e) => {
          setUsername(e.target.value);
          onLoginError(''); // Clear error on typing
        }}
        autoFocus
      />
      <input
        className="w-full border border-[#36393f] bg-[#40444b] text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
        placeholder="Mot de passe"
        type="password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          onLoginError(''); // Clear error on typing
        }}
      />
      <button
        onClick={handleLogin}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition"
        aria-label="Se connecter"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
        </svg>
        Se connecter
      </button>
    </div>
  );
}

export default LoginForm;