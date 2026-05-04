import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { menuAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import Header from '../components/customer/Header';
import CategoryFilter from '../components/customer/CategoryFilter';
import MenuCard from '../components/customer/MenuCard';
import ItemDetail from '../components/customer/ItemDetail';
import CartDrawer from '../components/customer/CartDrawer';

export default function CustomerMenu() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setTable } = useCart();
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const tableId = params.get('table');
    if (tableId) setTable(parseInt(tableId));
  }, [params, setTable]);

  useEffect(() => {
    menuAPI.getAll()
      .then(res => setMenuData(res.data.categories || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => menuData.map(c => ({ id: c.id, name: c.name, icon: c.icon })), [menuData]);

  const filteredItems = useMemo(() => {
    let items = [];
    menuData.forEach(cat => {
      if (activeCategory === null || activeCategory === cat.id) {
        items.push(...cat.items.map(i => ({ ...i, category_name: cat.name })));
      }
    });
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q));
    }
    return items;
  }, [menuData, activeCategory, search]);

  const handleOrderPlaced = (orderId) => {
    setCartOpen(false);
    navigate(`/order/${orderId}`);
  };

  if (loading) {
    return (
      <>
        <Header onCartClick={() => setCartOpen(true)} />
        <div className="container">
          <div className="page-loader"><div className="loader-spinner" /></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header onCartClick={() => setCartOpen(true)} />
      <div className="container">
        <div style={{ padding: '1rem 0 0' }}>
          <input
            className="input"
            placeholder="🔍 Search menu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="menu-search"
            style={{ background: 'var(--bg-surface)' }}
          />
        </div>
        <CategoryFilter categories={categories} activeId={activeCategory} onSelect={setActiveCategory} />

        {filteredItems.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🍽️</div><p className="empty-state-text">No items found</p></div>
        ) : (
          <div className="menu-grid">
            {filteredItems.map(item => (
              <MenuCard key={item.id} item={item} onClick={setSelectedItem} />
            ))}
          </div>
        )}
      </div>

      {selectedItem && <ItemDetail item={selectedItem} onClose={() => setSelectedItem(null)} />}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} onOrderPlaced={handleOrderPlaced} />
    </>
  );
}
