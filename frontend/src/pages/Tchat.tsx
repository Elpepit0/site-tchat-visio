import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import '../index.css';

interface Message {
  id: string;
  pseudo: string;
  text: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(true);
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Récupérer le pseudo connecté via /me (backend doit servir cette route)
  useEffect(() => {
    fetch('http://localhost:5000/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.username) {
          setPseudo(data.username);
        } else {
          navigate('/');
        }
        setLoading(false);
      })
      .catch(() => {
        navigate('/');
      });
  }, [navigate]);

  // Connexion Socket.IO quand pseudo est disponible
  useEffect(() => {
    if (!pseudo) return;

    const socket = io('http://localhost:5000', {
      withCredentials: true,
    });
    socketRef.current = socket;

    const handleMessages = (msgs: Message[]) => setMessages(msgs);
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on('messages', handleMessages);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    
    socket.on('connect_error', () => {
      setConnected(false);
    });

    return () => {
      socket.off('messages', handleMessages);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error');
      socket.disconnect();
    };
  }, [pseudo]);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim() === '' || !socketRef.current) return;
    socketRef.current.emit('send_message', { message: newMessage });
    setNewMessage('');
  };

  const handleLogout = () => {
    fetch('http://localhost:5000/logout', {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      setPseudo(null);
      navigate('/');
    });
  };

  if (loading) {
    return <div>Chargement...</div>;
  }
  if (!pseudo) {
    return null;
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200 py-8 px-4">
      <div className="w-full max-w-3xl bg-white shadow-md rounded-2xl p-6 flex flex-col h-full mt-14">
        <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-indigo-700">Tchat en temps réel</h1>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleLogout}
              className="text-red-500 px-4 py-2  hover:text-red-700 transition"
            >
              Déconnexion
            </button>
            <button
              onClick={() => navigate('/video')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Accéder à la visio
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>


        {!connected && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 mb-4 rounded-lg text-center">
            Connexion perdue, tentative de reconnexion...
          </div>
        )}

        <div className="flex-grow overflow-y-auto rounded-lg bg-gray-50 border border-gray-200 p-4 mb-4 max-h-[60vh]">
          {messages.length === 0 ? (
            <p className="text-gray-500 italic">Aucun message pour le moment</p>
          ) : (
            messages.map(({ id, pseudo: user, text }) => (
              <div key={id} className="mb-2">
                <span className="font-semibold text-indigo-600">{user}:</span>{' '}
                <span className="text-gray-800">{text}</span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Écris ton message..."
            className="flex-grow border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage();
            }}
          />
          <button
            onClick={sendMessage}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
