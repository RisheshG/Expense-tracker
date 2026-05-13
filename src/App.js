import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  Plus, Trash2, X, ChevronRight, TrendingUp, TrendingDown,
  Wallet, Target, Receipt, Tag, Calendar, FileText,
  AlertCircle, CheckCircle, Zap, LayoutGrid, List, Edit3
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const month = () => new Date().toISOString().slice(0, 7);
const uid = () => Math.random().toString(36).slice(2, 9);
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CAT_COLORS = [
  '#6c63ff','#ff6584','#43e97b','#f7971e','#38b6ff',
  '#ff9a3c','#a78bfa','#34d399','#fb7185','#fbbf24',
  '#60a5fa','#f472b6','#4ade80','#c084fc'
];

const DEFAULT_CATS = [
  { id: 'rent',      name: 'Rent / RentoMojo', icon: '🏠', color: CAT_COLORS[0] },
  { id: 'elec',      name: 'Electricity',      icon: '⚡', color: CAT_COLORS[1] },
  { id: 'grocery',   name: 'Grocery',          icon: '🛒', color: CAT_COLORS[2] },
  { id: 'commute',   name: 'Commute',          icon: '🚇', color: CAT_COLORS[3] },
  { id: 'subs',      name: 'Subscriptions',    icon: '📱', color: CAT_COLORS[4] },
  { id: 'ac',        name: 'Air Conditioner',  icon: '❄️', color: CAT_COLORS[5] },
  { id: 'weekend',   name: 'Weekends',         icon: '🎉', color: CAT_COLORS[6] },
  { id: 'cc',        name: 'Credit Card Bill', icon: '💳', color: CAT_COLORS[7] },
  { id: 'allowance', name: 'Monthly Allowance',icon: '👨‍👩‍👧', color: CAT_COLORS[8] },
  { id: 'sip',       name: 'SIP',              icon: '📈', color: CAT_COLORS[9] },
  { id: 'emergency', name: 'Emergency Fund',   icon: '🛡️', color: CAT_COLORS[10] },
  { id: 'misc',      name: 'Miscellaneous',    icon: '📦', color: CAT_COLORS[11] },
];

