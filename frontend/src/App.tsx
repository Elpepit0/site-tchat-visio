
import { Routes, Route } from 'react-router-dom';


import Login from './pages/Login/login';
import Register from './pages/Register/register';
import Chat from './pages/Tchat/Tchat';

import Home from './pages/Home/homepage';


function App() {

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chat" element={<Chat />} />
      
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default App;
