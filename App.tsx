import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { StarIcon, CartIcon, ClockIcon, SparklesIcon, TagIcon, RefreshIcon, HeartIcon } from './components/Icons';
import { enhanceMenuDescriptions, getNearbyFoodDiscovery, connectToLiveSupport } from './services/geminiService';
import { db } from './services/databaseService';

// --- Declare Leaflet Global ---
declare const L: any;

// --- Internal Icons ---
const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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
const MapIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7l5-2.5 5.553 2.776a1 1 0 01.447.894v10.764a1 1 0 01-1.447.894L14 17l-5 3z" /></svg>
);
const UserCircleIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const ChartIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
);
const PlusIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
);
const TrashIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);
const EditIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
);

const ORDER_STATUS_STEPS = ['preparing', 'picked_up', 'delivering', 'near_you', 'delivered'] as const;
const STATUS_LABELS: Record<string, string> = {
  'preparing': 'Preparing Food',
  'picked_up': 'Order Picked Up',
  'delivering': 'Out for Delivery',
  'near_you': 'Arriving Soon',
  'delivered': 'Delivered'
};

// --- Sub-components ---

const LiveSupportPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [status, setStatus] = useState('disconnected');
  const [transcript, setTranscript] = useState<{ role: string; text: string; timestamp: number }[]>([]);
  const sessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const updateTranscript = (role: string, text: string) => {
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
    <div className="fixed bottom-0 right-0 p-4 d-flex justify-content-end pointer-events-none" style={{ zIndex: 2000 }}>
      <div className={`card border-0 z-shadow rounded-5 overflow-hidden d-flex flex-column pointer-events-auto animate-fadeIn shadow-2xl bg-[#1a1a1a] text-white border border-gray-800`} style={{ width: '100%', maxWidth: '400px', height: '600px' }}>
        <div className="p-4 bg-danger text-white d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className={`rounded-circle p-2 bg-white/20 ${status === 'active' ? 'animate-pulse' : ''}`}><HeadsetIcon className="w-5 h-5" /></div>
            <div>
              <h6 className="m-0 font-black tracking-tighter text-white">Concierge Live</h6>
              <span className="small font-bold uppercase text-gray-300" style={{ fontSize: '10px' }}>{status === 'active' ? '● Live with Gemini' : 'Connecting...'}</span>
            </div>
          </div>
          <button className="btn text-white p-0 border-0 shadow-none" onClick={onClose}><XIcon /></button>
        </div>
        <div ref={scrollRef} className="flex-grow-1 p-4 overflow-auto no-scrollbar d-flex flex-column gap-3">
          {transcript.length === 0 && (
            <div className="text-center py-10 opacity-70 d-flex flex-column align-items-center gap-3">
              <SparklesIcon className="w-12 h-12 text-danger animate-spin-slow" />
              <p className="small font-bold uppercase tracking-widest text-gray-300">How can I help you today?</p>
            </div>
          )}
          {transcript.map((msg, i) => (
            <div key={i} className={`max-w-[85%] p-3 rounded-4 small font-bold ${msg.role === 'user' ? 'align-self-end bg-danger text-white rounded-tr-none' : 'bg-gray-800 text-gray-100 rounded-tl-none'}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="p-4 border-top border-gray-800">
          <div className="d-flex align-items-center gap-3">
             <div className="flex-grow-1">
                <div className="h-1 rounded-pill overflow-hidden bg-gray-800">
                   <div className={`h-100 bg-danger transition-all duration-300 ${status === 'active' ? 'w-1/2' : 'w-0'}`} />
                </div>
                <p className="small m-0 mt-2 font-bold uppercase text-gray-400" style={{ fontSize: '9px' }}>{status === 'active' ? 'Listening...' : 'Connecting...'}</p>
             </div>
             <div className={`rounded-circle p-3 ${status === 'active' ? 'bg-danger text-white shadow-lg shadow-red-500/50' : 'bg-gray-700 text-gray-300'}`}><div className="w-6 h-6 d-flex align-items-center justify-content-center">🎙️</div></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InteractiveMap = ({ center, markers = [], polyline = [], height = '450px', zoom = 15 }: any) => {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || typeof L === 'undefined') return;
    const map = L.map(containerRef.current, { center: center || [23.0225, 72.5714], zoom: zoom, zoomControl: false, attributionControl: false });
    mapRef.current = map;
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!mapRef.current || typeof L === 'undefined') return;
    const map = mapRef.current;
    map.eachLayer((layer: any) => { if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer); });
    markers.forEach((m: any) => {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="bg-${m.color || 'danger'} p-2 rounded-circle border-2 border-white shadow-lg ${m.pulse ? 'animate-glow-pulse' : 'animate-marker-bounce'}" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; position: relative;">${m.label || ''}${m.pulse ? '<div class="position-absolute inset-0 rounded-circle bg-white opacity-25 animate-ping"></div>' : ''}</div>`,
        iconSize: [36, 36], iconAnchor: [18, 18]
      });
      L.marker(m.position, { icon }).addTo(map);
    });
    if (polyline.length > 0) L.polyline(polyline, { color: '#ff4d4d', weight: 4, opacity: 0.7, dashArray: '10, 10' }).addTo(map);
    if (center) map.setView(center, zoom, { animate: true, duration: 1 });
  }, [markers, polyline, center, zoom]);

  return <div ref={containerRef} className="w-100 h-100 rounded-5 overflow-hidden z-shadow border border-gray-800" style={{ minHeight: height }} />;
};

