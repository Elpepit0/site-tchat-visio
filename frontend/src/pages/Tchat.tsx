import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  pseudo: string;
  text: string;
}

interface User {
  username: string;
  connected_at: string; // ou number, selon ce que le serveur renvoie
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(true);
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  const navigate = useNavigate();

  // Récupérer l'utilisateur au montage du composant
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/me', { credentials: 'include' });
        const data = await res.json();
        if (data.username) {
          setPseudo(data.username);
        } else {
          navigate('/');
        }
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [navigate]);

  // Filtrer les utilisateurs uniques pour l'affichage
  const uniqueUsers = Array.from(
    new Map(onlineUsers.map((u) => [u.username, u])).values()
  );

  // Connexion Socket.IO et gestion des événements
  useEffect(() => {
    if (!pseudo) return; // Se connecter uniquement si le pseudo est disponible

    // Empêcher plusieurs instances de socket pour le même montage de composant
    if (socketRef.current && socketRef.current.connected) {
      console.log("Socket déjà connecté, on ne crée pas de nouvelle connexion.");
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const socket = io(`${protocol}://${host}`, {
      transports: ['websocket'],
      withCredentials: true,
      // Ajouter des options de reconnexion pour une meilleure résilience
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });
    socketRef.current = socket;

    // Écouteurs d'événements
    socket.on('messages', (msgs: Message[]) => {
      console.log("Messages initiaux reçus :", msgs.length);
      setMessages(msgs.slice(-100));
    });

    socket.on('new_message', (message: Message) => {
      console.log("Nouveau message reçu :", message.text);
      setMessages(prev => {
        // S'assurer de ne pas dépasser 100 messages et ajouter le nouveau
        const newMsgs = [...prev.slice(-99), message];
        return newMsgs;
      });
    });

    socket.on('connect', async () => {
      console.log("Socket connecté !");
      setConnected(true);
      // Ré-émettre le nom d'utilisateur lors de la reconnexion
      if (pseudo) {
        socket.emit('set_username', pseudo);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log("Socket déconnecté :", reason);
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error("Erreur de connexion Socket :", error);
      setConnected(false);
    });

    socket.on('user_list', (userList: User[]) => {
      console.log("Liste d'utilisateurs reçue :", userList.length);
      setOnlineUsers(userList);
    });

    // Fonction de nettoyage
    return () => {
      console.log("Nettoyage de la connexion socket...");
      if (socketRef.current) {
        socketRef.current.off('messages');
        socketRef.current.off('new_message');
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('user_list');
       
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect(); 
        socketRef.current = null; 
        console.log("Socket nettoyé.");
      }
    };
  }, [pseudo]); 

  // Faire défiler vers le bas lors de nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Gestionnaire d'envoi de message
  const sendMessage = () => {
    if (newMessage.trim() === '' || !socketRef.current || !socketRef.current.connected) {
      console.warn("Impossible d'envoyer le message : vide ou socket non connecté.");
      return;
    }
    socketRef.current.emit('send_message', { text: newMessage.trim() });
    setNewMessage('');
  };

  // Gestionnaire de déconnexion
  const handleLogout = () => {
    fetch('/logout', {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      setPseudo(null);
      // Effacer les états lors de la déconnexion
      setMessages([]);
      setOnlineUsers([]);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      navigate('/');
    });
  };


  if (loading) return <div>Chargement...</div>;
  if (!pseudo) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200 p-4 md:p-8 gap-4 md:gap-8">

      {/* Sidebar utilisateurs */}
      <aside className="w-full md:w-64 bg-white rounded-2xl shadow-lg p-4 md:p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-4 text-indigo-700 border-b border-indigo-200 pb-2">
          Utilisateurs en ligne
        </h2>

        {uniqueUsers.length === 0 ? (
          <p className="text-gray-400 italic">Aucun utilisateur en ligne</p>
        ) : (
          <ul className="flex-grow overflow-auto space-y-3">
            {uniqueUsers.map((user) => (
              <li
                key={user.username}
                className="flex items-center gap-3 text-green-600 font-medium ml-5 hover:text-green-800 transition duration-200 cursor-pointer"
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                {user.username}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-4 border-t border-indigo-200 text-sm text-indigo-400 italic text-center">
          Connectés depuis le chat
        </div>
      </aside>

      {/* Zone de chat */}
      <div className="flex justify-center flex-grow">
        <main className="w-full max-w-4xl bg-white shadow-md rounded-2xl p-4 md:p-6 flex flex-col">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-indigo-700">Tchat en temps réel</h1>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleLogout}
                className="text-red-500 px-3 py-2 hover:text-red-700 transition font-semibold text-sm md:text-base"
              >
                Déconnexion
              </button>
              <button
                onClick={() => navigate('/video')}
                className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold text-sm md:text-base"
              >
                Accéder à la visio
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition font-semibold text-sm md:text-base"
              >
                Retour à l'accueil
              </button>
            </div>
          </header>

          {!connected && (
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 mb-4 rounded-lg text-center font-medium text-sm">
              Connexion perdue, tentative de reconnexion...
            </div>
          )}

          <section className="flex-grow overflow-y-auto rounded-lg bg-gray-50 border border-gray-200 p-4 mb-6">
            {messages.length === 0 ? (
              <p className="text-gray-500 italic">Aucun message pour le moment</p>
            ) : (
              messages.map(({ id, pseudo: user, text }) => (
                <div key={id} className="mb-3">
                  <span className="font-semibold text-indigo-600">{user}:</span>{' '}
                  <span className="text-gray-800">{text}</span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </section>


          <footer className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <input
              type="text"
              placeholder="Écris ton message..."
              className="flex-grow border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendMessage();
              }}
            />
            <button
              onClick={sendMessage}
              className="bg-indigo-600 text-white px-5 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold text-sm"
            >
              Envoyer
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}