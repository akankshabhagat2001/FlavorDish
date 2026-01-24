
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { StarIcon, CartIcon, ClockIcon, SparklesIcon, TagIcon, RefreshIcon, HeartIcon } from './components/Icons';
import { getNearbyFoodDiscovery, connectToLiveSupport, enhanceMenuDescriptions } from './services/geminiService';
import { db } from './services/databaseService';

// --- Types ---
import { Restaurant, Order, MenuItem } from './types';

// --- Obsidian Icons ---
const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);
const PackageIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
);
const XIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
);
const PlusIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
);
const HeadsetIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 4.978 4.978 0 011.414-3.536m0 0l2.829 2.829m-2.829 4.243L3 21m6.707-6.707a8.001 8.001 0 0111.314 0z" /></svg>
);
const MapIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7l5-2.5 5.553 2.776a1 1 0 01.447.894v10.764a1 1 0 01-1.447.894L14 17l-5 3z" /></svg>
);
const GpsIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1c0-.55-.45-1-1-1s-1 .45-1 1v2.06C6.83 3.52 3.52 6.83 3.06 11H1c-.55 0-1 .45-1 1s.45 1 1 1h2.06c.46 4.17 3.77 7.48 7.94 7.94V23c0 .55.45 1 1 1s1-.45 1-1v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23c.55 0 1-.45 1-1s-.45-1-1-1h-2.06z" /></svg>
);
const WarningIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
);

// --- Base Styled Components ---

const GlassCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`glass-card p-6 rounded-[2.5rem] ${className} ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
  >
    {children}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = "primary" }) => {
  const styles: any = {
    primary: "bg-[#ff2d2d] text-white",
    gold: "bg-[#ffc107] text-black",
    ghost: "bg-white/20 text-white backdrop-blur-md border border-white/10",
  };
  return (
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${styles[color] || styles.primary}`}>
      {children}
    </span>
  );
};

