
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { StarIcon, CartIcon, ClockIcon, SparklesIcon, TagIcon, RefreshIcon, HeartIcon } from './components/Icons';
import { getNearbyFoodDiscovery, connectToLiveSupport } from './services/geminiService';
import { db } from './services/databaseService';

// --- Types ---
import { Restaurant, Order, MenuItem } from './types';

// --- Icons ---
const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);
const PackageIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
);
const XIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
);
const TrashIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);
const EditIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
);
const PlusIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
);
const ChartIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
);
const HeadsetIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 4.978 4.978 0 011.414-3.536m0 0l2.829 2.829m-2.829 4.243L3 21m6.707-6.707a8.001 8.001 0 0111.314 0z" /></svg>
);

// --- Global UI Components ---

const Badge = ({ children, color = "primary" }) => {
    const colors: any = {
        primary: "bg-[#ff2d2d] text-white",
        gold: "bg-[#ffc107] text-black",
        dark: "bg-white/10 text-white backdrop-blur-md"
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${colors[color]}`}>
            {children}
        </span>
    );
};

// Fix: Updated Card component to accept and handle onClick prop
const Card = ({ children, className = "", hover = true, onClick }: { children: any; className?: string; hover?: boolean; onClick?: () => void }) => (
    <div 
        onClick={onClick}
        className={`bg-[#121212] border border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 ${hover ? 'hover:border-white/20 hover:translate-y-[-8px] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : ''} ${className}`}
    >
        {children}
    </div>
);

// --- Sub-components ---

const StatusStepper = ({ status }: { status: string }) => {
  const steps = ['preparing', 'picked_up', 'delivering', 'delivered'];
  const currentIdx = steps.indexOf(status);
  return (
    <div className="flex items-center gap-4 w-full mt-6">
      {steps.map((step, i) => (
        <div key={step} className="flex flex-col items-center flex-1">
          <div className="flex items-center w-full">
              <div className={`w-4 h-4 rounded-full transition-all duration-700 ${i <= currentIdx ? 'bg-[#ff2d2d] shadow-[0_0_15px_rgba(255,45,45,0.8)]' : 'bg-white/10'}`} />
              {i < steps.length - 1 && <div className={`h-[2px] flex-1 mx-2 ${i < currentIdx ? 'bg-[#ff2d2d]' : 'bg-white/10'}`} />}
          </div>
          <span className={`text-[8px] font-black uppercase tracking-widest mt-3 ${i <= currentIdx ? 'text-white' : 'text-white/20'}`}>{step.replace('_', ' ')}</span>
        </div>
      ))}
    </div>
  );
};

const RestaurantCard = ({ restaurant, onClick }: { restaurant: Restaurant; onClick: () => void }) => (
  <Card onClick={onClick} className="cursor-pointer group">
    <div className="relative h-64 overflow-hidden">
      <img src={restaurant.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={restaurant.name} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60" />
      <div className="absolute top-6 right-6">
        <Badge color="dark">
            <div className="flex items-center gap-1">
                <StarIcon className="text-[#ffc107] w-3 h-3" /> {restaurant.rating}
            </div>
        </Badge>
      </div>
      <div className="absolute bottom-6 left-6">
          <Badge color="primary">{restaurant.deliveryTime}</Badge>
      </div>
    </div>
    <div className="p-8">
      <h4 className="text-2xl font-black text-white tracking-tighter mb-2 group-hover:text-[#ff2d2d] transition-colors">{restaurant.name}</h4>
      <div className="flex justify-between items-center">
          <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{restaurant.cuisine}</p>
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#ff2d2d] group-hover:border-[#ff2d2d] transition-all">
              <PlusIcon className="w-4 h-4" />
          </div>
      </div>
    </div>
  </Card>
);

const LiveSupportPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [status, setStatus] = useState('disconnected');
  const [transcript, setTranscript] = useState<any[]>([]);
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
      <div className="glass-panel w-full max-w-[420px] h-[650px] rounded-[3rem] overflow-hidden flex flex-col pointer-events-auto shadow-2xl animate-reveal">
        <div className="p-8 bg-[#ff2d2d] text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`rounded-full p-3 bg-white/20 ${status === 'active' ? 'animate-pulse' : ''}`}>
                <HeadsetIcon className="w-6 h-6" />
            </div>
            <div>
              <h6 className="m-0 font-black text-xl tracking-tighter">AI Concierge</h6>
              <span className="text-[10px] opacity-75 font-black uppercase tracking-widest">{status === 'active' ? '● Encrypted Live' : 'Initializing...'}</span>
            </div>
          </div>
          <button className="text-white hover:scale-110 transition-transform" onClick={onClose}><XIcon /></button>
        </div>
        <div ref={scrollRef} className="flex-grow p-8 overflow-auto no-scrollbar flex flex-col gap-6">
          {transcript.length === 0 && (
            <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
              <SparklesIcon className="w-16 h-16 text-[#ff2d2d]" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Tell me what you're craving...</p>
            </div>
          )}
          {transcript.map((msg, i) => (
            <div key={i} className={`max-w-[85%] p-5 rounded-[2rem] text-sm font-bold ${msg.role === 'user' ? 'self-end bg-[#ff2d2d] text-white' : 'bg-white/5 text-white/80 border border-white/5'}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="p-8 border-t border-white/5">
          <div className="flex items-center gap-6">
             <div className="flex-grow">
                <div className="h-1 rounded-full overflow-hidden bg-white/5">
                   <div className={`h-full bg-[#ff2d2d] transition-all duration-300 ${status === 'active' ? 'w-full' : 'w-0'}`} />
                </div>
                <p className="text-[9px] m-0 mt-3 opacity-30 font-black uppercase tracking-widest">{status === 'active' ? 'Analyzing voice patterns...' : 'Connecting to Gemini Cloud...'}</p>
             </div>
             <div className={`rounded-full p-5 ${status === 'active' ? 'bg-[#ff2d2d] text-white shadow-[0_0_30px_rgba(255,45,45,0.4)]' : 'bg-white/10 text-white/20'}`}>
                <div className="w-8 h-8 flex items-center justify-center text-2xl">🎙️</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState('home');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  
  // Auth
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', password: '', name: '' });
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Admin / Mgmt
  const [mgmtRestaurant, setMgmtRestaurant] = useState<Restaurant | null>(null);
  const [mgmtItem, setMgmtItem] = useState<any | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'admin') setCurrentView('admin-dashboard');
    }
    const init = async () => {
      const [res, ord] = await Promise.all([db.getRestaurants(), db.getOrders()]);
      setRestaurants(res);
      setOrders(ord);
    };
    init();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      let user;
      if (isRegistering) {
        user = await db.register(authForm);
      } else {
        user = await db.login(authForm.username, authForm.password);
      }
      setCurrentUser(user);
      if (user.role === 'admin') setCurrentView('admin-dashboard');
      else setCurrentView('home');
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) + 40;
    const newOrder: any = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      items: cart,
      total,
      status: 'preparing',
      estimatedArrival: Date.now() + 1800000,
      timestamp: Date.now()
    };
    await db.saveOrder(newOrder);
    setCart([]);
    setOrders(await db.getOrders());
    setCurrentView('history');
  };

  // --- Admin Logic ---
  const adminStats = useMemo(() => {
    const revenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
    const activeOrders = orders.filter(o => o.status !== 'delivered').length;
    const data = orders.slice(0, 7).map((o, i) => ({ name: `O${i+1}`, value: o.total }));
    return { revenue, activeOrders, data };
  }, [orders]);

  if (!currentUser) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none scale-110">
        <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000" className="w-full h-full object-cover blur-sm" />
      </div>
      <div className="glass-panel w-full max-w-lg rounded-[4rem] p-16 shadow-2xl relative z-10 animate-reveal">
        <div className="text-center mb-16">
          <div className="bg-[#ff2d2d]/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 animate-soft-pulse">
            <SparklesIcon className="w-12 h-12 text-[#ff2d2d]" />
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter mb-4">FlavorDish</h2>
          <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em]">{isRegistering ? 'Join the Culinary Inner Circle' : 'Authentication Required'}</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-6">
          {isRegistering && (
            <input type="text" className="form-control w-full bg-white/5 border-white/5 rounded-3xl py-5 px-8 text-white focus:border-[#ff2d2d] outline-none" placeholder="FULL NAME" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} required />
          )}
          <input type="text" className="form-control w-full bg-white/5 border-white/5 rounded-3xl py-5 px-8 text-white focus:border-[#ff2d2d] outline-none" placeholder="USERNAME" value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} required />
          <input type="password" className="form-control w-full bg-white/5 border-white/5 rounded-3xl py-5 px-8 text-white focus:border-[#ff2d2d] outline-none" placeholder="PASSWORD" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} required />
          <button type="submit" disabled={isAuthLoading} className="btn-primary-flavor w-full mt-4">{isAuthLoading ? 'AUTHORIZING...' : (isRegistering ? 'INITIALIZE ACCOUNT' : 'SECURE SIGN IN')}</button>
        </form>
        <div className="mt-12 text-center">
          <button onClick={() => setIsRegistering(!isRegistering)} className="text-white/30 hover:text-[#ff2d2d] text-[10px] font-black uppercase tracking-widest transition-colors">{isRegistering ? 'Registered? Back to Access' : 'No credentials? Create access node'}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#ff2d2d]/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[1000] glass-panel border-0 border-b border-white/5 py-6">
        <div className="container mx-auto px-8 flex justify-between items-center">
          <div onClick={() => setCurrentView(currentUser.role === 'admin' ? 'admin-dashboard' : 'home')} className="flex items-center gap-4 cursor-pointer group">
            <div className="bg-[#ff2d2d] p-2 rounded-xl group-hover:rotate-12 transition-transform">
                <SparklesIcon className="text-white w-6 h-6" />
            </div>
            <span className="text-3xl font-black tracking-tighter">FlavorDish</span>
          </div>
          <div className="flex items-center gap-10 text-[11px] font-black uppercase tracking-widest">
            {currentUser.role === 'admin' ? (
              <>
                <button onClick={() => setCurrentView('admin-dashboard')} className={currentView === 'admin-dashboard' ? 'text-[#ff2d2d]' : 'text-white/40 hover:text-white transition-colors'}>Status</button>
                <button onClick={() => setCurrentView('admin-orders')} className={currentView === 'admin-orders' ? 'text-[#ff2d2d]' : 'text-white/40 hover:text-white transition-colors'}>Fleet</button>
                <button onClick={() => setCurrentView('admin-menu')} className={currentView === 'admin-menu' ? 'text-[#ff2d2d]' : 'text-white/40 hover:text-white transition-colors'}>Catalogue</button>
              </>
            ) : (
              <>
                <button onClick={() => setCurrentView('home')} className={currentView === 'home' ? 'text-[#ff2d2d]' : 'text-white/40 hover:text-white transition-colors'}>Explore</button>
                <button onClick={() => setCurrentView('history')} className={currentView === 'history' ? 'text-[#ff2d2d]' : 'text-white/40 hover:text-white transition-colors'}>Vault</button>
                <div onClick={() => setCurrentView('cart')} className="relative cursor-pointer hover:scale-110 transition-transform">
                   <CartIcon className="w-6 h-6 text-white" />
                   {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-[#ff2d2d] w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-[#050505]">{cart.length}</span>}
                </div>
              </>
            )}
            <button onClick={() => { db.logout(); setCurrentUser(null); }} className="px-6 py-2.5 rounded-full border border-white/10 hover:bg-[#ff2d2d] hover:border-[#ff2d2d] transition-all">Sign Out</button>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-24 container mx-auto px-8">
        {/* --- Customer Views --- */}
        {currentView === 'home' && (
          <div className="animate-reveal">
            <div className="relative h-[450px] rounded-[4rem] overflow-hidden mb-20 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
              <img src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2000" className="w-full h-full object-cover opacity-60 scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent flex flex-col items-center justify-center text-center px-8">
                <Badge color="primary">Premium Amdavadi Experience</Badge>
                <h1 className="text-7xl font-black tracking-tighter mt-8 mb-4">Taste the <span className="text-[#ff2d2d]">Extraordinary.</span></h1>
                <p className="text-white/50 font-bold uppercase tracking-[0.4em] text-xs">Curated Selection • Express Intelligence • Gourmet Quality</p>
                
                <div className="w-full max-w-2xl mt-12 relative">
                    <input type="text" className="w-full glass-panel py-6 px-10 rounded-full border-0 focus:ring-2 focus:ring-[#ff2d2d] outline-none text-white text-lg font-bold" placeholder="SEARCH CUISINES OR RESTAURANTS..." />
                    <button className="absolute right-3 top-3 bottom-3 px-8 bg-[#ff2d2d] rounded-full font-black text-xs tracking-widest uppercase hover:scale-105 transition-transform">Find</button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-10">
                <div className="h-[2px] w-12 bg-[#ff2d2d]" />
                <h2 className="text-3xl font-black tracking-tighter">Elite Partnerships</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {restaurants.map(res => (
                <RestaurantCard key={res.id} restaurant={res} onClick={() => { setMgmtRestaurant(res); setCurrentView('restaurant-detail'); }} />
              ))}
            </div>
          </div>
        )}

        {currentView === 'restaurant-detail' && mgmtRestaurant && (
          <div className="animate-reveal">
            <div className="flex justify-between items-end mb-16 border-b border-white/5 pb-12">
               <div>
                 <div className="flex items-center gap-4 mb-4">
                     <Badge color="primary">{mgmtRestaurant.cuisine}</Badge>
                     <Badge color="gold">TOP RATED</Badge>
                 </div>
                 <h1 className="text-7xl font-black tracking-tighter text-white">{mgmtRestaurant.name}</h1>
               </div>
               <button onClick={() => setCurrentView('home')} className="px-10 py-4 glass-button rounded-full font-black text-xs uppercase tracking-widest">Exit to Fleet</button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {mgmtRestaurant.menu.map(item => (
                <div key={item.id} className="bg-[#121212] rounded-[3rem] p-8 flex items-center gap-8 border border-white/5 group hover:border-[#ff2d2d]/30 transition-all shadow-xl">
                  <div className="w-40 h-40 rounded-[2rem] overflow-hidden flex-shrink-0 relative">
                    <img src={item.image} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-4 left-4 font-black text-xl">₹{item.price}</span>
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      <h6 className="text-2xl font-black text-white tracking-tighter">{item.name}</h6>
                    </div>
                    <p className="text-sm text-white/40 mb-8 leading-relaxed font-medium">{item.description}</p>
                    <button onClick={() => {
                      setCart(prev => {
                        const existing = prev.find(i => i.id === item.id);
                        if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
                        return [...prev, { ...item, quantity: 1, restaurantName: mgmtRestaurant.name }];
                      });
                    }} className="px-6 py-2.5 rounded-full border border-[#ff2d2d] text-[#ff2d2d] font-black text-[10px] uppercase tracking-widest hover:bg-[#ff2d2d] hover:text-white transition-all">Enlist to Basket</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'cart' && (
          <div className="animate-reveal max-w-5xl mx-auto">
            <div className="bg-[#121212] rounded-[4rem] p-16 border border-white/5 shadow-2xl">
              <div className="flex items-center gap-6 mb-16">
                  <CartIcon className="w-12 h-12 text-[#ff2d2d]" />
                  <h2 className="text-5xl font-black tracking-tighter">Acquisition Basket</h2>
              </div>
              
              {cart.length === 0 ? (
                <div className="text-center py-32 opacity-20">
                   <PackageIcon className="w-24 h-24 mx-auto mb-8" />
                   <p className="font-black uppercase tracking-[0.5em] text-sm">Target inventory is empty</p>
                </div>
              ) : (
                <div className="space-y-10">
                  <div className="max-h-[500px] overflow-auto pr-8 no-scrollbar">
                    {cart.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-8 border-b border-white/5">
                        <div className="flex items-center gap-8">
                          <img src={item.image} className="w-24 h-24 rounded-[1.5rem] object-cover border border-white/10" />
                          <div>
                            <p className="text-2xl font-black text-white tracking-tighter">{item.name}</p>
                            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-2">{item.restaurantName} • QTY: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-black text-[#ff2d2d] tracking-tighter">₹{item.price * item.quantity}</span>
                            <button onClick={() => setCart(cart.filter((_, idx) => idx !== i))} className="block text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-red-500 mt-2 ml-auto">Discard</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-12 mt-12 border-t border-white/5 flex justify-between items-end">
                    <div>
                        <p className="text-white/20 font-black uppercase tracking-widest text-[10px] mb-2">Total Logistics & Items</p>
                        <span className="text-6xl font-black text-white tracking-tighter">₹{cart.reduce((a, b) => a + (b.price * b.quantity), 40)}</span>
                    </div>
                    <button onClick={handlePlaceOrder} className="btn-primary-flavor h-20 px-16 text-xl">EXECUTE PROCUREMENT</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'history' && (
          <div className="animate-reveal space-y-12 max-w-4xl mx-auto">
            <h2 className="text-5xl font-black tracking-tighter">Order Vault</h2>
            {orders.map(o => (
              <div key={o.id} className="bg-[#121212] rounded-[3rem] p-10 border border-white/5 group">
                <div className="flex justify-between items-start mb-10">
                  <div className="flex gap-6 items-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                        <PackageIcon className="w-8 h-8 text-white/50" />
                    </div>
                    <div>
                        <span className="text-[#ff2d2d] font-black text-[10px] uppercase tracking-widest">NODESPEC-#{o.id}</span>
                        <h5 className="text-2xl font-black text-white mt-1 tracking-tighter">{o.items?.[0]?.restaurantName || 'Gourmet Order'}</h5>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-white tracking-tighter">₹{o.total}</p>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-2">{new Date(o.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-4">Transmission Status</p>
                    <StatusStepper status={o.status} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- Admin Command Center --- */}
        {currentView === 'admin-dashboard' && (
          <div className="animate-reveal space-y-16">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <Card className="p-10 text-center" hover={false}>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Aggregate Revenue</p>
                   <h2 className="text-6xl font-black text-white tracking-tighter">₹{adminStats.revenue}</h2>
                   <div className="mt-6 inline-block">
                       <Badge color="primary">+12.4% PERFORMANCE</Badge>
                   </div>
                </Card>
                <Card className="p-10 text-center border-[#ff2d2d]/20" hover={false}>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Active Fleet Cycles</p>
                   <h2 className="text-6xl font-black text-[#ff2d2d] tracking-tighter">{adminStats.activeOrders}</h2>
                   <div className="mt-6 inline-block">
                       <Badge color="dark">HIGH LOAD</Badge>
                   </div>
                </Card>
                <Card className="p-10 text-center" hover={false}>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Partner Nodes</p>
                   <h2 className="text-6xl font-black text-white tracking-tighter">{restaurants.length}</h2>
                   <div className="mt-6 inline-block">
                       <Badge color="gold">VERIFIED</Badge>
                   </div>
                </Card>
             </div>
             
             <Card className="p-12 h-[500px]" hover={false}>
                <h4 className="text-3xl font-black mb-12 tracking-tighter">Revenue Trajectory</h4>
                <ResponsiveContainer width="100%" height="80%">
                   <AreaChart data={adminStats.data}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ff2d2d" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#ff2d2d" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="value" stroke="#ff2d2d" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
                   </AreaChart>
                </ResponsiveContainer>
             </Card>
          </div>
        )}

        {currentView === 'admin-orders' && (
          <div className="animate-reveal glass-panel rounded-[4rem] p-12 border border-white/5">
             <div className="flex items-center gap-6 mb-12">
                 <PackageIcon className="w-10 h-10 text-[#ff2d2d]" />
                 <h4 className="text-4xl font-black tracking-tighter">Fleet Logistics</h4>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="border-b border-white/5">
                      <tr className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                         <th className="py-6 px-6">NODE ID</th>
                         <th className="py-6 px-6">STATUS MATRIX</th>
                         <th className="py-6 px-6 text-right">PROTOCOL UPDATE</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {orders.map(o => (
                        <tr key={o.id} className="hover:bg-white/[0.02] transition-all group">
                           <td className="py-8 px-6 font-black text-[#ff2d2d] text-lg tracking-tighter">#{o.id}</td>
                           <td className="py-8 px-6">
                              <Badge color={o.status === 'delivered' ? 'gold' : 'primary'}>{o.status}</Badge>
                           </td>
                           <td className="py-8 px-6 text-right">
                              <select 
                                value={o.status} 
                                onChange={(e) => db.updateOrderStatus(o.id, e.target.value as any).then(setOrders)}
                                className="bg-[#121212] border border-white/10 rounded-2xl px-6 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#ff2d2d] transition-colors"
                              >
                                {['preparing', 'picked_up', 'delivering', 'delivered'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                              </select>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {currentView === 'admin-menu' && (
          <div className="animate-reveal space-y-16">
            <div className="flex justify-between items-center">
               <h4 className="text-4xl font-black tracking-tighter">Catalogue Matrix</h4>
               <button onClick={() => { setMgmtRestaurant({ name: '', cuisine: '', image: '', rating: 4.5, deliveryTime: '30 min', deliveryFee: 40, id: '', menu: [] }); setCurrentView('admin-rest-edit'); }} className="btn-primary-flavor flex items-center gap-3"><PlusIcon className="w-4 h-4" /> New Partner Node</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
               {restaurants.map(res => (
                 <Card key={res.id} className="p-8" hover={true}>
                    <div className="flex items-center gap-6 mb-10">
                       <img src={res.image} className="w-20 h-20 rounded-[1.5rem] object-cover border border-white/10" />
                       <div>
                          <h6 className="font-black text-2xl text-white mb-1 tracking-tighter leading-none">{res.name}</h6>
                          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{res.cuisine}</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={() => { setMgmtRestaurant(res); setCurrentView('admin-menu-deep'); }} className="glass-button py-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest">Menu Config</button>
                       <button onClick={() => { setMgmtRestaurant(res); setCurrentView('admin-rest-edit'); }} className="glass-button py-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest">Base Update</button>
                    </div>
                 </Card>
               ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Voice Support Overlay */}
      <button onClick={() => setIsSupportOpen(true)} className="fixed bottom-12 right-12 w-24 h-24 bg-[#ff2d2d] rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,45,45,0.4)] z-[1000] border-8 border-[#050505] hover:scale-110 active:scale-95 transition-all duration-500 group overflow-hidden">
         <SparklesIcon className="w-10 h-10 text-white animate-soft-pulse group-hover:rotate-12" />
         <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Live Support Panel */}
      <LiveSupportPanel isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
      
      {/* Footer Branding */}
      <footer className="py-12 border-t border-white/5 opacity-20 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.8em]">FlavorDish Neural Network • 2025</p>
      </footer>
    </div>
  );
};

export default App;
