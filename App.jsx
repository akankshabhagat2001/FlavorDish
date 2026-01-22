
import React, { useState, useMemo, useEffect } from 'react';
import { StarIcon, CartIcon, ClockIcon, SparklesIcon, TagIcon, RefreshIcon } from './components/Icons.jsx';
import { enhanceMenuDescriptions, extractRestaurantData, getNearbyFoodDiscovery } from './services/geminiService.js';
import { db } from './services/databaseService.js';

// --- Icons for Theme & Search ---
const SunIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>
);
const MoonIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
);
const LocationIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);

// --- Pure UI Components ---

const RestaurantCard = ({ restaurant, onClick, isDarkMode }) => (
  <div 
    onClick={onClick}
    className={`card border-0 rounded-4 z-shadow z-shadow-hover cursor-pointer overflow-hidden transition-all h-100 ${isDarkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-dark'}`}
  >
    <div className="position-relative">
      <img src={restaurant.image} className="card-img-top object-cover h-48 md:h-56" alt={restaurant.name} />
      <div className={`position-absolute top-3 end-3 px-2 py-1 rounded-2 z-shadow d-flex align-items-center gap-1 ${isDarkMode ? 'bg-[#2a2a2a] text-white' : 'bg-white text-dark'}`}>
        <span className="fw-bold" style={{fontSize: '12px'}}>{restaurant.rating}</span>
        <StarIcon className="w-3 h-3 text-warning" />
      </div>
      <div className={`position-absolute bottom-3 start-3 backdrop-blur px-2 py-1 rounded-1 fw-bold text-uppercase ${isDarkMode ? 'bg-black/60 text-white' : 'bg-white/90 text-dark'}`} style={{fontSize: '10px'}}>
        {restaurant.deliveryTime}
      </div>
    </div>
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-start mb-1">
        <h5 className="card-title fw-black m-0 text-truncate" style={{letterSpacing: '-0.5px'}}>{restaurant.name}</h5>
      </div>
      <p className={`card-text small truncate mb-2 ${isDarkMode ? 'text-gray-400' : 'text-muted'}`}>{restaurant.cuisine}</p>
      <div className={`d-flex justify-content-between align-items-center pt-2 border-top ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <span className={`fw-bold ${isDarkMode ? 'text-gray-500' : 'text-muted'}`} style={{fontSize: '10px'}}>₹400 for two</span>
        <span className={`fw-bold ${isDarkMode ? 'text-gray-500' : 'text-muted'}`} style={{fontSize: '10px'}}>3.5 km</span>
      </div>
    </div>
  </div>
);

const LiveTrackingMap = ({ status, userLocation, isDarkMode }) => {
  const steps = ['preparing', 'picked_up', 'delivering', 'near_you', 'delivered'];
  const currentIdx = Math.max(0, steps.indexOf(status));
  const progress = currentIdx / (steps.length - 1);
  const pathD = "M 60 240 C 120 240, 180 60, 340 60";

  return (
    <div className={`rounded-4 overflow-hidden position-relative z-shadow border ${isDarkMode ? 'bg-[#1a1a1a] border-gray-800' : 'bg-[#f0f2f5] border-white'}`} style={{height: '400px'}}>
      <div className="position-absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `radial-gradient(${isDarkMode ? '#fff' : '#1c1c1c'} 1px, transparent 1px)`, backgroundSize: '20px 20px' }}></div>
      <svg className="w-100 h-100 p-4" viewBox="0 0 400 300">
        <g opacity="0.1">
          <rect x="20" y="20" width="60" height="100" fill={isDarkMode ? "#fff" : "#000"} />
          <rect x="250" y="200" width="80" height="60" fill={isDarkMode ? "#fff" : "#000"} />
          <path d="M0 150 H400 M200 0 V300" stroke={isDarkMode ? "#fff" : "#000"} strokeWidth="2" />
        </g>
        <path d={pathD} fill="none" stroke={isDarkMode ? "#333" : "#e5e7eb"} strokeWidth="12" strokeLinecap="round" />
        <path d={pathD} fill="none" stroke="#dc3545" strokeWidth="6" strokeLinecap="round" strokeDasharray="1000" strokeDashoffset={1000 - (progress * 1000)} className="transition-all duration-[3000ms] ease-out" />
        <g className="animate-boat-float">
          <path d="M -15 0 Q 0 10 15 0 L 10 -10 L -10 -10 Z" fill="#1e3a8a" />
          <path d="M 0 -10 V -20 L 8 -15 Z" fill="#dc3545" />
        </g>
        <g transform="translate(60, 240)">
          <circle r="15" fill="#dc3545" className="animate-pulse" />
          <text y="35" textAnchor="middle" className="fw-black" style={{fontSize: '10px', fill: '#dc3545'}}>RESTAURANT</text>
        </g>
        <g transform="translate(340, 60)">
          <circle r="15" fill={isDarkMode ? "#3b82f6" : "#111827"} />
          <text y="35" textAnchor="middle" className="fw-black" style={{fontSize: '10px', fill: isDarkMode ? '#3b82f6' : '#111827'}}>DESTINATION</text>
        </g>
        <g style={{ offsetPath: `path("${pathD}")`, offsetDistance: `${progress * 100}%`, transition: 'offset-distance 3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <circle r="12" fill="white" stroke="#dc3545" strokeWidth="2" />
          <text x="-7" y="5" style={{fontSize: '14px'}}>🚲</text>
        </g>
      </svg>
    </div>
  );
};

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [batchEnhancedMenu, setBatchEnhancedMenu] = useState({});
  const [dietaryFilters, setDietaryFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [discoveryResults, setDiscoveryResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [activeTrackingId, setActiveTrackingId] = useState(null);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.body.classList.add('bg-[#121212]');
      document.body.style.backgroundColor = '#121212';
    } else {
      document.body.classList.remove('bg-[#121212]');
      document.body.style.backgroundColor = '#ffffff';
    }
  }, [isDarkMode]);

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
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.debug("Location access denied", err)
      );
    }
  }, []);

  const handleManualLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          alert("Location updated successfully!");
        },
        () => alert("Please enable location permissions in your browser.")
      );
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await getNearbyFoodDiscovery(searchQuery, userCoords);
      setDiscoveryResults(results);
      setCurrentView('discovery');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const addToCart = (item, res) => {
    const updated = [...cart];
    const existing = updated.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      updated.push({ ...item, quantity: 1, restaurantId: res.id, restaurantName: res.name });
    }
    setCart(updated);
    db.saveCart(updated);
  };

  const handleOrderAgain = (order) => {
    const updatedCart = [...cart];
    order.items.forEach(item => {
      const existing = updatedCart.find(i => i.id === item.id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        updatedCart.push({ ...item });
      }
    });
    setCart(updatedCart);
    db.saveCart(updatedCart);
    setCurrentView('checkout');
  };

  const sortedRestaurants = useMemo(() => {
    let list = [...restaurants];
    if (dietaryFilters.length > 0) {
      list = list.filter(res => dietaryFilters.some(f => res.dietary?.includes(f)));
    }
    return list;
  }, [restaurants, dietaryFilters]);

  const renderView = () => {
    switch(currentView) {
      case 'home':
        return (
          <div className="animate-fadeIn">
            <div className="position-relative overflow-hidden mb-5 rounded-bottom-5" style={{height: '450px'}}>
              <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000" className="w-100 h-100 object-cover" alt="Hero" />
              <div className="position-absolute inset-0 bg-dark opacity-60"></div>
              <div className="position-absolute inset-0 d-flex flex-column align-items-center justify-content-center text-white px-4 text-center">
                <h1 className="display-3 fw-black tracking-tighter italic mb-2">Flavor<span className="text-danger">Dish</span></h1>
                <p className="h5 fw-bold mb-5 opacity-75">Premium food delivery in Ahmedabad.</p>
                <div className="container max-w-2xl">
                  <form onSubmit={handleSearch} className={`row rounded-4 p-2 mx-auto align-items-center ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
                    <div className="col-auto">
                       <button type="button" onClick={handleManualLocation} className={`btn p-2 rounded-3 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-dark'}`} title="Use Current Location">
                          <LocationIcon />
                       </button>
                    </div>
                    <div className="col">
                      <input 
                        type="text" 
                        placeholder="Search for restaurants, dishes or locations..." 
                        className={`form-control border-0 shadow-none fw-bold ${isDarkMode ? 'bg-transparent text-white placeholder-gray-500' : 'bg-white text-dark placeholder-gray-400'}`} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="col-auto">
                      <button type="submit" disabled={isSearching} className="btn btn-danger rounded-3 px-4 py-2 fw-black text-uppercase">
                        {isSearching ? '...' : 'Search'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div className="container">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className={`fw-black h3 m-0 ${isDarkMode ? 'text-white' : 'text-dark'}`}>Top Rated</h2>
                <div className="d-flex gap-2">
                  {['Vegetarian', 'Vegan'].map(f => (
                    <button 
                      key={f}
                      onClick={() => setDietaryFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])}
                      className={`btn btn-sm rounded-pill px-3 fw-bold border-2 ${dietaryFilters.includes(f) ? 'bg-success border-success text-white' : 'border-success/20 text-success'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="row g-4 mb-5">
                {sortedRestaurants.map(res => (
                  <div key={res.id} className="col-12 col-md-6 col-lg-3">
                    <RestaurantCard isDarkMode={isDarkMode} restaurant={res} onClick={() => { setSelectedRestaurant(res); setCurrentView('restaurant'); }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'discovery':
        return (
          <div className="container py-5 animate-fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-5">
               <h1 className={`display-5 fw-black m-0 ${isDarkMode ? 'text-white' : 'text-dark'}`}>Discovery Results</h1>
               <button onClick={() => setCurrentView('home')} className="btn btn-outline-danger rounded-pill px-4 fw-bold">Back to Home</button>
            </div>
            
            <div className={`card border-0 z-shadow rounded-5 p-5 mb-5 ${isDarkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white'}`}>
              <div className="d-flex align-items-start gap-4 mb-4">
                <div className="bg-danger/10 text-danger p-3 rounded-4">
                  <SparklesIcon className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="fw-black mb-2">AI Recommendations for "{searchQuery}"</h4>
                  <p className={`lead ${isDarkMode ? 'text-gray-400' : 'text-muted'}`}>{discoveryResults?.text}</p>
                </div>
              </div>

              {discoveryResults?.grounding?.length > 0 && (
                <div className="row g-4 mt-2">
                  <h5 className="fw-black text-uppercase small text-danger tracking-widest mb-0">Verified Google Maps Spots</h5>
                  {discoveryResults.grounding.map((chunk, idx) => chunk.maps && (
                    <div key={idx} className="col-md-6">
                      <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className={`d-block text-decoration-none p-4 rounded-4 border transition-all ${isDarkMode ? 'bg-[#2a2a2a] border-gray-800 text-white hover:bg-[#333]' : 'bg-[#f8f9fa] border-gray-200 text-dark hover:bg-white'}`}>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-black">{chunk.maps.title || "Nearby Restaurant"}</span>
                          <LocationIcon className="text-danger" />
                        </div>
                        <span className="small text-muted mt-2 d-block">Click to view location & reviews</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'restaurant':
        return selectedRestaurant && (
          <div className="container py-5 animate-fadeIn">
             <div className="position-relative overflow-hidden rounded-5 mb-5 shadow-2xl" style={{height: '300px'}}>
               <img src={selectedRestaurant.image} className="w-100 h-100 object-cover" alt={selectedRestaurant.name} />
               <div className="position-absolute bottom-0 start-0 w-100 p-5 bg-gradient-to-t from-black/90 text-white">
                 <h1 className="display-5 fw-black m-0 tracking-tighter">{selectedRestaurant.name}</h1>
                 <p className="fw-bold opacity-75">{selectedRestaurant.cuisine}</p>
               </div>
             </div>
             <div className="row g-5">
                <div className="col-lg-8">
                  <h3 className={`fw-black mb-4 ${isDarkMode ? 'text-white' : 'text-dark'}`}>Menu</h3>
                  <div className="d-flex flex-column gap-3">
                    {selectedRestaurant.menu.map(item => (
                      <div key={item.id} className={`card border-0 z-shadow rounded-5 p-4 ${isDarkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white'}`}>
                        <div className="row align-items-center">
                          <div className="col">
                            <h6 className="fw-black mb-1">{item.name}</h6>
                            <span className="fw-black text-danger">₹{item.price}</span>
                            <p className={`small mb-0 mt-1 ${isDarkMode ? 'text-gray-400' : 'text-muted'}`}>{batchEnhancedMenu[item.id] || item.description}</p>
                          </div>
                          <div className="col-auto">
                            <button onClick={() => addToCart(item, selectedRestaurant)} className="btn btn-outline-danger btn-sm fw-black rounded-3 px-3">ADD</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className={`card border-0 z-shadow rounded-5 p-4 sticky-top ${isDarkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white'}`} style={{top: '100px'}}>
                    <h4 className="fw-black mb-3">Cart</h4>
                    {cart.length === 0 ? <p className="text-muted small">Your cart is empty.</p> : (
                      <>
                        <div className="mb-4">
                          {cart.map((i, idx) => (
                            <div key={idx} className="d-flex justify-content-between mb-2 small">
                              <span>{i.name} x{i.quantity}</span>
                              <span className="fw-bold">₹{i.price * i.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-top pt-3">
                          <div className="d-flex justify-content-between h5 fw-black mb-4">
                            <span>Total</span>
                            <span className="text-danger">₹{cart.reduce((a, b) => a + (b.price * b.quantity), 40)}</span>
                          </div>
                          <button onClick={() => setCurrentView('checkout')} className="btn btn-danger w-100 py-3 rounded-4 fw-black">PROCEED TO CHECKOUT</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
             </div>
          </div>
        );
      case 'history':
        return (
          <div className="container py-5 animate-fadeIn">
            <h1 className={`display-5 fw-black mb-5 ${isDarkMode ? 'text-white' : 'text-dark'}`}>Order History</h1>
            <div className="row g-4">
              {orders.map(o => (
                <div key={o.id} className="col-12 col-md-6">
                  <div className="card border-0 z-shadow rounded-5 p-4 bg-[#1a1a1a] text-white">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div>
                        <span className="d-block text-danger fw-black small text-uppercase mb-1">Order Ref</span>
                        <span className="h4 fw-black m-0 tracking-tight">#{o.id}</span>
                      </div>
                      <span className="badge bg-gray-800 text-gray-300 rounded-pill px-4 py-2 fw-bold text-uppercase" style={{fontSize: '10px'}}>{o.status}</span>
                    </div>
                    
                    <div className="mb-4 border-top border-gray-800 pt-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-gray-400 small">Total Items: {o.items?.length || 0}</span>
                        <span className="fw-black h5 m-0">₹{o.items?.reduce((a, b) => a + (b.price * b.quantity), 40) || 0}</span>
                      </div>
                      <div className="mt-2">
                        {o.items?.map((item, idx) => (
                          <div key={idx} className="small text-gray-500">{item.name} x{item.quantity}</div>
                        ))}
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                       <button 
                        onClick={() => { setActiveTrackingId(o.id); setCurrentView('tracking'); }} 
                        className="btn btn-outline-light flex-grow-1 py-3 rounded-4 fw-black hover:scale-105 transition-transform"
                        style={{ fontSize: '12px' }}
                      >
                        RE-TRACK
                      </button>
                      {o.status === 'delivered' && (
                        <button 
                          onClick={() => handleOrderAgain(o)} 
                          className="btn btn-danger flex-grow-1 py-3 rounded-4 fw-black text-white hover:scale-105 transition-transform shadow-lg shadow-red-500/20"
                          style={{ fontSize: '12px' }}
                        >
                          ORDER AGAIN
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="col-12 text-center py-10">
                  <p className={`h5 fw-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>No past orders found.</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'tracking':
        const order = orders.find(o => o.id === activeTrackingId);
        return order && (
          <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className={`fw-black m-0 ${isDarkMode ? 'text-white' : 'text-dark'}`}>Tracking Order #{order.id}</h2>
              <button onClick={() => setCurrentView('history')} className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold">BACK TO HISTORY</button>
            </div>
            <LiveTrackingMap isDarkMode={isDarkMode} status={order.status} />
            <div className={`card border-0 z-shadow rounded-5 p-4 mt-4 ${isDarkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white'}`}>
              <h5 className="fw-black mb-3">Order Status: <span className="text-danger text-uppercase">{order.status.replace('_', ' ')}</span></h5>
              <p className="text-gray-400 small m-0">Our courier is on the way to deliver your hot meal!</p>
            </div>
          </div>
        );
      case 'checkout':
        return (
          <div className="container py-5 text-center">
             <div className={`card border-0 z-shadow rounded-5 p-5 max-w-md mx-auto ${isDarkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white'}`}>
                <h2 className="fw-black mb-4">Confirm Your Order</h2>
                <p className="text-gray-400 mb-5">By clicking place order, you agree to our premium service terms.</p>
                <div className="h3 fw-black text-danger mb-5">Total Payable: ₹{cart.reduce((a, b) => a + (b.price * b.quantity), 40)}</div>
                <button onClick={async () => {
                  const id = Math.random().toString(36).substr(2,6).toUpperCase();
                  const newOrder = { 
                    id, 
                    status: 'preparing', 
                    items: [...cart],
                    timestamp: Date.now()
                  };
                  await db.saveOrder(newOrder);
                  setOrders([newOrder, ...orders]);
                  setCart([]);
                  setActiveTrackingId(id);
                  setCurrentView('tracking');
                }} className="btn btn-danger w-100 py-4 rounded-4 fw-black h4 m-0 shadow-lg shadow-red-500/20">PLACE ORDER NOW</button>
                <button onClick={() => setCurrentView('restaurant')} className="btn btn-link mt-4 text-muted fw-bold text-decoration-none small">Go back to menu</button>
             </div>
          </div>
        );
      default: return null;
    }
  };

  if (!currentUser) return (
    <div className={`min-h-screen d-flex align-items-center justify-center p-4 transition-colors ${isDarkMode ? 'bg-[#0f0f0f]' : 'bg-[#f8f9fa]'}`}>
      <div className={`card border-0 z-shadow rounded-5 p-5 text-center shadow-2xl ${isDarkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-dark'}`} style={{maxWidth: '400px', width: '100%'}}>
        <div className="bg-danger text-white rounded-4 p-4 d-inline-block mb-4 shadow-xl shadow-red-500/30">
          <SparklesIcon className="w-12 h-12" />
        </div>
        <h1 className="display-5 fw-black mb-2 tracking-tighter">FlavorDish</h1>
        <p className="text-gray-500 mb-5 small fw-bold text-uppercase tracking-widest">Ahmedabad</p>
        <button onClick={async () => setCurrentUser(await db.login('user', 'pass'))} className="btn btn-danger w-100 py-3 rounded-4 fw-black tracking-tighter text-lg shadow-lg">SIGN IN TO DISCOVER</button>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="btn btn-link mt-4 text-gray-500 text-decoration-none small fw-bold uppercase">
          Switch to {isDarkMode ? 'Light' : 'Dark'} Mode
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-white'}`}>
      <nav className={`fixed-top w-100 py-3 transition-colors ${isDarkMode ? 'bg-[#0f0f0f]/90 backdrop-blur border-b border-gray-800' : 'bg-[#0f0f0f] shadow-xl'}`}>
        <div className="container d-flex justify-content-between align-items-center">
          <div onClick={() => setCurrentView('home')} className="cursor-pointer d-flex align-items-center gap-2">
            <SparklesIcon className="text-danger w-7 h-7" />
            <