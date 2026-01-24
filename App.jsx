
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { StarIcon, CartIcon, ClockIcon, SparklesIcon, TagIcon, RefreshIcon, HeartIcon } from './components/Icons.jsx';
import { enhanceMenuDescriptions, getNearbyFoodDiscovery, connectToLiveSupport } from './services/geminiService.js';
import { db } from './services/databaseService.js';

// --- Additional Icons ---
const HeadsetIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 4.978 4.978 0 011.414-3.536m0 0l2.829 2.829m-2.829 4.243L3 21m6.707-6.707a8.001 8.001 0 0111.314 0z" /></svg>
);
const XIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
);
const MicIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 013 3v8a3 3 0 01-6 0V5a3 3 0 013-3z" /></svg>
);
const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);

const ORDER_STATUS_STEPS = ['preparing', 'picked_up', 'delivering', 'near_you', 'delivered'];
const STATUS_LABELS = {
  'preparing': 'Preparing Food',
  'picked_up': 'Order Picked Up',
  'delivering': 'Out for Delivery',
  'near_you': 'Arriving Soon',
  'delivered': 'Delivered'
};

// --- Sub-components ---

const LiveSupportPanel = ({ isOpen, onClose, isDarkMode }) => {
  const [status, setStatus] = useState('disconnected');
  const [transcript, setTranscript] = useState([]);
  const sessionRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const startSupport = async () => {
    setStatus('connecting');
    try {
      const sessionPromise = await connectToLiveSupport({
        onopen: () => setStatus('active'),
        onmessage: (msg) => {
          if (msg.serverContent?.outputTranscription) {
            updateTranscript('model', msg.serverContent.outputTranscription.text);
          } else if (msg.serverContent?.inputTranscription) {
            updateTranscript('user', msg.serverContent.inputTranscription.text);
          }
        },
        onerror: () => setStatus('disconnected'),
        onclose: () => setStatus('disconnected'),
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('disconnected');
    }
  };

  const updateTranscript = (role, text) => {
    setTranscript(prev => {
      const last = prev[prev.length - 1];
      if (last && last.role === role) {
        const updated = [...prev];
        updated[updated.length - 1] = { ...last, text: last.text + text };
        return updated;
      }
      return [...prev, { role, text, timestamp: Date.now() }];
    });
  };

  useEffect(() => {
    if (isOpen && status === 'disconnected') {
      startSupport();
    }
    return () => {
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed-bottom p-4 d-flex justify-content-end pointer-events-none" style={{ zIndex: 2000 }}>
      <div className={`card border-0 z-shadow rounded-5 overflow-hidden d-flex flex-column pointer-events-auto animate-fadeIn shadow-2xl ${isDarkMode ? 'bg-[#1a1a1a] text-white border border-gray-800' : 'bg-white text-dark'}`} style={{ width: '100%', maxWidth: '400px', height: '600px' }}>
        <div className="p-4 bg-danger text-white d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className={`rounded-circle p-2 bg-white/20 ${status === 'active' ? 'animate-pulse' : ''}`}>
              <HeadsetIcon className="w-5 h-5" />
            </div>
            <div>
              <h6 className="m-0 fw-black tracking-tighter">Concierge Live</h6>
              <span className="small opacity-75 fw-bold uppercase" style={{ fontSize: '10px' }}>{status === 'active' ? '● Live with Gemini' : 'Connecting...'}</span>
            </div>
          </div>
          <button onClick={onClose} className="btn text-white p-0 border-0 shadow-none"><XIcon /></button>
        </div>

        <div ref={scrollRef} className="flex-grow-1 p-4 overflow-auto no-scrollbar d-flex flex-column gap-3">
          {transcript.length === 0 && (
            <div className="text-center py-10 opacity-50 d-flex flex-column align-items-center gap-3">
              <SparklesIcon className="w-12 h-12 text-danger animate-spin-slow" />
              <p className="small fw-bold uppercase tracking-widest">How can I help you today?</p>
            </div>
          )}
          {transcript.map((msg, i) => (
            <div key={i} className={`max-w-[85%] p-3 rounded-4 small fw-bold ${msg.role === 'user' ? 'align-self-end bg-danger text-white rounded-tr-none' : (isDarkMode ? 'bg-gray-800 text-white rounded-tl-none' : 'bg-gray-100 text-dark rounded-tl-none')}`}>
              {msg.text}
            </div>
          ))}
        </div>

        <div className={`p-4 border-top ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="d-flex align-items-center gap-3">
             <div className="flex-grow-1">
                <div className={`h-1 rounded-pill overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                   <div className={`h-100 bg-danger transition-all duration-300 ${status === 'active' ? 'w-1/2' : 'w-0'}`} />
                </div>
                <p className="small m-0 mt-2 opacity-50 fw-bold uppercase" style={{ fontSize: '9px' }}>
                  {status === 'active' ? 'Listening to your voice...' : 'Activating microphone...'}
                </p>
             </div>
             <div className={`rounded-circle p-3 ${status === 'active' ? 'bg-danger text-white shadow-lg shadow-red-500/50' : 'bg-gray-500 text-white'}`}>
                <MicIcon />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InteractiveMap = ({ center, isDarkMode, markers = [], polyline = [] }) => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, {
      center: center || [23.0225, 72.5714],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });
    mapRef.current = map;
    
    const tileUrl = isDarkMode 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png';
      
    L.tileLayer(tileUrl).addTo(map);
    return () => map.remove();
  }, [isDarkMode]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer);
    });

    markers.forEach(m => {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="bg-${m.color || 'danger'} p-2 rounded-circle border-2 border-white shadow-lg ${m.pulse ? 'animate-glow-pulse' : 'animate-marker-bounce'}" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; position: relative;">
          ${m.label || ''}
          ${m.pulse ? '<div class="position-absolute inset-0 rounded-circle bg-white opacity-25 animate-ping"></div>' : ''}
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      L.marker(m.position, { icon }).addTo(map);
    });

    if (polyline.length > 0) {
      L.polyline(polyline, { color: '#dc3545', weight: 4, opacity: 0.7, dashArray: '10, 10' }).addTo(map);
    }

    if (center) map.panTo(center, { animate: true, duration: 1 });
  }, [markers, polyline, center]);

  return <div ref={containerRef} className={`w-100 h-100 rounded-5 overflow-hidden z-shadow border ${isDarkMode ? 'border-gray-800' : 'border-white'}`} style={{ minHeight: '450px' }} />;
};

