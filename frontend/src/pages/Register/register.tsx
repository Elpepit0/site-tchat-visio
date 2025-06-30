import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from './components/RegisterForm';
import LoginPrompt from './components/LoginPrompt';
import '../../index.css';

function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleRegisterSuccess = (username: string) => {
    localStorage.setItem('username', username);
    navigate('/chat');
  };

  const handleRegisterError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#23272a]">
      <div className="w-full max-w-md bg-[#2f3136] shadow-2xl rounded-2xl p-8 border border-[#23272a]">
        <h1 className="text-3xl font-extrabold text-center mb-8 text-indigo-400 drop-shadow">Inscription</h1>

        <RegisterForm onRegisterSuccess={handleRegisterSuccess} onRegisterError={handleRegisterError} />

        {error && (
          <p className="text-red-400 text-center mt-5">{error}</p>
        )}

        <LoginPrompt />
      </div>
    </div>
  );
}

export default Register;
