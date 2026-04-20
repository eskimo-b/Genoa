import { useState, createContext } from 'react';
import Home      from './pages/Home';
import Login     from './pages/Login';
import Register  from './pages/Register';
import Members   from './pages/Members';
import Relations from './pages/Relations';
import AuthProvider from './context/AuthContext';

export const NavigationContext = createContext();

export default function App() {
  const [page, setPage] = useState('home');

  return (
    <AuthProvider>
      <NavigationContext.Provider value={{ page, setPage }}>
        <div className="app-container">
          {page === 'home'      && <Home />}
          {page === 'login'     && <Login />}
          {page === 'register'  && <Register />}
          {page === 'members'   && <Members />}
          {page === 'relations' && <Relations />}
        </div>
      </NavigationContext.Provider>
    </AuthProvider>
  );
}
