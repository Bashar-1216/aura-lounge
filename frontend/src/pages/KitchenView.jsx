import { useState, useCallback, useEffect, useRef } from 'react';
import { orderAPI, staffAPI } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];

function nextStatus(current) {
  const idx = STATUS_FLOW.indexOf(current);
  return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
}

function statusBtnLabel(status) {
  const map = { pending: '▶ Start', confirmed: '👨‍🍳 Prepare', preparing: '✓ Ready', ready: '📦 Deliver' };
  return map[status] || '';
}

function statusBtnClass(status) {
  const map = { pending: 'btn-primary', confirmed: 'btn-warning', preparing: 'btn-success', ready: 'btn-outline' };
  return map[status] || 'btn-primary';
}

export default function KitchenView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeStaff, setActiveStaff] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
    } else {
      staffAPI.getAll(true).then(res => setActiveStaff(res.data||[])).catch(console.error);
    }
  }, [user, navigate]);

  const fetchOrders = useCallback(() => orderAPI.getAll('pending,confirmed,preparing,ready'), []);
  const { data: orders, loading, refresh, error } = usePolling(fetchOrders, 5000);
  const [updating, setUpdating] = useState({});
  const prevCountRef = useRef(0);

  // Play sound on new order
  useEffect(() => {
    if (orders && orders.length > prevCountRef.current) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) { /* ignore audio errors */ }
    }
    if (orders) prevCountRef.current = orders.length;
  }, [orders]);

  const handleStatusChange = async (orderId, newStatus, chefName = null) => {
    setUpdating(prev => ({ ...prev, [orderId]: true }));
    try {
      const name = chefName || user?.name || 'Kitchen Staff';
      await orderAPI.updateStatus(orderId, newStatus, name);
      refresh();
    } catch (err) {
      console.error(err);
      alert('Error updating status. Please ensure you added the prepared_by column and staff table.');
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const grouped = { pending: [], confirmed: [], preparing: [], ready: [] };
  (orders || []).forEach(o => {
    if (grouped[o.status]) grouped[o.status].push(o);
  });

  const stats = {
    pending: grouped.pending.length,
    preparing: grouped.confirmed.length + grouped.preparing.length,
    ready: grouped.ready.length,
    total: (orders || []).length
  };

  if (loading && !orders) return <div className="page-loader"><div className="loader-spinner" /></div>;

  return (
    <div className="kitchen-page">
      <div className="kitchen-header">
        <div style={{flex: 1}}>
          <div className="logo" style={{ fontSize: '1.3rem' }}>✦ AURA KITCHEN</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Live Order Dashboard</p>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.2rem' }}>⚠️ Connection Error: Retrying...</p>}
          <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem' }}>
            {user?.role === 'admin' && (
              <Link to="/admin" className="btn btn-outline btn-sm" style={{padding: '0.3rem 0.8rem'}}>← Back to Admin</Link>
            )}
            <button 
              onClick={() => { logout(); navigate('/admin/login'); }} 
              className="btn btn-outline btn-sm" 
              style={{borderColor: 'var(--danger)', color: 'var(--danger)', padding: '0.3rem 0.8rem'}}
            >
              Logout Account
            </button>
          </div>
        </div>

        <div style={{flex: 2, display:'flex', gap:'1rem', overflowX:'auto', padding:'0.5rem'}}>
          {activeStaff.map(s => (
            <div key={s.id} style={{
              background:'rgba(197, 131, 97, 0.1)', border:'1px solid var(--accent)', 
              padding:'0.5rem 1rem', borderRadius:'2rem', whiteSpace:'nowrap',
              display:'flex', alignItems:'center', gap:'0.5rem'
            }}>
              <span style={{fontSize:'1.2rem'}}>👨‍🍳</span>
              <span style={{fontSize:'0.9rem', fontWeight:600}}>{s.name}</span>
            </div>
          ))}
          {activeStaff.length === 0 && (
            <p style={{color:'var(--text-muted)', fontSize:'0.8rem'}}>No staff clocked in. Manage staff in Admin panel.</p>
          )}
        </div>

        <div className="kitchen-stats">
          <div className="kitchen-stat">
            <div className="kitchen-stat-value" style={{ color: '#fbbf24' }}>{stats.pending}</div>
            <div className="kitchen-stat-label">New</div>
          </div>
          <div className="kitchen-stat">
            <div className="kitchen-stat-value" style={{ color: 'var(--warning)' }}>{stats.preparing}</div>
            <div className="kitchen-stat-label">In Progress</div>
          </div>
          <div className="kitchen-stat">
            <div className="kitchen-stat-value" style={{ color: 'var(--success)' }}>{stats.ready}</div>
            <div className="kitchen-stat-label">Ready</div>
          </div>
        </div>
      </div>

      {stats.total === 0 ? (
        <div className="empty-state" style={{ marginTop: '3rem' }}>
          <div className="empty-state-icon">👨‍🍳</div>
          <p className="empty-state-text">No active orders</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Waiting for new orders...</p>
        </div>
      ) : (
        <div className="kitchen-grid">
          {[...grouped.pending, ...grouped.confirmed, ...grouped.preparing, ...grouped.ready].map(order => {
            const next = nextStatus(order.status);
            const timeDiff = Math.round((Date.now() - new Date(order.created_at).getTime()) / 60000);
            return (
              <div key={order.id} className={`kitchen-order-card status-${order.status}`}>
                <div className="kitchen-order-header">
                  <div>
                    <span className="kitchen-order-id">#{order.id}</span>
                    <span className="kitchen-order-table" style={{ marginLeft: '0.5rem' }}>📍 Table {order.table_number}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: timeDiff > 15 ? 'var(--danger)' : 'var(--text-muted)' }}>{timeDiff}m ago</span>
                    <span className={`status status-${order.status}`}>{order.status}</span>
                  </div>
                </div>
                {order.customer_name && order.customer_name !== 'Guest' && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>👤 {order.customer_name}</p>
                )}
                <ul className="kitchen-order-items">
                  {order.items?.map((item, i) => (
                    <li key={i}>
                      <span>{item.quantity}x {item.item_name}</span>
                      {item.customization && <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>✎ {item.customization}</span>}
                    </li>
                  ))}
                </ul>
                {order.notes && <p style={{ fontSize: '0.8rem', color: 'var(--warning)', marginBottom: '0.8rem' }}>📝 {order.notes}</p>}
                
                <div className="kitchen-order-actions" style={{flexDirection:'column', gap:'0.8rem'}}>
                  {order.status === 'pending' || order.status === 'confirmed' ? (
                    <div style={{width:'100%'}}>
                      <p style={{fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:'0.5rem', textTransform:'uppercase'}}>
                        {activeStaff.length > 0 ? 'Assign to Chef:' : 'Action:'}
                      </p>
                      <div style={{display:'flex', gap:'0.4rem', flexWrap:'wrap'}}>
                        {activeStaff.map(s => (
                          <button 
                            key={s.id} className="btn btn-sm btn-primary" 
                            style={{fontSize:'0.85rem', padding:'0.6rem 1rem', flex:1}}
                            onClick={() => handleStatusChange(order.id, 'preparing', s.name)}
                            disabled={updating[order.id]}
                          >
                            ▶ {s.name}
                          </button>
                        ))}
                        {activeStaff.length === 0 && (
                          <button 
                            className="btn btn-sm btn-primary" 
                            style={{fontSize:'0.85rem', padding:'0.6rem 1rem', width:'100%'}}
                            onClick={() => handleStatusChange(order.id, 'preparing', 'Kitchen')}
                            disabled={updating[order.id]}
                          >
                            ▶ Start Preparation
                          </button>
                        )}
                      </div>
                    </div>
                  ) : next && (
                    <button
                      className={`btn btn-sm ${statusBtnClass(order.status)}`}
                      onClick={() => handleStatusChange(order.id, next, order.prepared_by)}
                      disabled={updating[order.id]}
                      style={{width:'100%', padding:'0.8rem'}}
                    >
                      {updating[order.id] ? '...' : `${statusBtnLabel(order.status)} (By ${order.prepared_by})`}
                    </button>
                  )}
                  
                  {user?.role === 'admin' && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleStatusChange(order.id, 'cancelled')}
                      disabled={updating[order.id]}
                      style={{width:'100%', marginTop: '0.5rem', opacity: 0.7}}
                    >
                      ✕ Cancel Order (Admin Only)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
