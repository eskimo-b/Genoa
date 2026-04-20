import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NavigationContext } from '../App';
import Header from '../components/Header';

const API = 'http://localhost:3000';

export default function Admin() {
  const { token, user } = useContext(AuthContext);
  const { setPage } = useContext(NavigationContext);

  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState('');
  const [err,     setErr]     = useState('');

  // Redirige si pas admin
  useEffect(() => {
    if (user?.role !== 'admin') { setPage('home'); return; }
    fetchUsers();
  }, []);

  function fetchUsers() {
    setLoading(true);
    fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setLoading(false);
        if (Array.isArray(data)) setUsers(data);
        else setErr(data.error);
      })
      .catch(() => { setLoading(false); setErr('Serveur inaccessible'); });
  }

  function validate(id) {
    fetch(`${API}/users/${id}/validate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setErr(data.error); return; }
        setMsg('Utilisateur validé !');
        fetchUsers();
      });
  }

  function changeRole(id, role) {
    fetch(`${API}/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role })
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setErr(data.error); return; }
        setMsg('Rôle mis à jour !');
        fetchUsers();
      });
  }

  function deleteUser(id) {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    fetch(`${API}/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setErr(data.error); return; }
        setMsg('Compte supprimé.');
        fetchUsers();
      });
  }

  const pending   = users.filter(u => !u.isValidated);
  const validated = users.filter(u =>  u.isValidated);

  return (
    <div>
      <Header />
      <div className="page-container">
        <h2>⚙️ Administration</h2>

        {err && <p className="error-msg">{err}</p>}
        {msg && <p className="success-msg" onClick={() => setMsg('')}>{msg} ✕</p>}
        {loading && <p>Chargement...</p>}

        {/* ── Inscriptions en attente ── */}
        {pending.length > 0 && (
          <div className="admin-section">
            <h3 className="admin-section-title">
              🕐 En attente de validation ({pending.length})
            </h3>
            <div className="admin-table">
              {pending.map(u => (
                <div key={u._id} className="admin-row pending">
                  <div className="admin-user-info">
                    <span className="admin-email">{u.email}</span>
                    <span className="admin-badge reader">reader</span>
                  </div>
                  <div className="admin-actions">
                    <button className="btn-validate" onClick={() => validate(u._id)}>
                      ✅ Valider
                    </button>
                    <button className="btn-delete-sm" onClick={() => deleteUser(u._id)}>
                      🗑️ Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pending.length === 0 && !loading && (
          <div className="admin-section">
            <p className="empty-msg" style={{ margin: '0.5rem 0' }}>✅ Aucune inscription en attente.</p>
          </div>
        )}

        {/* ── Utilisateurs actifs ── */}
        <div className="admin-section">
          <h3 className="admin-section-title">
            👥 Utilisateurs actifs ({validated.length})
          </h3>
          <div className="admin-table">
            {validated.map(u => (
              <div key={u._id} className="admin-row">
                <div className="admin-user-info">
                  <span className="admin-email">{u.email}</span>
                  {u._id?.toString() === user?._id?.toString() && (
                    <span className="admin-badge you">vous</span>
                  )}
                  <span className={`admin-badge ${u.role}`}>{u.role}</span>
                </div>
                <div className="admin-actions">
                  <select
                    className="role-select"
                    value={u.role}
                    onChange={e => changeRole(u._id, e.target.value)}
                  >
                    <option value="reader">reader</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </select>
                  <button className="btn-delete-sm" onClick={() => deleteUser(u._id)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
