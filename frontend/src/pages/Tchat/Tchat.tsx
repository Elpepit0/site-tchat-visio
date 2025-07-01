import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import ChatSidebar from './components/ChatSidebar';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import TypingIndicator from './components/TypingIndicator';
import ChatInputArea from './components/ChatInputArea';
import data from "@emoji-mart/data";
import '../../index.css';
import Spinner from '../../components/Spinner';

interface Message {
  id: string;
  pseudo: string;
  text: string;
  reactions?: { [emoji: string]: string[] };
  recipient?: string; // Added for private messages
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
  const [typingUsers, setTypingUsers] = useState<Map<string, number>>(new Map<string, number>());
  const [reactingTo, setReactingTo] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [privateChatRecipient, setPrivateChatRecipient] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef: React.RefObject<HTMLDivElement | null> = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [avatarCache, setAvatarCache] = useState<{ [username: string]: string }>({});

  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/me', { credentials: 'include' });
        const data = await res.json();
        if (data.username) {
          setPseudo(data.username);
          setIsAdmin(data.is_admin || false);
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

    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, [navigate]);

  const uniqueUsers = Array.from(
    new Map(onlineUsers.map((u) => [u.username, u])).values()
  );

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
      setMessages(prev => {
        // Only process public messages here
        if (!message.recipient) {
          if (!document.hasFocus() && Notification.permission === 'granted') {
            new Notification(`Nouveau message de ${message.pseudo}`, {
              body: message.text,
              icon: '/default-avatar.jpg',
            });
          }
          return [...prev.slice(-99), message];
        } else {
          // If it's a private message, add it to the state regardless
          return [...prev.slice(-99), message];
        }
      });
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    socket.on('new_private_message', (message: Message) => {
      console.log("Frontend: Received new_private_message:", message);
      setMessages(prev => {
        console.log("Frontend: Messages before update:", prev);
        const newMessages = [...prev.slice(-99), message];
        console.log("Frontend: Messages after update:", newMessages);
        return newMessages;
      });
      // Trigger notification if window is not focused and permission is granted
      if (!document.hasFocus() && Notification.permission === 'granted') {
        new Notification(`Nouveau message privé de ${message.pseudo}`, {
          body: message.text,
          icon: '/default-avatar.jpg',
        });
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(username, Date.now());
        return newMap;
      });
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

  const sendMessage = (recipient: string | null) => {
    if (newMessage.trim() === '' || !socketRef.current || !socketRef.current.connected) return;
    const textWithEmojis = replaceEmojis(newMessage.trim());

    if (recipient) {
      socketRef.current.emit('send_private_message', { to: recipient, text: textWithEmojis });
    } else {
      socketRef.current.emit('send_message', { text: textWithEmojis });
    }
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

  const fetchAvatar = useCallback(async (username: string) => {
    console.log(`Attempting to fetch avatar for: ${username}`);
    if (avatarCache[username] !== undefined) {
      console.log(`Avatar for ${username} already in cache.`);
      return;
    }
    try {
      const res = await fetch(`/user/${username}`);
      const data = await res.json();
      const newAvatarUrl = data.avatar_url || '/default-avatar.jpg';
      setAvatarCache(prev => {
        const updatedCache = { ...prev, [username]: newAvatarUrl };
        console.log(`Avatar cache updated for ${username}:`, updatedCache);
        return updatedCache;
      });
    } catch (error) {
      console.error(`Error fetching avatar for ${username}:`, error);
      setAvatarCache(prev => {
        const updatedCache = { ...prev, [username]: '/default-avatar.jpg' };
        console.log(`Avatar cache updated for ${username} (default):`, updatedCache);
        return updatedCache;
      });
    }
  }, [avatarCache]);
  
  useEffect(() => {
      const allAuthors = Array.from(new Set(messages.map(m => m.pseudo)));
      console.log("All message authors:", allAuthors);
      console.log("Current uniqueUsers (online users):", uniqueUsers);
      console.log("Current avatarCache:", avatarCache);
      allAuthors.forEach((author) => {
        const userObj = uniqueUsers.find(u => u.username === author);
        if (!userObj && (avatarCache[author] === undefined || avatarCache[author] === '/default-avatar.jpg')) {
          console.log(`Author ${author} is not online and not in cache. Fetching...`);
          fetchAvatar(author);
        } else if (userObj) {
          console.log(`Author ${author} is online. Using online avatar.`);
          // Ensure online user avatars are also in cache for consistency
          setAvatarCache(prev => ({ ...prev, [author]: userObj.avatar_url || '/default-avatar.jpg' }));
        }
      });
    }, [messages, uniqueUsers, avatarCache, fetchAvatar]);

  const handleReact = (messageId: string, emoji: string) => {
    if (socketRef.current) {
      socketRef.current.emit('react_message', { messageId, emoji });
    }
    setReactingTo(null);
  };

  useEffect(() => {
    if (!socketRef.current) return;

    const TYPING_TIMEOUT = 3000; // 3 seconds

    const handleTyping = (data: { pseudo: string }) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(data.pseudo, Date.now());
        return newMap;
      });
    };

    socketRef.current.on('typing_users', handleTyping);

    const interval = setInterval(() => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const now = Date.now();
        for (const [user, timestamp] of prev.entries()) {
          if (now - timestamp > TYPING_TIMEOUT) {
            newMap.delete(user);
          }
        }
        return newMap;
      });
    }, 1000); // Check every second

    return () => {
      if (socketRef.current) {
        socketRef.current.off('typing_users', handleTyping);
      }
      clearInterval(interval);
    };
  }, [pseudo]);


  function replaceEmojis(text: string) {
    const typedData = data as { emojis: { [key: string]: { id: string; native?: string; keywords?: string[]; skins?: { native: string }[] } } };
    return text.replace(/:([a-zA-Z0-9_+-]+):/g, (match, code) => {
      const q = code.toLowerCase();
      const emojis = Object.values(typedData.emojis);
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

  const isMobile = typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const touchTimeoutRef = useRef<number | null>(null);
  const handleTouchStart = (id: string) => {
    // Clear any existing timeout
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
    touchTimeoutRef.current = window.setTimeout(() => {
      setReactingTo(id);
      // Vibrate on mobile if the API is available
      if (isMobile && typeof navigator.vibrate === "function") {
        navigator.vibrate(50);
      }
    }, 1500); // 1500ms for long press
  };

  const handleTouchEnd = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
  };

  if (loading) return <Spinner />;
  if (!pseudo) return <Spinner message="Vous devez être connecté pour accéder au chat." />;

  const groupedMessages: {
    id: string;
    pseudo: string;
    texts: string[];
    reactions?: { [emoji: string]: string[] };
    recipient?: string; // Added recipient to the grouped message type
  }[] = [];

  messages.forEach((msg) => {
    const prev = groupedMessages[groupedMessages.length - 1];
    // Group messages if from the same pseudo AND (both public OR both private between the same two users)
    if (prev && prev.pseudo === msg.pseudo &&
        ((!prev.recipient && !msg.recipient) || // Both public
         (prev.recipient && msg.recipient && // Both private
          ((prev.pseudo === msg.pseudo && prev.recipient === msg.recipient) || // Same sender, same recipient
           (prev.pseudo === msg.recipient && prev.recipient === msg.pseudo)) // Sender/recipient swapped (reply)
         )
        )) {
      prev.texts.push(msg.text);
    } else {
      groupedMessages.push({
        id: msg.id,
        pseudo: msg.pseudo,
        texts: [msg.text],
        reactions: msg.reactions,
        recipient: msg.recipient, // Ensure recipient is carried over
      });
    }
  });

  const handleClearChat = () => {
    setMessages([]);
    if (socketRef.current)
      socketRef.current.emit('delete_message', { id: "all" });
  };

  return (
    <div className="flex h-screen bg-[#23272a]">
      <ChatSidebar
        pseudo={pseudo}
        uniqueUsers={uniqueUsers}
        handleLogout={handleLogout}
        setSidebarOpen={setSidebarOpen}
        onSelectPrivateChat={setPrivateChatRecipient}
        sidebarOpen={sidebarOpen}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col bg-[#36393f] relative">
        <ChatHeader
          setSidebarOpen={setSidebarOpen}
          handleClearChat={handleClearChat}
          handleNavigate={navigate}
          privateChatRecipient={privateChatRecipient}
          setPrivateChatRecipient={setPrivateChatRecipient}
          isAdmin={isAdmin}
        />

        <MessageList
          groupedMessages={groupedMessages}
          pseudo={pseudo}
          uniqueUsers={uniqueUsers}
          avatarCache={avatarCache}
          handleReact={handleReact}
          setReactingTo={setReactingTo}
          reactingTo={reactingTo}
          isMobile={isMobile}
          handleTouchStart={handleTouchStart}
          handleTouchEnd={handleTouchEnd}
          messagesEndRef={messagesEndRef}
          replaceEmojis={replaceEmojis}
          privateChatRecipient={privateChatRecipient}
        />

        <TypingIndicator typingUsers={Array.from(typingUsers.keys()) as string[]} /> 

        <ChatInputArea
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sendMessage={sendMessage}
          onTyping={() => {
            if (socketRef.current && pseudo) {
              socketRef.current.emit('user_typing', { pseudo });
            }
          }}
          privateChatRecipient={privateChatRecipient}
        />
      </main>
      {!connected && (
        <div className="fixed bottom-0 left-0 right-0 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-t-lg text-center font-medium text-sm z-50">
          Connexion perdue, tentative de reconnexion...
        </div>
      )}
    </div>
  );
}
