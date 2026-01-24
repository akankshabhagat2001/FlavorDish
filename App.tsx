
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { StarIcon, CartIcon, ClockIcon, SparklesIcon, TagIcon, RefreshIcon, HeartIcon } from './components/Icons';
import { getNearbyFoodDiscovery, connectToLiveSupport } from './services/geminiService';
import { db } from './services/databaseService';

// --- Types ---
import { Restaurant, Order, MenuItem } from './types';

// --- UI Components ---

const MapPinIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
const ChevronRight = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
);
const StoreIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
);
const BikeIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);

const GlassCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-[2rem] p-6 shadow-xl transition-all duration-500 hover:shadow-2xl ${className} ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
  >
    {children}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: 'red' | 'gold' | 'gray' }> = ({ children, color = 'red' }) => {
  const styles = {
    red: "bg-[#ff2d2d] text-white",
    gold: "bg-[#ffc107] text-black",
    gray: "bg-gray-100 text-gray-600"
  };
  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${styles[color]}`}>
      {children}
    </span>
  );
};

const App = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState('home'); 
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [authPortal, setAuthPortal] = useState<'user' | 'partner' | 'fleet'>('user');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'admin') setCurrentView('partner-dashboard');
    }
    db.getRestaurants().then(setRestaurants);
    db.getOrders().then(setOrders);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      // Simplistic routing logic based on portal choice
      let targetUser = authForm.username;
      let targetPass = authForm.password;
      
      const user = await db.login(targetUser, targetPass);
      setCurrentUser({ ...user, portal: authPortal });
      
      if (authPortal === 'partner' || user.role === 'admin') {
        setCurrentView('partner-dashboard');
      } else if (authPortal === 'fleet') {
        setCurrentView('fleet-dashboard');
      } else {
        setCurrentView('home');
      }
    } catch (err) {
      alert('Login failed. Hint: user/pass, admin/admin');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const addToCart = (item: MenuItem, res: Restaurant) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1, restaurantId: res.id, restaurantName: res.name }];
    });
  };

  // --- Views ---

  const HomeView = () => (
    <div className="animate-reveal">
      {/* Cinematic Hero */}
      <section className="relative h-[650px] flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000" 
            className="w-full h-full object-cover brightness-[0.4] scale-110" 
            alt="Hero Background" 
          />
        </div>
        <div className="relative z-10 w-full max-w-5xl px-8">
          <h1 className="text-9xl font-black text-white italic tracking-tighter mb-8 animate-reveal">FLAVORDISH.</h1>
          <p className="text-white text-3xl font-bold mb-16 opacity-90 tracking-tight">Best food & drinks in Ahmedabad</p>
          
          <div className="bg-white rounded-2xl flex flex-col md:flex-row items-center p-2 shadow-2xl w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-3 px-6 py-4 border-b md:border-b-0 md:border-r border-gray-100 w-full md:w-1/3">
              <MapPinIcon className="text-[#ff2d2d]" />
              <input type="text" className="bg-transparent text-black font-semibold outline-none w-full" defaultValue="Ahmedabad" />
            </div>
            <div className="flex items-center gap-4 px-6 py-4 w-full md:w-2/3">
              <SearchIcon className="text-gray-400" />
              <input type="text" className="bg-transparent text-black font-semibold outline-none w-full" placeholder="Search for restaurant, cuisine or a dish" />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-8 py-24 space-y-32">
        {/* Collections */}
        <section>
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-5xl font-black text-white tracking-tighter">Collections</h2>
              <p className="text-white/60 text-lg mt-2 font-medium">Explore curated lists of top restaurants in Ahmedabad</p>
            </div>
            <button className="text-[#ff2d2d] font-black uppercase text-xs tracking-widest flex items-center gap-2 group">
              All collections <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Trending this Week", count: "12 Places", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800" },
              { title: "Authentic Gujarati", count: "24 Places", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800" },
              { title: "Nightlife & Bars", count: "18 Places", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800" },
              { title: "Sweet Delights", count: "15 Places", img: "https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=800" },
            ].map((col, i) => (
              <div key={i} className="relative h-[450px] rounded-3xl overflow-hidden group cursor-pointer shadow-2xl">
                <img src={col.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-75" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-8 left-8 text-white">
                  <h4 className="text-2xl font-black tracking-tighter mb-1">{col.title}</h4>
                  <p className="text-sm font-bold opacity-80 flex items-center gap-1">{col.count} <ChevronRight /></p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Localities */}
        <section>
          <h2 className="text-5xl font-black text-white tracking-tighter mb-12">Popular localities in Ahmedabad</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {["Bodakdev", "Satellite", "Prahlad Nagar", "Vastrapur", "Gurukul", "Thaltej", "Navrangpura", "C G Road", "Ambawadi"].map((loc, i) => (
              <GlassCard key={i} className="flex justify-between items-center group hover:border-[#ff2d2d] border border-transparent">
                <div>
                  <h5 className="text-xl font-black text-black tracking-tight">{loc}</h5>
                  <p className="text-sm text-gray-400 font-bold">352 places</p>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-black transition-colors" />
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Restaurants */}
        <section>
          <h2 className="text-5xl font-black text-white tracking-tighter mb-12">Top restaurants for you</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {restaurants.map(res => (
              <GlassCard 
                key={res.id} 
                onClick={() => { setSelectedRestaurant(res); setCurrentView('restaurant-detail'); }}
                className="p-0 overflow-hidden group border-none"
              >
                <div className="h-72 overflow-hidden relative">
                  <img src={res.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-6 right-6">
                    <Badge color="gold">{res.rating} ★</Badge>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-2xl font-black text-black tracking-tighter">{res.name}</h4>
                    <span className="text-xs font-black text-[#ff2d2d] bg-red-50 px-2 py-1 rounded">{res.deliveryTime}</span>
                  </div>
                  <p className="text-sm text-gray-500 font-bold mb-6">{res.cuisine}</p>
                  <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Secure Protocol</p>
                    <StarIcon className="text-[#ff2d2d]" />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const LoginPortal = () => (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 blur-[100px] pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#ff2d2d] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#ffc107] rounded-full animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-6xl z-10 animate-reveal">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-black text-[#ff2d2d] tracking-tighter mb-2 italic">FLAVORDISH.</h2>
          <p className="text-white/40 text-xs font-black uppercase tracking-[0.5em]">Global Food Logistics Grid</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Portals */}
          {[
            { id: 'user', label: 'Customer', icon: <CartIcon />, color: 'red' },
            { id: 'partner', label: 'Partner', icon: <StoreIcon />, color: 'red' },
            { id: 'fleet', label: 'Fleet', icon: <BikeIcon />, color: 'red' }
          ].map(p => (
            <button 
              key={p.id}
              onClick={() => setAuthPortal(p.id as any)}
              className={`bg-white p-12 rounded-[3rem] transition-all duration-500 flex flex-col items-center gap-6 group ${authPortal === p.id ? 'ring-4 ring-[#ff2d2d] shadow-2xl scale-105' : 'opacity-40 hover:opacity-100'}`}
            >
              <div className={`p-6 rounded-[2rem] ${authPortal === p.id ? 'bg-[#ff2d2d] text-white' : 'bg-gray-100 text-black'}`}>
                {p.icon}
              </div>
              <h3 className="text-2xl font-black text-black tracking-tighter uppercase">{p.label}</h3>
            </button>
          ))}
        </div>

        <div className="max-w-xl mx-auto">
          <form onSubmit={handleLogin} className="space-y-6 bg-white p-12 rounded-[3rem] shadow-2xl">
            <h4 className="text-center text-black font-black uppercase tracking-widest text-[10px] mb-8">Login to {authPortal} portal</h4>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Credential ID</p>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 px-8 outline-none text-[#ff2d2d] text-xl font-bold" 
                  placeholder={authPortal === 'partner' ? 'admin' : 'user'}
                  onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Passphrase</p>
                <input 
                  type="password" 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 px-8 outline-none text-[#ff2d2d] text-xl font-bold" 
                  placeholder="••••••••"
                  onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isAuthLoading} 
                className="w-full bg-black text-white py-6 rounded-2xl font-black text-xl uppercase tracking-widest hover:bg-[#ff2d2d] transition-all duration-300 shadow-xl"
              >
                {isAuthLoading ? 'Connecting...' : 'Initialize Link'}
              </button>
            </div>
          </form>
          <div className="text-center mt-8">
            <button onClick={() => setCurrentView('home')} className="text-white/40 hover:text-white transition-colors font-black uppercase tracking-widest text-[10px]">Back to Explorer</button>
          </div>
        </div>
      </div>
    </div>
  );

  const PartnerDashboard = () => (
    <div className="min-h-screen bg-[#050505] p-12">
      <div className="flex justify-between items-end mb-20">
        <h2 className="text-7xl font-black text-white tracking-tighter italic">PARTNER<br/><span className="text-[#ff2d2d]">DASHBOARD.</span></h2>
        <div className="text-right">
          <Badge color="gold">Verified Merchant</Badge>
          <p className="text-white/40 font-black uppercase tracking-widest text-[10px] mt-4">Node: {currentUser?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <GlassCard className="lg:col-span-2 h-[500px] flex flex-col justify-between p-12">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-2">Aggregate Revenue (Monthly)</p>
            <h3 className="text-7xl font-black text-[#ff2d2d]">₹{orders.reduce((a, b) => a + (b.total || 0), 0).toLocaleString()}</h3>
          </div>
          <div className="h-64 pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={orders.slice(0, 10).map((o, i) => ({ n: i, v: o.total }))}>
                <Area type="monotone" dataKey="v" stroke="#ff2d2d" strokeWidth={5} fill="#ff2d2d" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
        <div className="space-y-12">
          <GlassCard className="bg-[#ff2d2d] !text-white flex flex-col items-center justify-center text-center p-12 border-none">
            <RefreshIcon className="w-12 h-12 mb-4" />
            <h4 className="text-6xl font-black">{orders.length}</h4>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-2">Active Logistics</p>
          </GlassCard>
          <GlassCard className="flex flex-col items-center justify-center text-center p-12">
            <ClockIcon className="w-12 h-12 mb-4 text-[#ff2d2d]" />
            <h4 className="text-4xl font-black text-black">22m</h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">Avg. Response Time</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] font-['Inter']">
      {/* Dynamic Nav */}
      <nav className="fixed top-0 left-0 right-0 z-[1000] transition-all bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-8 py-6 flex justify-between items-center">
          <div onClick={() => setCurrentView('home')} className="flex items-center gap-2 cursor-pointer group">
            <SparklesIcon className="text-[#ff2d2d] group-hover:rotate-12 transition-transform" />
            <span className="text-3xl font-black text-white tracking-tighter italic">FLAVORDISH.</span>
          </div>

          <div className="flex items-center gap-10 text-[10px] font-black uppercase tracking-widest">
            {currentUser ? (
              <>
                <button onClick={() => setCurrentView('home')} className={currentView === 'home' ? 'text-[#ff2d2d]' : 'text-white/60 hover:text-white transition-colors'}>Explore</button>
                {currentUser.role === 'admin' && (
                  <button onClick={() => setCurrentView('partner-dashboard')} className={currentView === 'partner-dashboard' ? 'text-[#ff2d2d]' : 'text-white/60 hover:text-white transition-colors'}>Dashboard</button>
                )}
                <button onClick={() => setCurrentView('cart')} className="relative flex items-center gap-2 text-white/60 hover:text-[#ff2d2d]">
                  <CartIcon />
                  {cart.length > 0 && <span className="bg-[#ff2d2d] text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] animate-reveal">{cart.length}</span>}
                </button>
                <div className="flex items-center gap-4 pl-10 border-l border-white/10">
                  <span className="text-white">{currentUser.name}</span>
                  <button onClick={() => { db.logout(); setCurrentUser(null); setCurrentView('home'); }} className="text-[#ff2d2d] hover:underline">Exit</button>
                </div>
              </>
            ) : (
              <div className="flex gap-8 items-center">
                <button onClick={() => setCurrentView('login')} className="text-white/60 hover:text-white">Log in</button>
                <button onClick={() => setCurrentView('login')} className="bg-[#ff2d2d] text-white px-8 py-3 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-red-500/20">Sign up</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className={currentView === 'home' ? '' : 'pt-32 pb-20'}>
        {currentView === 'home' && <HomeView />}
        {currentView === 'login' && <LoginPortal />}
        {currentView === 'partner-dashboard' && <PartnerDashboard />}
        
        {currentView === 'restaurant-detail' && selectedRestaurant && (
          <div className="animate-reveal container mx-auto px-8">
            <div className="relative h-[450px] rounded-[4rem] overflow-hidden mb-16 shadow-2xl">
              <img src={selectedRestaurant.image} className="w-full h-full object-cover brightness-50" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-12 left-12">
                <Badge color="gold">{selectedRestaurant.rating} ★ Rating</Badge>
                <h1 className="text-8xl font-black text-white tracking-tighter mt-4">{selectedRestaurant.name}</h1>
                <p className="text-white/60 text-xl font-bold mt-2">{selectedRestaurant.cuisine} • Ahmedabad Central</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {selectedRestaurant.menu.map(item => (
                <GlassCard key={item.id} className="flex gap-8 p-8 border-none group">
                  <div className="w-48 h-48 rounded-[2.5rem] overflow-hidden flex-shrink-0 relative">
                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex flex-col justify-between py-2">
                    <div>
                      <h5 className="text-3xl font-black text-black tracking-tighter">{item.name}</h5>
                      <p className="text-gray-400 text-sm font-bold mt-2 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex justify-between items-center mt-6">
                      <span className="text-3xl font-black text-[#ff2d2d]">₹{item.price}</span>
                      <button 
                        onClick={() => addToCart(item, selectedRestaurant)}
                        className="bg-black text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#ff2d2d] transition-all duration-300 shadow-lg"
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="bg-white py-24 mt-32 border-t border-gray-100">
        <div className="container mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-20">
            <div className="max-w-md">
              <div className="flex items-center gap-3 mb-8">
                <SparklesIcon className="text-[#ff2d2d] w-10 h-10" />
                <span className="text-4xl font-black text-black tracking-tighter italic">FLAVORDISH.</span>
              </div>
              <p className="text-gray-400 font-bold leading-relaxed">The premier food discovery and delivery network for Ahmedabad. High-precision logistics meets gourmet curation.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-20">
              <div className="space-y-6">
                <h6 className="text-[10px] font-black uppercase tracking-widest text-black">Protocol</h6>
                <div className="flex flex-col gap-4 text-gray-400 text-sm font-bold">
                  <button className="text-left hover:text-[#ff2d2d]">About</button>
                  <button className="text-left hover:text-[#ff2d2d]">Network</button>
                  <button className="text-left hover:text-[#ff2d2d]">Partners</button>
                </div>
              </div>
              <div className="space-y-6">
                <h6 className="text-[10px] font-black uppercase tracking-widest text-black">Logistics</h6>
                <div className="flex flex-col gap-4 text-gray-400 text-sm font-bold">
                  <button className="text-left hover:text-[#ff2d2d]">Support</button>
                  <button className="text-left hover:text-[#ff2d2d]">Terms</button>
                  <button className="text-left hover:text-[#ff2d2d]">Privacy</button>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-widest text-gray-300">
            <p>© 2025 FlavorDish Platform • Obsidian Edition V3</p>
            <div className="flex gap-8">
              <button>Instagram</button>
              <button>Twitter</button>
              <button>GitHub</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
