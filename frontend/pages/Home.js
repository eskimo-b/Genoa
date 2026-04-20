import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NavigationContext } from '../App';
import Header from '../components/Header';

export default function Home() {
  const { user } = useContext(AuthContext);
  const { setPage } = useContext(NavigationContext);

  return (
    <div className="home-page">
      {user && <Header />}
      
      <main className="hero-section">
        <div className="hero-content">
          <h1>Genoa 🌳</h1>
          <p className="subtitle">Explorez vos racines, construisez votre héritage.</p>
          
          {!user ? (
            <div className="cta-group">
              <button className="btn-primary" onClick={() => setPage('login')}>
                Commencer l'aventure
              </button>
            </div>
          ) : (
            <div className="dashboard-preview">
              <p>Bienvenue, <strong>{user.email}</strong> !</p>
              <button className="btn-secondary" onClick={() => setPage('tree')}>
                Voir mon arbre
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}