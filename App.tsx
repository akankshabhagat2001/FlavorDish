
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
const HeadsetIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 4.978 4.978 0 011.414-3.536m0 0l2.829 2.829m-2.829 4.243L3 21m6.707-6.707a8.001 8.001 0 0111.314 0z" /></svg>
);
const MapIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7l5-2.5 5.553 2.776a1 1 0 01.447.894v10.764a1 1 0 01-1.447.894L14 17l-5 3z" /></svg>
);
const ChartIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
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

const Badge: React.FC<{ children: React.ReactNode; color?: string; pulse?: boolean }> = ({ children, color = "primary", pulse = false }) => {
  const styles: any = {
    primary: "bg-[#ff2d2d] text-white",
    gold: "bg-[#ffc107] text-black",
    ghost: "bg-[#050505]/10 text-[#050505] backdrop-blur-md border border-[#050505]/10",
  };
  return (
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] relative ${styles[color] || styles.primary}`}>
      {pulse && <span className="absolute inset-0 rounded-full bg-inherit animate-ping opacity-50"></span>}
      <span className="relative z-10">{children}</span>
    </span>
  );
};

// --- Added RestaurantCard Component to fix the error ---
const RestaurantCard: React.FC<{ restaurant: Restaurant; onClick: () => void }> = ({ restaurant, onClick }) => (
  <GlassCard onClick={onClick} className="group !p-0 overflow-hidden border-none bg-white shadow-2xl transition-all duration-500">
    <div className="relative h-64 overflow-hidden">
      <img 
        src={restaurant.image} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        alt={restaurant.name} 
      />
      <div className="absolute top-6 right-6">
        <Badge color="gold">{restaurant.rating} ★</Badge>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
        <p className="text-white text-[10px] font-black uppercase tracking-widest">View Menu Protocol</p>
      </div>
    </div>
    <div className="p-8">
      <h5 className="text-2xl font-black text-[#050505] tracking-tighter mb-1">{restaurant.name}</h5>
      <p className="text-[#050505]/40 text-[10px] font-black uppercase tracking-widest">{restaurant.cuisine}</p>
      <div className="mt-6 flex items-center gap-4 text-[#050505]/60">
        <div className="flex items-center gap-1">
          <ClockIcon className="w-3 h-3" />
          <span className="text-[10px] font-bold">{restaurant.deliveryTime}</span>
        </div>
      </div>
    </div>
  </GlassCard>
);

// --- Interactive Map Helper ---
const InteractiveMap = ({ center, markers = [], polyline = [], height = '450px', zoom = 15 }: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const L = (window as any).L;
    if (!L) return;
    
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, { 
        center: center || [23.0225, 72.5714], 
        zoom: zoom, 
        zoomControl: false, 
        attributionControl: false 
      });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(mapRef.current);
    } else {
      mapRef.current.setView(center, zoom);
    }
    
    const map = mapRef.current;
    map.eachLayer((layer: any) => { 
      if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer); 
    });
    
    markers.forEach((m: any) => {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative flex items-center justify-center" style="width: 48px; height: 48px;">
            ${m.pulse ? '<div class="absolute inset-0 rounded-full bg-red-500 animate-ping-slow opacity-40"></div>' : ''}
            <div class="relative z-10 bg-${m.color || 'red-500'} p-2.5 rounded-full border-2 border-white shadow-2xl flex items-center justify-center text-white" style="width: 36px; height: 36px; font-size: 14px;">
              ${m.label || ''}
            </div>
          </div>`,
        iconSize: [48, 48], 
        iconAnchor: [24, 24]
      });
      L.marker(m.position, { icon }).addTo(map);
    });
    
    if (polyline.length > 0) {
      L.polyline(polyline, { color: '#ff2d2d', weight: 3, opacity: 0.6, dashArray: '10, 10' }).addTo(map);
    }
  }, [markers, polyline, center, zoom]);

  return <div ref={containerRef} className="w-100 h-100 rounded-[3rem] overflow-hidden border border-white/10" style={{ minHeight: height }} />;
};

