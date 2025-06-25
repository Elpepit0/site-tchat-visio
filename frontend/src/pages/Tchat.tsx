import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import AvatarChanger from '../components/avatarChanger';
import EmojiInput from '../components/emojiinput';
import data from "@emoji-mart/data";

interface Message {
  id: string;
  pseudo: string;
  text: string;
}

interface User {
  username: string;
  connected_at: string;
  avatar_url?: string; // <-- Ajout
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(true);
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);
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
    });
    socketRef.current = socket;

    // Écouteurs d'événements
    socket.on('messages', (msgs: Message[]) => {
      console.log("Messages initiaux reçus :", msgs.length);
      msgs.forEach((msg) => {
        console.log("Message from", msg.id);
      });
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
      console.log(`[Socket] New connection: ${socket.id}`);
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

    socket.on('typing', (username: string) => {
      setTypingUser(username);
      setTimeout(() => {
        setTypingUser(null);
      }, 3000); // Effacer l'indicateur de saisie après 3 secondes
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
        socketRef.current.off('typing');
        
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
    const textWithEmojis = replaceEmojis(newMessage.trim());
    socketRef.current.emit('send_message', { text: textWithEmojis });
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

  // Ajoute cette fonction dans ton composant
  const refreshUsers = () => {
    if (socketRef.current) {
      socketRef.current.emit('get_user_list');
    }
  };

  useEffect(() => {
    if (!socketRef.current) return;

    const handler = (data: { pseudo: string }) => {
      if (data.pseudo !== pseudo) {
        setTypingUser(data.pseudo);
        setTimeout(() => setTypingUser(null), 5000);
      }
    };

    socketRef.current.on('user_typing', handler);

    return () => {
      socketRef.current?.off('user_typing', handler);
    };
  }, [pseudo]);

  // Fonction de remplacement custom :
  function replaceEmojis(text: string) {
    return text.replace(/:([a-zA-Z0-9_+-]+):/g, (match, code) => {
      const q = code.toLowerCase();
      // @ts-ignore
      const emojis = Object.values(data.emojis) as any[];

      // 1. Cherche un id exact
      const exact = emojis.find(e => e.id === q);
      if (exact) {
        return exact.skins ? exact.skins[0].native : exact.native || match;
      }

      // 2. Sinon, cherche dans les mots-clés (en contient)
      const keyword = emojis.find(e =>
        e.keywords && e.keywords.some((k: string) => k === q)
      );
      if (keyword) {
        return keyword.skins ? keyword.skins[0].native : keyword.native || match;
      }

      // 3. Sinon, ne remplace pas
      return match;
    });
  }

  if (loading) return <div>Chargement...</div>;
  if (!pseudo) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200 p-4 md:p-8 gap-4 md:gap-8">

      {/* Sidebar utilisateurs */}
      <aside className="w-full md:w-64 bg-white rounded-2xl shadow-lg p-4 md:p-6 flex flex-col">
        {/* Bloc avatar séparé */}
        <div className="mb-6 pb-6 border-b border-indigo-200">
          <h3 className="text-lg font-semibold text-indigo-600 mb-3 text-center">Mon avatar</h3>
          <AvatarChanger
            currentAvatar={uniqueUsers.find(u => u.username === pseudo)?.avatar_url}
            onAvatarChange={refreshUsers}
          />
        </div>

        {/* Liste des utilisateurs */}
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
                <img
                  src={user.avatar_url || '/default-avatar.jpg'}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border"
                />
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
                className="flex items-center gap-1 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition font-semibold text-sm md:text-base"
                title="Se déconnecter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                </svg>
                Déconnexion
              </button>
              <button
                onClick={() => {
                  setMessages([]);
                  if (socketRef.current)
                    socketRef.current.emit('delete_message', { id: "all" });
                }}
                className="flex items-center gap-1 bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200 transition font-semibold text-sm md:text-base"
                title="Vider le chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Corbeille
              </button>
              <button
                onClick={() => navigate('/video')}
                className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold text-sm md:text-base"
                title="Accéder à la visio"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A2 2 0 0122 9.618v4.764a2 2 0 01-2.447 1.894L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                </svg>
                Visio
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition font-semibold text-sm md:text-base"
                title="Retour à l'accueil"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
                </svg>
                Accueil
              </button>
            </div>
            </header>

          {!connected && (
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 mb-4 rounded-lg text-center font-medium text-sm">
              Connexion perdue, tentative de reconnexion...
            </div>
          )}

          <section
            className="flex-grow overflow-y-auto rounded-lg bg-gray-50 border border-gray-200 p-4 mb-6"
            style={{ maxHeight: '75vh' }} // Ajoute cette ligne pour limiter la hauteur
          >
            {messages.length === 0 ? (
              <p className="text-gray-500 italic">Aucun message pour le moment</p>
            ) : (
              messages.map(({ id, pseudo: user, text }) => {
                const userObj = uniqueUsers.find(u => u.username === user);
                return (
                  <div key={id} className="mb-3 flex items-center gap-3">
                    <img
                      src={userObj?.avatar_url || '/default-avatar.jpg'}
                      alt="avatar"
                      className="w-8 h-8 rounded-full border"
                    />
                    <div>
                      <span className="font-semibold text-indigo-600">{user}</span>{' '}
                      <span className="text-gray-800">{replaceEmojis(text)}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </section>

          {typingUser && (
            <div className="text-sm text-gray-500 italic mb-2">
              {typingUser} est en train d’écrire...
            </div>
          )}

          <footer className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <EmojiInput
              value={newMessage}
              onChange={setNewMessage}
              onEnter={sendMessage}
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