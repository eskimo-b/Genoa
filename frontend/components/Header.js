import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Header() {
  const { user, setUser } = useContext(AuthContext);

  return (
    <header style={styles.header}>
      
      {/* Logo / Index */}
      <a href="/" style={styles.logo}>Genoa 🌳</a>

      {/* Barre de recherche */}
      <input 
        type="text" 
        placeholder="Rechercher un membre..." 
        style={styles.search}
      />

      {/* Menu */}
      <nav>
        <a href="/tree">Arbre</a>
        <a href="/stats">Stats</a>
        <a href="/search">Recherche</a>

        {user?.role === 'admin' && (
          <a href="/admin">Admin</a>
        )}
      </nav>

      {/* Logout */}
      <button onClick={() => setUser(null)}>Logout</button>

    </header>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    background: '#222',
    color: 'white',
    alignItems: 'center'
  },
  logo: {
    color: 'white',
    textDecoration: 'none',
    fontWeight: 'bold'
  },
  search: {
    padding: '5px',
    borderRadius: '5px'
  }
};