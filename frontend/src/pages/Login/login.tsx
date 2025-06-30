import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import RegisterPrompt from './components/RegisterPrompt';
import '../../index.css';

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLoginSuccess = (username: string) => {
    localStorage.setItem('username', username);
    navigate('/');
  };

  const handleLoginError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#23272a]">
      <div className="w-full max-w-md bg-[#2f3136] shadow-2xl rounded-2xl p-8 border border-[#23272a]">
        <h1 className="text-3xl font-extrabold text-center mb-8 text-indigo-400 drop-shadow">Connexion</h1>

        <LoginForm onLoginSuccess={handleLoginSuccess} onLoginError={handleLoginError} />

        {error && (
          <p className="text-red-400 text-center mt-5">{error}</p>
        )}

        <RegisterPrompt />
      </div>
    </div>
  );
}

export default Login;