const App = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState('landing'); // Initial state is landing
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [mgmtRestaurant, setMgmtRestaurant] = useState<Restaurant | null>(null);
  const [userCoords, setUserCoords] = useState({ latitude: 23.0225, longitude: 72.5714 });

  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setCurrentView(user.role === 'admin' ? 'admin-dashboard' : 'home');
    }
    db.getRestaurants().then(setRestaurants);
    db.getOrders().then(setOrders);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      const user = await db.login(authForm.username, authForm.password);
      setCurrentUser(user);
      setCurrentView(user.role === 'admin' ? 'admin-dashboard' : 'home');
    } catch (err) {
      alert('Login failed. Use user/pass or admin/admin');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const addToCart = (item: MenuItem, restaurant: Restaurant) => {
     setCart(prev => {
        const existing = prev.find(i => i.id === item.id);
        if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
        return [...prev, { ...item, quantity: 1, restaurantId: restaurant.id, restaurantName: restaurant.name }];
     });
  };

  // --- Landing View ---
  const LandingView = () => (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 relative overflow-hidden">
       <div className="absolute inset-0 opacity-40 scale-110 pointer-events-none">
          <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000" className="w-full h-full object-cover grayscale brightness-50" alt="Food background" />
       </div>
       <div className="relative z-10 text-center space-y-12 animate-reveal">
          <div className="flex flex-col items-center">
             <div className="bg-[#ff2d2d] p-6 rounded-[2.5rem] shadow-[0_0_100px_rgba(255,45,45,0.4)] mb-8 animate-glow">
                <SparklesIcon className="w-16 h-16 text-white" />
             </div>
             <h1 className="text-[12rem] font-black tracking-tighter text-[#ff2d2d] leading-none mb-0">FLAVOR<br/>DISH.</h1>
             <p className="text-white text-xl font-black uppercase tracking-[0.8em] mt-4 opacity-60">The Obsidian Culinary Protocol</p>
          </div>
          <div className="flex flex-col items-center gap-8">
             <button 
                onClick={() => setCurrentView('login')}
                className="btn-obsidian !px-24 !py-8 !text-2xl shadow-[0_20px_60px_rgba(255,45,45,0.3)] hover:!shadow-red-500/60"
             >
                INITIALIZE SYSTEM
             </button>
             <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Amdavad High-Precision Logistics • V3.1.2</p>
          </div>
       </div>
       <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end opacity-20">
          <div className="space-y-2">
             <p className="text-[8px] font-black uppercase tracking-widest text-white">Grid Status: Active</p>
             <p className="text-[8px] font-black uppercase tracking-widest text-white">Lat: 23.0225 | Lng: 72.5714</p>
          </div>
          <p className="text-[8px] font-black uppercase tracking-widest text-white">© 2025 FlavorDish Global Operations</p>
       </div>
    </div>
  );

  // --- Login View ---
  const LoginView = () => (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8 relative overflow-hidden">
       <div className="container max-w-7xl z-10 animate-reveal">
          <div className="text-center mb-20 flex flex-col items-center">
             <div className="bg-[#ff2d2d]/20 w-20 h-20 rounded-full flex items-center justify-center mb-6 border border-[#ff2d2d]/40">
                <SparklesIcon className="w-10 h-10 text-[#ff2d2d]" />
             </div>
             <h2 className="text-6xl font-black tracking-tighter mb-4 text-[#ff2d2d]">ACCESS NODE.</h2>
             <button onClick={() => setCurrentView('landing')} className="text-white/40 hover:text-[#ff2d2d] transition-colors text-[10px] font-black uppercase tracking-widest">← Abort Initialization</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="glass-card !bg-white p-16 rounded-[4rem] shadow-[0_0_80px_rgba(255,45,45,0.15)] flex flex-col border-none">
                <div className="text-center mb-12">
                   <div className="bg-[#ff2d2d]/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <CartIcon className="text-[#ff2d2d] w-10 h-10" />
                   </div>
                   <h3 className="text-4xl font-black text-[#050505] tracking-tighter uppercase">Customer</h3>
                   <p className="text-[#050505]/60 text-[10px] font-black uppercase tracking-widest mt-2">Personal Fleet Access</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6 flex-grow">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/60 ml-4">Credential ID</p>
                      <input type="text" className="w-full bg-[#050505]/5 border border-[#050505]/10 rounded-3xl py-5 px-8 focus:border-[#ff2d2d] outline-none text-[#ff2d2d] transition-all text-lg font-bold" placeholder="user" onChange={e => setAuthForm({...authForm, username: e.target.value})} required />
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/60 ml-4">Passphrase</p>
                      <input type="password" className="w-full bg-[#050505]/5 border border-[#050505]/10 rounded-3xl py-5 px-8 focus:border-[#ff2d2d] outline-none text-[#ff2d2d] transition-all text-lg font-bold" placeholder="pass" onChange={e => setAuthForm({...authForm, password: e.target.value})} required />
                   </div>
                   <button type="submit" disabled={isAuthLoading} className="btn-obsidian w-full mt-6 h-20 text-xl !shadow-none hover:bg-black transition-colors">CONNECT GUEST</button>
                </form>
             </div>

             <div className="glass-card !bg-white p-16 rounded-[4rem] shadow-[0_0_80px_rgba(255,45,45,0.15)] flex flex-col border-none">
                <div className="text-center mb-12">
                   <div className="bg-[#ff2d2d]/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <ChartIcon className="text-[#ff2d2d] w-10 h-10" />
                   </div>
                   <h3 className="text-4xl font-black text-[#050505] tracking-tighter uppercase">Partner</h3>
                   <p className="text-[#050505]/60 text-[10px] font-black uppercase tracking-widest mt-2">Fleet Management Core</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6 flex-grow">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/60 ml-4">Fleet Admin ID</p>
                      <input type="text" className="w-full bg-[#050505]/5 border border-[#050505]/10 rounded-3xl py-5 px-8 focus:border-[#ff2d2d] outline-none text-[#ff2d2d] transition-all text-lg font-bold" placeholder="admin" onChange={e => setAuthForm({...authForm, username: e.target.value})} required />
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#0a0a0a]/60 ml-4">Secure Key</p>
                      <input type="password" className="w-full bg-[#050505]/5 border border-[#050505]/10 rounded-3xl py-5 px-8 focus:border-[#ff2d2d] outline-none text-[#ff2d2d] transition-all text-lg font-bold" placeholder="admin" onChange={e => setAuthForm({...authForm, password: e.target.value})} required />
                   </div>
                   <button type="submit" disabled={isAuthLoading} className="btn-obsidian w-full mt-6 h-20 text-xl !shadow-none bg-[#050505] hover:bg-[#ff2d2d] transition-colors">INITIATE COMMAND</button>
                </form>
             </div>
          </div>
       </div>
    </div>
  );

  // --- Admin Dashboard (Admin Panel) ---
  const AdminPanel = () => {
    const revenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
    return (
      <div className="space-y-16 animate-reveal">
         <div className="flex justify-between items-end">
            <h1 className="text-8xl font-black tracking-tighter text-[#ff2d2d]">FLEET<br/>COMMAND.</h1>
            <div className="text-right">
               <Badge color="gold">SECURE LINK ESTABLISHED</Badge>
               <p className="text-[10px] font-black uppercase tracking-widest mt-4 opacity-40">Admin: {currentUser.name}</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <GlassCard className="col-span-full md:col-span-2 !bg-white flex flex-col justify-between h-[450px]">
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#050505]/60 mb-2">Aggregate Fleet Revenue</p>
                  <h3 className="text-7xl font-black text-[#ff2d2d]">₹{revenue.toLocaleString()}</h3>
               </div>
               <div className="h-64 opacity-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={orders.slice(0, 10).map((o, i) => ({ n: i, v: o.total }))}>
                       <Area type="monotone" dataKey="v" stroke="#ff2d2d" strokeWidth={6} fill="#ff2d2d" fillOpacity={1} />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </GlassCard>
            <div className="space-y-12">
               <GlassCard className="!bg-[#ff2d2d] flex flex-col items-center justify-center p-12 !text-white text-center">
                  <PackageIcon className="w-12 h-12 mb-4" />
                  <h4 className="text-6xl font-black leading-none">{orders.length}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-80">Processed Nodes</p>
               </GlassCard>
               <GlassCard className="!bg-white p-12 flex flex-col items-center justify-center text-center">
                  <ClockIcon className="w-12 h-12 mb-4 text-[#ff2d2d]" />
                  <h4 className="text-4xl font-black text-[#050505]">28m</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-[#050505]/40">Avg Delivery Delta</p>
               </GlassCard>
            </div>
         </div>

         <section>
            <h2 className="text-4xl font-black tracking-tighter text-[#ff2d2d] mb-8 uppercase">Live Logistics Grid</h2>
            <div className="bento-grid">
               {orders.filter(o => o.status !== 'delivered').map(o => (
                  <GlassCard key={o.id} className="!bg-white p-10 flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-[#050505]/40">NodeID-#{o.id}</p>
                           <h5 className="text-2xl font-black text-[#050505] tracking-tighter mt-1">{o.items?.[0]?.restaurantName || 'Gourmet Load'}</h5>
                        </div>
                        <Badge color="primary">{o.status}</Badge>
                     </div>
                     <button onClick={() => {
                        db.updateOrderStatus(o.id, 'delivered').then(() => db.getOrders().then(setOrders));
                     }} className="mt-8 border-2 border-[#ff2d2d] text-[#ff2d2d] font-black py-4 rounded-3xl hover:bg-[#ff2d2d] hover:text-white transition-all uppercase text-[10px] tracking-widest">Mark as Finalized</button>
                  </GlassCard>
               ))}
               {orders.filter(o => o.status !== 'delivered').length === 0 && (
                  <div className="col-span-full py-20 text-center opacity-20">
                     <p className="text-xl font-black uppercase tracking-[0.5em] text-[#ff2d2d]">No active nodes in grid</p>
                  </div>
               )}
            </div>
         </section>
      </div>
    );
  };

  if (currentView === 'landing') return <LandingView />;
  if (currentView === 'login') return <LoginView />;

  return (
    <div className="min-h-screen bg-[#050505]">
      <nav className="fixed top-0 left-0 right-0 z-[1000] glass-panel border-0 border-b border-white/10 py-8">
        <div className="container mx-auto px-8 flex justify-between items-center">
          <div onClick={() => setCurrentView(currentUser.role === 'admin' ? 'admin-dashboard' : 'home')} className="flex items-center gap-4 cursor-pointer group">
             <div className="bg-[#ff2d2d] p-2.5 rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-red-500/30">
                <SparklesIcon className="w-7 h-7 text-white" />
             </div>
             <span className="text-3xl font-black tracking-tighter text-[#ff2d2d]">FLAVORDISH.</span>
          </div>
          <div className="flex items-center gap-12 text-[11px] font-black uppercase tracking-widest">
            {currentUser?.role === 'admin' ? (
              <>
                <button onClick={() => setCurrentView('admin-dashboard')} className={currentView === 'admin-dashboard' ? 'text-[#ff2d2d]' : 'text-white/70 hover:text-white transition-colors'}>OPS CORE</button>
                <button className="text-white/70 hover:text-white transition-colors">FLEET NODES</button>
              </>
            ) : (
              <>
                <button onClick={() => setCurrentView('home')} className={currentView === 'home' ? 'text-[#ff2d2d]' : 'text-white/70 hover:text-white transition-colors'}>EXPLORE</button>
                <button onClick={() => setCurrentView('history')} className={currentView === 'history' ? 'text-[#ff2d2d]' : 'text-white/70 hover:text-white transition-colors'}>VAULT</button>
                <div onClick={() => setCurrentView('cart')} className="relative cursor-pointer hover:scale-110 transition-transform">
                   <CartIcon className="w-6 h-6 text-[#ff2d2d]" />
                   {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-[#ff2d2d] w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-[#050505] text-white">{cart.length}</span>}
                </div>
              </>
            )}
            <button onClick={() => { db.logout(); setCurrentUser(null); setCurrentView('landing'); }} className="px-8 py-3 rounded-full border border-white/20 hover:bg-[#ff2d2d] hover:border-[#ff2d2d] transition-all text-[#ff2d2d] font-black">DISCONNECT</button>
          </div>
        </div>
      </nav>

      <div className="pt-48 pb-32 container mx-auto px-8">
        {currentView === 'home' && (
          <div className="space-y-24 animate-reveal">
             <div className="relative h-[600px] rounded-[5rem] overflow-hidden shadow-2xl border border-white/10">
                <img src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2000" className="w-full h-full object-cover opacity-60" alt="Hero" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent flex flex-col items-center justify-center text-center p-12">
                   <Badge color="gold">Amdavad High-Definition Discovery</Badge>
                   <h1 className="text-9xl font-black tracking-tighter mt-8 mb-6 text-[#ff2d2d]">FEAST ON<br/>THE GRID.</h1>
                   <div className="w-full max-w-2xl mt-16 relative">
                      <input type="text" className="w-full glass-panel py-7 px-12 rounded-full border-white/20 focus:ring-4 focus:ring-[#ff2d2d]/50 outline-none text-white text-2xl font-bold" placeholder="SEARCHING FOR MOOD..." />
                      <button className="absolute right-4 top-4 bottom-4 px-10 bg-[#ff2d2d] rounded-full font-black text-xs tracking-widest uppercase hover:scale-105 transition-transform text-white">SCAN</button>
                   </div>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                {restaurants.map(res => (
                  <RestaurantCard key={res.id} restaurant={res} onClick={() => { setMgmtRestaurant(res); setCurrentView('restaurant-detail'); }} />
                ))}
             </div>
          </div>
        )}

        {currentView === 'restaurant-detail' && mgmtRestaurant && (
          <div className="animate-reveal space-y-20">
             <div className="relative h-[450px] rounded-[5rem] overflow-hidden">
                <img src={mgmtRestaurant.image} className="w-full h-full object-cover opacity-60" alt={mgmtRestaurant.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent" />
                <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
                   <div>
                      <h1 className="text-8xl font-black tracking-tighter text-[#ff2d2d] mb-4">{mgmtRestaurant.name}</h1>
                      <Badge color="primary">{mgmtRestaurant.cuisine}</Badge>
                   </div>
                </div>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {mgmtRestaurant.menu.map(item => (
                  <GlassCard key={item.id} className="!bg-white p-8 flex items-center gap-10">
                     <div className="w-40 h-40 rounded-[2rem] overflow-hidden flex-shrink-0">
                        <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                     </div>
                     <div className="flex-grow">
                        <h6 className="text-3xl font-black text-[#050505] tracking-tighter">{item.name}</h6>
                        <p className="text-[#050505]/60 text-sm mt-2 mb-6">{item.description}</p>
                        <div className="flex justify-between items-center">
                           <span className="text-2xl font-black text-[#ff2d2d]">₹{item.price}</span>
                           <button onClick={() => addToCart(item, mgmtRestaurant!)} className="px-8 py-3 bg-[#050505] text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[#ff2d2d] transition-colors">Acquire</button>
                        </div>
                     </div>
                  </GlassCard>
                ))}
             </div>
          </div>
        )}

        {currentView === 'admin-dashboard' && <AdminPanel />}
        
        {currentView === 'history' && (
          <div className="max-w-4xl mx-auto space-y-12">
             <h2 className="text-6xl font-black tracking-tighter text-[#ff2d2d]">YOUR VAULT.</h2>
             {orders.map(o => (
               <GlassCard key={o.id} className="!bg-white flex justify-between items-center p-12">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-[#050505]/40 mb-1">NODE-#{o.id}</p>
                     <h5 className="text-4xl font-black text-[#050505] tracking-tighter">{o.items?.[0]?.restaurantName || 'Gourmet Engagement'}</h5>
                     <div className="mt-4"><Badge color={o.status === 'delivered' ? 'gold' : 'primary'}>{o.status}</Badge></div>
                  </div>
                  <div className="text-right">
                     <p className="text-5xl font-black text-[#ff2d2d] mb-2">₹{o.total}</p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-[#050505]/40">{new Date(o.timestamp).toLocaleDateString()}</p>
                  </div>
               </GlassCard>
             ))}
          </div>
        )}
      </div>

      <footer className="py-24 border-t border-white/10 flex flex-col items-center justify-center opacity-40">
          <div className="flex items-center gap-3 mb-4">
             <SparklesIcon className="w-6 h-6 text-[#ff2d2d]" />
             <span className="text-2xl font-black tracking-[1em] text-[#ff2d2d]">FLAVORDISH.</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#ff2d2d]">OBSIDIAN OPS • DEPLOYED 2025</p>
      </footer>
    </div>
  );
};

export default App;
