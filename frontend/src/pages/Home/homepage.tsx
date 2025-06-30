import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeSection from './components/WelcomeSection';
import ImageSection from './components/ImageSection';
import Spinner from '../../components/Spinner';
import '../../index.css';

export default function Home() {
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVisitors, setActiveVisitors] = useState(0);
  const navigate = useNavigate();

  function fetchActiveVisitors() {
    // TODO: Consider replacing polling with WebSockets for real-time active visitor updates
    fetch('/active_visitors', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        setActiveVisitors(data.active_visitors);
      })
      .catch(err => console.error('Erreur fetch active visitors:', err));
  }

  useEffect(() => {
    fetchActiveVisitors();
    const interval = setInterval(fetchActiveVisitors, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function sendPing() {
      fetch('/ping', { method: 'POST', credentials: 'include' }).catch(() => {});
    }
    sendPing();
    const intervalPing = setInterval(sendPing, 30000);
    return () => clearInterval(intervalPing);
  }, []);

  useEffect(() => {
    fetch('/me', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.username) {
          setPseudo(data.username);
        } else {
          setPseudo(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setPseudo(null);
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setPseudo(null);
    navigate('/');
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="relative min-h-screen bg-[#23272a] flex items-center overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-16 md:gap-22">
          <WelcomeSection
            pseudo={pseudo}
            navigate={navigate}
            handleLogout={handleLogout}
            activeVisitors={activeVisitors}
          />
          <ImageSection />
        </div>
      </div>
    </div>
  );
}