// ─── Local Storage ────────────────────────────────────────────────────────────
const load = (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

// ─── Styles (inline for portability) ─────────────────────────────────────────
const S = {
  app: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' },
  header: {
    background: 'linear-gradient(135deg, #0d0d18 0%, #111128 100%)',
    borderBottom: '1px solid var(--border)',
    padding: '0 24px',
    position: 'sticky', top: 0, zIndex: 100,
    backdropFilter: 'blur(20px)',
  },
  headerInner: { maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 },
  logo: { fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10 },
  logoAccent: { color: 'var(--accent)' },
  nav: { display: 'flex', gap: 4 },
  navBtn: (active) => ({
    padding: '8px 18px', borderRadius: 10, fontFamily: 'Syne', fontWeight: 600,
    fontSize: 14, transition: 'all .2s',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text2)',
    cursor: 'pointer', border: 'none',
  }),
  main: { maxWidth: 1100, margin: '0 auto', width: '100%', padding: '28px 24px', flex: 1 },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 20, padding: 24, transition: 'border-color .2s',
  },
  cardTitle: { fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 16 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 },
  statCard: (color) => ({
    background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
    border: `1px solid ${color}30`,
    borderRadius: 20, padding: 20,
  }),
  statLabel: { fontSize: 13, color: 'var(--text2)', fontWeight: 500, marginBottom: 6 },
  statVal: { fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: 'var(--text)' },
  statSub: { fontSize: 12, color: 'var(--text3)', marginTop: 4 },
  input: {
    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '12px 16px', color: 'var(--text)', fontSize: 15,
    transition: 'border-color .2s',
  },
  btn: (color = 'var(--accent)') => ({
    background: color, color: '#fff', padding: '12px 22px',
    borderRadius: 12, fontFamily: 'Syne', fontWeight: 700, fontSize: 14,
    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
    transition: 'opacity .15s, transform .1s',
  }),
  pill: (color) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: `${color}22`, color: color, borderRadius: 20,
    padding: '3px 10px', fontSize: 12, fontWeight: 600,
  }),
  row: { display: 'flex', alignItems: 'center', gap: 12 },
  spacer: { flex: 1 },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2800); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: 'var(--success)', error: 'var(--danger)', info: 'var(--accent)' };
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 999,
      background: 'var(--surface)', border: `1px solid ${colors[type] || colors.info}`,
      borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: `0 8px 32px ${colors[type]}40`, animation: 'slideUp .25s ease',
      maxWidth: 340, fontSize: 14, color: 'var(--text)',
    }}>
      {type === 'success' ? <CheckCircle size={18} color="var(--success)" /> :
       type === 'error' ? <AlertCircle size={18} color="var(--danger)" /> :
       <Zap size={18} color="var(--accent)" />}
      {msg}
    </div>
  );
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────
function AddExpenseModal({ cats, onSave, onClose }) {
  const [catId, setCatId] = useState(cats[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const cat = cats.find(c => c.id === catId);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000a', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)', animation: 'fadeIn .2s ease',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 24, padding: 28, width: '100%', maxWidth: 460,
        boxShadow: '0 24px 64px #000a', animation: 'slideUp .25s ease',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ ...S.row, marginBottom: 24 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20 }}>Add Expense</div>
          <div style={S.spacer} />
          <button onClick={onClose} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 8, color: 'var(--text2)', cursor: 'pointer' }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {cats.map(c => (
                <button key={c.id} onClick={() => setCatId(c.id)} style={{
                  background: catId === c.id ? `${c.color}30` : 'var(--surface2)',
                  border: `1.5px solid ${catId === c.id ? c.color : 'var(--border)'}`,
                  borderRadius: 12, padding: '10px 8px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 5, cursor: 'pointer', transition: 'all .15s',
                }}>
                  <span style={{ fontSize: 20 }}>{c.icon}</span>
                  <span style={{ fontSize: 10, color: catId === c.id ? c.color : 'var(--text2)', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Amount (₹)</label>
            <input style={{ ...S.input, fontSize: 24, fontFamily: 'Syne', fontWeight: 700 }}
              type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Date</label>
            <input style={S.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Note (optional)</label>
            <textarea style={{ ...S.input, resize: 'none', height: 72 }}
              placeholder="What was this for?" value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <button style={{ ...S.btn(cat?.color || 'var(--accent)'), justifyContent: 'center', padding: '14px 22px' }}
            onClick={() => {
              if (!amount || isNaN(amount) || Number(amount) <= 0) return;
              onSave({ id: uid(), catId, amount: Number(amount), note, date });
            }}>
            <Plus size={18} /> Save Expense
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Category Modal ───────────────────────────────────────────────────────
function AddCatModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📌');
  const [color, setColor] = useState(CAT_COLORS[0]);
  const EMOJIS = ['📌','🏠','🍕','🎮','💊','✈️','📚','🎵','🛍️','💡','🏋️','🎨','🐾','🌱'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000a', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 24px 64px #000a' }} onClick={e => e.stopPropagation()}>
        <div style={{ ...S.row, marginBottom: 24 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20 }}>New Category</div>
          <div style={S.spacer} />
          <button onClick={onClose} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: 8, color: 'var(--text2)', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Icon</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setIcon(e)} style={{ fontSize: 22, background: icon === e ? 'var(--surface3)' : 'transparent', border: `1.5px solid ${icon === e ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 10, padding: 8, cursor: 'pointer' }}>{e}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Name</label>
            <input style={S.input} placeholder="Category name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {CAT_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', transform: color === c ? 'scale(1.2)' : 'scale(1)', transition: 'all .15s' }} />
              ))}
            </div>
          </div>
          <button style={{ ...S.btn(color), justifyContent: 'center' }} onClick={() => { if (!name.trim()) return; onSave({ id: uid(), name: name.trim(), icon, color }); }}>
            <Plus size={16} /> Create Category
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function Dashboard({ salary, expenses, cats, selMonth, onAddExp }) {
  const monthExp = expenses.filter(e => e.date.startsWith(selMonth));
  const total = monthExp.reduce((s, e) => s + e.amount, 0);
  const remaining = salary - total;
  const pct = salary > 0 ? Math.min(100, (total / salary) * 100) : 0;

  const catTotals = cats.map(c => ({
    ...c,
    total: monthExp.filter(e => e.catId === c.id).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const pieData = catTotals.map(c => ({ name: c.name, value: c.total, color: c.color, icon: c.icon }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 13 }}>
        <div style={{ fontWeight: 700 }}>{d.icon} {d.name}</div>
        <div style={{ color: d.color, fontFamily: 'Syne', fontWeight: 700 }}>{fmt(d.value)}</div>
        <div style={{ color: 'var(--text2)' }}>{salary > 0 ? ((d.value / salary) * 100).toFixed(1) : 0}% of salary</div>
      </div>
    );
  };

  const healthColor = pct < 60 ? 'var(--success)' : pct < 85 ? 'var(--warn)' : 'var(--danger)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Salary Overview */}
      <div style={{ ...S.card, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', border: '1px solid #2a2a5a' }}>
        <div style={{ ...S.row, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>Monthly Budget Health</div>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 36, color: 'var(--text)' }}>{fmt(total)}</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>spent of {fmt(salary)} salary</div>
          </div>
          <div style={S.spacer} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ ...S.pill(healthColor), fontSize: 14, padding: '6px 16px', fontFamily: 'Syne', fontWeight: 700 }}>
              {pct.toFixed(1)}% used
            </div>
            <div style={{ color: remaining >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'Syne', fontWeight: 700, fontSize: 18, marginTop: 8 }}>
              {remaining >= 0 ? '+' : ''}{fmt(remaining)}
            </div>
            <div style={{ color: 'var(--text2)', fontSize: 12 }}>{remaining >= 0 ? 'remaining' : 'over budget'}</div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${healthColor}80, ${healthColor})`, borderRadius: 99, transition: 'width .6s ease' }} />
        </div>
        <div style={{ ...S.row, marginTop: 10, fontSize: 12, color: 'var(--text2)' }}>
          <span>₹0</span><div style={S.spacer} /><span>{fmt(salary)}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={S.grid3}>
        {[
          { label: 'Total Spent', val: fmt(total), sub: `${monthExp.length} transactions`, color: '#ff6584', Icon: Receipt },
          { label: 'Remaining', val: fmt(Math.max(0, remaining)), sub: remaining < 0 ? '⚠️ Over budget' : '✅ On track', color: '#43e97b', Icon: Wallet },
          { label: 'Daily Avg', val: fmt(Math.round(total / new Date().getDate())), sub: 'this month', color: '#6c63ff', Icon: TrendingUp },
        ].map(({ label, val, sub, color, Icon }) => (
          <div key={label} style={S.statCard(color)}>
            <div style={{ ...S.row, marginBottom: 12 }}>
              <div style={{ background: `${color}22`, borderRadius: 10, padding: 8 }}><Icon size={18} color={color} /></div>
              <div style={S.spacer} />
            </div>
            <div style={S.statLabel}>{label}</div>
            <div style={S.statVal}>{val}</div>
            <div style={S.statSub}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + Top Categories */}
      {catTotals.length > 0 ? (
        <div style={S.grid2}>
          <div style={S.card}>
            <div style={S.cardTitle}>💰 Spending Breakdown</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>📊 Top Categories</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {catTotals.slice(0, 6).map(c => (
                <div key={c.id}>
                  <div style={{ ...S.row, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{c.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{c.name}</span>
                    <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14 }}>{fmt(c.total)}</span>
                  </div>
                  <div style={{ background: 'var(--surface2)', borderRadius: 99, height: 5 }}>
                    <div style={{ width: `${salary > 0 ? (c.total / salary) * 100 : 0}%`, height: '100%', background: c.color, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ ...S.card, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No expenses yet</div>
          <div style={{ color: 'var(--text2)', marginBottom: 20 }}>Start tracking to see your spending breakdown</div>
          <button style={{ ...S.btn(), margin: '0 auto' }} onClick={onAddExp}><Plus size={16} /> Add First Expense</button>
        </div>
      )}
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────
function Categories({ cats, expenses, salary, selMonth, onAddCat, onDeleteCat }) {
  const monthExp = expenses.filter(e => e.date.startsWith(selMonth));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ ...S.row }}>
        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20 }}>All Categories</div>
        <div style={S.spacer} />
        <button style={S.btn()} onClick={onAddCat}><Plus size={16} /> New Category</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {cats.map(c => {
          const catExp = monthExp.filter(e => e.catId === c.id);
          const total = catExp.reduce((s, e) => s + e.amount, 0);
          const pct = salary > 0 ? (total / salary) * 100 : 0;
          return (
            <div key={c.id} style={{ ...S.card, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.color, borderRadius: '20px 20px 0 0' }} />
              <div style={{ ...S.row, marginBottom: 12 }}>
                <div style={{ background: `${c.color}22`, borderRadius: 12, padding: 10, fontSize: 22 }}>{c.icon}</div>
                <div style={S.spacer} />
                {!DEFAULT_CATS.find(d => d.id === c.id) && (
                  <button onClick={() => onDeleteCat(c.id)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: 6, color: 'var(--text3)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                )}
              </div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.name}</div>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: c.color, marginBottom: 4 }}>{fmt(total)}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>{catExp.length} transactions · {pct.toFixed(1)}% of salary</div>
              <div style={{ background: 'var(--surface2)', borderRadius: 99, height: 4 }}>
                <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: c.color, borderRadius: 99, transition: 'width .5s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────
function Transactions({ expenses, cats, onDelete }) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [view, setView] = useState('list');

  const filtered = useMemo(() => {
    return expenses
      .filter(e => filterCat === 'all' || e.catId === filterCat)
      .filter(e => !search || e.note?.toLowerCase().includes(search.toLowerCase()) ||
        cats.find(c => c.id === e.catId)?.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, filterCat, search, cats]);

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(e => { if (!g[e.date]) g[e.date] = []; g[e.date].push(e); });
    return g;
  }, [filtered]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ ...S.card }}>
        <div style={{ ...S.row, gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <input style={{ ...S.input, paddingLeft: 40 }} placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} />
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>🔍</span>
          </div>
          <select style={{ ...S.input, width: 'auto', cursor: 'pointer' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="all">All categories</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {[['list','List'], ['grid','Grid']].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '10px 14px', background: view === v ? 'var(--accent)' : 'transparent', color: view === v ? '#fff' : 'var(--text2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, transition: 'all .15s' }}>
                {v === 'list' ? <List size={14} /> : <LayoutGrid size={14} />} {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ color: 'var(--text2)' }}>No transactions found</div>
        </div>
      ) : view === 'list' ? (
        Object.entries(grouped).map(([date, txns]) => {
          const d = new Date(date + 'T00:00:00');
          const dayTotal = txns.reduce((s, e) => s + e.amount, 0);
          return (
            <div key={date}>
              <div style={{ ...S.row, marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>
                  {d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                <div style={S.spacer} />
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{fmt(dayTotal)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {txns.map(e => {
                  const cat = cats.find(c => c.id === e.catId);
                  return (
                    <div key={e.id} style={{ ...S.card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ background: `${cat?.color}22`, borderRadius: 12, padding: 10, fontSize: 20 }}>{cat?.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{cat?.name}</div>
                        {e.note && <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>📝 {e.note}</div>}
                      </div>
                      <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: cat?.color }}>{fmt(e.amount)}</div>
                      <button onClick={() => onDelete(e.id)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, color: 'var(--text3)', cursor: 'pointer', flexShrink: 0 }}><Trash2 size={14} /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {filtered.map(e => {
            const cat = cats.find(c => c.id === e.catId);
            const d = new Date(e.date + 'T00:00:00');
            return (
              <div key={e.id} style={{ ...S.card, padding: 16, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: cat?.color, borderRadius: '20px 20px 0 0' }} />
                <div style={{ fontSize: 28, marginBottom: 10 }}>{cat?.icon}</div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: cat?.color, marginBottom: 4 }}>{fmt(e.amount)}</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{cat?.name}</div>
                {e.note && <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 8 }}>📝 {e.note}</div>}
                <div style={{ color: 'var(--text3)', fontSize: 11 }}>{d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                <button onClick={() => onDelete(e.id)} style={{ position: 'absolute', top: 12, right: 12, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: 6, color: 'var(--text3)', cursor: 'pointer' }}><Trash2 size={12} /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function Analytics({ expenses, cats, salary }) {
  const last6 = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = d.toISOString().slice(0, 7);
      const total = expenses.filter(e => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      return { month: months[d.getMonth()], total, key };
    });
  }, [expenses]);

  const CustomBar = ({ x, y, width, height, index }) => {
    const cur = last6[index];
    const pct = salary > 0 ? cur.total / salary : 0;
    const color = pct < 0.6 ? '#43e97b' : pct < 0.85 ? '#f7971e' : '#ff4d6d';
    return <rect x={x} y={y} width={width} height={height} fill={color} rx={6} />;
  };

  const allCatTotals = cats.map(c => ({
    ...c, total: expenses.filter(e => e.catId === c.id).reduce((s, e) => s + e.amount, 0)
  })).sort((a, b) => b.total - a.total);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={S.card}>
        <div style={S.cardTitle}>📈 6-Month Spending Trend</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={last6} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: 'var(--text2)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'k' : v)} />
            <Tooltip formatter={(v) => [fmt(v), 'Spent']} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }} />
            {salary > 0 && <Bar dataKey={() => salary} fill="transparent" stroke="var(--accent)" strokeDasharray="4" />}
            <Bar dataKey="total" shape={<CustomBar />} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>🏆 All-Time Category Totals</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allCatTotals.filter(c => c.total > 0).map((c, i) => {
            const maxTotal = allCatTotals[0]?.total || 1;
            return (
              <div key={c.id} style={{ ...S.row, gap: 12 }}>
                <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ ...S.row, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                    <div style={S.spacer} />
                    <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: c.color }}>{fmt(c.total)}</span>
                  </div>
                  <div style={{ background: 'var(--surface2)', borderRadius: 99, height: 6 }}>
                    <div style={{ width: `${(c.total / maxTotal) * 100}%`, height: '100%', background: c.color, borderRadius: 99 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function Settings({ salary, onSalaryChange }) {
  const [val, setVal] = useState(salary || '');
  return (
    <div style={{ maxWidth: 500 }}>
      <div style={S.card}>
        <div style={S.cardTitle}>⚙️ Settings</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Monthly Salary (₹)</label>
            <div style={{ ...S.row, gap: 10 }}>
              <input style={{ ...S.input, fontFamily: 'Syne', fontWeight: 700, fontSize: 20 }}
                type="number" placeholder="Enter your salary" value={val} onChange={e => setVal(e.target.value)} />
              <button style={S.btn()} onClick={() => onSalaryChange(Number(val))}><CheckCircle size={16} /> Save</button>
            </div>
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>💾 Data Storage</div>
            <div style={{ color: 'var(--text2)', fontSize: 13 }}>All your data is stored locally in your browser. Nothing is sent to any server.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [salary, setSalary] = useState(() => load('et_salary', 0));
  const [cats, setCats] = useState(() => load('et_cats', DEFAULT_CATS));
  const [expenses, setExpenses] = useState(() => load('et_expenses', []));
  const [selMonth, setSelMonth] = useState(month());
  const [showAddExp, setShowAddExp] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { save('et_salary', salary); }, [salary]);
  useEffect(() => { save('et_cats', cats); }, [cats]);
  useEffect(() => { save('et_expenses', expenses); }, [expenses]);

  const notify = (msg, type = 'success') => setToast({ msg, type });

  const handleAddExp = (e) => {
    setExpenses(prev => [...prev, e]);
    setShowAddExp(false);
    notify('Expense added! 💸');
  };

  const handleDeleteExp = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    notify('Expense deleted', 'info');
  };

  const handleAddCat = (c) => {
    setCats(prev => [...prev, c]);
    setShowAddCat(false);
    notify(`"${c.name}" category created! 🎉`);
  };

  const handleDeleteCat = (id) => {
    setCats(prev => prev.filter(c => c.id !== id));
    setExpenses(prev => prev.filter(e => e.catId !== id));
    notify('Category removed', 'info');
  };

  const handleSalary = (v) => {
    setSalary(v);
    notify(`Salary set to ${fmt(v)} 💰`);
  };

  const TABS = [
    { id: 'dashboard', label: '🏠 Dashboard' },
    { id: 'categories', label: '🏷️ Categories' },
    { id: 'transactions', label: '📋 Transactions' },
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'settings', label: '⚙️ Settings' },
  ];

  // Months for selector
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    return d.toISOString().slice(0, 7);
  });

  return (
    <div style={S.app}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        button:active { transform: scale(.97) !important; }
        input:focus, textarea:focus, select:focus { border-color: var(--accent) !important; }
        select option { background: #1a1a24; }
      `}</style>

      {/* Header */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.logo}>
            <span style={{ background: 'var(--accent)', borderRadius: 10, padding: '6px 8px', fontSize: 16 }}>💰</span>
            <span>Paisa<span style={S.logoAccent}>Track</span></span>
          </div>
          <nav style={S.nav}>
            {TABS.map(t => (
              <button key={t.id} style={S.navBtn(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </nav>
          <div style={S.row}>
            {(tab === 'dashboard' || tab === 'categories') && (
              <select value={selMonth} onChange={e => setSelMonth(e.target.value)}
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
                {monthOptions.map(m => {
                  const [yr, mo] = m.split('-');
                  return <option key={m} value={m}>{months[parseInt(mo)-1]} {yr}</option>;
                })}
              </select>
            )}
            <button style={S.btn()} onClick={() => setShowAddExp(true)}>
              <Plus size={16} /> Add Expense
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={S.main}>
        {!salary && tab !== 'settings' && (
          <div style={{ ...S.card, background: 'linear-gradient(135deg, #2a1a00, #1a1000)', border: '1px solid #f7971e40', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <AlertCircle size={20} color="var(--warn)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600 }}>Set your salary </span>
              <span style={{ color: 'var(--text2)', fontSize: 14 }}>to see budget percentages and health indicators</span>
            </div>
            <button style={S.btn('var(--warn)')} onClick={() => setTab('settings')}>Go to Settings <ChevronRight size={16} /></button>
          </div>
        )}

        {tab === 'dashboard' && <Dashboard salary={salary} expenses={expenses} cats={cats} selMonth={selMonth} onAddExp={() => setShowAddExp(true)} />}
        {tab === 'categories' && <Categories cats={cats} expenses={expenses} salary={salary} selMonth={selMonth} onAddCat={() => setShowAddCat(true)} onDeleteCat={handleDeleteCat} />}
        {tab === 'transactions' && <Transactions expenses={expenses} cats={cats} onDelete={handleDeleteExp} />}
        {tab === 'analytics' && <Analytics expenses={expenses} cats={cats} salary={salary} />}
        {tab === 'settings' && <Settings salary={salary} onSalaryChange={handleSalary} />}
      </main>

      {/* Modals */}
      {showAddExp && <AddExpenseModal cats={cats} onSave={handleAddExp} onClose={() => setShowAddExp(false)} />}
      {showAddCat && <AddCatModal onSave={handleAddCat} onClose={() => setShowAddCat(false)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}