const RestaurantCard = ({ restaurant, onClick }: any) => (
  <div onClick={onClick} className="group cursor-pointer">
    <div className="relative overflow-hidden rounded-[2.5rem] bg-[#1a1a1a] border border-gray-800/60 transition-all duration-500 hover:translate-y-[-8px] hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] group-hover:border-red-500/60">
      <div className="relative h-60 w-full overflow-hidden">
        <img 
          src={restaurant.image} 
          className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90" 
          alt={restaurant.name} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-black/30" />
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-lg">
          <StarIcon className="w-3.5 h-3.5 text-yellow-400 fill-current" />
          <span className="text-sm font-black tracking-tighter text-white">{restaurant.rating}</span>
        </div>
        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/90 backdrop-blur-md text-white shadow-xl">
          <ClockIcon className="w-3.5 h-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">{restaurant.deliveryTime}</span>
        </div>
      </div>
      <div className="p-7">
        <h3 className="text-2xl font-black text-white tracking-tighter leading-tight group-hover:text-red-500 transition-colors mb-1">
          {restaurant.name}
        </h3>
        <p className="text-sm text-gray-300 font-semibold mb-6 line-clamp-1 italic tracking-tight opacity-90">
          {restaurant.cuisine}
        </p>
        <div className="flex items-center justify-between pt-5 border-t border-gray-800/50">
           <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Delivery Fee</span>
              <span className="text-base font-black text-white tracking-tighter">₹{restaurant.deliveryFee}</span>
           </div>
           <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
              <SparklesIcon className="w-5 h-5" />
           </div>
        </div>
      </div>
    </div>
  </div>
);

