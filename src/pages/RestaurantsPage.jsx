import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import { listRestaurants, filterRestaurants } from '../api/restaurants';
import { getPopularItems, searchMenuItems } from '../api/menu';
import { addToCart } from '../api/cart';

const PAGE_SIZE = 20;

export default function RestaurantsPage() {
  const { token } = useAuthStore();
  const { incrementCount } = useCartStore();
  const [restaurants, setRestaurants] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [city, setCity] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [food, setFood] = useState('');
  const [filtering, setFiltering] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [addingId, setAddingId] = useState(null);

  const sentinelRef = useRef(null);
  const navigate = useNavigate();

  const categories = [
    { name: 'Pizza', emoji: '🍕' }, { name: 'Biryani', emoji: '🍛' }, { name: 'Burger', emoji: '🍔' },
    { name: 'South Indian', emoji: '🥘' }, { name: 'Chinese', emoji: '🥡' }, { name: 'Desserts', emoji: '🍰' },
    { name: 'Rolls', emoji: '🌯' }, { name: 'North Indian', emoji: '🫓' }, { name: 'Italian', emoji: '🍝' },
    { name: 'Mexican', emoji: '🌮' },
  ];

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const timer = setTimeout(() => {
      if (city || cuisine) handleFilter(); else resetAndLoad();
    }, 400);
    return () => clearTimeout(timer);
  }, [city, cuisine]);

  const loadPage = useCallback(async (pageNum, query, append) => {
    const loader = append ? setLoadingMore : setLoading;
    loader(true);
    try {
      const fn = query ? searchMenuItems : getPopularItems;
      const params = query ? [query, pageNum, PAGE_SIZE] : [pageNum, PAGE_SIZE];
      const res = await fn(...params);
      const data = res.data?.content || res.data || [];
      if (append) {
        setFoodItems((prev) => [...prev, ...data]);
      } else {
        setFoodItems(data);
      }
      const total = res.data?.totalPages || 1;
      setHasMore(pageNum + 1 < total);
      setPage(pageNum);
    } catch {
      toast.error('Failed to load dishes');
    } finally {
      loader(false);
    }
  }, []);

  const resetAndLoad = useCallback(() => {
    setFoodItems([]);
    setPage(0);
    setHasMore(true);
    setLoading(true);
    Promise.all([
      listRestaurants(0, 20).then((r) => setRestaurants((r.data.content || r.data).filter((x) => x.status === 'OPEN'))),
      getPopularItems(0, PAGE_SIZE).then((r) => {
        const data = r.data?.content || r.data || [];
        setFoodItems(data);
        const total = r.data?.totalPages || 1;
        setHasMore(1 < total);
        setPage(0);
      }),
    ]).catch((err) => toast.error(err.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { resetAndLoad(); }, []);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          const next = page + 1;
          loadPage(next, food || null, true);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, food, loadPage]);

  const handleFoodSearch = async (val) => {
    setFood(val);
    setActiveCategory('');
    setFoodItems([]);
    setPage(0);
    setHasMore(true);
    if (!val) { resetAndLoad(); return; }
    setLoading(true);
    try {
      const res = await searchMenuItems(val, 0, PAGE_SIZE);
      const data = res.data?.content || res.data || [];
      setFoodItems(data);
      const total = res.data?.totalPages || 1;
      setHasMore(1 < total);
      setPage(0);
    } catch { setFoodItems([]); } finally { setLoading(false); }
  };

  const handleFilter = async () => {
    setFiltering(true);
    try {
      const res = await filterRestaurants(city || undefined, cuisine || undefined);
      setRestaurants(res.data.filter((r) => r.status === 'OPEN'));
    } catch (err) { toast.error(err.message); } finally { setFiltering(false); }
  };

  const clearFilters = () => {
    setCity(''); setCuisine(''); setFood(''); setActiveCategory('');
    resetAndLoad();
  };

  const handleAddToCart = async (item) => {
    if (!token) return navigate('/login');
    setAddingId(item.id);
    try {
      await addToCart({ menuItemId: item.id, quantity: 1 });
      incrementCount();
      toast.success(`${item.name} added to cart!`);
    } catch (err) {
      toast.error(err.message || 'Failed to add to cart');
    } finally {
      setAddingId(null);
    }
  };

  const filteredRestaurants = activeCategory
    ? restaurants.filter((r) => r.cuisineType?.toLowerCase().includes(activeCategory.toLowerCase()))
    : restaurants;

  const filteredFoodItems = activeCategory
    ? foodItems.filter((item) => {
        const catEnum = activeCategory.toUpperCase().replace(/\s+/g, '_');
        return item.category?.toUpperCase() === catEnum;
      })
    : foodItems;

  return (
    <div className="page" style={{ backgroundColor: 'var(--bg)', minHeight: '100vh', paddingTop: '76px' }}>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)', padding: '2.5rem 0', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: '-5%', top: '-20%', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255, 107, 53, 0.12)', filter: 'blur(30px)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', padding: '0 1.5rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Browse Catalog</span>
          <h1 style={{ color: '#ffffff', fontSize: '1.8rem', fontWeight: 900, margin: '0.2rem 0 0.3rem' }}>Explore & Order</h1>
          <div style={{ display: 'flex', gap: '0.6rem', maxWidth: '800px', flexWrap: 'wrap', background: 'rgba(255, 255, 255, 0.08)', padding: '0.6rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
            <input placeholder="City..." value={city} onChange={(e) => setCity(e.target.value)}
              style={{ flex: 1, minWidth: '120px', padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '0.85rem', outline: 'none' }} />
            <input placeholder="Cuisine..." value={cuisine} onChange={(e) => setCuisine(e.target.value)}
              style={{ flex: 1, minWidth: '120px', padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '0.85rem', outline: 'none' }} />
            <input placeholder="Search dish..." value={food} onChange={(e) => handleFoodSearch(e.target.value)}
              style={{ flex: 1, minWidth: '120px', padding: '0.55rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', fontSize: '0.85rem', outline: 'none', fontWeight: food ? 600 : 400 }} />
            {(city || cuisine || food) && (
              <button onClick={clearFilters} style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: 'rgba(255, 107, 53, 0.2)', color: '#ff8a5c', fontWeight: 700, fontSize: '0.8rem' }}>Reset</button>
            )}
          </div>
        </div>
      </div>

      {/* Category Row */}
      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem 1.5rem 0' }}>
        <div className="category-row" style={{ gap: '0.5rem' }}>
          {categories.map((cat) => (
            <button key={cat.name} className={`category-pill${activeCategory === cat.name ? ' active' : ''}`}
              onClick={() => { setActiveCategory(activeCategory === cat.name ? '' : cat.name); setFood(''); }} style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }}>
              <span>{cat.emoji}</span>{cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem 1.5rem 4rem' }}>
        {loading ? (
          <div className="spinner" />
        ) : (
          <>
            {/* Restaurant Row — compact cards */}
            {filteredRestaurants.length > 0 && (
              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.75rem', color: '#0f172a' }}>
                  {city || cuisine || activeCategory ? 'Filtered Results' : 'All Open Restaurants'}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginLeft: '0.4rem' }}>({filteredRestaurants.length})</span>
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.85rem' }}>
                  {filteredRestaurants.map((r) => (
                    <div key={r.id} onClick={() => navigate(`/restaurants/${r.id}`)} style={{
                      background: '#ffffff', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', cursor: 'pointer',
                      transition: 'transform 0.15s',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                      <div style={{ height: '100px', background: '#f1f5f9', overflow: 'hidden' }}>
                        {r.imageUrl ? <img src={r.imageUrl} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', background: 'linear-gradient(135deg, #fef3c7 0%, #fee2e2 100%)' }}>🏪</div>}
                      </div>
                      <div style={{ padding: '0.6rem 0.75rem 0.7rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', marginBottom: '0.1rem' }}>{r.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, display: 'flex', gap: '0.4rem' }}>
                          <span>📍 {r.city || 'N/A'}</span>
                          <span>⭐ {r.rating?.toFixed(1) || '4.0'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Food Items Grid — infinite scroll */}
            <section>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.75rem', color: '#0f172a' }}>
                {activeCategory ? `"${activeCategory}" Items` : food ? `Dishes matching "${food}"` : 'Popular Dishes'}
              </h2>
              {filteredFoodItems.length === 0 && !loadingMore ? (
                <div className="empty-state" style={{ padding: '1.5rem' }}>
                  <p className="text-muted">{activeCategory ? `No ${activeCategory} items available` : 'No dishes found. Try a different search.'}</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                  {filteredFoodItems.map((item) => (
                    <div key={item.id} style={{
                      borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#ffffff',
                      transition: 'transform 0.15s', cursor: 'pointer',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      onClick={() => navigate(`/restaurants/${item.restaurantId}`)}>
                      <div style={{ width: '100%', aspectRatio: '1 / 1', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '2.5rem' }}>🍽️</span>}
                      </div>
                      <div style={{ padding: '0.5rem 0.6rem 0.6rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a', marginBottom: '0.1rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500, marginBottom: '0.35rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          🏪 {item.restaurantName}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--primary)' }}>₹{item.price?.toFixed(2)}</span>
                          <button className="btn btn-primary btn-sm" style={{ borderRadius: '16px', fontSize: '0.68rem', padding: '0.25rem 0.7rem' }}
                            onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }} disabled={addingId === item.id}>
                            {addingId === item.id ? '...' : '+ Add'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} style={{ height: 1 }} />
              {loadingMore && (
                <div style={{ textAlign: 'center', padding: '1rem' }}><div className="spinner" /></div>
              )}
              {!hasMore && filteredFoodItems.length > 0 && !activeCategory && (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '1rem' }}>You've seen all dishes</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
