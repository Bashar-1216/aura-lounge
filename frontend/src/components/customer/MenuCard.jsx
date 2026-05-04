const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" fill="%23f0f0f0"><rect width="400" height="240"/><text x="50%" y="50%" fill="%23999" font-family="sans-serif" font-size="18" text-anchor="middle" dy=".3em">Image Loading Error</text></svg>'
);

function getBadges(tags) {
  if (!tags) return [];
  const badges = [];
  if (tags.includes('popular')) badges.push({ label: '★ Popular', cls: 'badge-popular' });
  if (tags.includes('new')) badges.push({ label: 'New', cls: 'badge-new' });
  if (tags.includes('spicy')) badges.push({ label: '🌶 Spicy', cls: 'badge-spicy' });
  return badges;
}

export default function MenuCard({ item, onClick }) {
  const badges = getBadges(item.tags);

  return (
    <div className="glass-card menu-card" onClick={() => onClick(item)} id={`menu-item-${item.id}`}>
      {item.is_featured == 1 && <div className="featured-ribbon">Featured</div>}
      <div className="menu-card-img-wrapper">
        <div className="menu-card-tags">
          {badges.map((b, i) => (
            <span key={i} className={`badge ${b.cls}`}>{b.label}</span>
          ))}
        </div>
        <img
          className="menu-card-img"
          src={item.image_url || PLACEHOLDER}
          alt={item.name}
          loading="lazy"
          onError={e => { e.target.src = PLACEHOLDER; }}
        />
      </div>
      <div className="menu-card-body">
        <h3 className="menu-card-name">{item.name}</h3>
        <p className="menu-card-desc">{item.description}</p>
        <div className="menu-card-footer">
          <span className="menu-card-price">{parseFloat(item.price).toFixed(2)} SAR</span>
          <span className="menu-card-time">⏱ {item.prep_time_mins} min</span>
        </div>
      </div>
    </div>
  );
}
