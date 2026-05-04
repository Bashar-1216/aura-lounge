import { useParams, Link } from 'react-router-dom';
import { useCallback } from 'react';
import { orderAPI } from '../services/api';
import { usePolling } from '../hooks/usePolling';

const STEPS = [
  { key: 'pending', label: 'Received', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { key: 'confirmed', label: 'Confirmed', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> },
  { key: 'preparing', label: 'Preparing', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg> }, // Placeholder for chef icon
  { key: 'ready', label: 'Ready!', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
];

function getStepIndex(status) {
  const idx = STEPS.findIndex(s => s.key === status);
  return idx >= 0 ? idx : (status === 'delivered' ? 4 : -1);
}

export default function OrderTracking() {
  const { id } = useParams();
  const fetchOrder = useCallback(() => orderAPI.getById(id), [id]);
  const { data: order, loading, error } = usePolling(fetchOrder, 10000);

  if (loading) return <div className="page-loader"><div className="loader-spinner" /></div>;
  if (error || !order) return (
    <div className="tracking-page text-center">
      <h2 style={{ fontFamily: 'Outfit' }}>Order not found</h2>
      <Link to="/menu" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Back to Menu</Link>
    </div>
  );

  const currentStep = getStepIndex(order.status);
  const progressWidth = order.status === 'delivered' ? '100%' : `${(currentStep / (STEPS.length - 1)) * 80 + 10}%`;
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';

  return (
    <div className="tracking-page" style={{ padding: '2.5rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div className="logo" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>✦ AURA LOUNGE</div>
        <h2 style={{ fontFamily: 'Outfit', marginBottom: '0.4rem', fontSize: '1.8rem' }}>Order #{order.id}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
          Table {order.table_number} • {order.customer_name || 'Guest'}
        </p>
      </div>

      {isCancelled ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h3 style={{ color: 'var(--danger)', fontFamily: 'Outfit', fontSize: '1.5rem' }}>Order Cancelled</h3>
        </div>
      ) : isDelivered ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h3 style={{ color: 'var(--success)', fontFamily: 'Outfit', fontSize: '1.5rem' }}>Order Delivered!</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>We hope you enjoy your experience at Aura.</p>
        </div>
      ) : (
        <div className="tracking-progress">
          <div className="progress-fill" style={{ width: progressWidth }} />
          {STEPS.map((step, i) => (
            <div className="tracking-step" key={step.key}>
              <div className={`tracking-dot ${i < currentStep ? 'completed' : i === currentStep ? 'active' : ''}`}>
                {step.icon}
              </div>
              <span className={`tracking-label ${i <= currentStep ? 'active' : ''}`}>{step.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card" style={{ padding: '2rem', marginTop: '3rem', border: '1px solid var(--glass-border)' }}>
        <h4 style={{ fontFamily: 'Outfit', marginBottom: '1.2rem', fontSize: '1.1rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Selection Details</h4>
        {order.items?.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid var(--glass-border)' }}>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.quantity}x</span> 
              <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>{item.item_name}</span>
              {item.customization && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Note: {item.customization}</div>}
            </div>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{(item.unit_price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        {order.notes && (
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            Note: {order.notes}
          </div>
        )}
        <div className="cart-total" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
          <span style={{ color: 'var(--text-primary)' }}>Total</span>
          <span>{parseFloat(order.total_price).toFixed(2)} SAR</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <Link to={`/menu?table=${order.table_id}`} className="btn btn-outline" id="order-again-btn" style={{ padding: '1rem 2.5rem' }}>
          Back to Menu
        </Link>
      </div>
    </div>
  );
}
