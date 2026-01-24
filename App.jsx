
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { StarIcon, CartIcon, ClockIcon, SparklesIcon, TagIcon, RefreshIcon, HeartIcon } from './components/Icons.jsx';
import { enhanceMenuDescriptions, getNearbyFoodDiscovery, connectToLiveSupport } from './services/geminiService.js';
import { db } from './services/databaseService.js';

// --- Additional Icons ---
const ChartIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
);
const PackageIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
);
const HeadsetIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 4.978 4.978 0 011.414-3.536m0 0l2.829 2.829m-2.829 4.243L3 21m6.707-6.707a8.001 8.001 0 0111.314 0z" /></svg>
);
const XIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
);
const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);
const MapIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7l5-2.5 5.553 2.776a1 1 0 01.447.894v10.764a1 1 0 01-1.447.894L14 17l-5 3z" /></svg>
);
const GpsIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1c0-.55-.45-1-1-1s-1 .45-1 1v2.06C6.83 3.52 3.52 6.83 3.06 11H1c-.55 0-1 .45-1 1s.45 1 1 1h2.06c.46 4.17 3.77 7.48 7.94 7.94V23c0 .55.45 1 1 1s1-.45 1-1v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23c.55 0 1-.45 1-1s-.45-1-1-1h-2.06z" /></svg>
);
const UserCircleIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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

