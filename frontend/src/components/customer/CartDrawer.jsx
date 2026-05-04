import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { orderAPI } from '../../services/api';

export default function CartDrawer({ open, onClose, onOrderPlaced }) {
  const { items, totalPrice, totalItems, removeItem, updateQty, clearCart, tableId } = useCart();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async () => {
    if (items.length === 0) return;
    if (!tableId) { setError('Table not identified. Please scan the QR code again.'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await orderAPI.create({
        table_id: tableId,
        customer_name: name || 'Guest',
        notes,
        items: items.map(i => ({
          menu_item_id: i.id,
          quantity: i.quantity,
          customization: i.customization || ''
        }))
      });
      clearCart();
      onOrderPlaced(res.data.order_id);
    } catch (err) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-drawer">
        <div className="cart-header">
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 600 }}>Your Selection ({totalItems})</h3>
          <button className="btn-icon" onClick={onClose} id="cart-close-btn" style={{ border: 'none', background: 'transparent' }}>✕</button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ color: 'var(--accent-dim)' }}>✦</div>
              <p className="empty-state-text">Your selection is empty</p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div className="cart-item" key={idx}>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">{parseFloat(item.price).toFixed(2)} SAR</div>
                  {item.customization && <div className="cart-item-custom">Note: {item.customization}</div>}
                </div>
                <div className="qty-control" style={{ gap: '0.8rem' }}>
                  <button onClick={() => updateQty(idx, item.quantity - 1)} style={{ width: '28px', height: '28px', fontSize: '0.9rem' }}>−</button>
                  <span style={{ fontSize: '0.95rem', minWidth: '1.2rem' }}>{item.quantity}</span>
                  <button onClick={() => updateQty(idx, item.quantity + 1)} style={{ width: '28px', height: '28px', fontSize: '0.9rem' }}>+</button>
                </div>
                <button 
                  onClick={() => removeItem(idx)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="input-group" style={{ marginBottom: '0.8rem' }}>
              <label>Your Name (optional)</label>
              <input className="input" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} id="cart-name" />
            </div>
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label>Notes (optional)</label>
              <input className="input" placeholder="Any special notes..." value={notes} onChange={e => setNotes(e.target.value)} id="cart-notes" />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{error}</p>}
            <div className="cart-total">
              <span>Total</span>
              <span>{totalPrice.toFixed(2)} SAR</span>
            </div>
            <button className="btn btn-primary w-full" onClick={handleSubmit} disabled={loading} id="place-order-btn">
              {loading ? 'Placing Order...' : '✓ Place Order'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
