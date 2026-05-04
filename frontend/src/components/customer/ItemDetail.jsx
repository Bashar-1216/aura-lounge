import { useState } from 'react';
import { useCart } from '../../context/CartContext';

export default function ItemDetail({ item, onClose }) {
  const [qty, setQty] = useState(1);
  const [customization, setCustomization] = useState('');
  const { addItem } = useCart();

  if (!item) return null;

  const handleAdd = () => {
    addItem({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price),
      image_url: item.image_url,
      quantity: qty,
      customization
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="btn-icon modal-close" onClick={onClose} id="item-modal-close">✕</button>
        {item.image_url && <img className="modal-img" src={item.image_url} alt={item.name} />}
        <div className="modal-body">
          <h2 style={{ fontFamily: 'Outfit', marginBottom: '0.5rem' }}>{item.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1rem' }}>
            {item.description}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <span style={{ fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
              {parseFloat(item.price).toFixed(2)} SAR
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⏱ {item.prep_time_mins} min</span>
          </div>

          <div className="input-group" style={{ marginBottom: '1.2rem' }}>
            <label>Special Instructions</label>
            <textarea
              className="textarea"
              placeholder="e.g. No sugar, extra milk..."
              value={customization}
              onChange={e => setCustomization(e.target.value)}
              id="item-customization"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <span style={{ fontWeight: 600 }}>Quantity</span>
            <div className="qty-control">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} id="qty-decrease">−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} id="qty-increase">+</button>
            </div>
          </div>

          <button className="btn btn-primary w-full" onClick={handleAdd} id="add-to-cart-btn" style={{ padding: '1.2rem', fontSize: '1.05rem', letterSpacing: '0.5px' }}>
            Add to Selection — {(parseFloat(item.price) * qty).toFixed(2)} SAR
          </button>
        </div>
      </div>
    </div>
  );
}
