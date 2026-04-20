import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NavigationContext } from '../App';

export default function Header() {
  const { user, setUser } = useContext(AuthContext);
  const { setPage } = useContext(NavigationContext);

  return (
    <header className="main-header">
      <div className="logo" onClick={() => setPage('home')}>Genoa 🌳</div>

      <nav className="nav-links">
        <button onClick={() => setPage('home')}>Accueil</button>
        <button onClick={() => setPage('tree')}>Arbre</button>
        {user?.role === 'admin' && (
          <button onClick={() => setPage('admin')}>Admin</button>
        )}
      </nav>

      <div className="header-right">
        <span className="user-email">{user?.email}</span>
        <button className="btn-logout" onClick={() => setUser(null)}>Déconnexion</button>
      </div>
    </header>
  );
}