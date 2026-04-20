import { useState, useEffect, useContext } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  MarkerType, Panel,
  Handle, Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/Header';

const API        = 'http://localhost:3000';
const NODE_W     = 180;
const NODE_H     = 70;

// ── Layout dagre ──────────────────────────────────────────────
function applyLayout(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 50 });
  nodes.forEach(n  => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach(e  => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map(n => {
    const pos = g.node(n.id);
    if (!pos) return { ...n, position: { x: 0, y: 0 } };
    return { ...n, position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 } };
  });
}

// ── Nœud custom ───────────────────────────────────────────────
function MemberNode({ data }) {
  const { member: m, fields, selected } = data;
  const border = m.sex === 'M' ? '#3b82f6' : m.sex === 'F' ? '#ec4899' : '#9ca3af';
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div style={{
        width: NODE_W, minHeight: NODE_H,
        background: selected ? '#dcfce7' : 'white',
        border: `2px solid ${border}`,
        borderRadius: 10, padding: '8px 10px',
        fontSize: 12, cursor: 'pointer',
        boxShadow: selected ? '0 0 0 3px #86efac' : '0 2px 6px rgba(0,0,0,.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {m.photo
            ? <img src={m.photo} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 30, height: 30, borderRadius: '50%', background: border, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                {m.firstname?.[0]}{m.lastname?.[0]}
              </div>
          }
          <div>
            <div style={{ fontWeight: 700 }}>{m.firstname} {m.lastname}</div>
            {fields === 'full' && m.birthDate && (
              <div style={{ color: '#666' }}>🎂 {new Date(m.birthDate).getFullYear()}{m.deathDate ? ` – ✝ ${new Date(m.deathDate).getFullYear()}` : ''}</div>
            )}
            {fields === 'full' && m.profession?.length > 0 && (
              <div style={{ color: '#888', fontSize: 10 }}>💼 {m.profession[0]}</div>
            )}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

const nodeTypes = { member: MemberNode };

// ── Helpers traversal ─────────────────────────────────────────
function getAncestors(memberId, situations, visited = new Set()) {
  if (visited.has(memberId)) return visited;
  visited.add(memberId);
  situations.filter(s => s.child?.toString() === memberId)
    .forEach(s => getAncestors(s.parent?.toString(), situations, visited));
  return visited;
}

function getDescendants(memberId, situations, visited = new Set()) {
  if (visited.has(memberId)) return visited;
  visited.add(memberId);
  situations.filter(s => s.parent?.toString() === memberId)
    .forEach(s => getDescendants(s.child?.toString(), situations, visited));
  return visited;
}

function getSiblings(memberId, situations) {
  const parents = situations.filter(s => s.child?.toString() === memberId).map(s => s.parent?.toString());
  const sibs = new Set();
  parents.forEach(pid => {
    situations.filter(s => s.parent?.toString() === pid).forEach(s => sibs.add(s.child?.toString()));
  });
  sibs.delete(memberId);
  return sibs;
}

// ── Composant principal ───────────────────────────────────────
export default function Tree() {
  const { token } = useContext(AuthContext);

  const [members,    setMembers]    = useState([]);
  const [unions,     setUnions]     = useState([]);
  const [situations, setSituations] = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [root,       setRoot]       = useState(null);   // membre pivot pour les filtres
  const [filter,     setFilter]     = useState('all');  // all | immediate | ancestors | descendants | siblings
  const [showSpouses, setShowSpouses] = useState(true);
  const [fields,     setFields]     = useState('full'); // full | nameonly

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (members.length > 0) buildGraph();
  }, [members, unions, situations, selected, root, filter, showSpouses, fields]);

  function fetchAll() {
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/members`,    { headers: h }).then(r => r.json()),
      fetch(`${API}/unions`,     { headers: h }).then(r => r.json()),
      fetch(`${API}/situations`, { headers: h }).then(r => r.json()),
    ]).then(([m, u, s]) => {
      if (Array.isArray(m)) setMembers(m);
      if (Array.isArray(u)) setUnions(u);
      if (Array.isArray(s)) setSituations(s);
    });
  }

  // ── Calcule l'ensemble des membres visibles ────────────────
  function getVisibleIds() {
    const all = members.map(m => m._id?.toString());
    if (!root || filter === 'all') return new Set(all);

    const rid = root._id?.toString();
    let ids = new Set([rid]);

    if (filter === 'immediate') {
      // parents directs
      situations.filter(s => s.child?.toString() === rid).forEach(s => ids.add(s.parent?.toString()));
      // enfants directs
      situations.filter(s => s.parent?.toString() === rid).forEach(s => ids.add(s.child?.toString()));
    }
    if (filter === 'ancestors')   ids = getAncestors(rid, situations);
    if (filter === 'descendants') ids = getDescendants(rid, situations);
    if (filter === 'siblings') {
      ids.add(rid);
      getSiblings(rid, situations).forEach(id => ids.add(id));
      // ajouter les parents pour avoir du contexte
      situations.filter(s => s.child?.toString() === rid).forEach(s => ids.add(s.parent?.toString()));
    }

    // Ajouter conjoints si option activée
    if (showSpouses) {
      const extra = new Set();
      unions.forEach(u => {
        const m1 = u.member1?.toString();
        const m2 = u.member2?.toString();
        if (ids.has(m1)) extra.add(m2);
        if (ids.has(m2)) extra.add(m1);
      });
      extra.forEach(id => ids.add(id));
    }

    return ids;
  }

  // ── Construit nodes + edges reactflow ─────────────────────
  function buildGraph() {
    const visibleIds = getVisibleIds();
    const visibleMembers = members.filter(m => visibleIds.has(m._id?.toString()));
    const selId = selected?._id?.toString();

    const newNodes = visibleMembers.map(m => ({
      id:   m._id.toString(),
      type: 'member',
      data: { member: m, fields, selected: m._id.toString() === selId },
      position: { x: 0, y: 0 }
    }));

    // Edges parent → enfant
    const sitEdges = situations
      .filter(s => visibleIds.has(s.parent?.toString()) && visibleIds.has(s.child?.toString()))
      .map(s => ({
        id:     `sit-${s._id}`,
        source:  s.parent.toString(),
        target:  s.child.toString(),
        markerEnd: { type: MarkerType.ArrowClosed, color: '#374151' },
        style:   { stroke: '#374151', strokeWidth: 1.5 },
        label:   s.isBiological ? '' : 'adopté(e)',
        labelStyle: { fontSize: 10 }
      }));

    // Edges union (tirets rouges)
    const unionEdges = unions
      .filter(u => visibleIds.has(u.member1?.toString()) && visibleIds.has(u.member2?.toString()))
      .map(u => ({
        id:     `union-${u._id}`,
        source:  u.member1.toString(),
        target:  u.member2.toString(),
        style:   { stroke: '#ec4899', strokeDasharray: '6 3', strokeWidth: 2 },
        label:   '💑',
        labelStyle: { fontSize: 11 },
        type:   'straight'
      }));

    const laid = applyLayout(newNodes, sitEdges);
    setNodes(laid);
    setEdges([...sitEdges, ...unionEdges]);
  }

  function onNodeClick(_, node) {
    const m = members.find(m => m._id?.toString() === node.id);
    setSelected(sel => sel?._id?.toString() === node.id ? null : m);
  }

  // Relations du membre sélectionné
  function getRelations(m) {
    if (!m) return {};
    const id = m._id.toString();
    const parents  = situations.filter(s => s.child?.toString()  === id).map(s => members.find(mb => mb._id?.toString() === s.parent?.toString())).filter(Boolean);
    const children = situations.filter(s => s.parent?.toString() === id).map(s => members.find(mb => mb._id?.toString() === s.child?.toString())).filter(Boolean);
    const spouses  = unions.filter(u => u.member1?.toString() === id || u.member2?.toString() === id)
      .map(u => {
        const pid = u.member1?.toString() === id ? u.member2?.toString() : u.member1?.toString();
        return members.find(mb => mb._id?.toString() === pid);
      }).filter(Boolean);
    const siblings = [...getSiblings(id, situations)].map(sid => members.find(mb => mb._id?.toString() === sid)).filter(Boolean);
    return { parents, children, spouses, siblings };
  }

  const rel = getRelations(selected);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Panneau gauche : filtres ── */}
        <div className="tree-sidebar">
          <h3 style={{ margin: '0 0 16px' }}>🎛️ Filtres</h3>

          {/* Sélecteur de pivot */}
          <div className="filter-group">
            <p className="filter-label">Membre pivot</p>
            <select className="auth-input" style={{ fontSize: '0.85rem' }}
              value={root?._id || ''}
              onChange={e => {
                const m = members.find(m => m._id?.toString() === e.target.value);
                setRoot(m || null);
                if (!m) setFilter('all');
              }}>
              <option value="">— Aucun (tout afficher) —</option>
              {members.map(m => <option key={m._id} value={m._id}>{m.firstname} {m.lastname}</option>)}
            </select>
          </div>

          {/* Étendue */}
          <div className="filter-group">
            <p className="filter-label">Étendue</p>
            {[
              { v: 'all',         l: '🌍 Tout afficher',   disabled: false },
              { v: 'immediate',   l: '👨‍👩‍👧 Famille proche',  disabled: !root },
              { v: 'ancestors',   l: '⬆️ Ascendants',       disabled: !root },
              { v: 'descendants', l: '⬇️ Descendants',      disabled: !root },
              { v: 'siblings',    l: '👫 Fratrie',          disabled: !root },
            ].map(opt => (
              <button key={opt.v}
                className={filter === opt.v ? 'filter-btn active' : 'filter-btn'}
                disabled={opt.disabled}
                onClick={() => setFilter(opt.v)}
              >{opt.l}</button>
            ))}
          </div>

          {/* Conjoints */}
          <div className="filter-group">
            <p className="filter-label">Options</p>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showSpouses} onChange={e => setShowSpouses(e.target.checked)} />
              Inclure les conjoints
            </label>
          </div>

          {/* Champs affichés */}
          <div className="filter-group">
            <p className="filter-label">Infos affichées</p>
            <button className={fields === 'full'     ? 'filter-btn active' : 'filter-btn'} onClick={() => setFields('full')}>Complètes</button>
            <button className={fields === 'nameonly' ? 'filter-btn active' : 'filter-btn'} onClick={() => setFields('nameonly')}>Nom seul</button>
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={fetchAll}>
            🔄 Actualiser
          </button>

          <div style={{ marginTop: 16, fontSize: '0.78rem', color: '#aaa' }}>
            <p style={{ margin: '2px 0' }}>── Relation parent-enfant</p>
            <p style={{ margin: '2px 0', color: '#ec4899' }}>- - Union/couple</p>
          </div>
        </div>

        {/* ── Arbre ── */}
        <div style={{ flex: 1 }}>
          {members.length === 0
            ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 48 }}>🌱</span>
                <p>Aucun membre dans l'arbre. Ajoutez des membres d'abord.</p>
              </div>
            : <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
              >
                <Background color="#e5e7eb" gap={20} />
                <Controls />
                <MiniMap nodeColor={n => {
                  const m = members.find(mb => mb._id?.toString() === n.id);
                  return m?.sex === 'M' ? '#3b82f6' : m?.sex === 'F' ? '#ec4899' : '#9ca3af';
                }} />
                <Panel position="top-center">
                  <div style={{ background: 'white', padding: '6px 14px', borderRadius: 20, boxShadow: '0 2px 8px rgba(0,0,0,.15)', fontSize: 12, color: '#555' }}>
                    {nodes.length} membre(s) affiché(s) — cliquez sur un nœud pour voir les détails
                  </div>
                </Panel>
              </ReactFlow>
          }
        </div>

        {/* ── Panneau droit : détails membre sélectionné ── */}
        {selected && (
          <div className="tree-detail-panel">
            <button className="close-btn" onClick={() => setSelected(null)}>✕</button>

            <div className="detail-avatar">
              {selected.photo
                ? <img src={selected.photo} alt="" />
                : <span>{selected.firstname?.[0]}{selected.lastname?.[0]}</span>}
            </div>

            <h3 style={{ margin: '10px 0 4px', textAlign: 'center' }}>{selected.firstname} {selected.lastname}</h3>
            <p style={{ textAlign: 'center', margin: '0 0 12px', color: '#888', fontSize: 12 }}>
              {selected.sex === 'M' ? '♂ Homme' : selected.sex === 'F' ? '♀ Femme' : ''}
            </p>

            {selected.birthDate && <p className="detail-row">🎂 {new Date(selected.birthDate).toLocaleDateString('fr-FR')}</p>}
            {selected.deathDate && <p className="detail-row">✝ {new Date(selected.deathDate).toLocaleDateString('fr-FR')}</p>}
            {selected.profession?.length > 0 && <p className="detail-row">💼 {selected.profession.join(', ')}</p>}
            {selected.publicInfo  && <p className="detail-row">ℹ️ {selected.publicInfo}</p>}

            {rel.spouses?.length > 0 && (
              <div className="detail-section">
                <strong>Conjoint(s)</strong>
                {rel.spouses.map(s => (
                  <p key={s._id} className="detail-row link" onClick={() => { setSelected(s); setRoot(s); }}>
                    💑 {s.firstname} {s.lastname}
                  </p>
                ))}
              </div>
            )}
            {rel.parents?.length > 0 && (
              <div className="detail-section">
                <strong>Parents</strong>
                {rel.parents.map(p => (
                  <p key={p._id} className="detail-row link" onClick={() => { setSelected(p); setRoot(p); }}>
                    ⬆️ {p.firstname} {p.lastname}
                  </p>
                ))}
              </div>
            )}
            {rel.siblings?.length > 0 && (
              <div className="detail-section">
                <strong>Fratrie</strong>
                {rel.siblings.map(s => (
                  <p key={s._id} className="detail-row link" onClick={() => { setSelected(s); setRoot(s); }}>
                    👫 {s.firstname} {s.lastname}
                  </p>
                ))}
              </div>
            )}
            {rel.children?.length > 0 && (
              <div className="detail-section">
                <strong>Enfants</strong>
                {rel.children.map(c => (
                  <p key={c._id} className="detail-row link" onClick={() => { setSelected(c); setRoot(c); }}>
                    ⬇️ {c.firstname} {c.lastname}
                  </p>
                ))}
              </div>
            )}

            <button className="btn-primary" style={{ width: '100%', marginTop: 16, fontSize: '0.85rem' }}
              onClick={() => { setRoot(selected); setFilter('immediate'); }}>
              Centrer sur ce membre
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
