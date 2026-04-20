import { useState, useContext } from 'react';
import { NavigationContext } from '../App';

const API = 'http://localhost:3000';

export default function Register() {
  const { setPage } = useContext(NavigationContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleRegister() {
    setLoading(true);
    setError('');
    setMessage('');

    fetch(`${API}/auth/register`, {
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
          setMessage(data.message);
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
        <h2>Inscription 🌳</h2>

        {error   && <p className="error-msg">{error}</p>}
        {message && <p className="success-msg">{message}</p>}

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

        <button className="btn-primary" onClick={handleRegister} disabled={loading}>
          {loading ? 'Inscription...' : "S'inscrire"}
        </button>

        <p className="auth-switch">
          Déjà un compte ?{' '}
          <span className="link" onClick={() => setPage('login')}>Se connecter</span>
        </p>
      </div>
    </div>
  );
}
