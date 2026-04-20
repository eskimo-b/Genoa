import { createContext, useState } from 'react';

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  // On stocke aussi le token pour les appels API
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
