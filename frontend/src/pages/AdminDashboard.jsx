import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { menuAPI, categoryAPI, orderAPI, tablesAPI } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';

function StatsView() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    orderAPI.getStats().then(res => setStats(res.data)).catch(console.error);
  }, []);
  if (!stats) return <div className="page-loader"><div className="loader-spinner" /></div>;
  return (
    <>
      <h2 className="admin-title">📊 Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-card-value">{stats.total_orders}</div><div className="stat-card-label">Orders Today</div></div>
        <div className="stat-card"><div className="stat-card-value" style={{color:'var(--success)'}}>{parseFloat(stats.total_revenue).toFixed(0)}</div><div className="stat-card-label">Revenue (SAR)</div></div>
        <div className="stat-card"><div className="stat-card-value" style={{color:'var(--warning)'}}>{stats.by_status?.find(s=>s.status==='pending')?.count||0}</div><div className="stat-card-label">Pending</div></div>
        <div className="stat-card"><div className="stat-card-value" style={{color:'var(--info)'}}>{stats.by_status?.find(s=>s.status==='delivered')?.count||0}</div><div className="stat-card-label">Delivered</div></div>
      </div>
      {stats.top_items?.length > 0 && (
        <div className="glass-card" style={{padding:'1.2rem'}}>
          <h4 style={{fontFamily:'Outfit',marginBottom:'0.8rem'}}>🏆 Top Items Today</h4>
          <table className="data-table"><thead><tr><th>Item</th><th>Qty</th><th>Sales</th></tr></thead><tbody>
            {stats.top_items.map((item,i) => (
              <tr key={i}><td>{item.name}</td><td>{item.total_qty}</td><td style={{color:'var(--accent)'}}>{parseFloat(item.total_sales).toFixed(2)} SAR</td></tr>
            ))}
          </tbody></table>
        </div>
      )}
    </>
  );
}

