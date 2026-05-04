import { useState, useCallback, useEffect, useRef } from 'react';
import { orderAPI } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

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
  const fetchOrders = useCallback(() => orderAPI.getAll('pending,confirmed,preparing,ready'), []);
  const { data: orders, loading, refresh } = usePolling(fetchOrders, 5000);
  const [updating, setUpdating] = useState({});
  const [activeOrderAction, setActiveOrderAction] = useState(null);
  const prevCountRef = useRef(0);
  const audioRef = useRef(null);

  // Play sound on new order
  useEffect(() => {
    if (orders && orders.length > prevCountRef.current) {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio('data:audio/wav;base64,UklGRl9vT19televiXZlRm10teleIBAABBBIAIABAAAA=');
        }
        // Simple beep notification
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

  const handleStatusChange = async (orderId, newStatus) => {
    if (newStatus === 'preparing' || newStatus === 'ready') {
      setActiveOrderAction({ orderId, nextStatus: newStatus });
      return;
    }
    
    setUpdating(prev => ({ ...prev, [orderId]: true }));
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleChefSelect = async (chefName) => {
    if (!activeOrderAction) return;
    const { orderId, nextStatus } = activeOrderAction;
    setActiveOrderAction(null); // Close instantly
    
    setUpdating(prev => ({ ...prev, [orderId]: true }));
    try {
      await orderAPI.updateStatus(orderId, nextStatus, chefName);
      refresh();
    } catch (err) {
      console.error(err);
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

  if (loading) return <div className="page-loader"><div className="loader-spinner" /></div>;

  return (
    <div className="kitchen-page">
      <div className="kitchen-header">
        <div>
          <div className="logo" style={{ fontSize: '1.3rem' }}>✦ AURA KITCHEN</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Live Order Dashboard</p>
          <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.5rem' }}>
            {user?.role === 'admin' && (
              <Link to="/admin" className="btn btn-outline btn-sm" style={{padding: '0.3rem 0.8rem'}}>← Back to Admin</Link>
            )}
            <button onClick={logout} className="btn btn-outline btn-sm" style={{borderColor: 'var(--danger)', color: 'var(--danger)', padding: '0.3rem 0.8rem'}}>Logout</button>
          </div>
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
                <div className="kitchen-order-actions">
                  {next && (
                    <button
                      className={`btn btn-sm ${statusBtnClass(order.status)}`}
                      onClick={() => handleStatusChange(order.id, next)}
                      disabled={updating[order.id]}
                      id={`order-${order.id}-next`}
                    >
                      {updating[order.id] ? '...' : statusBtnLabel(order.status)}
                    </button>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleStatusChange(order.id, 'cancelled')}
                      disabled={updating[order.id]}
                      id={`order-${order.id}-cancel`}
                    >
                      ✕ Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeOrderAction && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(26,26,26,0.8)' }}>
          <div className="modal-content" style={{ borderRadius: 'var(--radius-lg)', padding: '3rem', maxWidth: '450px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '2.5rem', fontFamily: 'Outfit', letterSpacing: '1px', fontSize: '1.8rem' }}>Chef Accountability</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>Select the chef responsible for this order</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {['Chef A', 'Chef B', 'Chef C'].map(chef => (
                <button 
                  key={chef} 
                  className="btn btn-outline"
                  onClick={() => handleChefSelect(chef)}
                  style={{
                    padding: '1.5rem', fontSize: '1.1rem', borderRadius: 'var(--radius-md)',
                    justifyContent: 'center', fontWeight: 600
                  }}
                >
                  {chef}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setActiveOrderAction(null)}
              style={{ marginTop: '2.5rem', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
            >
              Cancel Action
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
