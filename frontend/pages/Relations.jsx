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
  const [tab,        setTab]        = useState('unions');

  // Formulaire union
  const [uMember1,   setUMember1]   = useState('');
  const [uMember2,   setUMember2]   = useState('');
  const [uUnionDate, setUUnionDate] = useState('');
  const [uSepDate,   setUSepDate]   = useState('');
  const [uMsg, setUMsg]             = useState('');
  const [uErr, setUErr]             = useState('');

  // Formulaire situation — on peut choisir via une union OU deux parents manuels
  const [sMode,    setSMode]    = useState('union');   // 'union' | 'manual'
  const [sUnionId, setSUnionId] = useState('');        // mode union
  const [sParent1, setSParent1] = useState('');        // mode manual
  const [sParent2, setSParent2] = useState('');        // mode manual (optionnel)
  const [sChild,   setSChild]   = useState('');
  const [sBio,     setSBio]     = useState(true);
  const [sMsg,     setSMsg]     = useState('');
  const [sErr,     setSErr]     = useState('');

  useEffect(() => { fetchAll(); }, []);

  function fetchAll() {
    const h = { Authorization: `Bearer ${token}` };
    fetch(`${API}/members`,    { headers: h }).then(r => r.json()).then(d => { if (Array.isArray(d)) setMembers(d); });
    fetch(`${API}/unions`,     { headers: h }).then(r => r.json()).then(d => { if (Array.isArray(d)) setUnions(d); });
    fetch(`${API}/situations`, { headers: h }).then(r => r.json()).then(d => { if (Array.isArray(d)) setSituations(d); });
  }

  function name(id) {
    const m = members.find(m => m._id?.toString() === id?.toString());
    return m ? `${m.firstname} ${m.lastname}` : '?';
  }

  // ---------- UNIONS ----------
  function addUnion() {
    setUErr(''); setUMsg('');
    if (!uMember1 || !uMember2) { setUErr('Sélectionne les deux membres'); return; }
    if (uMember1 === uMember2)  { setUErr('Les deux membres doivent être différents'); return; }

    fetch(`${API}/unions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ member1: uMember1, member2: uMember2, unionDate: uUnionDate || null, separationDate: uSepDate || null })
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
    fetch(`${API}/unions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchAll());
  }

  // ---------- SITUATIONS ----------
  function addSituation() {
    setSErr(''); setSMsg('');
    if (!sChild) { setSErr("Sélectionne l'enfant"); return; }

    // Détermine les parents à créer
    let parents = [];
    if (sMode === 'union') {
      if (!sUnionId) { setSErr('Sélectionne une union'); return; }
      const u = unions.find(u => u._id?.toString() === sUnionId);
      if (!u) { setSErr('Union introuvable'); return; }
      parents = [u.member1?.toString(), u.member2?.toString()];
    } else {
      if (!sParent1) { setSErr('Sélectionne au moins un parent'); return; }
      parents = [sParent1];
      if (sParent2 && sParent2 !== sParent1) parents.push(sParent2);
    }

    // Crée une situation par parent
    const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    Promise.all(parents.map(parentId =>
      fetch(`${API}/situations`, {
        method: 'POST', headers: h,
        body: JSON.stringify({ parent: parentId, child: sChild, isBiological: sBio })
      }).then(r => r.json())
    ))
      .then(results => {
        const err = results.find(r => r.error);
        if (err) { setSErr(err.error); return; }
        setSMsg(`Lien créé avec ${parents.length} parent(s) !`);
        setSUnionId(''); setSParent1(''); setSParent2(''); setSChild(''); setSBio(true);
        fetchAll();
      });
  }

  function deleteSituation(id) {
    if (!confirm('Supprimer ce lien ?')) return;
    fetch(`${API}/situations/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchAll());
  }

  // Groupe les situations par enfant pour affichage
  function groupByChild() {
    const map = {};
    situations.forEach(s => {
      const cid = s.child?.toString();
      if (!map[cid]) map[cid] = [];
      map[cid].push(s);
    });
    return Object.entries(map);
  }

  return (
    <div>
      <Header />
      <div className="page-container">
        <h2>Relations familiales</h2>

        <div className="tabs">
          <button className={tab === 'unions'     ? 'tab active' : 'tab'} onClick={() => setTab('unions')}>
            💑 Couples ({unions.length})
          </button>
          <button className={tab === 'situations' ? 'tab active' : 'tab'} onClick={() => setTab('situations')}>
            👨‍👧 Liens parent-enfant ({groupByChild().length} enfants)
          </button>
        </div>

        {/* ===== UNIONS ===== */}
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
                      {members.filter(m => m._id !== uMember1).map(m => <option key={m._id} value={m._id}>{m.firstname} {m.lastname}</option>)}
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
                    <strong>{name(u.member1)} × {name(u.member2)}</strong>
                    {u.unionDate       && <p>Union : {new Date(u.unionDate).toLocaleDateString('fr-FR')}</p>}
                    {u.separationDate  && <p>Séparation : {new Date(u.separationDate).toLocaleDateString('fr-FR')}</p>}
                  </div>
                  {canEdit && <button className="btn-delete" onClick={() => deleteUnion(u._id)}>🗑️</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== SITUATIONS ===== */}
        {tab === 'situations' && (
          <div>
            {canEdit && (
              <div className="form-card">
                <h3>Ajouter un lien parent-enfant</h3>

                {/* Toggle mode */}
                <div className="mode-toggle">
                  <button className={sMode === 'union'  ? 'tab active' : 'tab'} onClick={() => setSMode('union')}>
                    Via une union (couple)
                  </button>
                  <button className={sMode === 'manual' ? 'tab active' : 'tab'} onClick={() => setSMode('manual')}>
                    Parents individuels
                  </button>
                </div>

                <div className="form-grid" style={{ marginTop: '12px' }}>
                  {/* Mode union */}
                  {sMode === 'union' && (
                    <div className="form-group full">
                      <label>Union (couple)</label>
                      <select className="auth-input" value={sUnionId} onChange={e => setSUnionId(e.target.value)}>
                        <option value="">— Choisir un couple —</option>
                        {unions.map(u => (
                          <option key={u._id} value={u._id}>
                            {name(u.member1)} × {name(u.member2)}
                          </option>
                        ))}
                      </select>
                      {sUnionId && (
                        <p className="hint" style={{ marginTop: '4px' }}>
                          Les deux membres du couple seront enregistrés comme parents.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Mode manual */}
                  {sMode === 'manual' && (
                    <>
                      <div className="form-group">
                        <label>Parent 1 *</label>
                        <select className="auth-input" value={sParent1} onChange={e => setSParent1(e.target.value)}>
                          <option value="">— Choisir —</option>
                          {members.map(m => <option key={m._id} value={m._id}>{m.firstname} {m.lastname}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Parent 2 <span className="hint">(optionnel)</span></label>
                        <select className="auth-input" value={sParent2} onChange={e => setSParent2(e.target.value)}>
                          <option value="">— Choisir —</option>
                          {members.filter(m => m._id?.toString() !== sParent1).map(m =>
                            <option key={m._id} value={m._id}>{m.firstname} {m.lastname}</option>
                          )}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Enfant + filiation - communs aux deux modes */}
                  <div className="form-group">
                    <label>Enfant *</label>
                    <select className="auth-input" value={sChild} onChange={e => setSChild(e.target.value)}>
                      <option value="">— Choisir —</option>
                      {members.map(m => <option key={m._id} value={m._id}>{m.firstname} {m.lastname}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Filiation</label>
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

            {/* Liste groupée par enfant */}
            <div className="relations-list">
              {groupByChild().length === 0 && <p className="empty-msg">Aucun lien enregistré.</p>}
              {groupByChild().map(([childId, sits]) => (
                <div key={childId} className="relation-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                    <span className="relation-icon">👶</span>
                    <strong style={{ flex: 1 }}>{name(childId)}</strong>
                  </div>
                  {sits.map(s => (
                    <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '36px', width: '100%' }}>
                      <span>⬆️ {name(s.parent)}</span>
                      <span className="hint">— {s.isBiological ? 'biologique' : 'adopté(e)'}</span>
                      {canEdit && (
                        <button className="btn-delete" style={{ marginLeft: 'auto' }} onClick={() => deleteSituation(s._id)}>🗑️</button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
