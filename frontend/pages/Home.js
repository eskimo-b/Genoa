import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';

export default function Home() {
  const { user } = useContext(AuthContext);

  return (
    <div>
      {user && <Header />}

      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>Bienvenue sur Genoa 🌳</h1>

        {!user && (
          <a href="/login">
            <button>Login</button>
          </a>
        )}
      </div>
    </div>
  );
}