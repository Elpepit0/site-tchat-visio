import { useState } from 'react';
import '../../../index.css'

interface RegisterFormProps {
  onRegisterSuccess: (username: string) => void;
  onRegisterError: (error: string) => void;
}

/**
 * RegisterForm component for user registration.
 * Frontend validation for password strength is included, but robust password policy enforcement
 * and all security validations (e.g., uniqueness of username, rate limiting) must be handled on the backend.
 */
function RegisterForm({ onRegisterSuccess, onRegisterError }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleRegister = async () => {
    // Vérifie que le mot de passe respecte les critères
    const passwordIsValid = /^(?=.*[A-Z]).{5,}$/.test(password);

    if (!passwordIsValid) {
      setPasswordError("Le mot de passe doit contenir au moins 5 caractères et une majuscule.");
      return;
    } else {
      setPasswordError('');
    }

    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (res.ok) {
      onRegisterSuccess(username);
    } else {
      onRegisterError(data.error || "Erreur lors de l'inscription");
    }
  };

  return (
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
        onChange={(e) => {
          setPassword(e.target.value);
          setPasswordError(''); // Clear password error on typing
        }}
      />
      {passwordError && (
        <p className="text-red-400 text-sm mt-1">{passwordError}</p>
      )}
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
  );
}

export default RegisterForm;