function MenuManager() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name:'', description:'', price:'', category_id:'', is_available:true, is_featured:false, tags:'', prep_time_mins:'15', image_url:'' });

  const loadData = useCallback(() => {
    menuAPI.getAll().then(res => {
      const all = [];
      (res.data.categories||[]).forEach(c => c.items.forEach(i => all.push({...i, category_name:c.name})));
      setItems(all);
    });
    categoryAPI.getAll(true).then(res => setCategories(res.data||[]));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openForm = (item = null) => {
    if (item) {
      setForm({ name:item.name, description:item.description||'', price:item.price, category_id:item.category_id, is_available:!!item.is_available, is_featured:!!item.is_featured, tags:item.tags||'', prep_time_mins:item.prep_time_mins||15, image_url:item.image_url||'' });
      setEditItem(item);
    } else {
      setForm({ name:'', description:'', price:'', category_id:categories[0]?.id||'', is_available:true, is_featured:false, tags:'', prep_time_mins:'15', image_url:'' });
      setEditItem(null);
    }
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: parseFloat(form.price), category_id: parseInt(form.category_id), prep_time_mins: parseInt(form.prep_time_mins), is_available: form.is_available ? 1 : 0, is_featured: form.is_featured ? 1 : 0 };
    if (editItem) await menuAPI.update(editItem.id, payload);
    else await menuAPI.create(payload);
    setShowForm(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    await menuAPI.delete(id);
    loadData();
  };

  return (
    <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h2 className="admin-title" style={{margin:0}}>🍽️ Menu Items</h2>
        <button className="btn btn-primary btn-sm" onClick={() => openForm()} id="add-item-btn">+ Add Item</button>
      </div>

      <div className="glass-card" style={{overflow:'auto'}}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td style={{fontWeight:600}}>{item.name}</td>
                <td>{item.category_name}</td>
                <td style={{color:'var(--accent)'}}>{parseFloat(item.price).toFixed(2)}</td>
                <td><span className={`status ${item.is_available?'status-ready':'status-cancelled'}`}>{item.is_available?'Available':'Unavailable'}</span></td>
                <td style={{display:'flex',gap:'0.3rem'}}>
                  <button className="btn btn-outline btn-sm" onClick={() => openForm(item)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()} style={{borderRadius:'var(--radius-lg)',maxWidth:'500px',margin:'auto'}}>
            <div className="modal-body">
              <h3 style={{fontFamily:'Outfit',marginBottom:'1rem'}}>{editItem ? 'Edit Item' : 'New Item'}</h3>
              <form onSubmit={handleSave}>
                <div className="input-group" style={{marginBottom:'0.8rem'}}><label>Name</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /></div>
                <div className="input-group" style={{marginBottom:'0.8rem'}}><label>Description</label><textarea className="textarea" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.8rem',marginBottom:'0.8rem'}}>
                  <div className="input-group"><label>Price (SAR)</label><input className="input" type="number" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required /></div>
                  <div className="input-group"><label>Prep Time (min)</label><input className="input" type="number" value={form.prep_time_mins} onChange={e=>setForm({...form,prep_time_mins:e.target.value})} /></div>
                </div>
                <div className="input-group" style={{marginBottom:'0.8rem'}}><label>Category</label>
                  <select className="select" value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{marginBottom:'0.8rem'}}><label>Image URL</label><input className="input" value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://..." /></div>
                <div className="input-group" style={{marginBottom:'0.8rem'}}><label>Tags (comma-separated)</label><input className="input" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="popular,new,spicy" /></div>
                <div style={{display:'flex',gap:'1.5rem',marginBottom:'1.2rem'}}>
                  <label style={{display:'flex',alignItems:'center',gap:'0.4rem',cursor:'pointer'}}><input type="checkbox" checked={form.is_available} onChange={e=>setForm({...form,is_available:e.target.checked})} /> Available</label>
                  <label style={{display:'flex',alignItems:'center',gap:'0.4rem',cursor:'pointer'}}><input type="checkbox" checked={form.is_featured} onChange={e=>setForm({...form,is_featured:e.target.checked})} /> Featured</label>
                </div>
                <div style={{display:'flex',gap:'0.5rem'}}>
                  <button type="submit" className="btn btn-primary" id="save-item-btn">Save</button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  useEffect(() => {
    orderAPI.getAll(filter || undefined).then(res => setOrders(res.data||[])).catch(console.error);
  }, [filter]);
  return (
    <>
      <h2 className="admin-title">📋 Order History</h2>
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem',flexWrap:'wrap'}}>
        {['','pending','preparing','ready','delivered','cancelled'].map(s => (
          <button key={s} className={`category-chip ${filter===s?'active':''}`} onClick={()=>setFilter(s)}>{s||'All'}</button>
        ))}
      </div>
      <div className="glass-card" style={{overflow:'auto'}}>
        <table className="data-table">
          <thead><tr><th>#</th><th>Table</th><th>Customer</th><th>Total</th><th>Status</th><th>Prepared By</th><th>Time</th></tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td style={{fontWeight:700}}>#{o.id}</td>
                <td>{o.table_number}</td>
                <td>{o.customer_name}</td>
                <td style={{color:'var(--accent)'}}>{parseFloat(o.total_price).toFixed(2)}</td>
                <td><span className={`status status-${o.status}`}>{o.status}</span></td>
                <td>{o.prepared_by ? `👨‍🍳 ${o.prepared_by}` : <span style={{color:'var(--text-muted)'}}>-</span>}</td>
                <td style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{new Date(o.created_at).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TablesQR() {
  const [tables, setTables] = useState([]);
  useEffect(() => {
    tablesAPI.getAll().then(res => setTables(res.data||[])).catch(console.error);
  }, []);

  return (
    <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h2 className="admin-title" style={{margin:0}}>🖨️ Table QR Codes</h2>
        <button className="btn btn-primary btn-sm" onClick={() => window.print()}>Print QR Codes</button>
      </div>
      <p style={{color:'var(--text-secondary)', marginBottom:'2rem'}}>
        Print these codes and place them on your physical tables. Customers will scan them to open the menu.
      </p>
      <div className="kitchen-grid">
        {tables.map(t => {
          const url = `${window.location.origin}/menu?table=${t.id}`;
          return (
            <div key={t.id} className="stat-card" style={{textAlign:'center', padding:'2rem'}}>
              <h3 style={{fontFamily:'Outfit', marginBottom:'1.5rem'}}>Table {t.table_number}</h3>
              <div style={{background:'#fff', padding:'1rem', display:'inline-block', borderRadius:'8px', marginBottom:'1rem'}}>
                <QRCodeSVG value={url} size={180} fgColor="#0D0D0D" bgColor="#ffffff" />
              </div>
              <p style={{fontSize:'0.85rem', color:'var(--text-muted)', wordBreak:'break-all'}}>{url}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}

function KitchenLeaderboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    orderAPI.getStats().then(res => setStats(res.data)).catch(console.error);
  }, []);

  if (!stats) return <div className="page-loader"><div className="loader-spinner" /></div>;

  const leaderboard = stats.leaderboard || [];

  return (
    <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <h2 className="admin-title" style={{margin:0}}>🏆 Kitchen Stars</h2>
      </div>
      <p style={{color:'var(--text-secondary)', marginBottom:'2rem'}}>
        Leaderboard ranking based on successful orders prepared today.
      </p>
      
      {leaderboard.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👨‍🍳</div>
          <p className="empty-state-text">No orders prepared by chefs yet today.</p>
        </div>
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem'}}>
          {leaderboard.map((chef, idx) => (
            <div key={idx} style={{
              background: '#1A1A1A', 
              borderRadius: 'var(--radius-lg)', 
              padding: '3rem 2rem', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid rgba(197, 131, 97, 0.15)',
              boxShadow: 'var(--shadow-lg)',
              transition: 'var(--transition)'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(197, 131, 97, 0.15)'; }}
            >
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%', 
                background: 'rgba(197, 131, 97, 0.1)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem',
                border: '1px solid var(--accent)'
              }}>
                #{idx + 1}
              </div>
              <h3 style={{color: '#FFFFFF', fontFamily: 'Outfit', fontSize: '1.6rem', margin: '0 0 0.6rem 0', letterSpacing: '1px'}}>
                {chef.prepared_by}
              </h3>
              <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', margin: 0, letterSpacing: '0.5px'}}>
                Preparation Star: <span style={{color: 'var(--accent)', fontWeight: 'bold'}}>{chef.orders_count}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');

  useEffect(() => { 
    if (!user) navigate('/admin/login'); 
    else if (user.role !== 'admin') navigate('/kitchen');
  }, [user, navigate]);
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div style={{padding:'0 1.5rem',marginBottom:'2rem'}}>
          <div className="logo" style={{fontSize:'1.1rem'}}>✦ AURA ADMIN</div>
          <p style={{color:'var(--text-muted)',fontSize:'0.75rem',marginTop:'0.3rem'}}>{user.email}</p>
        </div>
        <ul className="admin-nav">
          <li><a className={tab==='dashboard'?'active':''} onClick={()=>setTab('dashboard')} style={{cursor:'pointer'}}>📊 Dashboard</a></li>
          <li><a className={tab==='menu'?'active':''} onClick={()=>setTab('menu')} style={{cursor:'pointer'}}>🍽️ Menu Items</a></li>
          <li><a className={tab==='orders'?'active':''} onClick={()=>setTab('orders')} style={{cursor:'pointer'}}>📋 Orders</a></li>
          <li><a className={tab==='qr'?'active':''} onClick={()=>setTab('qr')} style={{cursor:'pointer'}}>🖨️ QR Codes</a></li>
          <li><a className={tab==='kitchen'?'active':''} onClick={()=>setTab('kitchen')} style={{cursor:'pointer'}}>🏆 Kitchen Stars</a></li>
        </ul>
        <div style={{padding:'1rem 1.5rem'}}>
          <button className="btn btn-outline btn-sm w-full" onClick={() => { logout(); navigate('/admin/login'); }} id="logout-btn">Logout</button>
        </div>
      </aside>
      <main className="admin-main">
        {tab === 'dashboard' && <StatsView />}
        {tab === 'menu' && <MenuManager />}
        {tab === 'orders' && <OrderHistory />}
        {tab === 'qr' && <TablesQR />}
        {tab === 'kitchen' && <KitchenLeaderboard />}
      </main>
    </div>
  );
}
