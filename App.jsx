
import React, { useState, useMemo, useEffect } from 'react';
import { StarIcon, CartIcon, ClockIcon, SparklesIcon, TagIcon, RefreshIcon } from './components/Icons.jsx';
import { enhanceMenuDescriptions, extractRestaurantData, getNearbyFoodDiscovery } from './services/geminiService.js';
import { db } from './services/databaseService.js';

// --- Pure UI Components ---

const CategoryCircle = ({ label, image, active, onClick }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none"
  >
    <div className={`w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden transition-all duration-300 border-2 ${active ? 'border-red-500 scale-110 shadow-lg shadow-red-100' : 'border-transparent group-hover:border-gray-200'}`}>
      <img src={image} className="w-full h-full object-cover" alt={label} />
    </div>
    <span className={`text-xs md:text-sm font-semibold ${active ? 'text-red-600' : 'text-gray-600'}`}>{label}</span>
  </button>
);

const RestaurantCard = ({ restaurant, onClick }) => (
  <div 
    onClick={onClick}
    className="card border-0 rounded-4 z-shadow z-shadow-hover cursor-pointer overflow-hidden transition-all h-100"
  >
    <div className="position-relative">
      <img src={restaurant.image} className="card-img-top object-cover h-48 md:h-56" alt={restaurant.name} />
      <div className="position-absolute top-3 end-3 bg-white px-2 py-1 rounded-2 z-shadow d-flex align-items-center gap-1">
        <span className="fw-bold text-dark" style={{fontSize: '12px'}}>{restaurant.rating}</span>
        <StarIcon className="w-3 h-3 text-warning" />
      </div>
      <div className="position-absolute bottom-3 start-3 bg-white/90 backdrop-blur px-2 py-1 rounded-1 fw-bold text-uppercase" style={{fontSize: '10px'}}>
        {restaurant.deliveryTime}
      </div>
      <div className="position-absolute top-3 start-3 d-flex flex-wrap gap-1">
        {restaurant.dietary?.includes('Vegetarian') && <span className="bg-success text-white px-2 py-0.5 rounded-1 fw-black text-uppercase" style={{fontSize: '8px'}}>VEG</span>}
        {restaurant.dietary?.includes('Vegan') && <span className="bg-green-600 text-white px-2 py-0.5 rounded-1 fw-black text-uppercase" style={{fontSize: '8px'}}>VEGAN</span>}
      </div>
    </div>
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-start mb-1">
        <h5 className="card-title fw-black m-0 text-truncate" style={{letterSpacing: '-0.5px'}}>{restaurant.name}</h5>
      </div>
      <p className="card-text text-muted small truncate mb-2">{restaurant.cuisine}</p>
      <div className="d-flex justify-content-between align-items-center pt-2 border-top">
        <span className="text-muted fw-bold" style={{fontSize: '10px'}}>₹400 for two</span>
        <span className="text-muted fw-bold" style={{fontSize: '10px'}}>3.5 km</span>
      </div>
    </div>
  </div>
);

