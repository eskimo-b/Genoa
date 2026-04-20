import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';

const API = 'http://localhost:3000';

const emptyForm = {
  firstname: '', lastname: '', sex: '',
  birthDate: '', deathDate: '',
  profession: '', photo: '',
  addresses: '', phones: '', emails: '',
  publicInfo: '', privateInfo: ''
};

export default function Members() {
  const { token, user } = useContext(AuthContext);

  const [members, setMembers]     = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // Formulaire ajout/édition
  const [showForm, setShowForm]   = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [formMsg, setFormMsg]     = useState('');
  const [formErr, setFormErr]     = useState('');

  const canEdit = ['editor', 'admin'].includes(user?.role);
  const isEditor = ['editor', 'admin'].includes(user?.role);

  useEffect(() => { fetchMembers(); }, []);

  function fetchMembers() {
    setLoading(true);
    fetch(`${API}/members`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setLoading(false); if (Array.isArray(data)) setMembers(data); else setError(data.error); })
      .catch(() => { setLoading(false); setError('Serveur inaccessible'); });
  }

  function handleSearch(e) {
    const q = e.target.value;
    setSearch(q);
    if (!q) { fetchMembers(); return; }
    fetch(`${API}/members/search?q=${q}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => { if (Array.isArray(data)) setMembers(data); });
  }

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setFormMsg(''); setFormErr('');
    setShowForm(true);
  }

  function openEdit(m) {
    setEditId(m._id);
    setForm({
      firstname:   m.firstname   || '',
      lastname:    m.lastname    || '',
      sex:         m.sex         || '',
      birthDate:   m.birthDate   ? m.birthDate.slice(0,10) : '',
      deathDate:   m.deathDate   ? m.deathDate.slice(0,10) : '',
      profession:  (m.profession || []).join(', '),
      photo:       m.photo       || '',
      addresses:   (m.addresses  || []).join(', '),
      phones:      (m.phones     || []).join(', '),
      emails:      (m.emails     || []).join(', '),
      publicInfo:  m.publicInfo  || '',
      privateInfo: m.privateInfo || ''
    });
    setFormMsg(''); setFormErr('');
    setShowForm(true);
  }

  function handleSubmit() {
    setFormErr(''); setFormMsg('');
    if (!form.firstname || !form.lastname) { setFormErr('Prénom et nom requis'); return; }

    const body = {
      firstname:   form.firstname,
      lastname:    form.lastname,
      sex:         form.sex     || null,
      birthDate:   form.birthDate  || null,
      deathDate:   form.deathDate  || null,
      profession:  form.profession  ? form.profession.split(',').map(s => s.trim()).filter(Boolean)  : [],
      photo:       form.photo       || null,
      addresses:   form.addresses   ? form.addresses.split(',').map(s => s.trim()).filter(Boolean)   : [],
      phones:      form.phones      ? form.phones.split(',').map(s => s.trim()).filter(Boolean)      : [],
      emails:      form.emails      ? form.emails.split(',').map(s => s.trim()).filter(Boolean)      : [],
      publicInfo:  form.publicInfo  || null,
      privateInfo: form.privateInfo || null
    };

    const url    = editId ? `${API}/members/${editId}` : `${API}/members`;
    const method = editId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setFormErr(data.error); return; }
        setFormMsg(editId ? 'Membre mis à jour !' : 'Membre ajouté !');
        setShowForm(false);
        fetchMembers();
      });
  }

  function handleDelete(id) {
    if (!confirm('Supprimer ce membre ?')) return;
    fetch(`${API}/members/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => fetchMembers());
  }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  return (
    <div>
      <Header />
      <div className="page-container">

        {/* Barre du haut */}
        <div className="page-topbar">
          <h2>Membres de la famille</h2>
          <input className="search-input" placeholder="Rechercher..." value={search} onChange={handleSearch} />
          {canEdit && <button className="btn-primary" onClick={openAdd}>+ Ajouter</button>}
        </div>

        {error   && <p className="error-msg">{error}</p>}
        {loading && <p>Chargement...</p>}

        {/* Formulaire */}
        {showForm && (
          <div className="form-card">
            <h3>{editId ? 'Modifier le membre' : 'Nouveau membre'}</h3>

            <div className="form-grid">
              <div className="form-group">
                <label>Prénom *</label>
                <input className="auth-input" value={form.firstname} onChange={e => setField('firstname', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Nom *</label>
                <input className="auth-input" value={form.lastname} onChange={e => setField('lastname', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Sexe</label>
                <select className="auth-input" value={form.sex} onChange={e => setField('sex', e.target.value)}>
                  <option value="">—</option>
                  <option value="M">Homme</option>
                  <option value="F">Femme</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date de naissance</label>
                <input className="auth-input" type="date" value={form.birthDate} onChange={e => setField('birthDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Date de décès</label>
                <input className="auth-input" type="date" value={form.deathDate} onChange={e => setField('deathDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Photo (URL)</label>
                <input className="auth-input" placeholder="https://..." value={form.photo} onChange={e => setField('photo', e.target.value)} />
              </div>
              <div className="form-group full">
                <label>Profession(s) <span className="hint">(séparées par des virgules)</span></label>
                <input className="auth-input" placeholder="Médecin, Enseignant..." value={form.profession} onChange={e => setField('profession', e.target.value)} />
              </div>
              <div className="form-group full">
                <label>Adresse(s) <span className="hint">(séparées par des virgules)</span></label>
                <input className="auth-input" value={form.addresses} onChange={e => setField('addresses', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Téléphone(s)</label>
                <input className="auth-input" placeholder="06..., 07..." value={form.phones} onChange={e => setField('phones', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email(s)</label>
                <input className="auth-input" placeholder="a@b.com, ..." value={form.emails} onChange={e => setField('emails', e.target.value)} />
              </div>
              <div className="form-group full">
                <label>Informations publiques</label>
                <textarea className="auth-input" rows="2" value={form.publicInfo} onChange={e => setField('publicInfo', e.target.value)} />
              </div>
              {isEditor && (
                <div className="form-group full">
                  <label>Informations privées <span className="hint">(éditeurs/admins uniquement)</span></label>
                  <textarea className="auth-input" rows="2" value={form.privateInfo} onChange={e => setField('privateInfo', e.target.value)} />
                </div>
              )}
            </div>

            {formErr && <p className="error-msg">{formErr}</p>}
            {formMsg && <p className="success-msg">{formMsg}</p>}

            <div className="form-actions">
              <button className="btn-primary" onClick={handleSubmit}>{editId ? 'Mettre à jour' : 'Ajouter'}</button>
              <button className="btn-cancel" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </div>
        )}

        {/* Grille membres */}
        <div className="members-grid">
          {members.map(m => (
            <div key={m._id} className="member-card">
              <div className="member-avatar">
                {m.photo
                  ? <img src={m.photo} alt={m.firstname} />
                  : <span>{m.firstname?.[0]}{m.lastname?.[0]}</span>}
              </div>
              <div className="member-info">
                <strong>{m.firstname} {m.lastname}</strong>
                {m.sex && <p>{m.sex === 'M' ? '♂ Homme' : m.sex === 'F' ? '♀ Femme' : 'Autre'}</p>}
                {m.birthDate && <p>🎂 {new Date(m.birthDate).toLocaleDateString('fr-FR')}</p>}
                {m.deathDate && <p>✝ {new Date(m.deathDate).toLocaleDateString('fr-FR')}</p>}
                {m.profession?.length > 0 && <p>💼 {m.profession.join(', ')}</p>}
                {m.publicInfo && <p className="info-public">ℹ {m.publicInfo}</p>}
                {isEditor && m.privateInfo && <p className="info-private">🔒 {m.privateInfo}</p>}
              </div>
              {canEdit && (
                <div className="card-actions">
                  <button className="btn-edit" onClick={() => openEdit(m)}>✏️</button>
                  <button className="btn-delete" onClick={() => handleDelete(m._id)}>🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {!loading && members.length === 0 && (
          <p className="empty-msg">Aucun membre. Ajoutez le premier !</p>
        )}
      </div>
    </div>
  );
}