const App = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState('home');
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [userCoords, setUserCoords] = useState({ latitude: 23.0225, longitude: 72.5714 });
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [discoveryQuery, setDiscoveryQuery] = useState('');
  const [discoveryResult, setDiscoveryResult] = useState<any>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Management States
  const [isEditingRestaurant, setIsEditingRestaurant] = useState<any>(null);
  const [isAddingRestaurant, setIsAddingRestaurant] = useState(false);
  const [mgmtForm, setMgmtForm] = useState({ name: '', cuisine: '', image: '', rating: 4.5, deliveryTime: '30-45 min', deliveryFee: 40 });

  // Recent searches state
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('flavor_dish_recent_searches');
    return saved ? JSON.parse(saved) : [];
  });
  const [homeSearchInput, setHomeSearchInput] = useState('');

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
  }, []);

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('flavor_dish_recent_searches', JSON.stringify(updated));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const user = await db.login(usernameInput, passwordInput);
      setCurrentUser(user);
      if (user.role === 'admin') setCurrentView('admin-dashboard');
      else setCurrentView('home');
    } catch (err) {
      alert('Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDiscovery = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = overrideQuery || discoveryQuery;
    if (!queryToUse.trim()) return;

    saveRecentSearch(queryToUse);
    setIsDiscovering(true);
    try {
      const res = await getNearbyFoodDiscovery(queryToUse, userCoords);
      setDiscoveryResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleHomeSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeSearchInput.trim()) return;
    setDiscoveryQuery(homeSearchInput);
    setCurrentView('discovery');
    handleDiscovery(undefined, homeSearchInput);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('flavor_dish_recent_searches');
  };

  const handleMgmtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = isEditingRestaurant ? { ...isEditingRestaurant, ...mgmtForm } : { ...mgmtForm };
    const updated = await db.saveRestaurant(payload);
    setRestaurants(updated);
    setIsAddingRestaurant(false);
    setIsEditingRestaurant(null);
    setMgmtForm({ name: '', cuisine: '', image: '', rating: 4.5, deliveryTime: '30-45 min', deliveryFee: 40 });
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this restaurant?')) {
      const updated = await db.deleteRestaurant(id);
      setRestaurants(updated);
    }
  };

  const updateGlobalStatus = async (id: string, status: any) => {
    const updated = await db.updateOrderStatus(id, status);
    setOrders(updated);
  };

  const PartnerDashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    return (
      <div className="d-flex bg-[#0a0a0a] text-white" style={{ minHeight: '100vh', marginTop: '-112px' }}>
         <div className={`transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} border-end border-gray-800/20 d-flex flex-column sticky-top h-screen bg-inherit`}>
            <div className="p-4 d-flex align-items-center gap-3 mb-5 mt-28">
               <SparklesIcon className="text-danger w-8 h-8 flex-shrink-0" />
               {sidebarOpen && <span className="h5 m-0 font-black tracking-tighter text-white">Partner Portal</span>}
            </div>
            <nav className="flex-grow-1 px-3 d-flex flex-column gap-2">
               {[
                 { id: 'admin-dashboard', label: 'Overview', icon: <ChartIcon /> },
                 { id: 'admin-orders', label: 'Live Orders', icon: <PackageIcon /> },
                 { id: 'admin-menu', label: 'Menu Commander', icon: <TagIcon /> }
               ].map(item => (
                 <button key={item.id} onClick={() => setCurrentView(item.id)} className={`btn border-0 text-start py-3 px-3 rounded-4 d-flex align-items-center gap-3 transition-all ${currentView === item.id ? 'bg-danger text-white shadow-lg shadow-red-500/20' : 'text-gray-400 hover:bg-gray-800'}`}>
                    <span className="flex-shrink-0">{item.icon}</span>
                    {sidebarOpen && <span className="font-bold small uppercase tracking-widest text-inherit">{item.label}</span>}
                 </button>
               ))}
            </nav>
            <div className="p-4 border-top border-gray-800/20">
               <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn btn-outline-danger w-100 rounded-pill"><RefreshIcon /></button>
            </div>
         </div>
         <div className="flex-grow-1 p-5 mt-28">
            <div className="d-flex justify-content-between align-items-center mb-5">
               <h1 className="font-black m-0 tracking-tighter text-white">Welcome back, Admin</h1>
               <button onClick={() => { db.logout(); setCurrentUser(null); }} className="btn btn-outline-danger px-4 rounded-pill font-black small tracking-widest uppercase">LOGOUT</button>
            </div>

            {currentView === 'admin-dashboard' && (
              <div className="animate-fadeIn">
                 <div className="row g-4 mb-5">
                    <div className="col-md-4">
                       <div className="card border-0 rounded-5 p-5 bg-[#1a1a1a] border border-gray-800 text-center">
                          <PackageIcon className="w-10 h-10 text-danger mx-auto mb-3" />
                          <p className="small font-black uppercase tracking-widest text-gray-400">Total Partners</p>
                          <h2 className="font-black m-0 text-white">{restaurants.length}</h2>
                       </div>
                    </div>
                    <div className="col-md-4">
                       <div className="card border-0 rounded-5 p-5 bg-[#1a1a1a] border border-gray-800 text-center">
                          <ChartIcon className="w-10 h-10 text-primary mx-auto mb-3" />
                          <p className="small font-black uppercase tracking-widest text-gray-400">Live Orders</p>
                          <h2 className="font-black m-0 text-white">{orders.filter(o => o.status !== 'delivered').length}</h2>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {currentView === 'admin-orders' && (
              <div className="card border-0 z-shadow rounded-5 p-4 bg-[#1a1a1a] border border-gray-800 animate-fadeIn">
                <h4 className="font-black mb-4 text-white">Live Order Management</h4>
                <div className="table-responsive">
                   <table className="table table-borderless align-middle mb-0 text-white">
                      <thead className="border-bottom border-gray-800/20">
                         <tr className="text-gray-500 small uppercase tracking-widest font-black">
                            <th className="py-3">Order ID</th>
                            <th className="py-3">Restaurant</th>
                            <th className="py-3 text-center">Status</th>
                            <th className="py-3 text-end">Action</th>
                         </tr>
                      </thead>
                      <tbody>
                         {orders.filter(o => o.status !== 'delivered').map(o => (
                           <tr key={o.id} className="border-bottom border-gray-800/5">
                              <td className="py-4"><span className="font-black text-danger">#{o.id}</span></td>
                              <td className="py-4 font-bold text-gray-300">{o.items?.[0]?.restaurantName || 'Unknown'}</td>
                              <td className="text-center"><span className="badge rounded-pill bg-warning/10 text-warning px-3 py-2 font-bold uppercase tracking-tighter" style={{ fontSize: '10px' }}>{o.status}</span></td>
                              <td className="text-end">
                                 <button onClick={() => updateGlobalStatus(o.id, 'delivered')} className="btn btn-outline-success btn-sm rounded-pill px-3 font-black text-xs">MARK DELIVERED</button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
              </div>
            )}

            {currentView === 'admin-menu' && (
              <div className="animate-fadeIn">
                <div className="d-flex justify-content-between align-items-center mb-5">
                   <h4 className="font-black text-white m-0">Restaurant Management</h4>
                   <button onClick={() => { setIsAddingRestaurant(true); setIsEditingRestaurant(null); setMgmtForm({ name: '', cuisine: '', image: '', rating: 4.5, deliveryTime: '30-45 min', deliveryFee: 40 }); }} className="btn btn-danger rounded-pill px-4 font-black d-flex align-items-center gap-2 text-sm uppercase tracking-widest"><PlusIcon /> ADD PARTNER</button>
                </div>

                {(isAddingRestaurant || isEditingRestaurant) && (
                  <div className="card border-0 rounded-5 p-5 bg-[#151515] border border-red-500/20 mb-5 animate-fadeIn shadow-2xl">
                     <div className="d-flex justify-content-between align-items-center mb-5">
                        <h5 className="font-black text-white m-0">{isEditingRestaurant ? 'Edit Restaurant' : 'New Culinary Partner'}</h5>
                        <button onClick={() => { setIsAddingRestaurant(false); setIsEditingRestaurant(null); }} className="btn text-gray-400 hover:text-white"><XIcon /></button>
                     </div>
                     <form onSubmit={handleMgmtSubmit} className="row g-4">
                        <div className="col-md-6">
                           <label className="small font-black uppercase tracking-widest text-gray-500 mb-2">Restaurant Name</label>
                           <input type="text" className="form-control bg-[#0a0a0a] border-gray-800 text-white rounded-4 py-3 shadow-none" placeholder="e.g. Ahmedabad Bistro" value={mgmtForm.name} onChange={e => setMgmtForm({...mgmtForm, name: e.target.value})} required />
                        </div>
                        <div className="col-md-6">
                           <label className="small font-black uppercase tracking-widest text-gray-500 mb-2">Cuisine Speciality</label>
                           <input type="text" className="form-control bg-[#0a0a0a] border-gray-800 text-white rounded-4 py-3 shadow-none" placeholder="e.g. Gujrati • Fusion" value={mgmtForm.cuisine} onChange={e => setMgmtForm({...mgmtForm, cuisine} = { ...mgmtForm, cuisine: e.target.value })} required />
                        </div>
                        <div className="col-md-12">
                           <label className="small font-black uppercase tracking-widest text-gray-500 mb-2">Image URL (Unsplash preferred)</label>
                           <input type="url" className="form-control bg-[#0a0a0a] border-gray-800 text-white rounded-4 py-3 shadow-none" placeholder="https://images.unsplash.com/..." value={mgmtForm.image} onChange={e => setMgmtForm({...mgmtForm, image: e.target.value})} required />
                        </div>
                        <div className="col-md-4">
                           <label className="small font-black uppercase tracking-widest text-gray-500 mb-2">Delivery Time</label>
                           <input type="text" className="form-control bg-[#0a0a0a] border-gray-800 text-white rounded-4 py-3 shadow-none" placeholder="e.g. 25-40 min" value={mgmtForm.deliveryTime} onChange={e => setMgmtForm({...mgmtForm, deliveryTime: e.target.value})} required />
                        </div>
                        <div className="col-md-4">
                           <label className="small font-black uppercase tracking-widest text-gray-500 mb-2">Fee (₹)</label>
                           <input type="number" className="form-control bg-[#0a0a0a] border-gray-800 text-white rounded-4 py-3 shadow-none" value={mgmtForm.deliveryFee} onChange={e => setMgmtForm({...mgmtForm, deliveryFee: parseInt(e.target.value)})} required />
                        </div>
                        <div className="col-md-4">
                           <label className="small font-black uppercase tracking-widest text-gray-500 mb-2">Rating</label>
                           <input type="number" step="0.1" max="5" min="1" className="form-control bg-[#0a0a0a] border-gray-800 text-white rounded-4 py-3 shadow-none" value={mgmtForm.rating} onChange={e => setMgmtForm({...mgmtForm, rating: parseFloat(e.target.value)})} required />
                        </div>
                        <div className="col-12 mt-4">
                           <button type="submit" className="btn btn-danger w-100 py-3 rounded-4 font-black uppercase tracking-widest text-sm">{isEditingRestaurant ? 'SAVE CHANGES' : 'CREATE PARTNER'}</button>
                        </div>
                     </form>
                  </div>
                )}

                <div className="card border-0 rounded-5 p-4 bg-[#1a1a1a] border border-gray-800">
                  <div className="table-responsive">
                    <table className="table table-borderless align-middle mb-0 text-white">
                      <thead className="border-bottom border-gray-800/20">
                        <tr className="text-gray-500 small uppercase tracking-widest font-black">
                          <th className="py-3">Partner</th>
                          <th className="py-3">Cuisine</th>
                          <th className="py-3 text-center">Rating</th>
                          <th className="py-3 text-end">Operations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {restaurants.map(res => (
                          <tr key={res.id} className="border-bottom border-gray-800/5 hover:bg-white/5 transition-colors">
                            <td className="py-4">
                               <div className="d-flex align-items-center gap-3">
                                  <img src={res.image} className="w-12 h-12 rounded-3 object-cover shadow-lg" alt={res.name} />
                                  <span className="font-black text-white">{res.name}</span>
                               </div>
                            </td>
                            <td className="py-4 font-bold text-gray-400 text-sm">{res.cuisine}</td>
                            <td className="text-center">
                               <div className="d-flex align-items-center justify-content-center gap-1">
                                  <span className="font-black">{res.rating}</span>
                                  <StarIcon className="text-yellow-400 w-3 h-3" />
                               </div>
                            </td>
                            <td className="text-end">
                               <div className="d-flex justify-content-end gap-2">
                                  <button onClick={() => { setIsEditingRestaurant(res); setIsAddingRestaurant(false); setMgmtForm({ name: res.name, cuisine: res.cuisine, image: res.image, rating: res.rating, deliveryTime: res.deliveryTime, deliveryFee: res.deliveryFee }); }} className="btn btn-gray-800 p-2 rounded-circle hover:bg-white/10 text-gray-300 transition-all"><EditIcon /></button>
                                  <button onClick={() => handleDeleteRestaurant(res.id)} className="btn btn-gray-800 p-2 rounded-circle hover:bg-red-500/10 text-danger transition-all"><TrashIcon /></button>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
         </div>
      </div>
    );
  };

  if (!currentUser) return (
    <div className="min-h-screen d-flex align-items-center justify-content-center p-4 bg-[#0a0a0a]">
       <div className="card border-0 z-shadow rounded-5 overflow-hidden bg-[#1a1a1a] text-white border border-gray-800" style={{ maxWidth: '400px', width: '100%' }}>
          <div className="p-5">
             <div className="text-center mb-5">
                <div className="bg-danger/10 p-4 rounded-circle d-inline-block mb-4"><CartIcon className="text-danger w-12 h-12" /></div>
                <h2 className="font-black tracking-tighter text-white">Welcome</h2>
                <p className="text-gray-400 small">Sign in to flavor your day</p>
             </div>
             <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
                <input type="text" className="form-control py-3 rounded-4 bg-[#111] border-gray-800 text-white shadow-none placeholder:text-gray-600" placeholder="Username (user)" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} required />
                <input type="password" className="form-control py-3 rounded-4 bg-[#111] border-gray-800 text-white shadow-none placeholder:text-gray-600" placeholder="Password (pass)" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} required />
                <button type="submit" disabled={isLoggingIn} className="btn btn-danger py-3 rounded-4 font-black mt-2 tracking-widest uppercase">SIGN IN</button>
             </form>
          </div>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {currentUser.role !== 'admin' && (
        <nav className="fixed-top w-100 py-2 bg-[#0f0f0f]/95 backdrop-blur-md shadow-2xl border-b border-white/5" style={{ zIndex: 1100 }}>
          <div className="container d-flex justify-content-between align-items-center gap-4">
            <div onClick={() => setCurrentView('home')} className="cursor-pointer d-flex align-items-center gap-2">
              <SparklesIcon className="text-danger w-7 h-7" />
              <span className="h4 m-0 font-black text-white tracking-tighter">FlavorDish</span>
            </div>
            <div className="d-flex align-items-center gap-4 text-white">
              <button onClick={() => setCurrentView('discovery')} className={`small font-black uppercase tracking-widest transition-colors ${currentView === 'discovery' ? 'text-danger' : 'text-gray-400 hover:text-white'}`}>DISCOVER</button>
              <button onClick={() => setCurrentView('history')} className={`small font-black uppercase tracking-widest transition-colors ${currentView === 'history' ? 'text-danger' : 'text-gray-400 hover:text-white'}`}>ORDERS</button>
              <button onClick={() => { db.logout(); setCurrentUser(null); }} className="small font-black uppercase tracking-widest text-gray-500 hover:text-danger transition-colors">LOGOUT</button>
            </div>
          </div>
        </nav>
      )}

      <div className={currentUser.role === 'admin' ? "" : "pt-28 pb-10 container"}>
        {currentUser.role === 'admin' ? <PartnerDashboard /> : (
          <>
            {currentView === 'home' && (
              <div className="animate-fadeIn">
                <div className="mb-12 position-relative rounded-[3rem] overflow-hidden h-96 shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000" className="w-100 h-100 object-cover opacity-40 grayscale-[0.3]" />
                  <div className="position-absolute inset-0 d-flex flex-column align-items-center justify-content-center px-4 text-center bg-black/30">
                    <h1 className="display-3 font-black text-white tracking-tighter mb-4">Pure Culinary Art</h1>
                    
                    {/* Main Search Bar on Home Page */}
                    <div className="max-w-xl w-full">
                      <form onSubmit={handleHomeSearchSubmit} className="relative group mb-6">
                        <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text" 
                          className="w-full py-4 pl-16 pr-32 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-2xl focus:ring-2 focus:ring-red-500 outline-none placeholder:text-gray-300" 
                          placeholder="What are you craving today?" 
                          value={homeSearchInput}
                          onChange={e => setHomeSearchInput(e.target.value)}
                        />
                        <button type="submit" className="absolute right-2 top-2 bottom-2 px-8 rounded-full bg-danger text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-colors">SEARCH</button>
                      </form>

                      {/* Recent Searches Section */}
                      {recentSearches.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-3 animate-fadeIn">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-60">Recent:</span>
                          {recentSearches.map((s, i) => (
                            <button 
                              key={i} 
                              onClick={() => {
                                setDiscoveryQuery(s);
                                setCurrentView('discovery');
                                handleDiscovery(undefined, s);
                              }}
                              className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:bg-danger hover:text-white transition-all hover:scale-105 active:scale-95"
                            >
                              {s}
                            </button>
                          ))}
                          <button 
                            onClick={clearRecentSearches}
                            className="ml-2 text-[9px] font-black text-gray-500 hover:text-danger uppercase tracking-tighter transition-colors"
                          >
                            Clear History
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {restaurants.map(res => (
                    <RestaurantCard key={res.id} restaurant={res} onClick={() => { setSelectedRestaurant(res); setCurrentView('restaurant'); }} />
                  ))}
                </div>
              </div>
            )}

            {currentView === 'discovery' && (
              <div className="animate-fadeIn">
                <div className="row g-5">
                  <div className="col-lg-8">
                    <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border border-gray-800" style={{ height: '600px' }}>
                      <InteractiveMap center={[23.0225, 72.5714]} height="600px" />
                      <div className="absolute top-6 left-6 right-6 z-[1000]">
                        <form onSubmit={handleDiscovery} className="relative group">
                          <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="text" className="w-full py-5 pl-16 pr-32 rounded-full bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl focus:ring-2 focus:ring-red-500 outline-none" placeholder="Search for local Amdavadi favorites..." value={discoveryQuery} onChange={e => setDiscoveryQuery(e.target.value)} />
                          <button type="submit" className="absolute right-3 top-3 bottom-3 px-8 rounded-full bg-danger text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">{isDiscovering ? 'SEARCHING...' : 'FIND'}</button>
                        </form>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="card border-0 shadow-2xl rounded-[3rem] p-8 h-100 bg-[#1a1a1a] text-white border border-gray-800/60">
                      <h4 className="font-black mb-6 flex items-center gap-3 text-white"><MapIcon className="text-danger" /> AI Discovery</h4>
                      {discoveryResult ? (
                        <div className="overflow-auto no-scrollbar" style={{ maxHeight: '450px' }}>
                           <p className="text-gray-300 mb-6 font-medium italic text-sm leading-relaxed">{discoveryResult.text}</p>
                           {discoveryResult.grounding?.map((chunk: any, i: number) => (
                             <div key={i} className="p-5 rounded-[1.5rem] bg-[#111] border border-gray-800/80 mb-4 hover:border-red-500/50 transition-colors">
                                <h6 className="font-black text-white m-0 text-lg">{chunk.maps?.title || "Spot"}</h6>
                                <a href={chunk.maps?.uri} target="_blank" className="text-[10px] text-danger font-black mt-3 inline-block tracking-[0.2em] uppercase hover:underline">VIEW ON MAPS →</a>
                             </div>
                           ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-40 py-20">
                          {/* Fixed typo: changed sparklesIcon to SparklesIcon */}
                          <SparklesIcon className="w-12 h-12 mb-4 text-gray-500" />
                          <p className="text-center font-black uppercase tracking-widest text-xs text-gray-400">Enter a query to explore</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'restaurant' && selectedRestaurant && (
              <div className="animate-fadeIn">
                 <div className="d-flex justify-content-between align-items-end mb-12 border-b border-gray-800 pb-8">
                    <div>
                      <h1 className="text-6xl font-black tracking-tighter text-white">{selectedRestaurant.name}</h1>
                      <span className="text-danger font-bold uppercase tracking-[0.3em] text-xs mt-2 block">{selectedRestaurant.cuisine}</span>
                    </div>
                    <button onClick={() => setCurrentView('home')} className="px-8 py-3 rounded-full bg-gray-800 text-white font-black text-xs uppercase tracking-widest hover:bg-gray-700 transition-colors">BACK TO HOME</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {selectedRestaurant.menu.map((item: any) => (
                      <div key={item.id} className="bg-[#141414] rounded-[2.5rem] p-6 flex items-center gap-6 border border-gray-800/40 hover:border-red-500/30 transition-all group">
                         <div className="relative w-32 h-32 flex-shrink-0">
                           <img src={item.image} className="w-full h-full rounded-[1.5rem] object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" alt={item.name} />
                           <div className="absolute bottom-[-10px] right-[-10px] bg-red-600 text-white font-black text-[10px] px-3 py-1 rounded-full shadow-lg shadow-red-500/20">₹{item.price}</div>
                         </div>
                         <div className="flex-grow">
                            <h6 className="text-xl font-black text-white tracking-tighter group-hover:text-red-500 transition-colors">{item.name}</h6>
                            <p className="text-sm text-gray-400 mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
                            <button className="mt-4 text-[10px] font-black uppercase tracking-widest text-danger hover:text-white transition-colors">Add to Cart +</button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </>
        )}
      </div>

      <button onClick={() => setIsSupportOpen(true)} className="fixed bottom-10 right-10 w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl z-[1000] border-4 border-black/50 hover:scale-110 transition-transform active:scale-95">
         <SparklesIcon className="w-8 h-8 text-white animate-pulse" />
      </button>
      <LiveSupportPanel isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
};

export default App;