const LiveTrackingMap = ({ status, userLocation }) => {
  const steps = ['preparing', 'picked_up', 'delivering', 'near_you', 'delivered'];
  const currentIdx = Math.max(0, steps.indexOf(status));
  const progress = currentIdx / (steps.length - 1);
  const pathD = "M 60 240 C 120 240, 180 60, 340 60";
  const locationKey = userLocation ? `${userLocation.lat}-${userLocation.lng}` : 'static';

  return (
    <div className="bg-[#f0f2f5] rounded-4 overflow-hidden position-relative z-shadow border border-white" style={{height: '400px'}}>
      <div className="position-absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1c1c1c 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      <svg className="w-100 h-100 p-4" viewBox="0 0 400 300">
        <g opacity="0.1">
          <rect x="20" y="20" width="60" height="100" fill="#000" />
          <rect x="250" y="200" width="80" height="60" fill="#000" />
          <path d="M0 150 H400 M200 0 V300" stroke="#000" strokeWidth="2" />
        </g>
        <path d={pathD} fill="none" stroke="#e5e7eb" strokeWidth="12" strokeLinecap="round" />
        <path d={pathD} fill="none" stroke="#dc3545" strokeWidth="6" strokeLinecap="round" strokeDasharray="1000" strokeDashoffset={1000 - (progress * 1000)} className="transition-all duration-[3000ms] ease-out" />
        
        {/* Floating Boat (Sabarmati Riverfront Vibe) */}
        <g className="animate-boat-float">
          <path d="M -15 0 Q 0 10 15 0 L 10 -10 L -10 -10 Z" fill="#1e3a8a" />
          <path d="M 0 -10 V -20 L 8 -15 Z" fill="#dc3545" />
        </g>

        {/* Restaurant Marker */}
        <g transform="translate(60, 240)">
          <circle r="15" fill="#dc3545" className="animate-pulse" />
          <text y="30" textAnchor="middle" className="fw-black" style={{fontSize: '9px', fill: '#dc3545'}}>RESTAURANT</text>
          <text y="4" x="-5" style={{fontSize: '10px'}}>🏠</text>
        </g>

        {/* Destination Marker */}
        <g transform="translate(340, 60)" key={locationKey}>
          {userLocation && <circle r="15" fill="none" stroke="#3b82f6" strokeWidth="2" className="animate-glow-pulse" />}
          <g className={userLocation ? "animate-marker-bounce" : ""}>
            <circle r="15" fill={userLocation ? "#3b82f6" : "#111827"} className="transition-colors duration-500" />
            <text y="4" x="-5" style={{fontSize: '10px'}}>📍</text>
          </g>
          <text y="30" textAnchor="middle" className="fw-black" style={{fontSize: '9px', fill: userLocation ? '#3b82f6' : '#111827'}}>
            {userLocation ? "HOME (LIVE GPS)" : "DELIVERY ADDRESS"}
          </text>
        </g>

        {/* Courier Marker */}
        <g style={{ offsetPath: `path("${pathD}")`, offsetDistance: `${progress * 100}%`, transition: 'offset-distance 3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <circle r="12" fill="white" stroke="#dc3545" strokeWidth="2" className="shadow-lg" />
          <text x="-6" y="5" style={{fontSize: '14px'}}>🚲</text>
        </g>
      </svg>
    </div>
  );
};

const Footer = () => (
  <footer className="bg-[#0f0f0f] text-white py-12 mt-12 mb-16 lg:mb-0">
    <div className="container">
      <div className="row g-4 justify-content-between align-items-center">
        <div className="col-lg-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="bg-danger rounded-3 p-2 text-white">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <span className="h3 m-0 fw-black tracking-tighter">Flavor<span className="text-danger">Dish</span></span>
          </div>
          <p className="text-gray-400 small fw-medium">
            Redefining the culinary landscape of Ahmedabad with AI-driven discovery and premium delivery.
          </p>
        </div>
        <div className="col-lg-5 text-center text-lg-end">
          <p className="text-gray-500 small mb-0 fw-bold">© 2026 FlavorDish. Ahmedabad's Finest.</p>
        </div>
      </div>
    </div>
  </footer>
);

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [batchEnhancedMenu, setBatchEnhancedMenu] = useState({});
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [userCoords, setUserCoords] = useState(null);
  const [activeTrackingId, setActiveTrackingId] = useState(null);
  const [sortCriteria, setSortCriteria] = useState('default');
  const [dietaryFilters, setDietaryFilters] = useState([]);
  const [manualDeliveryFee, setManualDeliveryFee] = useState(40);
  const [searchQuery, setSearchQuery] = useState('');
  const [discoveryResults, setDiscoveryResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [partnerText, setPartnerText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) setCurrentUser(user);
    const init = async () => {
      const res = await db.getRestaurants();
      const ord = await db.getOrders();
      const crt = await db.getCart();
      setRestaurants(res || []);
      setOrders(ord || []);
      setCart(crt || []);
    };
    init();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.debug("Geolocation denied", err)
      );
    }
  }, []);

  useEffect(() => {
    if (currentView === 'restaurant' && selectedRestaurant) {
      const loadEnhancements = async () => {
        const stored = await db.getMenuEnhancements(selectedRestaurant.id);
        if (stored) {
          setBatchEnhancedMenu(stored);
        } else {
          handleEnhanceMenu();
        }
      };
      loadEnhancements();
    }
  }, [currentView, selectedRestaurant]);

  const handleEnhanceMenu = async () => {
    if (!selectedRestaurant) return;
    setIsEnhancing(true);
    const fresh = await enhanceMenuDescriptions(selectedRestaurant.menu);
    if (fresh) {
      setBatchEnhancedMenu(fresh);
      await db.saveMenuEnhancements(selectedRestaurant.id, fresh);
    }
    setIsEnhancing(false);
  };

  const sortedRestaurants = useMemo(() => {
    let list = [...restaurants];
    if (dietaryFilters.length > 0) {
      list = list.filter(res => dietaryFilters.some(f => res.dietary?.includes(f)));
    }
    if (sortCriteria === 'rating') list.sort((a, b) => b.rating - a.rating);
    else if (sortCriteria === 'delivery') {
      list.sort((a, b) => parseInt(a.deliveryTime) - parseInt(b.deliveryTime));
    }
    return list;
  }, [restaurants, sortCriteria, dietaryFilters]);

  const addToCart = (item, res) => {
    const updated = [...cart];
    const existing = updated.find(i => i.id === item.id);
    if (existing) existing.quantity += 1;
    else updated.push({ ...item, quantity: 1, restaurantId: res.id, restaurantName: res.name });
    setCart(updated);
    db.saveCart(updated);
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await getNearbyFoodDiscovery(searchQuery, userCoords ? { latitude: userCoords.lat, longitude: userCoords.lng } : null);
    setDiscoveryResults(results);
    setIsSearching(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="animate-fadeIn">
            <div className="position-relative overflow-hidden mb-5 rounded-bottom-5" style={{height: '500px'}}>
              <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000" className="w-100 h-100 object-cover" alt="Hero" />
              <div className="position-absolute inset-0 bg-dark opacity-60"></div>
              <div className="position-absolute inset-0 d-flex flex-column align-items-center justify-content-center text-white px-4 text-center">
                <h1 className="display-2 fw-black tracking-tighter italic mb-3">Flavor<span className="text-danger">Dish</span></h1>
                <p className="h4 fw-bold mb-5 opacity-75">Ahmedabad's Ultimate Dining Experience.</p>
                <div className="container max-w-2xl">
                  <form onSubmit={handleSearch} className="row bg-white rounded-4 p-2 text-dark mx-auto align-items-center">
                    <div className="col">
                      <input 
                        type="text" 
                        placeholder="Search restaurants or dishes..." 
                        className="form-control border-0 shadow-none fw-bold" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="col-auto">
                      <button type="submit" disabled={isSearching} className="btn btn-danger rounded-3 px-4 py-2 fw-black">
                        {isSearching ? '...' : 'Search'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div className="container">
              <section className="mb-5">
                <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-4">
                  <h2 className="fw-black h3 m-0">Ahmedabad's Best</h2>
                  <div className="d-flex flex-wrap gap-2">
                    {['Vegetarian', 'Vegan', 'Gluten-Free'].map(f => (
                      <button 
                        key={f} 
                        onClick={() => setDietaryFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])}
                        className={`btn btn-sm rounded-pill px-3 fw-bold transition-all border-2 ${dietaryFilters.includes(f) ? 'bg-success border-success text-white' : 'border-success/20 text-success'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="row g-4">
                  {sortedRestaurants.map(res => (
                    <div key={res.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                      <RestaurantCard restaurant={res} onClick={() => { setSelectedRestaurant(res); setCurrentView('restaurant'); }} />
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <Footer />
          </div>
        );
      case 'restaurant':
        return selectedRestaurant && (
          <div className="container py-5 animate-fadeIn min-h-screen">
             <div className="position-relative overflow-hidden rounded-5 mb-5 shadow-2xl" style={{height: '350px'}}>
               <img src={selectedRestaurant.image} className="w-100 h-100 object-cover" alt={selectedRestaurant.name} />
               <div className="position-absolute bottom-0 start-0 w-100 p-5 bg-gradient-to-t from-black/90 text-white">
                 <h1 className="display-4 fw-black m-0 tracking-tighter">{selectedRestaurant.name}</h1>
                 <p className="fw-bold opacity-75">{selectedRestaurant.cuisine}</p>
               </div>
             </div>
             <div className="row g-5">
                <div className="col-lg-8">
                  <div className="d-flex align-items-center justify-content-between mb-5">
                    <h3 className="fw-black m-0">Menu</h3>
                    <button onClick={handleEnhanceMenu} disabled={isEnhancing} className="btn btn-light btn-sm rounded-pill px-3 fw-black text-uppercase d-flex align-items-center gap-2">
                      <SparklesIcon className="w-4 h-4 text-danger" /> AI Enhance Descriptions
                    </button>
                  </div>
                  <div className="d-flex flex-column gap-4">
                    {selectedRestaurant.menu.map(item => (
                      <div key={item.id} className="card border-0 z-shadow rounded-5 p-4 bg-white">
                        <div className="row g-4">
                          <div className="col">
                            <h5 className="fw-black mb-1">{item.name}</h5>
                            <span className="fw-black text-danger">₹{item.price}</span>
                            <p className={`small mb-0 mt-2 ${batchEnhancedMenu[item.id] ? 'text-dark fw-medium italic border-start border-danger ps-3' : 'text-muted'}`}>
                              {batchEnhancedMenu[item.id] || item.description}
                            </p>
                          </div>
                          <div className="col-auto">
                            <div className="position-relative" style={{width: '120px', height: '120px'}}>
                              <img src={item.image} className="w-100 h-100 object-cover rounded-4" alt={item.name} />
                              <button onClick={() => addToCart(item, selectedRestaurant)} className="position-absolute bottom-0 start-50 translate-middle-x btn btn-white border z-shadow rounded-3 px-3 py-1 fw-black text-danger text-uppercase btn-sm">Add +</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-lg-4">
                   <div className="card border-0 z-shadow rounded-5 p-4 sticky-top" style={{top: '100px'}}>
                      <h4 className="fw-black mb-4">Cart</h4>
                      {cart.length === 0 ? <p className="text-muted small">Your cart is empty.</p> : (
                        <div>
                          {cart.map((i, idx) => <div key={idx} className="d-flex justify-content-between mb-2"><span>{i.name} x{i.quantity}</span><span>₹{i.price * i.quantity}</span></div>)}
                          <div className="border-top mt-4 pt-4">
                            <button onClick={() => setCurrentView('checkout')} className="btn btn-danger w-100 py-3 rounded-4 fw-black text-uppercase">Checkout</button>
                          </div>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
        );
      case 'checkout':
        return (
          <div className="container py-5 animate-fadeIn">
            <div className="max-w-xl mx-auto">
              <h1 className="display-5 fw-black mb-5">Checkout</h1>
              <div className="card border-0 z-shadow rounded-5 p-4 mb-4">
                 {cart.map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="fw-black">₹{item.price * item.quantity}</span>
                    </div>
                 ))}
                 <div className="pt-3 d-flex justify-content-between h4 fw-black text-danger">
                    <span>Total</span><span>₹{cart.reduce((acc, i) => acc + (i.price * i.quantity), 0) + manualDeliveryFee}</span>
                 </div>
              </div>
              <button onClick={async () => {
                 const id = Math.random().toString(36).substr(2,6).toUpperCase();
                 const newOrder = { id, status: 'preparing', total: 100, items: cart, timestamp: Date.now() };
                 await db.saveOrder(newOrder);
                 setOrders([newOrder, ...orders]);
                 setCart([]);
                 setActiveTrackingId(id);
                 setCurrentView('tracking');
              }} className="btn btn-danger w-100 py-4 rounded-4 fw-black h4">Place Order</button>
            </div>
          </div>
        );
      case 'tracking': {
        const order = orders.find(o => o.id === activeTrackingId);
        return order ? (
          <div className="container py-5 animate-fadeIn">
             <h2 className="fw-black mb-4">Track Order #{order.id}</h2>
             <LiveTrackingMap status={order.status} userLocation={userCoords} />
          </div>
        ) : <div>Order not found</div>;
      }
      case 'history':
        return (
          <div className="container py-5 animate-fadeIn">
            <h1 className="display-5 fw-black mb-5">Order History</h1>
            <div className="row g-4">
              {orders.map(o => (
                <div key={o.id} className="col-12 col-md-6">
                  <div className="card border-0 z-shadow rounded-5 p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fw-black text-danger">Order #{o.id}</span>
                      <span className="badge bg-dark rounded-pill px-3">{o.status}</span>
                    </div>
                    <button onClick={() => { setActiveTrackingId(o.id); setCurrentView('tracking'); }} className="btn btn-outline-dark btn-sm rounded-3">Re-track</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'partner':
        return (
          <div className="container py-5 animate-fadeIn">
            <h1 className="fw-black mb-4">AI Partner Portal</h1>
            <textarea className="form-control mb-3 rounded-4 p-4" rows="10" placeholder="Paste your menu here..." value={partnerText} onChange={e => setPartnerText(e.target.value)}></textarea>
            <button onClick={async () => {
              setIsExtracting(true);
              const data = await extractRestaurantData(partnerText);
              setExtractedData(data);
              setIsExtracting(false);
            }} className="btn btn-danger rounded-pill px-5 py-3 fw-black">{isExtracting ? 'Magic happening...' : 'Extract Menu with AI'}</button>
          </div>
        );
      default: return <div className="p-5">View Coming Soon</div>;
    }
  };

  if (!currentUser) return (
    <div className="min-h-screen d-flex align-items-center justify-center bg-[#f8f9fa] p-4">
      <div className="card border-0 z-shadow rounded-5 p-5 text-center shadow-2xl" style={{maxWidth: '420px', width: '100%'}}>
        <div className="bg-danger text-white rounded-4 p-4 d-inline-block mb-4"><SparklesIcon className="w-12 h-12" /></div>
        <h1 className="display-5 fw-black mb-4 tracking-tighter">FlavorDish</h1>
        <button onClick={async () => setCurrentUser(await db.login('user', 'pass'))} className="btn btn-dark w-100 py-3 rounded-4 fw-black text-uppercase">Sign In</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed-top w-100 bg-[#0f0f0f] py-3 text-white">
        <div className="container d-flex justify-content-between align-items-center">
          <div onClick={() => setCurrentView('home')} className="cursor-pointer d-flex align-items-center gap-2">
            <SparklesIcon className="text-danger w-6 h-6" />
            <span className="h3 m-0 fw-black tracking-tighter">FlavorDish</span>
          </div>
          <div className="d-none d-lg-flex gap-5">
            {['home', 'history', 'partner'].map(v => (
              <button key={v} onClick={() => setCurrentView(v)} className={`btn btn-link text-decoration-none p-0 fw-black text-uppercase small ${currentView === v ? 'text-danger' : 'text-gray-300'}`}>{v}</button>
            ))}
          </div>
          <div className="d-flex align-items-center gap-3">
            <CartIcon className="w-6 h-6 cursor-pointer" onClick={() => setCurrentView('checkout')} />
            <div className="w-8 h-8 rounded-full bg-danger"></div>
          </div>
        </div>
      </nav>
      <main className="pt-20">{renderContent()}</main>
    </div>
  );
};

export default App;
