
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StarIcon, CartIcon, ClockIcon, SparklesIcon, HeartIcon, RefreshIcon, TagIcon } from './components/Icons.jsx';
import { getSmartRecommendations, enhanceMenuDescriptions, extractRestaurantData, getNearbyFoodDiscovery } from './services/geminiService.js';
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
  
  // Use coordinates as a key to trigger CSS animations when they change
  const locationKey = userLocation ? `${userLocation.lat}-${userLocation.lng}` : 'static-address';

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
        
        {/* Restaurant Marker */}
        <g transform="translate(60, 240)">
          <circle r="15" fill="#dc3545" className="animate-pulse" />
          <text y="30" textAnchor="middle" className="fw-black" style={{fontSize: '9px', fill: '#dc3545'}}>RESTAURANT</text>
          <text y="4" x="-5" style={{fontSize: '10px'}}>🏠</text>
        </g>

        {/* Destination Marker with animations */}
        <g transform="translate(340, 60)" key={locationKey}>
          {/* Pulsing ring for Live GPS */}
          {userLocation && (
            <circle r="15" fill="none" stroke="#3b82f6" strokeWidth="2" className="animate-glow-pulse" />
          )}
          
          {/* Base Circle with bounce on coordinate update */}
          <g className={userLocation ? "animate-marker-bounce" : ""}>
            <circle r="15" fill={userLocation ? "#3b82f6" : "#111827"} className="transition-colors duration-500" />
            <text y="4" x="-5" style={{fontSize: '10px'}}>📍</text>
          </g>

          <text y="30" textAnchor="middle" className="fw-black" style={{fontSize: '9px', fill: userLocation ? '#3b82f6' : '#111827'}}>
            {userLocation ? "HOME (LIVE GPS)" : "DELIVERY ADDRESS"}
          </text>
        </g>

        {/* Courier/Bike Marker */}
        <g style={{ offsetPath: `path("${pathD}")`, offsetDistance: `${progress * 100}%`, transition: 'offset-distance 3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <circle r="12" fill="white" stroke="#dc3545" strokeWidth="2" className="shadow-lg" />
          <text x="-6" y="5" style={{fontSize: '14px'}}>🚲</text>
        </g>
      </svg>
      <div className="position-absolute top-3 start-3 d-flex flex-column gap-2">
        <div className="bg-white px-3 py-1.5 rounded-pill z-shadow d-flex align-items-center gap-2">
          <div className="bg-success rounded-circle animate-pulse" style={{width: '8px', height: '8px'}}></div>
          <span className="fw-black text-uppercase" style={{fontSize: '9px', letterSpacing: '0.5px'}}>Live Tracking Active</span>
        </div>
        {userLocation && (
          <div className="bg-dark text-white px-3 py-1.5 rounded-pill z-shadow d-flex align-items-center gap-2">
             <div className="bg-blue-400 rounded-circle animate-ping" style={{width: '6px', height: '6px'}}></div>
             <span className="fw-bold" style={{fontSize: '9px'}}>GPS: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
          </div>
        )}
      </div>
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
            Redefining the culinary landscape of Ahmedabad with AI-driven discovery and premium delivery experiences.
          </p>
        </div>
        <div className="col-lg-5">
          <div className="bg-white/5 rounded-5 p-4 border border-white/10">
            <h6 className="fw-black text-uppercase small tracking-widest text-danger mb-3">Project Credits</h6>
            <div className="space-y-2">
              <div className="d-flex justify-content-between align-items-center border-bottom border-white/10 pb-2">
                <span className="text-gray-400 small fw-bold">Developed By</span>
                <span className="fw-black">Akanksha Bhagat</span>
              </div>
              <div className="d-flex justify-content-between align-items-center border-bottom border-white/10 pb-2">
                <span className="text-gray-400 small fw-bold">Year</span>
                <span className="fw-black">2026</span>
              </div>
              <div className="d-flex justify-content-between align-items-center border-bottom border-white/10 pb-2">
                <span className="text-gray-400 small fw-bold">Email</span>
                <a href="mailto:akanxa@gmail.com" className="text-white text-decoration-none fw-black hover:text-danger transition-colors">akanxa@gmail.com</a>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-gray-400 small fw-bold">Mobile</span>
                <a href="tel:8200429399" className="text-white text-decoration-none fw-black hover:text-danger transition-colors">8200429399</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-top border-white/10 mt-10 pt-5 text-center">
        <p className="text-gray-500 small mb-0 fw-bold">© 2026 FlavorDish. All rights reserved. Crafted with ❤️ in Ahmedabad.</p>
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
  const [sortCriteria, setSortCriteria] = useState('default'); // 'default', 'rating', 'delivery'
  const [manualDeliveryFee, setManualDeliveryFee] = useState(40);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Search & Discovery States
  const [searchQuery, setSearchQuery] = useState('');
  const [discoveryResults, setDiscoveryResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Partner/Admin States
  const [partnerText, setPartnerText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedRestaurant, activeTrackingId]);

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
    if ((currentView === 'tracking' || currentView === 'checkout' || currentView === 'home') && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.debug("Geolocation denied", err)
      );
    }
  }, [currentView]);

  useEffect(() => {
    const trackingOrder = orders.find(o => o.id === activeTrackingId);
    if (trackingOrder && trackingOrder.status !== 'delivered') {
      const interval = setInterval(() => {
        const statuses = ['preparing', 'picked_up', 'delivering', 'near_you', 'delivered'];
        const currentIdx = statuses.indexOf(trackingOrder.status);
        if (currentIdx < statuses.length - 1) {
          const nextStatus = statuses[currentIdx + 1];
          const updated = orders.map(o => o.id === trackingOrder.id ? { ...o, status: nextStatus } : o);
          setOrders(updated);
          localStorage.setItem('flavordish_db_orders', JSON.stringify(updated));
        }
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [activeTrackingId, orders]);

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
    if (sortCriteria === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortCriteria === 'delivery') {
      list.sort((a, b) => {
        const timeA = parseInt(a.deliveryTime.split('-')[0]) || 0;
        const timeB = parseInt(b.deliveryTime.split('-')[0]) || 0;
        return timeA - timeB;
      });
    }
    return list;
  }, [restaurants, sortCriteria]);

  const cartTotal = useMemo(() => cart.reduce((acc, i) => acc + (i.price * i.quantity), 0), [cart]);

  const addToCart = (item, res) => {
    const updated = [...cart];
    const existing = updated.find(i => i.id === item.id);
    if (existing) existing.quantity += 1;
    else updated.push({ ...item, quantity: 1, restaurantId: res.id, restaurantName: res.name, image: item.image });
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

  const handleNearMe = async () => {
    if (navigator.geolocation) {
      setIsSearching(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          const results = await getNearbyFoodDiscovery("Top rated restaurants near me in Ahmedabad", { latitude: coords.lat, longitude: coords.lng });
          setDiscoveryResults(results);
          setIsSearching(false);
        },
        (err) => {
          console.debug("Location failed", err);
          setIsSearching(false);
          alert("Could not access location. Please enter your search manually.");
        }
      );
    }
  };

  const handlePartnerExtract = async () => {
    if (!partnerText.trim()) return;
    setIsExtracting(true);
    const data = await extractRestaurantData(partnerText);
    setExtractedData(data);
    setIsExtracting(false);
  };

  const handleSaveRestaurant = async () => {
    if (!extractedData) return;
    const resId = `ext_${Date.now()}`;
    const newRes = { ...extractedData, id: resId };
    const updated = await db.saveRestaurant(newRes);
    setRestaurants(updated);
    setExtractedData(null);
    setPartnerText('');
    setCurrentView('home');
    alert("Welcome aboard! Your restaurant is now live in Ahmedabad.");
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="animate-fadeIn">
            <div className="position-relative overflow-hidden mb-5 rounded-bottom-5" style={{height: '550px'}}>
              <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000" className="w-100 h-100 object-cover" />
              <div className="position-absolute inset-0 bg-dark opacity-60"></div>
              <div className="position-absolute inset-0 d-flex flex-column align-items-center justify-content-center text-white px-4 text-center">
                <h1 className="display-2 fw-black tracking-tighter italic mb-3">Flavor<span className="text-danger">Dish</span></h1>
                <p className="h4 fw-bold mb-5 opacity-75 d-none d-md-block">The ultimate dining experience in Ahmedabad, delivered to your doorstep.</p>
                <div className="container max-w-2xl px-0">
                  <form onSubmit={handleSearch} className="row bg-white rounded-4 p-2 z-shadow text-dark mx-auto w-100 align-items-center">
                    <div className="col-auto d-none d-md-flex align-items-center px-4 border-end">
                      <span className="text-danger me-2">📍</span>
                      <span className="fw-black small text-uppercase">Ahmedabad</span>
                    </div>
                    <div className="col">
                      <input 
                        type="text" 
                        placeholder="Search for restaurant or dish..." 
                        className="form-control border-0 shadow-none fw-bold py-3" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="col-auto">
                      <button type="submit" disabled={isSearching} className="btn btn-danger rounded-3 px-4 py-2 fw-black text-uppercase small">
                        {isSearching ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                  </form>
                  <div className="mt-3">
                     <button onClick={handleNearMe} className="btn btn-link text-white text-decoration-none fw-bold small opacity-80 hover:opacity-100">
                        <span className="me-2">🎯</span> Use my current location
                     </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="container pb-5">
              {discoveryResults && (
                <section className="mb-5 animate-fadeIn">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-black h3 m-0">Discovery Results</h2>
                    <button onClick={() => setDiscoveryResults(null)} className="btn btn-outline-dark btn-sm rounded-pill px-4 fw-black">Clear Results</button>
                  </div>
                  <div className="card border-0 z-shadow rounded-5 p-4 p-md-5 bg-danger-subtle">
                    <div className="row g-4 align-items-center">
                       <div className="col-md-7">
                          <p className="h4 fw-bold mb-4 leading-relaxed">{discoveryResults.text}</p>
                          <div className="d-flex flex-wrap gap-2">
                             {discoveryResults.grounding.map((chunk, idx) => (
                               chunk.maps && (
                                 <a 
                                   key={idx} 
                                   href={chunk.maps.uri} 
                                   target="_blank" 
                                   rel="noopener noreferrer" 
                                   className="btn btn-white z-shadow rounded-pill px-4 py-2 fw-black text-danger d-flex align-items-center gap-2 hover:bg-danger hover:text-white transition-all"
                                 >
                                   <span>📍</span> {chunk.maps.title || "View on Maps"}
                                 </a>
                               )
                             ))}
                          </div>
                       </div>
                       <div className="col-md-5 d-none d-md-block">
                          <div className="bg-white p-4 rounded-5 z-shadow rotate-3">
                             <img src="https://images.unsplash.com/photo-1526367790999-0150786486a2?q=80&w=400" className="w-100 rounded-4 mb-3" />
                             <p className="small fw-bold text-muted text-center m-0">Amdavadi Street Food Guide</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </section>
              )}

              <section className="mb-5">
                <h2 className="fw-black h3 mb-4">Inspiration for your first order</h2>
                <div className="d-flex gap-4 gap-md-5 overflow-x-auto pb-4 no-scrollbar">
                  {[
                    { label: 'Biryani', img: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=200' },
                    { label: 'Burger', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200' },
                    { label: 'Thali', img: 'https://images.unsplash.com/photo-1626777552726-4a6b547b4de5?q=80&w=200' },
                    { label: 'Pizza', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200' },
                    { label: 'Dosa', img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?q=80&w=200' },
                    { label: 'Dessert', img: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=200' }
                  ].map(cat => (
                    <CategoryCircle key={cat.label} label={cat.label} image={cat.img} active={activeCategory === cat.label} onClick={() => setActiveCategory(cat.label)} />
                  ))}
                </div>
              </section>

              <section className="mb-5">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-4 mb-4">
                  <h2 className="fw-black h3 m-0">Curated for Ahmedabad</h2>
                  <div className="d-flex flex-wrap gap-2">
                    <button 
                      onClick={() => setSortCriteria('default')} 
                      className={`btn btn-sm rounded-pill px-4 fw-bold small text-uppercase transition-all ${sortCriteria === 'default' ? 'btn-danger shadow-lg' : 'btn-outline-secondary'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setSortCriteria('delivery')} 
                      className={`btn btn-sm rounded-pill px-4 fw-bold small text-uppercase transition-all ${sortCriteria === 'delivery' ? 'btn-danger shadow-lg' : 'btn-outline-secondary'}`}
                    >
                      <ClockIcon className="w-4 h-4 d-inline me-1" /> Fastest Delivery
                    </button>
                    <button 
                      onClick={() => setSortCriteria('rating')} 
                      className={`btn btn-sm rounded-pill px-4 fw-bold small text-uppercase transition-all ${sortCriteria === 'rating' ? 'btn-danger shadow-lg' : 'btn-outline-secondary'}`}
                    >
                      <StarIcon className="w-4 h-4 d-inline me-1" /> Highest Rating
                    </button>
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
      case 'partner':
        return (
          <div className="container py-5 animate-fadeIn min-h-screen">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-5">
                <div className="d-inline-block bg-danger text-white rounded-circle p-4 mb-3 shadow-lg">
                  <SparklesIcon className="w-10 h-10" />
                </div>
                <h1 className="display-4 fw-black tracking-tighter">AI Restaurant Importer</h1>
                <p className="text-muted fw-bold">Copy content from your website or menu, and our AI will build your store profile instantly.</p>
              </div>

              <div className="card border-0 z-shadow rounded-5 p-4 mb-4">
                <h5 className="fw-black mb-3">Paste Website or Menu Content</h5>
                <textarea 
                  className="form-control border-0 bg-light rounded-4 p-4 shadow-none fw-medium"
                  rows="10"
                  placeholder="Paste details here: Restaurant name, cuisine, address, menu items with prices, descriptions..."
                  value={partnerText}
                  onChange={(e) => setPartnerText(e.target.value)}
                ></textarea>
                <div className="d-flex justify-content-end mt-4">
                  <button 
                    onClick={handlePartnerExtract}
                    disabled={isExtracting || !partnerText.trim()}
                    className="btn btn-danger rounded-pill px-5 py-3 fw-black text-uppercase shadow-lg d-flex align-items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {isExtracting ? (
                      <><div className="spinner-border spinner-border-sm" role="status"></div> Extracting Magic...</>
                    ) : (
                      <><SparklesIcon /> AI Magic Extract</>
                    )}
                  </button>
                </div>
              </div>

              {extractedData && (
                <div className="animate-fadeIn mt-5">
                  <h3 className="fw-black mb-4">Review Extracted Profile</h3>
                  <div className="row g-4">
                    <div className="col-md-5">
                      <RestaurantCard restaurant={extractedData} onClick={() => {}} />
                    </div>
                    <div className="col-md-7">
                      <div className="card border-0 z-shadow rounded-5 p-4 h-100">
                        <h5 className="fw-black mb-4 border-bottom pb-2">Menu Preview ({extractedData.menu.length} items)</h5>
                        <div className="space-y-4">
                          {extractedData.menu.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="d-flex justify-content-between align-items-center">
                              <div>
                                <p className="fw-bold mb-0">{item.name}</p>
                                <p className="text-muted small mb-0">{item.description}</p>
                              </div>
                              <span className="fw-black text-danger">₹{item.price}</span>
                            </div>
                          ))}
                          <p className="text-center text-muted small mt-3 italic">And {extractedData.menu.length - 3} more items...</p>
                        </div>
                        <div className="mt-auto pt-4 border-top">
                           <button onClick={handleSaveRestaurant} className="btn btn-dark w-100 py-3 rounded-4 fw-black text-uppercase shadow-lg">Confirm & Publish Restaurant</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'restaurant':
        return selectedRestaurant && (
          <div className="container py-5 animate-fadeIn min-h-screen">
             <div className="position-relative overflow-hidden rounded-5 mb-5 shadow-2xl" style={{height: '350px'}}>
               <img src={selectedRestaurant.image} className="w-100 h-100 object-cover" />
               <div className="position-absolute bottom-0 start-0 w-100 p-4 p-md-5 bg-gradient-to-t from-black/90 via-black/30 to-transparent text-white">
                 <div className="d-flex justify-content-between align-items-end flex-wrap gap-3">
                   <div>
                     <h1 className="display-4 fw-black m-0 tracking-tighter">{selectedRestaurant.name}</h1>
                     <p className="fw-bold opacity-75 mb-2 mt-1">{selectedRestaurant.cuisine}</p>
                     <div className="d-flex align-items-center gap-3">
                        <span className="badge bg-success px-3 py-2 fw-black">{selectedRestaurant.rating} ★</span>
                        <span className="small fw-bold border-start ps-3">{selectedRestaurant.deliveryTime} delivery</span>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
             <div className="row g-5">
                <div className="col-lg-8">
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-4 mb-5">
                    <div className="d-flex align-items-center gap-3">
                      <h3 className="fw-black m-0">Menu</h3>
                      {isEnhancing && (
                        <div className="text-danger fw-bold small animate-pulse d-flex align-items-center gap-2">
                          <SparklesIcon className="w-4 h-4 animate-spin-slow" /> Refining tastes...
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={handleEnhanceMenu}
                      disabled={isEnhancing}
                      className="btn btn-light btn-sm rounded-pill px-3 fw-black text-uppercase d-flex align-items-center gap-2 shadow-sm"
                    >
                      <SparklesIcon className="w-4 h-4 text-danger" /> 
                      {batchEnhancedMenu && Object.keys(batchEnhancedMenu).length > 0 ? "Regenerate AI Descriptions" : "AI Enhance Menu"}
                    </button>
                  </div>
                  <div className="d-flex flex-column gap-4">
                    {selectedRestaurant.menu.map(item => (
                      <div key={item.id} className="card border-0 z-shadow rounded-5 p-4 transition-all hover:scale-[1.01] group bg-white">
                        <div className="row g-4">
                          <div className="col">
                            <h5 className="fw-black mb-1">{item.name}</h5>
                            <div className="d-flex align-items-center gap-3 mb-3">
                              <span className="fw-black text-danger">₹{item.price}</span>
                              <span className="text-muted small fw-bold d-flex align-items-center gap-1">
                                <ClockIcon className="w-3 h-3" /> {item.prepTime || '20 min'}
                              </span>
                            </div>
                            <p className={`small mb-0 leading-relaxed ${batchEnhancedMenu[item.id] ? 'text-dark fw-medium italic border-start border-danger border-2 ps-3' : 'text-muted'}`}>
                              {batchEnhancedMenu[item.id] || item.description}
                            </p>
                          </div>
                          <div className="col-auto">
                            <div className="position-relative" style={{width: '140px', height: '140px'}}>
                              <img src={item.image} className="w-100 h-100 object-cover rounded-4 shadow-sm" />
                              <button onClick={() => addToCart(item, selectedRestaurant)} className="position-absolute bottom-[-15px] start-50 translate-middle-x btn btn-white border z-shadow rounded-3 px-4 py-2 fw-black text-danger text-uppercase btn-sm hover:bg-light active:scale-95 shadow-lg" style={{fontSize: '11px'}}>Add +</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="card border-0 z-shadow rounded-5 p-4 sticky-top shadow-xl" style={{top: '110px'}}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                       <h4 className="fw-black m-0">Your Basket</h4>
                       <CartIcon className="text-danger w-6 h-6" />
                    </div>
                    {cart.length === 0 ? (
                      <div className="text-center py-5">
                        <div className="bg-light rounded-circle p-4 d-inline-block mb-3"><CartIcon className="w-10 h-10 text-muted opacity-30" /></div>
                        <p className="text-muted fw-black small text-uppercase">Start adding delicious items</p>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-4">
                        <div className="overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                          {cart.map((i, idx) => (
                            <div key={idx} className="d-flex justify-content-between align-items-center mb-4">
                              <div className="d-flex align-items-center gap-2">
                                <img src={i.image} className="rounded-2" style={{width: '40px', height: '40px', objectFit: 'cover'}} />
                                <span className="fw-bold small">{i.name} <span className="text-danger fw-black ms-1">x{i.quantity}</span></span>
                              </div>
                              <span className="fw-black small">₹{i.price * i.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-top pt-4">
                          <div className="d-flex justify-content-between align-items-center mb-4">
                             <span className="text-muted fw-bold small text-uppercase tracking-widest">Total to pay</span>
                             <span className="h2 fw-black text-danger m-0">₹{cartTotal}</span>
                          </div>
                          <button onClick={() => setCurrentView('checkout')} className="btn btn-danger w-100 py-3 rounded-4 fw-black text-uppercase z-shadow active:scale-95 shadow-lg">Proceed to Pay</button>
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
          <div className="container py-5 animate-fadeIn min-h-screen">
            <div className="row justify-content-center">
              <div className="col-lg-6">
                <div className="text-center mb-5">
                  <h1 className="display-5 fw-black tracking-tighter">Secure Checkout</h1>
                  <p className="text-muted fw-bold">Review your order before we dispatch the flavor.</p>
                </div>
                <div className="card border-0 z-shadow rounded-5 overflow-hidden mb-4">
                  <div className="bg-dark p-4 text-white d-flex justify-content-between align-items-center">
                    <h5 className="m-0 fw-bold">Order Summary</h5>
                    <span className="badge bg-danger">{cart.length} Items</span>
                  </div>
                  <div className="card-body p-4 p-md-5">
                    {cart.map((item, idx) => (
                      <div key={idx} className="d-flex justify-content-between mb-3 border-bottom border-light pb-2">
                        <span className="text-muted fw-bold">{item.name} × {item.quantity}</span>
                        <span className="fw-black text-dark">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="mt-5 space-y-2">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-muted fw-bold small text-uppercase tracking-widest">Delivery Fee (Adjustable)</span>
                        <div className="d-flex align-items-center bg-light rounded-3 px-3 py-1">
                          <span className="text-muted fw-black me-1">₹</span>
                          <input 
                            type="number" 
                            className="form-control border-0 bg-transparent p-0 shadow-none fw-black text-end" 
                            style={{width: '60px'}}
                            value={manualDeliveryFee}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setManualDeliveryFee(isNaN(val) ? 0 : val);
                            }}
                          />
                        </div>
                      </div>
                      <div className="d-flex justify-content-between small text-muted"><span>Platform Fee</span><span>₹5</span></div>
                      <div className="d-flex justify-content-between h2 fw-black text-danger pt-3 border-top mt-3">
                        <span>Total Payable</span>
                        <span>₹{cartTotal + manualDeliveryFee + 5}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card border-0 z-shadow rounded-5 p-4 mb-4">
                  <h5 className="fw-black mb-3">Special Delivery Instructions</h5>
                  <textarea 
                    className="form-control border-0 bg-light rounded-4 p-3 shadow-none fw-medium"
                    rows="3"
                    placeholder="E.g., Call upon arrival, Leave at the door, House is near the big tree..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                  ></textarea>
                </div>

                <div className="card border-0 z-shadow rounded-5 p-4 mb-4">
                  <h5 className="fw-black mb-3">Delivery To</h5>
                  <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-4">
                    <div className="bg-danger text-white rounded-circle p-2"><TagIcon /></div>
                    <div>
                       <p className="fw-black mb-0">Satellite Residence</p>
                       <p className="text-muted small mb-0">{userCoords ? `Live GPS Active (Ahmedabad)` : 'Satellite, Ahmedabad'}</p>
                    </div>
                  </div>
                </div>
                <button onClick={async () => {
                    const id = Math.random().toString(36).substr(2,6).toUpperCase();
                    const newOrder = { 
                      id, 
                      status: 'preparing', 
                      total: cartTotal + manualDeliveryFee + 5, 
                      items: [...cart], 
                      timestamp: Date.now(), 
                      estimatedArrival: 30,
                      instructions: specialInstructions 
                    };
                    await db.saveOrder(newOrder);
                    setOrders([newOrder, ...orders]);
                    setCart([]);
                    db.saveCart([]);
                    setSpecialInstructions(''); // Clear instructions after order
                    setActiveTrackingId(id);
                    setCurrentView('tracking');
                  }} className="btn btn-danger w-100 py-4 rounded-4 fw-black h4 shadow-2xl active:scale-95 transition-all">Pay & Place Order</button>
              </div>
            </div>
          </div>
        );
      case 'tracking': {
        const order = orders.find(o => o.id === activeTrackingId);
        if (!order) return <div className="text-center py-5 h1 fw-black">Order not found.</div>;
        return (
          <div className="container py-5 animate-fadeIn pb-5 min-h-screen">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                  <div className="d-flex align-items-center gap-3">
                    <button onClick={() => setCurrentView('history')} className="btn btn-link text-decoration-none text-danger fw-black p-0">← History</button>
                    <h2 className="fw-black m-0 tracking-tighter">Live Order Tracking</h2>
                  </div>
                  <span className="badge bg-dark rounded-pill px-4 py-2 fw-black text-uppercase shadow-sm">ID: #{order.id}</span>
                </div>
                <div className="row g-4">
                  <div className="col-xl-8">
                    <div className="card border-0 z-shadow rounded-5 overflow-hidden">
                      <div className="card-body p-0">
                        <LiveTrackingMap status={order.status} userLocation={userCoords} />
                      </div>
                    </div>
                    {order.instructions && (
                      <div className="card border-0 z-shadow rounded-5 p-4 mt-4 bg-light">
                        <h6 className="fw-black text-uppercase small text-danger mb-2">Your Delivery Instructions</h6>
                        <p className="mb-0 fw-medium italic text-muted">"{order.instructions}"</p>
                      </div>
                    )}
                  </div>
                  <div className="col-xl-4">
                    <div className="d-flex flex-column gap-4 h-100">
                      <div className="card border-0 z-shadow rounded-5 p-4 bg-danger text-white flex-grow-1">
                        <p className="fw-bold small text-uppercase mb-2 opacity-75">Current Status</p>
                        <h2 className="display-6 fw-black text-capitalize mb-4" style={{letterSpacing: '-1px'}}>{order.status.replace('_', ' ')}</h2>
                        <div className="mt-auto d-flex align-items-center gap-3 p-3 rounded-4" style={{background: 'rgba(255,255,255,0.1)'}}>
                          <div className="bg-white rounded-circle p-2 text-danger animate-bounce"><ClockIcon className="w-6 h-6" /></div>
                          <div>
                            <p className="fw-black mb-0 h3">{order.status === 'delivered' ? '0' : '22'}<small className="h6 ms-1">Mins</small></p>
                            <p className="small mb-0 opacity-75 fw-bold">Est. Delivery Time</p>
                          </div>
                        </div>
                      </div>
                      <div className="card border-0 z-shadow rounded-5 p-4 flex-grow-1">
                        <h5 className="fw-black mb-4 d-flex justify-content-between align-items-center">Your Meal<span className="small text-muted fw-bold">₹{order.total}</span></h5>
                        <div className="overflow-y-auto" style={{maxHeight: '200px'}}>
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="d-flex justify-content-between align-items-center mb-3">
                              <div className="d-flex align-items-center gap-2">
                                <img src={item.image} className="rounded-2" style={{width: '40px', height: '40px', objectFit: 'cover'}} />
                                <span className="fw-bold small">{item.name} × {item.quantity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'history':
        return (
          <div className="container py-5 animate-fadeIn min-h-screen">
            <h1 className="display-5 fw-black mb-5 tracking-tighter">Order History</h1>
            <div className="row g-4">
              {orders.map(o => (
                <div key={o.id} className="col-12 col-lg-6">
                  <div className="card border-0 z-shadow rounded-5 p-4 h-100 transition-all hover:bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div className="d-flex align-items-center gap-2">
                         <div className="bg-danger text-white p-2 rounded-3"><ClockIcon /></div>
                         <span className="fw-black text-danger">Order #{o.id}</span>
                      </div>
                      <span className={`badge rounded-pill ${o.status === 'delivered' ? 'bg-success' : 'bg-warning text-dark'} px-3 py-2 fw-black text-uppercase`} style={{fontSize: '9px'}}>{o.status}</span>
                    </div>
                    <div className="row g-3 align-items-center">
                       <div className="col">
                          <h5 className="fw-black mb-1">{o.items?.[0]?.restaurantName || 'Premium Restaurant'}</h5>
                          <p className="text-muted small fw-bold mb-0">Total: ₹{o.total} • {new Date(o.timestamp).toLocaleDateString()}</p>
                       </div>
                       <div className="col-auto">
                          <div className="d-flex gap-2">
                            <button onClick={() => { setActiveTrackingId(o.id); setCurrentView('tracking'); }} className="btn btn-dark rounded-3 px-4 fw-black text-uppercase btn-sm">Track</button>
                            <button className="btn btn-outline-dark rounded-3 btn-sm"><RefreshIcon /></button>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="col-12 text-center py-5">
                   <div className="opacity-10 display-1 mb-3">📦</div>
                   <h3 className="fw-black text-muted">No orders yet.</h3>
                   <button onClick={() => setCurrentView('home')} className="btn btn-danger rounded-pill px-5 py-3 mt-4 fw-black text-uppercase shadow-lg">Discover Food</button>
                </div>
              )}
            </div>
          </div>
        );
      default: return <div className="p-5 text-center h1 fw-black opacity-20">Coming Soon</div>;
    }
  };

  if (!currentUser) return <LoginView onLoginSuccess={setCurrentUser} />;

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed-top w-100 bg-[#0f0f0f] z-shadow py-3 text-white transition-all duration-300">
        <div className="container d-flex justify-content-between align-items-center">
          <div onClick={() => { setCurrentView('home'); setDiscoveryResults(null); }} className="cursor-pointer d-flex align-items-center gap-2 group">
            <div className="bg-danger rounded-3 p-2 shadow-lg text-white group-hover:rotate-12 transition-transform">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <span className="h3 m-0 fw-black tracking-tighter text-white">Flavor<span className="text-danger">Dish</span></span>
          </div>
          <div className="d-none d-lg-flex gap-5">
            {['home', 'history', 'partner'].map(v => (
              <button 
                key={v} 
                onClick={() => { setCurrentView(v); setDiscoveryResults(null); }} 
                className={`btn btn-link text-decoration-none p-0 fw-black text-uppercase small tracking-widest transition-all ${currentView === v ? 'text-danger' : 'text-gray-300 hover:text-white'}`}
              >
                {v === 'partner' ? 'Partner with Us' : v}
              </button>
            ))}
          </div>
          <div className="d-flex align-items-center gap-3">
            <button onClick={() => { if(cart.length) setCurrentView('checkout'); }} className="position-relative btn p-2 hover:bg-white/10 rounded-4 transition-all text-white">
              <CartIcon className="w-6 h-6" />
              {cart.length > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border-2 border-[#0f0f0f] shadow-sm" style={{fontSize: '9px'}}>{cart.length}</span>}
            </button>
            <div className="bg-white/10 rounded-circle overflow-hidden border-2 border-white/20 z-shadow cursor-pointer transition-all hover:scale-110" style={{width: '42px', height: '42px'}} onClick={() => { db.logout(); setCurrentUser(null); }}>
              <img src="https://ui-avatars.com/api/?name=Premium+Guest&background=dc3545&color=fff" alt="User" />
            </div>
          </div>
        </div>
      </nav>
      <main className="pt-20">{renderContent()}</main>
      <div className="d-lg-none fixed-bottom bg-white border-top py-3 z-shadow-lg">
        <div className="d-flex justify-content-around align-items-center">
          <button onClick={() => { setCurrentView('home'); setDiscoveryResults(null); }} className={`btn btn-link text-decoration-none p-2 rounded-4 ${currentView === 'home' ? 'text-danger bg-danger-subtle' : 'text-muted'}`}><RefreshIcon className="w-6 h-6" /></button>
          <button onClick={() => { setCurrentView('history'); setDiscoveryResults(null); }} className={`btn btn-link text-decoration-none p-2 rounded-4 ${currentView === 'history' ? 'text-danger bg-danger-subtle' : 'text-muted'}`}><ClockIcon className="w-6 h-6" /></button>
          <button onClick={() => { setCurrentView('partner'); setDiscoveryResults(null); }} className={`btn btn-link text-decoration-none p-2 rounded-4 ${currentView === 'partner' ? 'text-danger bg-danger-subtle' : 'text-muted'}`}><SparklesIcon className="w-6 h-6" /></button>
        </div>
      </div>
    </div>
  );
};

const LoginView = ({ onLoginSuccess }) => (
  <div className="min-h-screen d-flex align-items-center justify-center bg-[#f8f9fa] p-4">
    <div className="card border-0 z-shadow rounded-5 p-5 text-center animate-fadeIn shadow-2xl" style={{maxWidth: '420px', width: '100%'}}>
      <div className="bg-danger text-white rounded-4 p-4 d-inline-block shadow-lg mb-4 rotate-12 transition-transform hover:rotate-0 cursor-pointer"><SparklesIcon className="w-12 h-12" /></div>
      <h1 className="display-5 fw-black mb-1 tracking-tighter">Welcome back</h1>
      <p className="text-muted small fw-bold text-uppercase tracking-widest mb-5">Ahmedabad's Premium Concierge</p>
      <div className="space-y-3 mb-5">
        <button onClick={async () => {
            const user = await db.login('user', 'pass');
            onLoginSuccess(user);
          }} className="btn btn-dark w-100 py-3 rounded-4 fw-black text-uppercase shadow-lg hover:bg-danger transition-all active:scale-95 mb-3">Quick Sign In</button>
      </div>
      <p className="small text-muted mb-0">Experience the flavor of the future in Ahmedabad.</p>
    </div>
  </div>
);

export default App;
