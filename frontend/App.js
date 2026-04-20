import { useState, createContext, useContext } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import AuthProvider from './context/AuthContext';

// Création d'un contexte de navigation simple
export const NavigationContext = createContext();

export default function App() {
  const [page, setPage] = useState('home');

  return (
    <AuthProvider>
      <NavigationContext.Provider value={{ page, setPage }}>
        <div className="app-container">
          {page === 'home' && <Home />}
          {page === 'login' && <Login />}
        </div>
      </NavigationContext.Provider>
    </AuthProvider>
  );
}