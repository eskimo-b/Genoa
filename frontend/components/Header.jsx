import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NavigationContext } from '../App';

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const { setPage } = useContext(NavigationContext);

  return (
    <header className="main-header">
      <div className="logo" onClick={() => setPage('home')}>Genoa 🌳</div>
      <nav className="nav-links">
        <button onClick={() => setPage('home')}>Accueil</button>
        <button onClick={() => setPage('members')}>Membres</button>
        <button onClick={() => setPage('relations')}>Relations</button>
        {user?.role === 'admin' && (
          <button onClick={() => setPage('admin')}>Admin</button>
        )}
      </nav>
      <div className="header-right">
        <span className="user-email">{user?.email}</span>
        <span className="user-role">[{user?.role}]</span>
        <button className="btn-logout" onClick={logout}>Déconnexion</button>
      </div>
    </header>
  );
}
