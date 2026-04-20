import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';

const API = 'http://localhost:3000';

export default function Relations() {
  const { token, user } = useContext(AuthContext);
  const canEdit = ['editor', 'admin'].includes(user?.role);

  const [members,    setMembers]    = useState([]);
  const [unions,     setUnions]     = useState([]);
  const [situations, setSituations] = useState([]);
  const [tab,        setTab]        = useState('unions'); // 'unions' | 'situations'

  // Formulaire union
  const [uMember1, setUMember1]           = useState('');
  const [uMember2, setUMember2]           = useState('');
  const [uUnionDate, setUUnionDate]       = useState('');
  const [uSepDate, setUSepDate]           = useState('');
  const [uMsg, setUMsg]                   = useState('');
  const [uErr, setUErr]                   = useState('');

  // Formulaire situation
  const [sParent, setSParent]             = useState('');
  const [sChild, setSChild]               = useState('');
  const [sBio, setSBio]                   = useState(true);
  const [sMsg, setSMsg]                   = useState('');
  const [sErr, setSErr]                   = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  function fetchAll() {
    const h = { Authorization: `Bearer ${token}` };
    fetch(`${API}/members`,    { headers: h }).then(r => r.json()).then(d => { if (Array.isArray(d)) setMembers(d); });
    fetch(`${API}/unions`,     { headers: h }).then(r => r.json()).then(d => { if (Array.isArray(d)) setUnions(d); });
    fetch(`${API}/situations`, { headers: h }).then(r => r.json()).then(d => { if (Array.isArray(d)) setSituations(d); });
  }

  // Trouve le nom d'un membre par son id
  function name(id) {
    const m = members.find(m => m._id === id || m._id?.toString() === id?.toString());
    return m ? `${m.firstname} ${m.lastname}` : id;
  }

  // --- Unions ---
  function addUnion() {
    setUErr(''); setUMsg('');
    if (!uMember1 || !uMember2) { setUErr('Sélectionne les deux membres'); return; }

    fetch(`${API}/unions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        member1: uMember1, member2: uMember2,
        unionDate: uUnionDate || null, separationDate: uSepDate || null
      })
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setUErr(data.error); return; }
        setUMsg('Union créée !');
        setUMember1(''); setUMember2(''); setUUnionDate(''); setUSepDate('');
        fetchAll();
      });
  }

  function deleteUnion(id) {
    if (!confirm('Supprimer cette union ?')) return;
    fetch(`${API}/unions/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    }).then(() => fetchAll());
  }

  // --- Situations ---
  function addSituation() {
    setSErr(''); setSMsg('');
    if (!sParent || !sChild) { setSErr('Sélectionne le parent et l\'enfant'); return; }

    fetch(`${API}/situations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ parent: sParent, child: sChild, isBiological: sBio })
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setSErr(data.error); return; }
        setSMsg('Lien créé !');
        setSParent(''); setSChild(''); setSBio(true);
        fetchAll();
      });
  }

  function deleteSituation(id) {
    if (!confirm('Supprimer ce lien ?')) return;
    fetch(`${API}/situations/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    }).then(() => fetchAll());
  }

  return (
    <div>
      <Header />
      <div className="page-container">
        <h2>Relations familiales</h2>

        {/* Onglets */}
        <div className="tabs">
          <button className={tab === 'unions'     ? 'tab active' : 'tab'} onClick={() => setTab('unions')}>
            💑 Couples ({unions.length})
          </button>
          <button className={tab === 'situations' ? 'tab active' : 'tab'} onClick={() => setTab('situations')}>
            👨‍👧 Liens parent-enfant ({situations.length})
          </button>
        </div>

        {/* --- UNIONS --- */}
        {tab === 'unions' && (
          <div>
            {canEdit && (
              <div className="form-card">
                <h3>Ajouter une union</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Membre 1</label>
                    <select className="auth-input" value={uMember1} onChange={e => setUMember1(e.target.value)}>
                      <option value="">— Choisir —</option>
                      {members.map(m => <option key={m._id} value={m._id}>{m.firstname} {m.lastname}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Membre 2</label>
                    <select className="auth-input" value={uMember2} onChange={e => setUMember2(e.target.value)}>
                      <option value="">— Choisir —</option>
                      {members.map(m => <option key={m._id} value={m._id}>{m.firstname} {m.lastname}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date d'union</label>
                    <input className="auth-input" type="date" value={uUnionDate} onChange={e => setUUnionDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Date de séparation</label>
                    <input className="auth-input" type="date" value={uSepDate} onChange={e => setUSepDate(e.target.value)} />
                  </div>
                </div>
                {uErr && <p className="error-msg">{uErr}</p>}
                {uMsg && <p className="success-msg">{uMsg}</p>}
                <div className="form-actions">
                  <button className="btn-primary" onClick={addUnion}>Créer l'union</button>
                </div>
              </div>
            )}

            <div className="relations-list">
              {unions.length === 0 && <p className="empty-msg">Aucune union enregistrée.</p>}
              {unions.map(u => (
                <div key={u._id} className="relation-card">
                  <span className="relation-icon">💑</span>
                  <div className="relation-info">
                    <strong>{name(u.member1)} — {name(u.member2)}</strong>
                    {u.unionDate    && <p>Union : {new Date(u.unionDate).toLocaleDateString('fr-FR')}</p>}
                    {u.separationDate && <p>Séparation : {new Date(u.separationDate).toLocaleDateString('fr-FR')}</p>}
                  </div>
                  {canEdit && (
                    <button className="btn-delete" onClick={() => deleteUnion(u._id)}>🗑️</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SITUATIONS --- */}
        {tab === 'situations' && (
          <div>
            {canEdit && (
              <div className="form-card">
                <h3>Ajouter un lien parent → enfant</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Parent</label>
                    <select className="auth-input" value={sParent} onChange={e => setSParent(e.target.value)}>
                      <option value="">— Choisir —</option>
                      {members.map(m => <option key={m._id} value={m._id}>{m.firstname} {m.lastname}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Enfant</label>
                    <select className="auth-input" value={sChild} onChange={e => setSChild(e.target.value)}>
                      <option value="">— Choisir —</option>
                      {members.map(m => <option key={m._id} value={m._id}>{m.firstname} {m.lastname}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Type de filiation</label>
                    <select className="auth-input" value={sBio} onChange={e => setSBio(e.target.value === 'true')}>
                      <option value="true">Biologique</option>
                      <option value="false">Adopté(e)</option>
                    </select>
                  </div>
                </div>
                {sErr && <p className="error-msg">{sErr}</p>}
                {sMsg && <p className="success-msg">{sMsg}</p>}
                <div className="form-actions">
                  <button className="btn-primary" onClick={addSituation}>Créer le lien</button>
                </div>
              </div>
            )}

            <div className="relations-list">
              {situations.length === 0 && <p className="empty-msg">Aucun lien parent-enfant enregistré.</p>}
              {situations.map(s => (
                <div key={s._id} className="relation-card">
                  <span className="relation-icon">👨‍👧</span>
                  <div className="relation-info">
                    <strong>{name(s.parent)} → {name(s.child)}</strong>
                    <p>{s.isBiological ? 'Biologique' : 'Adopté(e)'}</p>
                  </div>
                  {canEdit && (
                    <button className="btn-delete" onClick={() => deleteSituation(s._id)}>🗑️</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
