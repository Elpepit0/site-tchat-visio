import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import AvatarChanger from '../components/avatarChanger';
import EmojiInput from '../components/emojiinput';
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

interface Message {
  id: string;
  pseudo: string;
  text: string;
  reactions?: { [emoji: string]: string[] };
}

interface User {
  username: string;
  connected_at: string;
  avatar_url?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(true);
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [reactingTo, setReactingTo] = useState<string | null>(null);
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
    if (!pseudo) return;

    if (socketRef.current && socketRef.current.connected) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const socket = io(`${protocol}://${host}`, {
      transports: ['websocket'],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('messages', (msgs: Message[]) => {
      setMessages(msgs.slice(-100));
    });

    socket.on('new_message', (message: Message) => {
      setMessages(prev => [...prev.slice(-99), message]);
    });

    socket.on('connect', () => {
      setConnected(true);
      if (pseudo) {
        socket.emit('set_username', pseudo);
      }
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('user_list', (userList: User[]) => setOnlineUsers(userList));
    socket.on('typing', (username: string) => {
      setTypingUser(username);
      setTimeout(() => setTypingUser(null), 3000);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [pseudo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim() === '' || !socketRef.current || !socketRef.current.connected) return;
    const textWithEmojis = replaceEmojis(newMessage.trim());
    socketRef.current.emit('send_message', { text: textWithEmojis });
    setNewMessage('');
  };

  const handleLogout = () => {
    fetch('/logout', {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      setPseudo(null);
      setMessages([]);
      setOnlineUsers([]);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      navigate('/');
    });
  };

  // Rafraîchir la liste des utilisateurs (utilisé par AvatarChanger)
  const refreshUsers = () => {
    if (socketRef.current) {
      socketRef.current.emit('get_user_list');
    }
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (socketRef.current) {
      socketRef.current.emit('react_message', { messageId, emoji });
    }
    setReactingTo(null);
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

  function replaceEmojis(text: string) {
    return text.replace(/:([a-zA-Z0-9_+-]+):/g, (match, code) => {
      const q = code.toLowerCase();
      // @ts-ignore
      const emojis = Object.values(data.emojis) as any[];
      const exact = emojis.find(e => e.id === q);
      if (exact) {
        return exact.skins ? exact.skins[0].native : exact.native || match;
      }
      const keyword = emojis.find(e =>
        e.keywords && e.keywords.some((k: string) => k === q)
      );
      if (keyword) {
        return keyword.skins ? keyword.skins[0].native : keyword.native || match;
      }
      return match;
    });
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  let touchTimeout: number | null = null;

  const handleTouchStart = (id: string) => {
    touchTimeout = window.setTimeout(() => setReactingTo(id), 500);
  };

  const handleTouchEnd = () => {
    if (touchTimeout) clearTimeout(touchTimeout);
  };

  if (loading) return <div>Chargement...</div>;
  if (!pseudo) return null;

  return (
    <div className="flex h-screen bg-[#23272a]">

      {/* Liste des salons et utilisateurs */}
      <aside className="w-64 bg-[#2f3136] flex flex-col border-r border-[#23272a]">
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 border-b border-[#23272a]">
            <h3 className="text-sm font-semibold text-indigo-400 mb-3 text-center">Mon avatar</h3>
            <AvatarChanger
              currentAvatar={uniqueUsers.find(u => u.username === pseudo)?.avatar_url}
              onAvatarChange={refreshUsers}
            />
          </div>
          <div className="px-4 py-6">
            <h2 className="text-gray-400 text-xs font-bold uppercase mb-2">Salons</h2>
            <div className="flex flex-col gap-1">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#36393f] text-white font-semibold">
                <span className="text-lg">#</span> Tchat 
              </button>
              {/* Ajoute d'autres salons ici */}
            </div>
          </div>
          <div className="px-4 py-4">
            <h2 className="text-gray-400 text-xs font-bold uppercase mb-2">En ligne</h2>
            <ul className="space-y-2">
              {uniqueUsers.map((user) => (
                <li key={user.username} className="flex items-center gap-2">
                  <img
                    src={user.avatar_url || '/default-avatar.jpg'}
                    alt="avatar"
                    className="w-7 h-7 rounded-full border"
                  />
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-ping" />
                  <span className="text-white text-sm">{user.username}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-4 border-t border-[#23272a] flex items-center gap-2">
          <img
            src={uniqueUsers.find(u => u.username === pseudo)?.avatar_url || '/default-avatar.jpg'}
            alt="avatar"
            className="w-8 h-8 rounded-full border"
          />
          <span className="text-white font-semibold">{pseudo}</span>
          <button
            onClick={handleLogout}
            className="ml-auto text-gray-400 hover:text-red-500 transition"
            title="Déconnexion"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main chat */}
      <main className="flex-1 flex flex-col bg-[#36393f]">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[#23272a] bg-[#36393f]">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-xl">#</span>
            <h1 className="text-white text-xl font-bold">Tchat</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/video')}
              className="text-gray-400 hover:text-indigo-400 transition"
              title="Visio"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A2 2 0 0122 9.618v4.764a2 2 0 01-2.447 1.894L15 14M4 6h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
              </svg>
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-indigo-400 transition"
              title="Accueil"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
              </svg>
            </button>
          </div>
        </header>

        {/* Messages */}
        <section className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.length === 0 ? (
            <p className="text-gray-400 italic">Aucun message pour le moment</p>
          ) : (
            messages.map(({ id, pseudo: user, text, reactions }) => {
              const userObj = uniqueUsers.find(u => u.username === user);
              return (
                <div
                  key={id}
                  className="flex items-start gap-4 group relative"
                  onTouchStart={isMobile ? () => handleTouchStart(id) : undefined}
                  onTouchEnd={isMobile ? handleTouchEnd : undefined}
                >
                  {/* Avatar */}
                  <img
                    src={userObj?.avatar_url || '/default-avatar.jpg'}
                    alt="avatar"
                    className="w-10 h-10 rounded-full border mt-1"
                  />
                  {/* Message + réactions */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-[#40444b] rounded-lg px-4 py-3 shadow-sm border border-[#23272a] relative">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-indigo-200">{user}</span>
                        {/* Tu peux ajouter la date ici */}
                      </div>
                      <div className="text-gray-100 break-words whitespace-pre-wrap text-base">
                        {replaceEmojis(text)}
                      </div>
                      {/* Réactions */}
                      {reactions && Object.keys(reactions).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {Object.entries(reactions).map(([emoji, users]) => (
                            <button
                              key={emoji}
                              className={`flex items-center gap-1 px-3 py-1 rounded-full shadow border text-base font-medium transition-all duration-100
                                ${
                                  users.includes(pseudo!)
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-[#36393f] text-gray-200 border-[#23272a] hover:bg-indigo-700 hover:text-white"
                                }`}
                              onClick={() => handleReact(id, emoji)}
                              title={users.join(", ")}
                            >
                              <span className="text-xl">{emoji}</span>
                              <span className="text-xs">{users.length}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Picker d'emoji pour ajouter une réaction */}
                      {reactingTo === id && (
                        <div className="absolute z-40 left-1/2 -translate-x-1/2 top-full mt-2">
                          <Picker
                            data={data}
                            onEmojiSelect={(emoji: any) => handleReact(id, emoji.native)}
                            previewPosition="none"
                            skinTonePosition="none"
                            theme="dark"
                          />
                        </div>
                      )}
                      {/* + bouton pour ajouter une réaction (desktop seulement) */}
                      {!isMobile && (
                        <button
                          className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#36393f] border border-[#23272a] rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-indigo-700 hover:text-white text-indigo-400"
                          onClick={() => setReactingTo(id)}
                          title="Ajouter une réaction"
                        >
                          <span className="text-xl font-bold">+</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </section>

        {/* Typing */}
        {typingUser && (
          <div className="text-sm text-white italic px-6 pb-2">
            {typingUser} est en train d’écrire...
          </div>
        )}

        {/* Zone de saisie */}
        <footer className="px-6 py-4 border-t border-[#23272a] bg-[#36393f] flex items-center gap-3">
          <EmojiInput
            value={newMessage}
            onChange={setNewMessage}
            onEnter={sendMessage}
            onTyping={() => {
              if (socketRef.current && pseudo) {
                socketRef.current.emit('user_typing', { pseudo });
              }
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
      {!connected && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 mb-4 rounded-lg text-center font-medium text-sm">
          Connexion perdue, tentative de reconnexion...
        </div>
      )}
    </div>
  );
}