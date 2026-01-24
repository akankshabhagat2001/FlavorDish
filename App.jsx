
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
const UsersIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
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
        html: `<div class="bg-${m.color || 'danger'} p-2 rounded-circle border-2 border-white shadow-lg ${m.pulse ? 'animate-glow-pulse' : 'animate-marker-bounce'}" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; position: relative;">${m.label || ''}${m.pulse ? '<div class="position-absolute inset-0 rounded-circle bg-white opacity-25 animate-ping"></div>' : ''}</div>`,
        iconSize: [36, 36], iconAnchor: [18, 18]
      });
      L.marker(m.position, { icon }).addTo(map);
    });
    if (polyline.length > 0) L.polyline(polyline, { color: '#E23744', weight: 4, opacity: 0.7, dashArray: '10, 10' }).addTo(map);
    if (center) map.setView(center, zoom, { animate: true, duration: 1 });
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

// --- Audio Feedback Utility ---
const playAudioCue = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'add') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'reorder') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (err) {
    console.debug("Audio cue failed", err);
  }
};

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [restaurants, setRestaurants] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [headerSearchTerm, setHeaderSearchTerm] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isUsingGps, setIsUsingGps] = useState(true);
  const [userCoords, setUserCoords] = useState({ latitude: 23.0225, longitude: 72.5714 });
  const [activeTrackingId, setActiveTrackingId] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [courierDrift, setCourierDrift] = useState(0);

  // Discovery States
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [discoveryResult, setDiscoveryResult] = useState(null);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Auth States
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'admin') setCurrentView('admin-dashboard');
    }
    const init = async () => {
      const [res, ord, crt] = await Promise.all([db.getRestaurants(), db.getOrders(), db.getCart()]);
      setRestaurants(res || []); setOrders(ord || []); setCart(crt || []);
    };
    init();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.debug("Location denied", err)
      );
    }
  }, []);

  useEffect(() => {
    let interval;
    if (activeTrackingId || orders.some(o => ['preparing', 'picked_up', 'delivering', 'near_you'].includes(o.status))) {
      interval = setInterval(() => setCourierDrift(prev => (prev + 0.0001) % 0.005), 3000);
    } else setCourierDrift(0);
    return () => clearInterval(interval);
  }, [activeTrackingId, orders]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const user = await db.login(usernameInput, passwordInput);
      setCurrentUser(user);
      if (user.role === 'admin') setCurrentView('admin-dashboard');
      else setCurrentView('home');
    } catch (err) {
      alert('Invalid credentials. Hint: user/pass or admin/admin');
    } finally {
      setIsLoggingIn(false);
    }
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
    if (order.status === 'delivering') progress += (0.1 * courierDrift / 0.005);
    const courierPos = [restCoords[0] + (homeCoords[0] - restCoords[0]) * progress, restCoords[1] + (homeCoords[1] - restCoords[1]) * progress];
    return { restCoords, homeCoords, courierPos, progress };
  };

  const addToCart = (item, res) => {
    playAudioCue('add');
    const updated = [...cart];
    const existing = updated.find(i => i.id === item.id);
    if (existing) existing.quantity += 1;
    else updated.push({ ...item, quantity: 1, restaurantId: res.id, restaurantName: res.name });
    setCart(updated);
    db.saveCart(updated);
  };

  const handleReorder = (order) => {
    playAudioCue('reorder');
    const updatedCart = [...cart];
    order.items.forEach(pastItem => {
      const existingIndex = updatedCart.findIndex(i => i.id === pastItem.id);
      if (existingIndex > -1) {
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: updatedCart[existingIndex].quantity + pastItem.quantity
        };
      } else {
        updatedCart.push({ ...pastItem });
      }
    });
    setCart(updatedCart);
    db.saveCart(updatedCart);
    if (order.items.length > 0) {
      const firstItemResId = order.items[0].restaurantId;
      const res = restaurants.find(r => r.id === firstItemResId);
      if (res) setSelectedRestaurant(res);
    }
    setCurrentView('checkout');
  };

  const checkoutMapCenter = useMemo(() => {
    if (isUsingGps) return [userCoords.latitude, userCoords.longitude];
    if (!deliveryAddress.trim()) return [userCoords.latitude, userCoords.longitude];
    
    let hash = 0;
    for (let i = 0; i < deliveryAddress.length; i++) {
      hash = ((hash << 5) - hash) + deliveryAddress.charCodeAt(i);
      hash |= 0; 
    }
    const latOffset = (hash % 100) * 0.0001;
    const lngOffset = ((hash * 7) % 100) * 0.0001;
    return [userCoords.latitude + latOffset, userCoords.longitude + lngOffset];
  }, [isUsingGps, userCoords, deliveryAddress]);

  const userStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((acc, o) => acc + (o.total || 0), 0);
    return { totalOrders, totalSpent };
  }, [orders]);

  // --- Partner Portal UI ---
  const PartnerDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    return (
      <div className="d-flex bg-white text-dark" style={{ minHeight: '100vh', marginTop: '-112px' }}>
         <div className={`transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} border-end border-gray-100 d-flex flex-column sticky-top h-screen bg-white`}>
            <div className="p-4 d-flex align-items-center gap-3 mb-5 mt-28">
               <SparklesIcon className="text-danger w-8 h-8 flex-shrink-0" />
               {sidebarOpen && <span className="h5 m-0 fw-black tracking-tighter">Partner Portal</span>}
            </div>
            <nav className="flex-grow-1 px-3 d-flex flex-column gap-2">
               {[
                 { id: 'admin-dashboard', label: 'Overview', icon: <ChartIcon /> },
                 { id: 'admin-orders', label: 'Live Orders', icon: <PackageIcon /> },
                 { id: 'admin-menu', label: 'Menu Commander', icon: <TagIcon /> }
               ].map(item => (
                 <button key={item.id} onClick={() => setCurrentView(item.id)} className={`btn border-0 text-start py-3 px-3 rounded-4 d-flex align-items-center gap-3 transition-all ${currentView === item.id ? 'bg-danger text-white shadow-lg shadow-red-500/20' : 'text-gray-500 hover:bg-gray-50'}`}>
                    <span className="flex-shrink-0">{item.icon}</span>
                    {sidebarOpen && <span className="fw-bold small uppercase tracking-widest">{item.label}</span>}
                 </button>
               ))}
            </nav>
            <div className="p-4 border-top border-gray-100">
               <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn btn-outline-danger w-100 rounded-pill"><RefreshIcon /></button>
            </div>
         </div>
         <div className="flex-grow-1 p-5 mt-28 bg-gray-50">
            <div className="d-flex justify-content-between align-items-center mb-5">
               <h1 className="fw-black m-0 tracking-tighter">Welcome back, Admin</h1>
               <button onClick={() => { db.logout(); setCurrentUser(null); }} className="btn btn-outline-danger px-4 rounded-pill fw-black small">LOGOUT</button>
            </div>
            <div className="z-card p-4 bg-white shadow-sm border-0">
               <h4 className="fw-black mb-4">Live Order Management</h4>
               <div className="table-responsive">
                  <table className="table table-borderless align-middle mb-0 text-dark">
                     <thead className="border-bottom border-gray-50">
                        <tr className="text-muted small uppercase tracking-widest">
                           <th className="py-3">Order ID</th>
                           <th className="py-3">Status</th>
                           <th className="py-3 text-end">Action</th>
                        </tr>
                     </thead>
                     <tbody>
                        {orders.filter(o => o.status !== 'delivered').map(o => (
                          <tr key={o.id} className="border-bottom border-gray-50">
                             <td className="py-4"><span className="fw-black text-danger">#{o.id}</span></td>
                             <td><span className="badge rounded-pill bg-warning text-dark px-3 py-2 fw-bold uppercase" style={{backgroundColor: 'rgba(255, 193, 7, 0.1)'}}>{o.status}</span></td>
                             <td className="text-end">
                                <button onClick={() => updateGlobalStatus(o.id, 'delivered')} className="btn btn-outline-success btn-sm rounded-pill px-3 fw-bold">MARK DELIVERED</button>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>
    );
  };

  const ProfileView = () => (
    <div className="animate-fadeIn">
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="z-card p-5 bg-white text-dark border-0 shadow-sm text-center h-100">
            <div className="mx-auto mb-4 bg-danger/5 p-4 rounded-circle d-inline-block">
               <UserCircleIcon className="w-20 h-20 text-danger" />
            </div>
            <h3 className="fw-black tracking-tighter mb-1">{currentUser.name}</h3>
            <p className="text-muted small fw-bold uppercase tracking-widest mb-4">Amdavadi Food Enthusiast</p>
            <div className="p-3 rounded-4 bg-gray-50 border border-gray-100 text-start">
               <p className="x-small text-muted fw-bold uppercase tracking-widest mb-1" style={{fontSize: '9px'}}>Account Tier</p>
               <p className="small m-0 fw-bold text-danger">Diamond Member</p>
            </div>
          </div>
        </div>
        <div className="col-lg-8">
           <div className="row g-4 h-100">
              <div className="col-md-6">
                 <div className="z-card p-5 bg-white text-dark border-0 shadow-sm text-center">
                    <PackageIcon className="w-12 h-12 text-primary mb-3 mx-auto" />
                    <p className="small text-muted fw-bold uppercase tracking-widest">Total Orders</p>
                    <h1 className="display-4 fw-black m-0">{userStats.totalOrders}</h1>
                 </div>
              </div>
              <div className="col-md-6">
                 <div className="z-card p-5 bg-white text-dark border-0 shadow-sm text-center">
                    <TagIcon className="w-12 h-12 text-success mb-3 mx-auto" />
                    <p className="small text-muted fw-bold uppercase tracking-widest">Lifetime Spent</p>
                    <h1 className="display-4 fw-black m-0 text-success">₹{userStats.totalSpent}</h1>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  if (!currentUser) return (
    <div className="min-h-screen d-flex align-items-center justify-content-center p-4 bg-gray-50">
       <div className="z-card border-0 rounded-5 overflow-hidden animate-fadeIn bg-white shadow-xl" style={{ maxWidth: '1000px', width: '100%' }}>
          <div className="row g-0">
             <div className="col-md-6 border-end border-gray-100 p-5">
                <div className="text-center mb-5">
                   <div className="bg-danger/5 p-4 rounded-circle d-inline-block mb-4"><CartIcon className="text-danger w-12 h-12" /></div>
                   <h3 className="fw-black tracking-tighter text-dark">Customer Portal</h3>
                </div>
                <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
                   <input type="text" className="form-control py-3 rounded-4 bg-gray-50 border-gray-100 text-dark shadow-none" placeholder="Username (user)" onChange={e => setUsernameInput(e.target.value)} required />
                   <input type="password" className="form-control py-3 rounded-4 bg-gray-50 border-gray-100 text-dark shadow-none" placeholder="Password (pass)" onChange={e => setPasswordInput(e.target.value)} required />
                   <button type="submit" disabled={isLoggingIn} className="btn btn-danger py-3 rounded-4 fw-black mt-2">LOGIN AS GUEST</button>
                </form>
             </div>
             <div className="col-md-6 bg-gray-50/50 p-5">
                <div className="text-center mb-5">
                   <div className="bg-primary/5 p-4 rounded-circle d-inline-block mb-4"><ChartIcon className="text-primary w-12 h-12" /></div>
                   <h3 className="fw-black tracking-tighter text-dark">Partner Access</h3>
                </div>
                <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
                   <input type="text" className="form-control py-3 rounded-4 bg-white border-gray-100 text-dark shadow-none" placeholder="Admin ID (admin)" onChange={e => setUsernameInput(e.target.value)} required />
                   <input type="password" className="form-control py-3 rounded-4 bg-white border-gray-100 text-dark shadow-none" placeholder="Key (admin)" onChange={e => setPasswordInput(e.target.value)} required />
                   <button type="submit" disabled={isLoggingIn} className="btn btn-primary py-3 rounded-4 fw-black mt-2">BUSINESS LOGIN</button>
                </form>
             </div>
          </div>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser.role !== 'admin' && (
        <nav className="fixed-top w-100 py-2 bg-white/95 backdrop-blur shadow-sm" style={{ zIndex: 1100, borderBottom: '1px solid #f0f0f0' }}>
          <div className="container d-flex justify-content-between align-items-center gap-4">
            <div onClick={() => setCurrentView('home')} className="cursor-pointer d-flex align-items-center gap-2">
              <SparklesIcon className="text-danger w-7 h-7" />
              <span className="h4 m-0 fw-black text-dark tracking-tighter d-none d-md-block">FlavorDish</span>
            </div>
            <div className="d-flex align-items-center gap-4 text-dark">
              <button onClick={() => setCurrentView('home')} className={`small fw-black uppercase tracking-widest ${currentView === 'home' ? 'text-danger' : 'text-gray-500'}`}>HOME</button>
              <button onClick={() => setCurrentView('history')} className={`small fw-black uppercase tracking-widest ${currentView === 'history' ? 'text-danger' : 'text-gray-500'}`}>ORDERS</button>
              <button onClick={() => setCurrentView('profile')} className={`small fw-black uppercase tracking-widest ${currentView === 'profile' ? 'text-danger' : 'text-gray-500'}`}>PROFILE</button>
              <div onClick={() => setCurrentView('checkout')} className="position-relative cursor-pointer">
                <CartIcon className="w-6 h-6 text-dark" />
                {cart.length > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize: '9px'}}>{cart.length}</span>}
              </div>
            </div>
          </div>
        </nav>
      )}

      <div className={currentUser.role === 'admin' ? "" : "pt-28 pb-10 container"}>
        {currentUser.role === 'admin' ? <PartnerDashboard /> : (
          <>
            {currentView === 'home' && (
              <div className="animate-fadeIn">
                <div className="mb-5 position-relative rounded-5 overflow-hidden h-96 shadow-sm">
                  <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000" className="w-100 h-100 object-cover" />
                  <div className="position-absolute inset-0 bg-black/30 d-flex flex-column align-items-center justify-content-center px-4 text-center">
                    <h1 className="display-4 fw-black text-white tracking-tighter drop-shadow-lg">Ahmedabad's Finest</h1>
                    <p className="text-white fw-bold tracking-widest small mt-3 opacity-90 uppercase drop-shadow-md">Culinary Excellence Delivered</p>
                  </div>
                </div>
                <div className="row g-4">{restaurants.map(res => (<div key={res.id} className="col-12 col-md-6 col-lg-3"><RestaurantCard restaurant={res} onClick={() => { setSelectedRestaurant(res); setCurrentView('restaurant'); }} /></div>))}</div>
              </div>
            )}

            {currentView === 'profile' && <ProfileView />}

            {currentView === 'history' && (
              <div className="animate-fadeIn">
                 <h2 className="fw-black mb-5 tracking-tighter text-dark">My Orders</h2>
                 <div className="row g-4">
                    {orders.map(o => {
                      const tData = ['preparing', 'picked_up', 'delivering', 'near_you'].includes(o.status) ? getTrackingData(o) : null;
                      return (
                        <div key={o.id} className="col-12">
                          <div className="z-card p-4 bg-white text-dark border-0 shadow-sm transition-all">
                             <div className="row g-4">
                                <div className={tData ? 'col-lg-5' : 'col-12'}>
                                   <div className="d-flex justify-content-between mb-4">
                                      <div><span className="text-danger fw-black small uppercase tracking-widest">#{o.id}</span><h4 className="fw-black m-0 mt-1">{o.items?.[0]?.restaurantName}</h4></div>
                                      <div className="text-end"><span className="fw-black text-danger d-block">₹{o.total || 0}</span><span className="text-muted small">{new Date(o.timestamp).toLocaleDateString()}</span></div>
                                   </div>
                                   <StatusProgress currentStatus={o.status} />
                                   <div className="mt-4 pt-4 border-top border-gray-50">
                                      {tData ? (<button className="btn bg-red-600 hover:bg-red-700 text-white w-100 py-3 rounded-4 fw-black border-0">LIVE TRACK</button>) : (<button onClick={() => handleReorder(o)} className="btn bg-red-600 hover:bg-red-700 text-white w-100 py-3 rounded-4 fw-black border-0">ORDER AGAIN</button>)}
                                   </div>
                                </div>
                                {tData && (
                                  <div className="col-lg-7"><InteractiveMap center={tData.courierPos} markers={[{ position: tData.restCoords, color: 'danger', label: '🏪' }, { position: tData.homeCoords, color: 'primary', label: '🏠' }, { position: tData.courierPos, color: 'warning', label: '🚲', pulse: true }]} polyline={[tData.restCoords, tData.courierPos, tData.homeCoords]} height="320px" /></div>
                                )}
                             </div>
                          </div>
                        </div>
                      );
                    })}
                 </div>
              </div>
            )}
            
            {currentView === 'restaurant' && selectedRestaurant && (
              <div className="animate-fadeIn">
                 <div className="d-flex align-items-center justify-content-between mb-5"><div><h1 className="h2 fw-black m-0 text-dark">{selectedRestaurant.name}</h1><span className="small text-muted fw-bold">{selectedRestaurant.cuisine}</span></div><button onClick={() => setCurrentView('home')} className="btn btn-outline-danger btn-sm rounded-pill px-4 fw-black">BACK</button></div>
                 <div className="row g-4">{selectedRestaurant.menu.map(item => (<div key={item.id} className="col-12 col-md-6"><div className="z-card p-4 bg-white text-dark border-0 shadow-sm"><div className="d-flex justify-content-between h-100"><div className="flex-grow-1 pe-3"><h6 className="fw-black m-0">{item.name}</h6><p className="text-danger fw-black mb-2">₹{item.price}</p><p className="small text-muted mb-0">{item.description}</p></div><div className="d-flex flex-column align-items-center gap-2"><img src={item.image} className="w-24 h-24 rounded-4 object-cover" /><button onClick={() => addToCart(item, selectedRestaurant)} className="btn btn-outline-danger btn-sm rounded-3 w-100 fw-black">ADD</button></div></div></div></div>))}</div>
              </div>
            )}

            {currentView === 'checkout' && (
              <div className="animate-fadeIn">
                 <div className="z-card border-0 overflow-hidden max-w-4xl mx-auto bg-white text-dark shadow-lg">
                    <div className="row g-0">
                       <div className="col-lg-6 p-5">
                          <h2 className="fw-black mb-5 tracking-tighter">Confirm Order</h2>
                          <div className="overflow-auto no-scrollbar mb-4" style={{maxHeight: '300px'}}>
                             {cart.map((i, idx) => (<div key={idx} className="d-flex justify-content-between align-items-center py-3 border-bottom border-gray-50"><div><p className="m-0 fw-bold small">{i.quantity}x {i.name}</p></div><span className="fw-black small">₹{i.price * i.quantity}</span></div>))}
                          </div>
                          <div className="border-top pt-4 h4 fw-black d-flex justify-content-between"><span>Total</span><span className="text-danger">₹{cart.reduce((a, b) => a + (b.price * b.quantity), 40)}</span></div>
                          <button onClick={async () => {
                             const id = Math.random().toString(36).substr(2,6).toUpperCase();
                             const total = cart.reduce((a, b) => a + (b.price * b.quantity), 40);
                             await db.saveOrder({ id, status: 'preparing', items: [...cart], total, timestamp: Date.now(), estimatedArrival: Date.now() + 30*60*1000, specialInstructions, deliveryAddress: isUsingGps ? 'Live GPS Location' : deliveryAddress });
                             setCart([]); setOrders(await db.getOrders()); setCurrentView('history');
                          }} className="btn btn-danger w-100 py-4 rounded-4 fw-black mt-4 shadow-xl shadow-red-500/10">PLACE ORDER</button>
                       </div>
                       <div className="col-lg-6 bg-gray-50 p-5 border-start border-gray-100">
                          <h5 className="fw-black mb-4 d-flex align-items-center gap-2"><MapIcon className="text-danger" /> Delivery Destination</h5>
                          <div className="position-relative mb-4 rounded-5 overflow-hidden border border-gray-100" style={{ height: '220px' }}>
                             <InteractiveMap center={checkoutMapCenter} markers={[{ position: checkoutMapCenter, color: 'danger', label: '🏠', pulse: true }]} height="220px" zoom={17} />
                          </div>
                          <div className="d-flex align-items-center gap-2 mb-3">
                             <input type="text" className="form-control rounded-4 py-3 bg-white border-gray-200 text-dark shadow-none flex-grow-1" placeholder="Enter delivery address..." value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} disabled={isUsingGps} />
                             <button onClick={() => setIsUsingGps(!isUsingGps)} className={`btn rounded-4 p-3 ${isUsingGps ? 'bg-danger text-white' : 'bg-white text-gray-400 border border-gray-200'}`} title="Use GPS"><GpsIcon /></button>
                          </div>
                          <textarea className="form-control rounded-4 p-3 bg-white border-gray-200 text-dark shadow-none" placeholder="Special delivery instructions..." rows="2" value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} />
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </>
        )}
      </div>

      {currentUser.role !== 'admin' && (
        <>
          <button onClick={() => setIsSupportOpen(true)} className="fixed bottom-8 right-8 btn btn-danger rounded-circle p-0 d-flex align-items-center justify-content-center shadow-2xl transition-all" style={{ width: '64px', height: '64px', zIndex: 1000 }}>🎙️</button>
          <LiveSupportPanel isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
        </>
      )}

      {/* Light Theme Footer */}
      <footer className="z-footer">
        <div className="container">
           <div className="row g-5 mb-5">
              <div className="col-md-3">
                 <h2 className="h4 fw-black italic mb-4">FLAVORDISH</h2>
                 <p className="text-secondary small">Ahmedabad's smartest food delivery network. Bringing Amdavadi flavors to your doorstep.</p>
              </div>
              <div className="col-md-3">
                 <h6 className="fw-bold mb-3 small uppercase tracking-widest text-dark opacity-50">Discovery</h6>
                 <ul className="list-unstyled text-secondary small d-flex flex-column gap-2">
                    <li>Popular Localities</li>
                    <li>Trending Collections</li>
                    <li>Smart Search</li>
                 </ul>
              </div>
              <div className="col-md-3">
                 <h6 className="fw-bold mb-3 small uppercase tracking-widest text-dark opacity-50">For Business</h6>
                 <ul className="list-unstyled text-secondary small d-flex flex-column gap-2">
                    <li className="cursor-pointer hover:text-danger">Join as Partner</li>
                    <li className="cursor-pointer hover:text-danger">Rider Portal</li>
                 </ul>
              </div>
              <div className="col-md-3">
                 <h6 className="fw-bold mb-3 small uppercase tracking-widest text-dark opacity-50">Follow Us</h6>
                 <div className="d-flex gap-3 mt-3">
                    <div className="bg-gray-100 p-2 rounded-circle cursor-pointer hover:bg-danger/10 hover:text-danger"><StarIcon className="w-4 h-4" /></div>
                    <div className="bg-gray-100 p-2 rounded-circle cursor-pointer hover:bg-danger/10 hover:text-danger"><ClockIcon className="w-4 h-4" /></div>
                    <div className="bg-gray-100 p-2 rounded-circle cursor-pointer hover:bg-danger/10 hover:text-danger"><TagIcon className="w-4 h-4" /></div>
                 </div>
              </div>
           </div>
           <div className="pt-5 border-top border-gray-100 text-secondary x-small text-center opacity-60">
              © 2025 FlavorDish Ahmedabad. All Rights Reserved.
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
