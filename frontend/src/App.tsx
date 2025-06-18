
import { Routes, Route } from 'react-router-dom';


import Login from './pages/login';
import Register from './pages/register';
import Chat from './pages/Tchat';
import VideoChat from './pages/videoChat';
import Home from './pages/homepage';


function App() {

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/video" element={<VideoChat />} />
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default App;