const LiveSupportPanel = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState('disconnected');
  const [transcript, setTranscript] = useState([]);
  const sessionRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcript]);

  const startSupport = async () => {
    setStatus('connecting');
    try {
      const sessionPromise = await connectToLiveSupport({
        onopen: () => setStatus('active'),
        onmessage: (msg) => {
          if (msg.serverContent?.outputTranscription) updateTranscript('model', msg.serverContent.outputTranscription.text);
          else if (msg.serverContent?.inputTranscription) updateTranscript('user', msg.serverContent.inputTranscription.text);
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
    if (isOpen && status === 'disconnected') startSupport();
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
      <div className={`z-card border-0 rounded-5 overflow-hidden d-flex flex-column pointer-events-auto animate-fadeIn shadow-2xl bg-white border border-gray-100`} style={{ width: '100%', maxWidth: '400px', height: '600px' }}>
        <div className="p-4 bg-danger text-white d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className={`rounded-circle p-2 bg-white/20 ${status === 'active' ? 'animate-pulse' : ''}`}><HeadsetIcon className="w-5 h-5" /></div>
            <div>
              <h6 className="m-0 fw-black tracking-tighter">Concierge Live</h6>
              <span className="small opacity-75 fw-bold uppercase" style={{ fontSize: '10px' }}>{status === 'active' ? '● Live with Gemini' : 'Connecting...'}</span>
            </div>
          </div>
          <button className="btn text-white p-0 border-0 shadow-none" onClick={onClose}><XIcon /></button>
        </div>
        <div ref={scrollRef} className="flex-grow-1 p-4 overflow-auto no-scrollbar d-flex flex-column gap-3 bg-gray-50">
          {transcript.length === 0 && (
            <div className="text-center py-10 opacity-50 d-flex flex-column align-items-center gap-3">
              <SparklesIcon className="w-12 h-12 text-danger animate-spin-slow" />
              <p className="small fw-bold uppercase tracking-widest text-dark">How can I help you today?</p>
            </div>
          )}
          {transcript.map((msg, i) => (
            <div key={i} className={`max-w-[85%] p-3 rounded-4 small fw-bold ${msg.role === 'user' ? 'align-self-end bg-danger text-white rounded-tr-none' : 'bg-white text-dark shadow-sm rounded-tl-none border border-gray-100'}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="p-4 border-top border-gray-100 bg-white">
          <div className="d-flex align-items-center gap-3">
             <div className="flex-grow-1">
                <div className="h-1 rounded-pill overflow-hidden bg-gray-100">
                   <div className={`h-100 bg-danger transition-all duration-300 ${status === 'active' ? 'w-1/2' : 'w-0'}`} />
                </div>
                <p className="small m-0 mt-2 opacity-50 fw-bold uppercase text-dark" style={{ fontSize: '9px' }}>{status === 'active' ? 'Listening to your voice...' : 'Activating microphone...'}</p>
             </div>
             <div className={`rounded-circle p-3 ${status === 'active' ? 'bg-danger text-white shadow-lg shadow-red-500/50' : 'bg-gray-200 text-gray-400'}`}><div className="w-6 h-6 d-flex align-items-center justify-content-center">🎙️</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InteractiveMap = ({ center, markers = [], polyline = [], height = '450px', zoom = 15 }) => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { center: center || [23.0225, 72.5714], zoom: zoom, zoomControl: false, attributionControl: false });
    mapRef.current = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    map.eachLayer((layer) => { if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer); });
    
    markers.forEach(m => {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="position-relative d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
            <div class="bg-${m.color || 'danger'} p-2 rounded-circle border-2 border-white shadow-lg d-flex align-items-center justify-content-center animate-marker-bounce" style="width: 36px; height: 36px; color: white; font-size: 16px; z-index: 2;">
              ${m.label || ''}
            </div>
            ${m.pulse ? `
              <div class="position-absolute rounded-circle bg-${m.color || 'danger'} opacity-40 animate-glow-pulse" style="width: 36px; height: 36px; z-index: 1;"></div>
              <div class="position-absolute rounded-circle border-2 border-${m.color || 'danger'} animate-marker-ping" style="width: 36px; height: 36px; z-index: 0;"></div>
            ` : ''}
          </div>
        `,
        iconSize: [36, 36], 
        iconAnchor: [18, 18]
      });
      L.marker(m.position, { icon }).addTo(map);
    });
    
    if (polyline.length > 0) L.polyline(polyline, { color: '#E23744', weight: 4, opacity: 0.7, dashArray: '10, 10' }).addTo(map);
    if (center) map.setView(center, zoom, { animate: true, duration: 0.8 });
  }, [markers, polyline, center, zoom]);

  return <div ref={containerRef} className="w-100 h-100 rounded-5 overflow-hidden shadow-sm border border-gray-100" style={{ minHeight: height }} />;
};

const StatusProgress = ({ currentStatus }) => {
  const currentIdx = ORDER_STATUS_STEPS.indexOf(currentStatus);
  return (
    <div className="w-100 mb-4">
      <div className="d-flex justify-content-between mb-2">
        {ORDER_STATUS_STEPS.map((step, idx) => (
          <div key={step} className={`rounded-circle d-flex align-items-center justify-content-center transition-all duration-500 ${idx <= currentIdx ? 'bg-danger text-white' : 'bg-gray-200'}`} style={{width: '12px', height: '12px'}}>
             {idx === currentIdx && <div className="absolute w-6 h-6 bg-danger/20 rounded-circle animate-ping"></div>}
          </div>
        ))}
      </div>
      <div className="w-100 bg-gray-100 rounded-pill overflow-hidden" style={{height: '6px'}}>
        <div className="h-100 bg-danger transition-all duration-1000" style={{width: `${(currentIdx / (ORDER_STATUS_STEPS.length - 1)) * 100}%`}} />
      </div>
      <p className="small fw-black text-danger text-uppercase tracking-tighter mt-2 mb-0">{STATUS_LABELS[currentStatus]}</p>
    </div>
  );
};

const RestaurantCard = ({ restaurant, onClick }) => (
  <div onClick={onClick} className="card border-0 rounded-4 z-shadow z-shadow-hover cursor-pointer overflow-hidden transition-all h-100 bg-white text-dark">
    <div className="position-relative">
      <img src={restaurant.image} className="card-img-top object-cover h-48 md:h-56" alt={restaurant.name} />
      <div className="position-absolute top-3 end-3 px-2 py-1 rounded-2 shadow-sm d-flex align-items-center gap-1 bg-white/90 text-dark backdrop-blur">
        <span className="fw-bold" style={{fontSize: '12px'}}>{restaurant.rating}</span>
        <StarIcon className="w-3 h-3 text-warning" />
      </div>
    </div>
    <div className="card-body">
      <h5 className="card-title fw-black m-0 text-truncate">{restaurant.name}</h5>
      <p className="card-text small truncate mb-2 text-gray-500">{restaurant.cuisine}</p>
    </div>
  </div>
);

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [restaurants, setRestaurants] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isUsingGps, setIsUsingGps] = useState(true);
  const [userCoords, setUserCoords] = useState({ latitude: 23.0225, longitude: 72.5714 });
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  
  // AI Discovery States
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [discoveryResult, setDiscoveryResult] = useState(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [activeTrackingId, setActiveTrackingId] = useState(null);
  const [courierDrift, setCourierDrift] = useState(0);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    db.getRestaurants().then(setRestaurants);
    db.getOrders().then(setOrders);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.debug("Location access denied. Using Ahmedabad city center.", err)
      );
    }
  }, []);

  const handleDiscovery = async (e) => {
    e.preventDefault();
    if (!discoveryQuery.trim()) return;
    setIsDiscovering(true);
    const result = await getNearbyFoodDiscovery(discoveryQuery, userCoords);
    setDiscoveryResult(result);
    setIsDiscovering(false);
  };

  const updateGlobalStatus = async (id, status) => {
    const updated = await db.updateOrderStatus(id, status);
    setOrders(updated);
  };

  const getTrackingData = (order) => {
    if (!order) return null;
    const restCoords = [userCoords.latitude + 0.012, userCoords.longitude + 0.008];
    const homeCoords = [userCoords.latitude, userCoords.longitude];
    const statusIdx = ORDER_STATUS_STEPS.indexOf(order.status);
    let progress = statusIdx / (ORDER_STATUS_STEPS.length - 1);
    const courierPos = [restCoords[0] + (homeCoords[0] - restCoords[0]) * progress, restCoords[1] + (homeCoords[1] - restCoords[1]) * progress];
    return { restCoords, homeCoords, courierPos, progress };
  };

  const addToCart = (item, res) => {
    const updated = [...cart];
    const existing = updated.find(i => i.id === item.id);
    if (existing) existing.quantity += 1;
    else updated.push({ ...item, quantity: 1, restaurantId: res.id, restaurantName: res.name });
    setCart(updated);
    db.saveCart(updated);
  };

  const HomeView = () => (
    <div className="animate-fadeIn">
      <div className="mb-5 position-relative rounded-5 overflow-hidden h-96 shadow-sm border border-gray-100">
        <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000" className="w-100 h-100 object-cover" />
        <div className="position-absolute inset-0 bg-black/40 d-flex flex-column align-items-center justify-content-center px-4 text-center">
          <h1 className="display-4 fw-black text-white tracking-tighter drop-shadow-lg">Amdavad's AI Concierge</h1>
          <p className="text-white fw-bold tracking-widest small mt-3 opacity-90 uppercase drop-shadow-md mb-5">Discover real-world gems based on your live location</p>
          
          <form onSubmit={handleDiscovery} className="w-100 max-w-2xl bg-white p-2 rounded-4 shadow-2xl d-flex gap-2">
             <div className="flex-grow-1 d-flex align-items-center px-3 border-end border-gray-100">
                <GpsIcon className="text-danger w-5 h-5 mr-3" />
                <input 
                  type="text" 
                  className="w-100 border-0 outline-none fw-bold text-dark p-2" 
                  placeholder="Find the best khaman nearby..." 
                  value={discoveryQuery}
                  onChange={e => setDiscoveryQuery(e.target.value)}
                />
             </div>
             <button type="submit" disabled={isDiscovering} className="btn btn-danger rounded-3 px-5 fw-black d-flex align-items-center gap-2">
               {isDiscovering ? <div className="animate-spin">🌀</div> : <SparklesIcon />}
               DISCOVER
             </button>
          </form>
        </div>
      </div>

      {discoveryResult && (
        <div className="mb-5 animate-fadeIn">
           <div className="z-card p-5 bg-white border-0 shadow-lg mb-4">
              <div className="row g-5">
                 <div className="col-lg-7">
                    <div className="d-flex align-items-center gap-3 mb-4">
                       <div className="bg-danger/10 p-3 rounded-circle"><SparklesIcon className="text-danger w-6 h-6" /></div>
                       <h2 className="fw-black m-0 tracking-tighter">AI Local Intelligence</h2>
                    </div>
                    <p className="lead text-dark fw-medium opacity-80 mb-4">{discoveryResult.text}</p>
                    <div className="d-flex flex-wrap gap-3">
                       {discoveryResult.grounding.map((chunk, i) => (
                         chunk.maps && (
                           <a key={i} href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="btn btn-outline-danger btn-sm rounded-pill px-4 fw-bold d-flex align-items-center gap-2">
                             <MapIcon className="w-4 h-4" /> {chunk.maps.title || "View on Maps"}
                           </a>
                         )
                       ))}
                    </div>
                 </div>
                 <div className="col-lg-5">
                    <div className="rounded-5 overflow-hidden shadow-sm h-100 border border-gray-100" style={{ minHeight: '300px' }}>
                       <InteractiveMap center={[userCoords.latitude, userCoords.longitude]} markers={[{ position: [userCoords.latitude, userCoords.longitude], color: 'danger', label: '📍', pulse: true }]} height="300px" zoom={14} />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <h3 className="fw-black mb-4 tracking-tighter d-flex align-items-center gap-3">
         <div className="bg-danger w-2 h-8 rounded-pill"></div>
         Top Amdavadi Restaurants
      </h3>
      <div className="row g-4">
        {restaurants.map(res => (
          <div key={res.id} className="col-12 col-md-6 col-lg-3">
            <RestaurantCard restaurant={res} onClick={() => { setSelectedRestaurant(res); setCurrentView('restaurant'); }} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed-top w-100 py-3 bg-white/95 backdrop-blur shadow-sm border-bottom border-gray-100" style={{ zIndex: 1100 }}>
        <div className="container d-flex justify-content-between align-items-center">
          <div onClick={() => setCurrentView('home')} className="cursor-pointer d-flex align-items-center gap-2">
            <SparklesIcon className="text-danger w-8 h-8" />
            <span className="h4 m-0 fw-black text-dark tracking-tighter">FlavorDish</span>
          </div>
          <div className="d-flex align-items-center gap-4 text-dark fw-bold uppercase tracking-widest small">
            <button onClick={() => setCurrentView('home')} className={`hover:text-danger transition-colors ${currentView === 'home' ? 'text-danger' : 'text-gray-500'}`}>HOME</button>
            <button onClick={() => setCurrentView('history')} className={`hover:text-danger transition-colors ${currentView === 'history' ? 'text-danger' : 'text-gray-500'}`}>MY ORDERS</button>
            <div onClick={() => setCurrentView('checkout')} className="position-relative cursor-pointer hover:scale-110 transition-transform">
              <CartIcon className="w-6 h-6" />
              {cart.length > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border-2 border-white" style={{fontSize: '10px'}}>{cart.length}</span>}
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-10 container">
        {currentView === 'home' && <HomeView />}
        {currentView === 'restaurant' && selectedRestaurant && (
          <div className="animate-fadeIn">
             <div className="mb-5 border-bottom border-gray-200 pb-4 d-flex justify-content-between align-items-end">
                <div>
                  <h1 className="display-6 fw-black m-0 text-dark tracking-tighter">{selectedRestaurant.name}</h1>
                  <p className="text-danger fw-bold uppercase tracking-widest small m-0 mt-2">{selectedRestaurant.cuisine}</p>
                </div>
                <button onClick={() => setCurrentView('home')} className="btn btn-outline-danger btn-sm rounded-pill px-4 fw-black">BACK TO DISCOVERY</button>
             </div>
             <div className="row g-4">
                {selectedRestaurant.menu.map(item => (
                  <div key={item.id} className="col-12 col-md-6">
                    <div className="z-card p-4 bg-white border-0 shadow-sm hover:shadow-lg transition-all h-100">
                       <div className="d-flex justify-content-between gap-4">
                          <div className="flex-grow-1">
                             <h6 className="fw-black m-0 text-dark">{item.name}</h6>
                             <div className="text-danger fw-black mb-3">₹{item.price}</div>
                             <p className="small text-muted mb-0 italic leading-relaxed">{item.description}</p>
                          </div>
                          <div className="d-flex flex-column align-items-center gap-3">
                             <img src={item.image} className="w-28 h-28 rounded-4 object-cover shadow-sm" alt={item.name} />
                             <button onClick={() => addToCart(item, selectedRestaurant)} className="btn btn-danger btn-sm rounded-3 w-100 fw-black shadow-lg shadow-red-500/10">ADD TO CART</button>
                          </div>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {currentView === 'checkout' && (
          <div className="animate-fadeIn">
             <div className="z-card border-0 overflow-hidden max-w-4xl mx-auto bg-white text-dark shadow-2xl rounded-5">
                <div className="row g-0">
                   <div className="col-lg-6 p-5">
                      <h2 className="fw-black mb-5 tracking-tighter display-6">Bag Review</h2>
                      {cart.length === 0 ? (
                        <div className="text-center py-5 opacity-40"><p className="fw-bold">Your bag is empty.</p></div>
                      ) : (
                        <>
                          <div className="overflow-auto no-scrollbar mb-5" style={{maxHeight: '350px'}}>
                             {cart.map((i, idx) => (
                               <div key={idx} className="d-flex justify-content-between align-items-center py-3 border-bottom border-gray-50">
                                  <div className="d-flex align-items-center gap-3">
                                     <div className="bg-danger/5 px-3 py-1 rounded-2 fw-black text-danger small">{i.quantity}x</div>
                                     <p className="m-0 fw-bold text-dark">{i.name}</p>
                                  </div>
                                  <span className="fw-black text-dark">₹{i.price * i.quantity}</span>
                               </div>
                             ))}
                          </div>
                          <div className="border-top border-gray-100 pt-4">
                             <div className="h4 fw-black d-flex justify-content-between text-dark">
                                <span>Total Amount</span>
                                <span className="text-danger">₹{cart.reduce((a, b) => a + (b.price * b.quantity), 40)}</span>
                             </div>
                             <button onClick={async () => {
                                const id = Math.random().toString(36).substr(2,6).toUpperCase();
                                const total = cart.reduce((a, b) => a + (b.price * b.quantity), 40);
                                await db.saveOrder({ id, status: 'preparing', items: [...cart], total, timestamp: Date.now(), estimatedArrival: Date.now() + 30*60*1000, deliveryAddress: 'Live GPS Location' });
                                setCart([]); setOrders(await db.getOrders()); setCurrentView('history');
                             }} className="btn btn-danger w-100 py-4 rounded-4 fw-black mt-5 shadow-xl shadow-red-500/20 text-lg">PLACE ORDER NOW</button>
                          </div>
                        </>
                      )}
                   </div>
                   <div className="col-lg-6 bg-gray-50 p-5 border-start border-gray-100">
                      <div className="d-flex align-items-center gap-3 mb-5">
                         <div className="bg-danger/10 p-2 rounded-circle"><MapIcon className="text-danger w-5 h-5" /></div>
                         <h5 className="fw-black m-0 tracking-tighter">Live Delivery Map</h5>
                      </div>
                      <div className="position-relative mb-5 rounded-5 overflow-hidden border-4 border-white shadow-lg" style={{ height: '300px' }}>
                         <InteractiveMap center={[userCoords.latitude, userCoords.longitude]} markers={[{ position: [userCoords.latitude, userCoords.longitude], color: 'danger', label: '🏠', pulse: true }]} height="300px" zoom={17} />
                      </div>
                      <div className="bg-white p-4 rounded-4 shadow-sm border border-gray-100">
                         <p className="small text-muted fw-bold uppercase tracking-widest mb-2" style={{fontSize: '10px'}}>Current Location</p>
                         <div className="d-flex align-items-center gap-3">
                            <GpsIcon className="text-danger" />
                            <span className="fw-black text-dark">Live Amdavadi Location Active</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {currentView === 'history' && (
          <div className="animate-fadeIn">
             <h2 className="display-6 fw-black mb-5 tracking-tighter text-dark border-bottom border-gray-100 pb-3">Order History</h2>
             <div className="row g-4">
                {orders.map(o => {
                  const tData = ['preparing', 'picked_up', 'delivering', 'near_you'].includes(o.status) ? getTrackingData(o) : null;
                  return (
                    <div key={o.id} className="col-12">
                      <div className="z-card p-5 bg-white border-0 shadow-sm transition-all">
                         <div className="row g-5">
                            <div className={tData ? 'col-lg-6' : 'col-12'}>
                               <div className="d-flex justify-content-between mb-5 border-bottom border-gray-50 pb-4">
                                  <div><span className="text-danger fw-black small uppercase tracking-widest bg-danger/5 px-2 py-1 rounded">ORDER #{o.id}</span><h3 className="fw-black m-0 mt-3">{o.items?.[0]?.restaurantName}</h3></div>
                                  <div className="text-end"><span className="h4 fw-black text-danger d-block">₹{o.total || 0}</span><span className="text-muted small fw-bold">{new Date(o.timestamp).toLocaleDateString()}</span></div>
                               </div>
                               <StatusProgress currentStatus={o.status} />
                               <div className="mt-5 d-flex gap-3">
                                  {tData ? (
                                    <button className="btn btn-danger flex-grow-1 py-3 rounded-4 fw-black shadow-lg shadow-red-500/10 uppercase tracking-widest">LIVE TRACKING ACTIVE</button>
                                  ) : (
                                    <button onClick={() => setCurrentView('home')} className="btn btn-outline-danger flex-grow-1 py-3 rounded-4 fw-black uppercase tracking-widest">ORDER FROM THIS PLACE AGAIN</button>
                                  )}
                               </div>
                            </div>
                            {tData && (
                              <div className="col-lg-6">
                                <div className="h-100 rounded-5 overflow-hidden shadow-md border border-gray-100">
                                   <InteractiveMap 
                                      center={tData.courierPos} 
                                      markers={[
                                        { position: tData.restCoords, color: 'danger', label: '🏪' }, 
                                        { position: tData.homeCoords, color: 'primary', label: '🏠' }, 
                                        { position: tData.courierPos, color: 'warning', label: '🚲', pulse: true }
                                      ]} 
                                      polyline={[tData.restCoords, tData.courierPos, tData.homeCoords]} 
                                      height="400px" 
                                   />
                                </div>
                              </div>
                            )}
                         </div>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        )}
      </div>

      <button onClick={() => setIsSupportOpen(true)} className="fixed bottom-8 right-8 btn btn-danger rounded-circle p-0 d-flex align-items-center justify-content-center shadow-2xl transition-all hover:scale-110 active:scale-95" style={{ width: '72px', height: '72px', zIndex: 1000, border: '4px solid white' }}>🎙️</button>
      <LiveSupportPanel isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      <footer className="z-footer bg-white mt-5">
        <div className="container">
           <div className="row g-5 mb-5">
              <div className="col-md-4">
                 <h2 className="h4 fw-black italic mb-4 tracking-tighter">FLAVORDISH</h2>
                 <p className="text-secondary small fw-medium leading-relaxed">Ahmedabad's smartest food discovery and delivery network. Using Google's latest AI to find you the best flavors based on your live location.</p>
              </div>
              <div className="col-md-2 offset-md-1">
                 <h6 className="fw-black mb-4 small uppercase tracking-widest text-dark opacity-40">Tech</h6>
                 <ul className="list-unstyled text-secondary small d-flex flex-column gap-3 fw-bold">
                    <li className="hover:text-danger cursor-pointer">Maps Grounding</li>
                    <li className="hover:text-danger cursor-pointer">Live Concierge</li>
                    <li className="hover:text-danger cursor-pointer">Sensory Search</li>
                 </ul>
              </div>
              <div className="col-md-5">
                 <h6 className="fw-black mb-4 small uppercase tracking-widest text-dark opacity-40">Live Location Experience</h6>
                 <div className="bg-gray-50 p-4 rounded-4 border border-gray-100">
                    <div className="d-flex align-items-center gap-3">
                       <GpsIcon className="text-danger" />
                       <div className="small fw-bold text-dark">AI is grounded with your real-time Amdavadi coordinates for pin-point accuracy.</div>
                    </div>
                 </div>
              </div>
           </div>
           <div className="pt-5 border-top border-gray-100 text-secondary x-small text-center opacity-60 font-medium">
              © 2025 FlavorDish Amdavad. Real-world mapping powered by Gemini 2.5.
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
