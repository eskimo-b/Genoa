import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NavigationContext } from '../App';

const API = 'http://localhost:3000';

export default function Login() {
  const { login } = useContext(AuthContext);
  const { setPage } = useContext(NavigationContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    setLoading(true);
    setError('');

    fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.error) {
          setError(data.error);
        } else {
          login({ email: data.email, role: data.role }, data.token);
          setPage('home');
        }
      })
      .catch(() => {
        setLoading(false);
        setError('Impossible de contacter le serveur');
      });
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Connexion 🌳</h2>

        {error && <p className="error-msg">{error}</p>}

        <input
          className="auth-input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          className="auth-input"
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button className="btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>

        <p className="auth-switch">
          Pas encore de compte ?{' '}
          <span className="link" onClick={() => setPage('register')}>S'inscrire</span>
        </p>
      </div>
    </div>
  );
}
