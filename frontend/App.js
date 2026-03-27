import { useState } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import AuthProvider from './context/AuthContext';

export default function App() {
  const [page, setPage] = useState('home');

  return (
    <AuthProvider>
      {page === 'home' && <Home />}
      {page === 'login' && <Login />}
    </AuthProvider>
  );
}