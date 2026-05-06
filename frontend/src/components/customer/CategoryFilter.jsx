const ICON_MAP = {
  'Hot Drinks': '☕',
  'Cold Drinks': '🥤',
  'Pastries': '🥐',
  'Breakfast': '🍳',
  'Main Dishes': '🍽️',
  'Desserts': '🍰',
};

export default function CategoryFilter({ categories, activeId, onSelect }) {
  return (
    <div className="category-filter">
      <button
        className={`category-chip ${activeId === null ? 'active' : ''}`}
        onClick={() => onSelect(null)}
        id="category-all"
      >
        🍽️ All
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          className={`category-chip ${activeId === cat.id ? 'active' : ''}`}
          onClick={() => onSelect(cat.id)}
          id={`category-${cat.id}`}
        >
          {ICON_MAP[cat.name] || cat.icon || '🍴'} {cat.name}
        </button>
      ))}
    </div>
  );
}