// --- Interactive Map Helper ---
const InteractiveMap = ({ center, markers = [], polyline = [], height = '450px', zoom = 15 }: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const L = (window as any).L;
    if (!L) return;
    
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, { center: center || [23.0225, 72.5714], zoom: zoom, zoomControl: false, attributionControl: false });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
    } else {
      mapRef.current.setView(center, zoom);
    }
    
    const map = mapRef.current;
    map.eachLayer((layer: any) => { if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer); });
    
    markers.forEach((m: any) => {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="bg-${m.color || 'danger'} p-2 rounded-circle border-2 border-white shadow-lg d-flex align-items-center justify-content-center text-white" style="width: 32px; height: 32px; font-size: 14px;">${m.label || ''}</div>`,
        iconSize: [32, 32], iconAnchor: [16, 16]
      });
      L.marker(m.position, { icon }).addTo(map);
    });
    
    if (polyline.length > 0) L.polyline(polyline, { color: '#ff2d2d', weight: 3, opacity: 0.8 }).addTo(map);
    
    return () => {};
  }, [markers, polyline, center, zoom]);

  return <div ref={containerRef} className="w-100 h-100 rounded-5 overflow-hidden border border-white/10" style={{ minHeight: height }} />;
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
      const session = await connectToLiveSupport({
        onopen: () => setStatus('active'),
        onmessage: (msg: any) => {
          if (msg.serverContent?.outputTranscription) updateTranscript('model', msg.serverContent.outputTranscription.text);
          else if (msg.serverContent?.inputTranscription) updateTranscript('user', msg.serverContent.inputTranscription.text);
        },
        onerror: () => setStatus('disconnected'),
        onclose: () => setStatus('disconnected'),
      });
      sessionRef.current = session;
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
    <div className="fixed bottom-0 right-0 p-8 flex justify-end pointer-events-none z-[2000]">
      <div className="glass-panel w-full max-w-[420px] h-[650px] rounded-[3rem] overflow-hidden flex flex-col pointer-events-auto shadow-2xl animate-reveal border-white/20">
        <div className="p-8 bg-[#ff2d2d] text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`rounded-full p-3 bg-white/30 ${status === 'active' ? 'animate-pulse' : ''}`}>
                <HeadsetIcon className="w-6 h-6" />
            </div>
            <div>
              <h6 className="m-0 font-black text-xl tracking-tighter">AI Concierge</h6>
              <span className="text-[10px] opacity-90 font-black uppercase tracking-widest">{status === 'active' ? '● Encrypted Live' : 'Initializing...'}</span>
            </div>
          </div>
          <button className="text-white hover:scale-110 transition-transform" onClick={onClose}><XIcon /></button>
        </div>
        <div ref={scrollRef} className="flex-grow p-8 overflow-auto no-scrollbar flex flex-col gap-6">
          {transcript.length === 0 && (
            <div className="text-center py-20 opacity-50 flex flex-col items-center gap-4">
              <SparklesIcon className="w-16 h-16 text-[#ff2d2d]" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white">Tell me what you're craving...</p>
            </div>
          )}
          {transcript.map((msg, i) => (
            <div key={i} className={`max-w-[85%] p-5 rounded-[2rem] text-sm font-bold shadow-lg ${msg.role === 'user' ? 'self-end bg-[#ff2d2d] text-white' : 'bg-white/10 text-white border border-white/10'}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="p-8 border-t border-white/10">
          <div className="flex items-center gap-6">
             <div className="flex-grow">
                <div className="h-1 rounded-full overflow-hidden bg-white/10">
                   <div className={`h-full bg-[#ff2d2d] transition-all duration-300 ${status === 'active' ? 'w-full' : 'w-0'}`} />
                </div>
                <p className="text-[9px] m-0 mt-3 opacity-60 font-black uppercase tracking-widest text-white">{status === 'active' ? 'Listening...' : 'Connecting to Gemini Cloud...'}</p>
             </div>
             <div className={`rounded-full p-5 ${status === 'active' ? 'bg-[#ff2d2d] text-white shadow-[0_0_30px_rgba(255,45,45,0.6)]' : 'bg-white/10 text-white/40'}`}>
                <div className="w-8 h-8 flex items-center justify-center text-2xl">🎙️</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RestaurantCard: React.FC<{ restaurant: Restaurant; onClick: () => void }> = ({ restaurant, onClick }) => (
  <GlassCard onClick={onClick} className="group p-0 overflow-hidden h-full flex flex-col border-white/10">
    <div className="relative h-64 overflow-hidden">
      <img 
        src={restaurant.image} 
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:brightness-110" 
        alt={restaurant.name} 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-90" />
      <div className="absolute top-6 left-6 flex flex-col gap-2 items-start">
         <Badge color="ghost">{restaurant.cuisine.split('•')[0]}</Badge>
         {restaurant.rating > 4.7 && <Badge color="gold">ELITE CHOICE</Badge>}
      </div>
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
         <div>
            <h4 className="text-3xl font-black text-white tracking-tighter leading-none mb-1 shadow-sm">{restaurant.name}</h4>
            <div className="flex items-center gap-2 text-[10px] font-black text-white/80 uppercase tracking-widest">
               <ClockIcon className="w-3 h-3" /> {restaurant.deliveryTime}
            </div>
         </div>
         <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center border border-white/30 group-hover:bg-[#ff2d2d] group-hover:border-[#ff2d2d] transition-all">
            <PlusIcon className="w-6 h-6 text-white" />
         </div>
      </div>
    </div>
  </GlassCard>
);

const App = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState('home');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [mgmtRestaurant, setMgmtRestaurant] = useState<Restaurant | null>(null);
  
  // Checkout States
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isUsingGps, setIsUsingGps] = useState(true);
  const [userCoords, setUserCoords] = useState({ latitude: 23.0225, longitude: 72.5714 });

  // AI Enhanced State
  const [enhancedDescriptions, setEnhancedDescriptions] = useState<Record<string, string>>({});
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'admin') setCurrentView('admin-dashboard');
    }
    const init = async () => {
      const [res, ord, existingEnhancements] = await Promise.all([
        db.getRestaurants(), 
        db.getOrders(),
        db.getMenuEnhancements()
      ]);
      setRestaurants(res);
      setOrders(ord);
      setEnhancedDescriptions(existingEnhancements);
    };
    init();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.debug("Location access denied", err)
      );
    }
  }, []);

  // Real-time Address Validation
  const validateAddress = (val: string) => {
    if (isUsingGps) return null;
    if (val.length < 10) return "Minimum 10 characters required for secure delivery.";
    if (!/[a-zA-Z]/.test(val) || !/\s/.test(val)) return "Please provide a valid street address format.";
    return null;
  };

  const handleAddressChange = (val: string) => {
    setDeliveryAddress(val);
    setAddressError(validateAddress(val));
  };

  // AI Menu Storytelling Effect with Persistence
  useEffect(() => {
    if (currentView === 'restaurant-detail' && mgmtRestaurant) {
      const needsEnhancement = mgmtRestaurant.menu.some(item => !enhancedDescriptions[item.id]);
      if (needsEnhancement && !isEnhancing) {
        const enhance = async () => {
          setIsEnhancing(true);
          try {
            const results = await enhanceMenuDescriptions(mgmtRestaurant.menu);
            if (results) {
              setEnhancedDescriptions(prev => {
                const updated = { ...prev, ...results };
                db.saveMenuEnhancements(results);
                return updated;
              });
            }
          } catch (err) {
            console.error("AI enhancement failed", err);
          } finally {
            setIsEnhancing(false);
          }
        };
        enhance();
      }
    }
  }, [currentView, mgmtRestaurant]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      const user = await db.login(authForm.username, authForm.password);
      setCurrentUser(user);
      if (user.role === 'admin') setCurrentView('admin-dashboard');
      else setCurrentView('home');
    } catch (err) {
      alert('Login failed. Use user/pass or admin/admin');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    const finalAddressErr = validateAddress(deliveryAddress);
    if (finalAddressErr) {
      setAddressError(finalAddressErr);
      return;
    }
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const total = subtotal + 40;
    const newOrder: any = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      items: cart,
      total,
      status: 'preparing',
      timestamp: Date.now(),
      estimatedArrival: Date.now() + 1800000,
      deliveryAddress: isUsingGps ? "Live GPS Coordinates" : deliveryAddress
    };
    await db.saveOrder(newOrder);
    setCart([]);
    setOrders(await db.getOrders());
    setCurrentView('history');
  };

  const addToCart = (item: MenuItem, restaurant: Restaurant) => {
     setCart(prev => {
        const existing = prev.find(i => i.id === item.id);
        if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        return [...prev, { ...item, quantity: 1, restaurantName: restaurant.name }];
     });
  };

  // --- View Renderers ---

  const AdminDashboard = () => {
    const stats = useMemo(() => {
      const revenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
      const active = orders.filter(o => o.status !== 'delivered').length;
      const data = orders.slice(0, 10).map((o, i) => ({ name: `O${i}`, val: o.total }));
      return { revenue, active, data };
    }, [orders]);

    return (
      <div className="space-y-12 animate-reveal">
         <div className="flex justify-between items-end">
            <h1 className="text-6xl font-black tracking-tighter text-hero text-white">COMMAND <br/><span className="text-[#ff2d2d]">CENTER.</span></h1>
            <Badge color="primary">V.3.1 OPS CORE</Badge>
         </div>

         <div className="bento-grid">
            <GlassCard className="col-span-full md:col-span-2 flex flex-col justify-between h-80 relative overflow-hidden border-white/20">
               <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">Aggregate Revenue</p>
                  <h3 className="text-6xl font-black text-white">₹{stats.revenue.toLocaleString()}</h3>
                  <div className="mt-4"><Badge color="gold">+12% vs LY</Badge></div>
               </div>
               <div className="absolute inset-0 z-0 opacity-30 mt-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.data}>
                       <Area type="monotone" dataKey="val" stroke="#ff2d2d" strokeWidth={4} fill="#ff2d2d" fillOpacity={0.4} />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </GlassCard>

            <GlassCard className="flex flex-col items-center justify-center text-center gap-4 border-[#ff2d2d]/30">
               <PackageIcon className="w-12 h-12 text-[#ff2d2d] animate-glow rounded-full p-2" />
               <div>
                  <h4 className="text-5xl font-black text-white">{stats.active}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mt-1">Live Fleet Nodes</p>
               </div>
            </GlassCard>

            <GlassCard className="flex flex-col justify-center gap-2 border-white/20">
               <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Real-Time Pulse</p>
                  <RefreshIcon className="w-4 h-4 text-white/40" />
               </div>
               {orders.slice(0, 3).map(o => (
                  <div key={o.id} className="flex justify-between items-center py-3 border-b border-white/10 last:border-0">
                     <span className="text-xs font-black text-white">#{o.id}</span>
                     <Badge color="ghost">{o.status}</Badge>
                  </div>
               ))}
            </GlassCard>
         </div>

         <GlassCard className="p-0 overflow-hidden border-white/20">
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5">
               <h5 className="text-xl font-black text-white">Fleet Protocol Log</h5>
               <button className="text-[10px] font-black uppercase tracking-widest text-[#ff2d2d] hover:brightness-125 transition-all">Full Audit Log →</button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] border-b border-white/10">
                        <th className="py-6 px-8">TRANS ID</th>
                        <th className="py-6 px-8">STATUS MATRIX</th>
                        <th className="py-6 px-8 text-right">ACTION</th>
                     </tr>
                  </thead>
                  <tbody>
                     {orders.map(o => (
                        <tr key={o.id} className="group hover:bg-white/10 transition-colors">
                           <td className="py-8 px-8 font-black text-[#ff2d2d] text-lg">#{o.id}</td>
                           <td className="py-8 px-8">
                              <Badge color={o.status === 'delivered' ? 'gold' : 'primary'}>{o.status.replace('_', ' ')}</Badge>
                           </td>
                           <td className="py-8 px-8 text-right">
                              <select 
                                value={o.status} 
                                onChange={(e) => db.updateOrderStatus(o.id, e.target.value as any).then(setOrders)}
                                className="bg-[#1a1a1a] border border-white/20 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-[#ff2d2d]"
                              >
                                {['preparing', 'picked_up', 'delivering', 'delivered'].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </GlassCard>
      </div>
    );
  };

  if (!currentUser) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8 relative overflow-hidden">
       <div className="absolute inset-0 opacity-20 pointer-events-none scale-110 blur-xl">
          <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000" className="w-full h-full object-cover" />
       </div>
       <GlassCard className="w-full max-w-xl p-16 animate-reveal z-10 border-white/20 shadow-2xl rounded-[4rem] bg-[#0f0f0f]">
          <div className="text-center mb-16">
             <div className="bg-[#ff2d2d]/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 animate-soft-pulse border border-[#ff2d2d]/40">
                <SparklesIcon className="w-12 h-12 text-[#ff2d2d]" />
             </div>
             <h2 className="text-5xl font-black tracking-tighter mb-4 text-white">FLAVORDISH.</h2>
             <p className="text-white/60 text-xs font-black uppercase tracking-[0.4em]">Establish Secure Link</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
             <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70 ml-4">Credential ID</p>
                <input type="text" className="w-full bg-white/10 border border-white/20 rounded-3xl py-5 px-8 focus:border-[#ff2d2d] outline-none text-white transition-all text-lg font-bold" placeholder="ID (user / admin)" onChange={e => setAuthForm({...authForm, username: e.target.value})} required />
             </div>
             <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70 ml-4">Passphrase</p>
                <input type="password" className="w-full bg-white/10 border border-white/20 rounded-3xl py-5 px-8 focus:border-[#ff2d2d] outline-none text-white transition-all text-lg font-bold" placeholder="Code (pass / admin)" onChange={e => setAuthForm({...authForm, password: e.target.value})} required />
             </div>
             <button type="submit" disabled={isAuthLoading} className="btn-obsidian w-full mt-6 shadow-[0_0_50px_rgba(255,45,45,0.4)] h-20 text-xl">Connect to Fleet</button>
          </form>
       </GlassCard>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505]">
      <nav className="fixed top-0 left-0 right-0 z-[1000] glass-panel border-0 border-b border-white/10 py-8">
        <div className="container mx-auto px-8 flex justify-between items-center">
          <div onClick={() => setCurrentView(currentUser.role === 'admin' ? 'admin-dashboard' : 'home')} className="flex items-center gap-4 cursor-pointer group">
             <div className="bg-[#ff2d2d] p-2.5 rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-red-500/30">
                <SparklesIcon className="w-7 h-7 text-white" />
             </div>
             <span className="text-3xl font-black tracking-tighter text-white">FLAVORDISH.</span>
          </div>
          <div className="flex items-center gap-12 text-[11px] font-black uppercase tracking-widest">
            {currentUser.role === 'admin' ? (
              <>
                <button onClick={() => setCurrentView('admin-dashboard')} className={currentView === 'admin-dashboard' ? 'text-[#ff2d2d]' : 'text-white/70 hover:text-white transition-colors'}>OPS</button>
                <button className="text-white/70 hover:text-white transition-colors">FLEET</button>
              </>
            ) : (
              <>
                <button onClick={() => setCurrentView('home')} className={currentView === 'home' ? 'text-[#ff2d2d]' : 'text-white/70 hover:text-white transition-colors'}>EXPLORE</button>
                <button onClick={() => setCurrentView('history')} className={currentView === 'history' ? 'text-[#ff2d2d]' : 'text-white/70 hover:text-white transition-colors'}>VAULT</button>
                <div onClick={() => setCurrentView('cart')} className="relative cursor-pointer hover:scale-110 transition-transform">
                   <CartIcon className="w-6 h-6 text-white" />
                   {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-[#ff2d2d] w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-[#050505] text-white">{cart.length}</span>}
                </div>
              </>
            )}
            <button onClick={() => { db.logout(); setCurrentUser(null); }} className="px-8 py-3 rounded-full border border-white/20 hover:bg-[#ff2d2d] hover:border-[#ff2d2d] transition-all text-white font-black">EXIT</button>
          </div>
        </div>
      </nav>

      <div className="pt-40 pb-32 container mx-auto px-8">
        {currentView === 'home' && (
          <div className="space-y-24 animate-reveal">
             <div className="relative h-[600px] rounded-[5rem] overflow-hidden shadow-2xl border border-white/10">
                <img src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2000" className="w-full h-full object-cover scale-105 opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent flex flex-col items-center justify-center text-center p-12">
                   <Badge color="gold">ELITE AMDAVADI DISCOVERY</Badge>
                   <h1 className="text-8xl font-black tracking-tighter mt-8 mb-6 text-white shadow-xl">FEAST ON <br/><span className="text-[#ff2d2d]">OBSIDIAN.</span></h1>
                   <p className="max-w-xl text-white/80 font-bold text-sm uppercase tracking-[0.4em] leading-relaxed">Neural Logistics • AI-Enhanced Discovery • Gourmet Protocol</p>
                   <div className="w-full max-w-2xl mt-16 relative group">
                      <div className="absolute inset-0 bg-[#ff2d2d]/30 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      <input type="text" className="w-full glass-panel py-7 px-12 rounded-full border-white/20 focus:ring-4 focus:ring-[#ff2d2d]/50 outline-none text-white text-2xl font-bold relative z-10" placeholder="WHAT'S YOUR MOOD TODAY?" />
                      <button className="absolute right-3.5 top-3.5 bottom-3.5 px-10 bg-[#ff2d2d] rounded-full font-black text-xs tracking-widest uppercase hover:scale-105 transition-transform z-20 shadow-xl shadow-red-500/40 text-white">SEARCH</button>
                   </div>
                </div>
             </div>
             <section>
                <div className="flex justify-between items-center mb-12">
                   <div className="flex items-center gap-6">
                      <div className="h-[2px] w-20 bg-[#ff2d2d]" />
                      <h2 className="text-5xl font-black tracking-tighter text-white">THE FLEET.</h2>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                  {restaurants.map(res => (
                    // Fix: Removed undefined setSelectedRestaurant and used setMgmtRestaurant
                    <RestaurantCard key={res.id} restaurant={res} onClick={() => { setMgmtRestaurant(res); setCurrentView('restaurant-detail'); }} />
                  ))}
                </div>
             </section>
          </div>
        )}

        {currentView === 'restaurant-detail' && mgmtRestaurant && (
          <div className="animate-reveal space-y-20">
             <div className="relative h-[450px] rounded-[5rem] overflow-hidden border border-white/10">
                <img src={mgmtRestaurant.image} className="w-full h-full object-cover opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent" />
                <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
                   <div>
                      <div className="flex gap-4 mb-6">
                         <Badge color="primary">{mgmtRestaurant.cuisine}</Badge>
                         <Badge color="ghost">PROCESSED IN 30M</Badge>
                      </div>
                      <h1 className="text-8xl font-black tracking-tighter leading-none text-white">{mgmtRestaurant.name}</h1>
                   </div>
                   <button onClick={() => setCurrentView('home')} className="glass-button px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest border border-white/30 text-white hover:bg-white hover:text-black transition-all">EXIT TO FLEET</button>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {mgmtRestaurant.menu.map(item => (
                  <GlassCard key={item.id} className="group p-8 flex items-center gap-10 hover:border-[#ff2d2d]/50 shadow-2xl relative overflow-hidden border-white/20">
                     {isEnhancing && !enhancedDescriptions[item.id] && (
                        <div className="absolute top-4 right-8"><Badge color="gold">AI STORYTELLING...</Badge></div>
                     )}
                     <div className="w-48 h-48 rounded-[3rem] overflow-hidden flex-shrink-0 relative border border-white/10">
                        <img src={item.image} className="w-full h-full object-cover transition-all duration-1000 scale-110 group-hover:scale-125" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 font-black text-3xl tracking-tighter text-white">₹{item.price}</span>
                     </div>
                     <div className="flex-grow">
                        <h6 className="text-3xl font-black text-white tracking-tighter mb-4">{item.name}</h6>
                        <p className="text-base text-white/80 font-medium leading-relaxed mb-10 transition-opacity duration-1000">
                           {enhancedDescriptions[item.id] || item.description}
                        </p>
                        <button onClick={() => addToCart(item, mgmtRestaurant!)} className="px-10 py-4 rounded-full border-2 border-[#ff2d2d] text-[#ff2d2d] font-black text-[12px] uppercase tracking-widest hover:bg-[#ff2d2d] hover:text-white transition-all shadow-lg hover:shadow-red-500/30">ACQUIRE DISH</button>
                     </div>
                  </GlassCard>
                ))}
             </div>
          </div>
        )}

        {currentView === 'cart' && (
          <div className="animate-reveal max-w-5xl mx-auto">
             <div className="glass-panel rounded-[5rem] p-20 border-white/20 shadow-[0_40px_100px_rgba(0,0,0,0.9)] bg-[#0f0f0f]">
                <div className="flex items-center gap-8 mb-20">
                   <div className="bg-[#ff2d2d] p-6 rounded-[2rem] shadow-2xl shadow-red-500/50">
                      <CartIcon className="w-14 h-14 text-white" />
                   </div>
                   <h2 className="text-7xl font-black tracking-tighter text-white">THE <br/><span className="text-[#ff2d2d]">BASKET.</span></h2>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-32 opacity-40 flex flex-col items-center">
                     <PackageIcon className="w-32 h-32 mb-10 text-white" />
                     <p className="font-black uppercase tracking-[0.8em] text-sm text-white">Target inventory offline</p>
                  </div>
                ) : (
                  <div className="space-y-12">
                     <div className="space-y-6 max-h-[450px] overflow-auto pr-10 no-scrollbar">
                        {cart.map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-10 border-b border-white/10 last:border-0 group">
                             <div className="flex items-center gap-10">
                                <img src={item.image} className="w-32 h-32 rounded-[2.5rem] object-cover border-2 border-white/20 transition-all duration-700 shadow-xl" />
                                <div>
                                   <p className="text-4xl font-black text-white tracking-tighter leading-none mb-3">{item.name}</p>
                                   <p className="text-sm text-white/70 uppercase font-black tracking-widest">{item.restaurantName} • QTY: {item.quantity}</p>
                                </div>
                             </div>
                             <div className="text-right flex flex-col items-end">
                                <span className="text-4xl font-black text-[#ff2d2d] tracking-tighter">₹{item.price * item.quantity}</span>
                                <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="text-[11px] font-black uppercase tracking-widest text-[#ff2d2d] hover:brightness-125 mt-4 transition-colors">Discard Cycle</button>
                             </div>
                          </div>
                        ))}
                     </div>
                     <div className="pt-16 border-t border-white/20 flex justify-between items-end">
                        <div className="space-y-2">
                           <p className="text-white/60 font-black uppercase tracking-widest text-xs">Pre-Allocation Review</p>
                           <h3 className="text-8xl font-black text-white tracking-tighter leading-none">₹{(cart.reduce((a, b) => a + (b.price * b.quantity), 0) + 40).toLocaleString()}</h3>
                        </div>
                        <button onClick={() => setCurrentView('checkout')} className="btn-obsidian h-28 px-20 text-3xl shadow-[0_20px_60px_rgba(255,45,45,0.5)]">CONTINUE TO LOGISTICS</button>
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {currentView === 'checkout' && (
          <div className="animate-reveal max-w-6xl mx-auto">
             <div className="glass-panel rounded-[5rem] overflow-hidden border-white/20 shadow-[0_40px_100px_rgba(0,0,0,0.9)] bg-[#0a0a0a]">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                   <div className="p-16 border-e border-white/10 bg-[#111]/40">
                      <div className="flex items-center gap-4 mb-12">
                          <PackageIcon className="text-[#ff2d2d] w-12 h-12" />
                          <h2 className="text-5xl font-black tracking-tighter uppercase text-white">Order Summary</h2>
                      </div>
                      
                      <div className="space-y-8 mb-16 max-h-[300px] overflow-auto pr-6 no-scrollbar">
                         {cart.map((item, idx) => (
                           <div key={idx} className="flex justify-between items-start border-b border-white/10 pb-6 last:border-0">
                              <div>
                                 <p className="text-2xl font-black text-white leading-none tracking-tight">{item.name}</p>
                                 <p className="text-xs font-black uppercase tracking-widest text-white/70 mt-3">{item.restaurantName} • QTY: {item.quantity}</p>
                              </div>
                              <span className="text-2xl font-black text-white tracking-tighter">₹{item.price * item.quantity}</span>
                           </div>
                         ))}
                      </div>

                      <div className="space-y-6 pt-10 border-t border-white/20 border-dashed">
                         <div className="flex justify-between items-center text-white/80 font-black uppercase tracking-widest text-sm">
                            <span>SUBTOTAL LOGISTICS</span>
                            <span className="text-white text-2xl tracking-tighter">₹{cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)}</span>
                         </div>
                         <div className="flex justify-between items-center text-white/80 font-black uppercase tracking-widest text-sm">
                            <span>DELIVERY PROTOCOL FEE</span>
                            <span className="text-white text-2xl tracking-tighter">₹40</span>
                         </div>
                         <div className="flex justify-between items-center pt-8 border-t border-white/30">
                            <span className="text-[#ff2d2d] font-black uppercase tracking-[0.2em] text-lg">TOTAL ALLOCATION</span>
                            <span className="text-7xl font-black text-white tracking-tighter">₹{(cart.reduce((a, b) => a + (b.price * b.quantity), 40)).toLocaleString()}</span>
                         </div>
                      </div>

                      <button onClick={handlePlaceOrder} className="btn-obsidian w-full h-28 mt-16 text-2xl shadow-[0_20px_50px_rgba(255,45,45,0.5)]">INITIATE PROCUREMENT</button>
                   </div>

                   <div className="p-16 bg-[#050505]/80 flex flex-col">
                      <div className="flex items-center justify-between mb-12">
                         <h5 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3 text-white">
                            <MapIcon className="text-[#ff2d2d] w-8 h-8" /> Delivery Protocol
                         </h5>
                         <button onClick={() => setIsUsingGps(!isUsingGps)} className={`px-6 py-3 rounded-full border-2 border-white/20 text-[10px] font-black uppercase tracking-widest transition-all ${isUsingGps ? 'bg-[#ff2d2d] border-[#ff2d2d] text-white' : 'hover:bg-white/10 text-white'}`}>
                            {isUsingGps ? 'Live GPS Active' : 'Manual Signal'}
                         </button>
                      </div>

                      <div className="flex-grow rounded-[3rem] overflow-hidden border-2 border-white/10 relative mb-12 shadow-inner">
                         <InteractiveMap 
                           center={isUsingGps ? [userCoords.latitude, userCoords.longitude] : [23.0225, 72.5714]} 
                           markers={[{ position: isUsingGps ? [userCoords.latitude, userCoords.longitude] : [23.0225, 72.5714], color: 'danger', label: '🏠' }]} 
                           height="100%" 
                           zoom={16} 
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                      </div>

                      <div className="space-y-6">
                         <div className="relative">
                           <input 
                             type="text" 
                             className={`w-full bg-white/10 border-2 rounded-3xl py-7 px-10 focus:border-[#ff2d2d] outline-none text-white transition-all text-lg font-bold ${addressError ? 'border-[#ff2d2d]' : 'border-white/10'}`}
                             placeholder="ENTRY PROTOCOL / ADDRESS..." 
                             value={deliveryAddress}
                             onChange={(e) => handleAddressChange(e.target.value)}
                             disabled={isUsingGps}
                           />
                           {addressError && !isUsingGps && (
                             <div className="absolute -bottom-8 left-6 flex items-center gap-2 text-[#ff2d2d] font-black text-[10px] uppercase tracking-widest animate-reveal">
                                <WarningIcon /> {addressError}
                             </div>
                           )}
                         </div>
                         <textarea 
                           className="w-full bg-white/10 border-2 border-white/10 rounded-[2.5rem] py-7 px-10 focus:border-[#ff2d2d] outline-none text-white transition-all text-lg font-bold no-scrollbar mt-4" 
                           placeholder="SPECIAL LOGISTICS INSTRUCTIONS..." 
                           rows={3}
                         />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {currentView === 'history' && (
          <div className="animate-reveal space-y-16 max-w-5xl mx-auto">
             <div className="flex justify-between items-end">
                <h2 className="text-7xl font-black tracking-tighter text-white">ORDER <br/><span className="text-[#ff2d2d]">VAULT.</span></h2>
                <Badge color="ghost">ENCRYPTED HISTORY</Badge>
             </div>
             {orders.map(o => (
                <GlassCard key={o.id} className="p-12 group border-white/20 hover:border-[#ff2d2d]/60 transition-all duration-700 bg-[#0f0f0f]">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-10 items-center">
                        <div className="w-24 h-24 rounded-[2rem] bg-white/10 flex items-center justify-center border-2 border-white/10 group-hover:bg-[#ff2d2d]/20 transition-colors shadow-lg">
                            <PackageIcon className="w-12 h-12 text-white/50 group-hover:text-[#ff2d2d]" />
                        </div>
                        <div>
                            <p className="text-[#ff2d2d] font-black text-sm uppercase tracking-widest mb-1">NODE-#{o.id}</p>
                            <h5 className="text-5xl font-black text-white tracking-tighter leading-none">{o.items?.[0]?.restaurantName || 'Gourmet Engagement'}</h5>
                            <div className="mt-4"><Badge color={o.status === 'delivered' ? 'gold' : 'primary'}>{o.status.replace('_', ' ')}</Badge></div>
                        </div>
                        </div>
                        <div className="text-right">
                        <p className="text-5xl font-black text-white tracking-tighter leading-none mb-3">₹{o.total}</p>
                        <p className="text-xs text-white/60 font-black uppercase tracking-[0.2em]">{new Date(o.timestamp).toLocaleDateString()}</p>
                        </div>
                    </div>
                </GlassCard>
             ))}
          </div>
        )}

        {currentView === 'admin-dashboard' && <AdminDashboard />}
      </div>

      <button 
        onClick={() => setIsSupportOpen(true)} 
        className="fixed bottom-16 right-16 w-32 h-32 bg-[#ff2d2d] rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(255,45,45,0.6)] z-[1000] border-[12px] border-[#050505] hover:scale-110 active:scale-90 transition-all duration-500 group overflow-hidden animate-glow"
      >
         <SparklesIcon className="w-14 h-14 text-white animate-soft-pulse group-hover:rotate-12 transition-transform" />
         <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity mix-blend-overlay" />
      </button>

      <LiveSupportPanel isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      <footer className="py-24 border-t border-white/10 flex flex-col items-center justify-center opacity-40">
          <div className="flex items-center gap-3 mb-4">
             <SparklesIcon className="w-6 h-6 text-white" />
             <span className="text-2xl font-black tracking-[1em] text-white">FLAVORDISH.</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white">OBSIDIAN CORE • DEPLOYED 2025</p>
      </footer>
    </div>
  );
};

export default App;