const StatusProgress = ({ currentStatus, isDarkMode }) => {
  const currentIdx = ORDER_STATUS_STEPS.indexOf(currentStatus);
  return (
    <div className="w-100 mb-4">
      <div className="d-flex justify-content-between mb-2">
        {ORDER_STATUS_STEPS.map((step, idx) => (
          <div key={step} className={`rounded-circle d-flex align-items-center justify-content-center transition-all duration-500 ${idx <= currentIdx ? 'bg-danger text-white' : 'bg-gray-800'}`} style={{width: '12px', height: '12px'}}>
             {idx === currentIdx && <div className="absolute w-6 h-6 bg-danger/20 rounded-circle animate-ping"></div>}
          </div>
        ))}
      </div>
      <div className="w-100 bg-gray-800 rounded-pill overflow-hidden" style={{height: '6px'}}>
        <div className="h-100 bg-danger transition-all duration-1000" style={{width: `${(currentIdx / (ORDER_STATUS_STEPS.length - 1)) * 100}%`}} />
      </div>
      <p className="small fw-black text-danger text-uppercase tracking-tighter mt-2 mb-0">{STATUS_LABELS[step]}</p>
    </div>
  );
};

const RestaurantCard = ({ restaurant, onClick, isDarkMode }) => (
  <div onClick={onClick} className={`card border-0 rounded-4 z-shadow z-shadow-hover cursor-pointer overflow-hidden transition-all h-100 ${isDarkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-dark'}`}>
    <div className="position-relative">
      <img src={restaurant.image} className="card-img-top object-cover h-48 md:h-56" alt={restaurant.name} />
      <div className={`position-absolute top-3 end-3 px-2 py-1 rounded-2 z-shadow d-flex align-items-center gap-1 ${isDarkMode ? 'bg-[#2a2a2a] text-white' : 'bg-white text-dark'}`}>
        <span className="fw-bold" style={{fontSize: '12px'}}>{restaurant.rating}</span>
        <StarIcon className="w-3 h-3 text-warning" />
      </div>
    </div>
    <div className="card-body">
      <h5 className="card-title fw-black m-0 text-truncate">{restaurant.name}</h5>
      <p className={`card-text small truncate mb-2 ${isDarkMode ? 'text-gray-400' : 'text-muted'}`}>{restaurant.cuisine}</p>
    </div>
  </div>
);

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [restaurants, setRestaurants] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [headerSearchTerm, setHeaderSearchTerm] = useState(() => localStorage.getItem('header_search_query') || '');
  const [userCoords, setUserCoords] = useState({ latitude: 23.0225, longitude: 72.5714 });
  const [activeTrackingId, setActiveTrackingId] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [batchEnhancedMenu, setBatchEnhancedMenu] = useState({});
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [courierDrift, setCourierDrift] = useState(0);

  // Auth States
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.body.style.backgroundColor = isDarkMode ? '#121212' : '#ffffff';
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('header_search_query', headerSearchTerm);
  }, [headerSearchTerm]);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'admin') setCurrentView('admin-dashboard');
    }
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
        (err) => console.debug("Location denied", err)
      );
    }
  }, []);

  // Courier Simulation Drift
  useEffect(() => {
    let interval;
    if (activeTrackingId) {
      interval = setInterval(() => {
        setCourierDrift(prev => (prev + 0.0001) % 0.005);
      }, 3000);
    } else {
      setCourierDrift(0);
    }
    return () => clearInterval(interval);
  }, [activeTrackingId]);

  useEffect(() => {
    if (currentView === 'restaurant' && selectedRestaurant) {
      const loadOrEnhance = async () => {
        setBatchEnhancedMenu({});
        const stored = await db.getMenuEnhancements(selectedRestaurant.id);
        if (stored) {
          setBatchEnhancedMenu(stored);
          return;
        }
        setIsEnhancing(true);
        try {
          const enhancements = await enhanceMenuDescriptions(selectedRestaurant.menu);
          if (enhancements) {
            await db.saveMenuEnhancements(selectedRestaurant.id, enhancements);
            setBatchEnhancedMenu(enhancements);
          }
        } catch (err) {
          console.error("AI Enhancement failed", err);
        } finally {
          setIsEnhancing(false);
        }
      };
      loadOrEnhance();
    }
  }, [currentView, selectedRestaurant]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');
    try {
      const user = await db.login(usernameInput, passwordInput);
      setCurrentUser(user);
      if (user.role === 'admin') setCurrentView('admin-dashboard');
      else setCurrentView('home');
    } catch (err) {
      setAuthError('Invalid credentials. Hint: user/pass or admin/admin');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const addToCart = (item, res) => {
    const updated = [...cart];
    const existing = updated.find(i => i.id === item.id);
    if (existing) existing.quantity += 1;
    else updated.push({ ...item, quantity: 1, restaurantId: res.id, restaurantName: res.name });
    setCart(updated);
    db.saveCart(updated);
  };

  const updateGlobalStatus = async (id, status) => {
    const updated = await db.updateOrderStatus(id, status);
    setOrders(updated);
  };

  const activeOrder = useMemo(() => orders.find(o => o.id === activeTrackingId), [orders, activeTrackingId]);
  
  const trackingData = useMemo(() => {
    if (!activeOrder) return null;
    // Mock restaurant slightly north-east
    const restCoords = [userCoords.latitude + 0.012, userCoords.longitude + 0.008];
    const homeCoords = [userCoords.latitude, userCoords.longitude];
    
    const statusIdx = ORDER_STATUS_STEPS.indexOf(activeOrder.status);
    let progress = statusIdx / (ORDER_STATUS_STEPS.length - 1);
    
    // Smooth progress based on current drift if delivering
    if (activeOrder.status === 'delivering') {
      progress += (0.1 * courierDrift / 0.005);
    }

    const courierPos = [
      restCoords[0] + (homeCoords[0] - restCoords[0]) * progress,
      restCoords[1] + (homeCoords[1] - restCoords[1]) * progress
    ];

    return { restCoords, homeCoords, courierPos, progress };
  }, [activeOrder, userCoords, courierDrift]);

  const filteredRestaurants = useMemo(() => {
    if (!headerSearchTerm.trim()) return [];
    return restaurants.filter(res => 
      res.name.toLowerCase().includes(headerSearchTerm.toLowerCase()) ||
      res.cuisine.toLowerCase().includes(headerSearchTerm.toLowerCase())
    ).slice(0, 5);
  }, [restaurants, headerSearchTerm]);

  if (!currentUser) return (
    <div className={`min-h-screen d-flex align-items-center justify-center p-4 ${isDarkMode ? 'bg-[#0f0f0f]' : 'bg-[#f8f9fa]'}`}>
      <div className={`card border-0 z-shadow rounded-5 p-5 text-center shadow-2xl animate-fadeIn ${isDarkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-dark'}`} style={{maxWidth: '450px', width: '100%'}}>
        <div className="bg-danger text-white rounded-4 p-4 d-inline-block mb-4 shadow-xl shadow-red-500/30">
          <SparklesIcon className="w-12 h-12" />
        </div>
        <h1 className="display-5 fw-black mb-2 tracking-tighter">FlavorDish</h1>
        <p className="text-gray-500 mb-5 small fw-bold text-uppercase tracking-widest">Premium Culinary Platform</p>
        <form onSubmit={handleLogin} className="d-flex flex-column gap-3 text-start">
          <div>
            <label className="small fw-bold mb-1 text-uppercase text-gray-500">Username</label>
            <input type="text" className={`form-control py-3 px-4 rounded-4 border-2 ${isDarkMode ? 'bg-[#0f0f0f] border-gray-800 text-white' : 'bg-gray-50'}`} value={usernameInput} onChange={e => setUsernameInput(e.target.value)} placeholder="user" required />
          </div>
          <div>
            <label className="small fw-bold mb-1 text-uppercase text-gray-500">Password</label>
            <input type="password" className={`form-control py-3 px-4 rounded-4 border-2 ${isDarkMode ? 'bg-[#0f0f0f] border-gray-800 text-white' : 'bg-gray-50'}`} value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="pass" required />
          </div>
          {authError && <p className="text-danger small fw-bold mt-1">{authError}</p>}
          <button type="submit" disabled={isLoggingIn} className="btn btn-danger py-4 rounded-4 fw-black tracking-tighter text-lg shadow-lg mt-3">SIGN IN</button>
        </form>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className="btn btn-link mt-4 text-gray-500 text-decoration-none small fw-bold uppercase">Toggle Mode</button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#121212]' : 'bg-white'}`}>
      <nav className={`fixed-top w-100 py-2 ${isDarkMode ? 'bg-[#0f0f0f]/95 backdrop-blur shadow-xl' : 'bg-[#0f0f0f]'}`} style={{ zIndex: 1100 }}>
        <div className="container d-flex justify-content-between align-items-center gap-3 md:gap-5">
          <div onClick={() => setCurrentView('home')} className="cursor-pointer d-flex align-items-center gap-2 flex-shrink-0">
            <SparklesIcon className="text-danger w-6 h-6 md:w-7 h-7" />
            <span className="h4 m-0 fw-black text-white tracking-tighter d-none d-md-block">FlavorDish</span>
          </div>

          <div className="flex-grow-1 position-relative max-w-xl">
             <div className={`d-flex align-items-center rounded-pill px-3 py-2 transition-all ${isDarkMode ? 'bg-gray-900 border border-gray-800 focus-within:border-danger' : 'bg-gray-800 border border-gray-700'}`}>
                <SearchIcon className="text-gray-500 me-2" />
                <input 
                  type="text" 
                  className="bg-transparent border-0 text-white shadow-none w-100 small fw-bold outline-none" 
                  placeholder="Find your favorite taste..."
                  value={headerSearchTerm}
                  onChange={(e) => {
                    setHeaderSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
             </div>
             {showSuggestions && filteredRestaurants.length > 0 && (
               <div className={`position-absolute top-100 start-0 w-100 mt-2 z-shadow rounded-4 overflow-hidden animate-fadeIn ${isDarkMode ? 'bg-[#1a1a1a] text-white border border-gray-800' : 'bg-white text-dark border border-gray-100'}`} style={{ zIndex: 1200 }}>
                  {filteredRestaurants.map(res => (
                    <div 
                      key={res.id} 
                      onClick={() => {
                        setSelectedRestaurant(res);
                        setCurrentView('restaurant');
                        setShowSuggestions(false);
                      }}
                      className={`p-3 cursor-pointer d-flex align-items-center gap-3 transition-colors ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                    >
                       <img src={res.image} className="w-10 h-10 rounded-3 object-cover" />
                       <div>
                          <p className="m-0 fw-black small">{res.name}</p>
                          <p className="m-0 text-muted x-small tracking-widest uppercase" style={{fontSize: '9px'}}>{res.cuisine}</p>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>

          <div className="d-flex align-items-center gap-2 md:gap-4 text-white flex-shrink-0">
            <button onClick={() => setCurrentView('history')} className={`small fw-black text-uppercase tracking-widest d-none d-md-block ${currentView === 'history' ? 'text-danger' : 'text-gray-400'}`}>MY ORDERS</button>
            <button onClick={() => { db.logout(); setCurrentUser(null); }} className="small fw-black text-uppercase tracking-widest text-gray-400 hover:text-danger">LOGOUT</button>
            <div onClick={() => setCurrentView('checkout')} className="position-relative cursor-pointer">
              <CartIcon className="w-5 h-5 md:w-6 h-6" />
              {cart.length > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize: '9px'}}>{cart.length}</span>}
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-10 container">
        {currentView === 'home' && (
          <div className="animate-fadeIn">
            <div className="mb-5 position-relative rounded-5 overflow-hidden h-64 md:h-96">
              <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000" className="w-100 h-100 object-cover opacity-60" />
              <div className="position-absolute inset-0 d-flex flex-column align-items-center justify-content-center px-4 text-center">
                <h1 className="display-4 fw-black text-white tracking-tighter">Ahmedabad's Finest</h1>
                <p className="text-white fw-bold tracking-widest small mt-3 opacity-80 uppercase">Culinary Excellence Delivered</p>
              </div>
            </div>
            <div className="row g-4">
              {restaurants.map(res => (
                <div key={res.id} className="col-12 col-md-6 col-lg-3">
                  <RestaurantCard isDarkMode={isDarkMode} restaurant={res} onClick={() => { setSelectedRestaurant(res); setCurrentView('restaurant'); }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'history' && (
          <div className="animate-fadeIn">
             <div className="d-flex justify-content-between align-items-center mb-5">
                <h2 className={`fw-black m-0 tracking-tighter ${isDarkMode ? 'text-white' : 'text-dark'}`}>My Orders</h2>
                <button onClick={() => setCurrentView('home')} className="btn btn-outline-danger btn-sm rounded-pill px-4 fw-black">EXPLORE MORE</button>
             </div>
             <div className="row g-4">
                {orders.map(o => (
                  <div key={o.id} className="col-12 col-md-6">
                    <div className={`card border-0 z-shadow rounded-5 p-4 ${isDarkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white'}`}>
                       <div className="d-flex justify-content-between mb-4">
                          <div className="flex-grow-1">
                             <div className="d-flex align-items-center gap-2 mb-1">
                                <span className="text-danger fw-black small uppercase tracking-widest">#{o.id}</span>
                                <span className="badge bg-danger/10 text-danger rounded-pill px-2 py-0.5 fw-bold" style={{fontSize: '8px'}}>{STATUS_LABELS[o.status]}</span>
                             </div>
                             <h4 className="fw-black m-0">{o.items?.[0]?.restaurantName}</h4>
                          </div>
                          <button onClick={() => { setActiveTrackingId(o.id); setCurrentView('tracking'); }} className="btn btn-danger btn-sm rounded-pill px-4 fw-black h-fit shadow-lg shadow-red-500/20">TRACK LIVE</button>
                       </div>
                       <div className="d-flex justify-content-between pt-3 border-top border-gray-800 mt-2">
                          <div className="d-flex align-items-center gap-2">
                             <ClockIcon className="text-muted" />
                             <span className="text-muted small">{new Date(o.timestamp).toLocaleDateString()}</span>
                          </div>
                          <span className="fw-black text-danger">₹{o.items?.reduce((a, b) => a + (b.price * b.quantity), 40)}</span>
                       </div>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                   <div className="col-12 text-center py-5">
                      <p className="text-muted fw-bold">No orders found. Start your food journey today!</p>
                   </div>
                )}
             </div>
          </div>
        )}

        {currentView === 'tracking' && activeOrder && trackingData && (
          <div className="animate-fadeIn">
             <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                   <h2 className={`fw-black m-0 tracking-tighter ${isDarkMode ? 'text-white' : 'text-dark'}`}>Tracking Order #{activeOrder.id}</h2>
                   <p className="text-muted fw-bold uppercase small tracking-widest mt-1">Status: <span className="text-danger">{STATUS_LABELS[activeOrder.status]}</span></p>
                </div>
                <button onClick={() => setCurrentView('history')} className="btn btn-outline-danger btn-sm rounded-pill px-4 fw-black">BACK TO HISTORY</button>
             </div>
             
             <div className="row g-4">
                <div className="col-lg-8">
                   <InteractiveMap 
                      isDarkMode={isDarkMode}
                      center={trackingData.courierPos}
                      markers={[
                        { position: trackingData.restCoords, color: 'danger', label: '🏪' },
                        { position: trackingData.homeCoords, color: 'primary', label: '🏠' },
                        { position: trackingData.courierPos, color: 'warning', label: '🚲', pulse: true }
                      ]}
                      polyline={[trackingData.restCoords, trackingData.courierPos, trackingData.homeCoords]}
                   />
                </div>
                <div className="col-lg-4">
                   <div className={`card border-0 z-shadow rounded-5 p-4 h-100 ${isDarkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white'}`}>
                      <div className="mb-5">
                         <h4 className="fw-black mb-1">Estimated Arrival</h4>
                         <p className="display-6 fw-black text-danger mb-0">12 mins</p>
                         <p className="small text-muted fw-bold uppercase tracking-widest">Rider is on the way</p>
                      </div>
                      
                      <div className="d-flex flex-column gap-4">
                         {ORDER_STATUS_STEPS.map((step, idx) => {
                           const statusIdx = ORDER_STATUS_STEPS.indexOf(activeOrder.status);
                           const isCurrent = step === activeOrder.status;
                           const isDone = ORDER_STATUS_STEPS.indexOf(step) < statusIdx;
                           return (
                             <div key={step} className={`d-flex gap-3 align-items-center ${isCurrent || isDone ? 'opacity-100' : 'opacity-30'}`}>
                                <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 transition-all ${isCurrent ? 'bg-danger scale-110 shadow-lg shadow-red-500/40' : isDone ? 'bg-success' : 'bg-gray-800'}`} style={{width: '32px', height: '32px'}}>
                                   {isDone ? <span className="text-white small">✓</span> : <span className="text-white small fw-black">{idx + 1}</span>}
                                </div>
                                <div className="flex-grow-1">
                                   <p className={`m-0 fw-black small ${isCurrent ? 'text-danger' : ''}`}>{STATUS_LABELS[step]}</p>
                                   {isCurrent && <div className="progress mt-1" style={{height: '3px'}}><div className="progress-bar progress-bar-striped progress-bar-animated bg-danger w-100"></div></div>}
                                </div>
                             </div>
                           )
                         })}
                      </div>

                      <div className="mt-auto pt-5">
                         <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-4 bg-gray-50/5 border border-gray-800">
                            <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200" className="w-12 h-12 rounded-circle object-cover" />
                            <div>
                               <p className="m-0 fw-black small">Rajesh Kumar</p>
                               <p className="m-0 text-muted x-small">Top Rated Rider ★ 4.9</p>
                            </div>
                         </div>
                         <button onClick={() => setIsSupportOpen(true)} className="btn btn-danger w-100 py-3 rounded-4 fw-black shadow-lg shadow-red-500/30 d-flex align-items-center justify-content-center gap-2">
                           <HeadsetIcon className="w-5 h-5" /> HELP WITH ORDER
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {currentView === 'restaurant' && selectedRestaurant && (
          <div className="animate-fadeIn">
             <div className="d-flex align-items-center justify-content-between mb-5">
                <div>
                   <h1 className={`h2 fw-black m-0 ${isDarkMode ? 'text-white' : 'text-dark'}`}>{selectedRestaurant.name}</h1>
                   <div className="d-flex align-items-center gap-3 mt-2">
                      <span className="small text-muted fw-bold">{selectedRestaurant.cuisine}</span>
                      <span className="badge bg-warning/20 text-warning px-2 py-1 rounded-2 fw-black">★ {selectedRestaurant.rating}</span>
                   </div>
                </div>
                <button onClick={() => setCurrentView('home')} className="btn btn-outline-danger btn-sm rounded-pill px-4 fw-black">BACK</button>
             </div>
             <div className="row g-4">
                {selectedRestaurant.menu.map(item => (
                  <div key={item.id} className="col-12 col-md-6">
                    <div className={`card border-0 z-shadow rounded-5 p-4 h-100 ${isDarkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white'}`}>
                       <div className="d-flex justify-content-between items-start h-100">
                          <div className="flex-grow-1 pe-3">
                             <h6 className="fw-black m-0 d-flex align-items-center gap-2">
                               {item.name}
                               {batchEnhancedMenu[item.id] && <SparklesIcon className="w-3 h-3 text-danger animate-pulse" />}
                             </h6>
                             <p className="text-danger fw-black mb-2">₹{item.price}</p>
                             <p className="small text-muted leading-relaxed mb-0">
                               {isEnhancing && !batchEnhancedMenu[item.id] ? (
                                 <span className="opacity-50 italic">Enhancing description...</span>
                               ) : (batchEnhancedMenu[item.id] || item.description)}
                             </p>
                          </div>
                          <div className="d-flex flex-column align-items-center gap-2">
                             <img src={item.image} className="w-24 h-24 rounded-4 object-cover shadow-lg" alt={item.name} />
                             <button onClick={() => addToCart(item, selectedRestaurant)} className="btn btn-outline-danger btn-sm rounded-3 w-100 fw-black mt-1">ADD</button>
                          </div>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {currentView === 'checkout' && (
          <div className="text-center py-10">
             <div className={`card border-0 z-shadow rounded-5 p-5 max-w-md mx-auto animate-fadeIn ${isDarkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white'}`}>
                <h2 className="fw-black mb-5">Checkout</h2>
                {cart.length === 0 ? (
                  <div className="py-5">
                    <CartIcon className="w-16 h-16 text-muted mx-auto mb-4 opacity-20" />
                    <p className="text-muted fw-bold">Your cart is empty.</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-5 text-start">
                      {cart.map((i, idx) => (
                        <div key={idx} className="d-flex justify-content-between small mb-3">
                          <div className="fw-bold">
                            <span className="text-danger me-2">{i.quantity}x</span>
                            {i.name}
                          </div>
                          <span className="text-muted">₹{i.price * i.quantity}</span>
                        </div>
                      ))}
                      <div className="border-top pt-3 mt-4 d-flex justify-content-between h5 fw-black">
                        <span>Total Amount</span>
                        <span className="text-danger">₹{cart.reduce((a, b) => a + (b.price * b.quantity), 40)}</span>
                      </div>
                      <p className="small text-muted mt-2">Incl. delivery fee of ₹40</p>
                    </div>
                    <button onClick={async () =>