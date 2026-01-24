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

// --- Components ---

const StatusStepper = ({ status }: { status: string }) => {
  const steps = ['preparing', 'picked_up', 'delivering', 'delivered'];
  const currentIdx = steps.indexOf(status);
  return (
    <div className="flex items-center gap-2 w-full mt-4">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className={`w-3 h-3 rounded-full transition-all duration-500 ${i <= currentIdx ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-gray-800'}`} />
          {i < steps.length - 1 && <div className={`h-0.5 flex-1 mx-1 ${i < currentIdx ? 'bg-red-500/50' : 'bg-gray-800'}`} />}
        </div>
      ))}
    </div>
  );
};

const RestaurantCard = ({ restaurant, onClick }: { restaurant: Restaurant; onClick: () => void }) => (
  <div onClick={onClick} className="group cursor-pointer bg-[#1a1a1a] rounded-[2rem] overflow-hidden border border-gray-800 hover:border-red-500/40 transition-all duration-500 shadow-xl">
    <div className="relative h-48 overflow-hidden">
      <img src={restaurant.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={restaurant.name} />
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 text-xs font-black">
        <StarIcon className="text-yellow-400 w-3 h-3" /> {restaurant.rating}
      </div>
    </div>
    <div className="p-6">
      <h4 className="text-xl font-black text-white tracking-tighter mb-1">{restaurant.name}</h4>
      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{restaurant.cuisine}</p>
    </div>
  </div>
);

// --- Sub-components ---

// Fix: LiveSupportPanel component added to support the AI voice support feature.
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
    <div className="fixed bottom-0 right-0 p-4 flex justify-end pointer-events-none" style={{ zIndex: 2000 }}>
      <div className={`card border-0 rounded-[2.5rem] overflow-hidden flex flex-col pointer-events-auto shadow-2xl bg-[#1a1a1a] text-white border border-gray-800`} style={{ width: '100%', maxWidth: '400px', height: '600px' }}>
        <div className="p-4 bg-red-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 bg-white/20 ${status === 'active' ? 'animate-pulse' : ''}`}><HeadsetIcon className="w-5 h-5" /></div>
            <div>
              <h6 className="m-0 font-black tracking-tighter">Concierge Live</h6>
              <span className="text-[10px] opacity-75 font-bold uppercase">{status === 'active' ? '● Live with Gemini' : 'Connecting...'}</span>
            </div>
          </div>
          <button className="text-white p-0 border-0 shadow-none bg-transparent" onClick={onClose}><XIcon /></button>
        </div>
        <div ref={scrollRef} className="flex-grow p-4 overflow-auto no-scrollbar flex flex-col gap-3">
          {transcript.length === 0 && (
            <div className="text-center py-10 opacity-50 flex flex-col items-center gap-3">
              <SparklesIcon className="w-12 h-12 text-red-600" />
              <p className="text-xs font-bold uppercase tracking-widest">How can I help you today?</p>
            </div>
          )}
          {transcript.map((msg, i) => (
            <div key={i} className={`max-w-[85%] p-3 rounded-2xl text-xs font-bold ${msg.role === 'user' ? 'self-end bg-red-600 text-white' : 'bg-gray-800 text-white'}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
             <div className="flex-grow">
                <div className="h-1 rounded-full overflow-hidden bg-gray-800">
                   <div className={`h-full bg-red-600 transition-all duration-300 ${status === 'active' ? 'w-1/2' : 'w-0'}`} />
                </div>
                <p className="text-[9px] m-0 mt-2 opacity-50 font-bold uppercase">{status === 'active' ? 'Listening to your voice...' : 'Activating microphone...'}</p>
             </div>
             <div className={`rounded-full p-3 ${status === 'active' ? 'bg-red-600 text-white shadow-lg shadow-red-500/50' : 'bg-gray-500 text-white'}`}><div className="w-6 h-6 flex items-center justify-center">🎙️</div></div>
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
  
  // Fix: Added missing state for AI voice support.
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
    const revenue = orders.reduce((acc, o) => acc + o.total, 0);
    const activeOrders = orders.filter(o => o.status !== 'delivered').length;
    const data = orders.slice(0, 7).map((o, i) => ({ name: `Order ${i+1}`, value: o.total }));
    return { revenue, activeOrders, data };
  }, [orders]);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mgmtRestaurant) return;
    const updated = await db.saveMenuItem(mgmtRestaurant.id, mgmtItem);
    setRestaurants(updated);
    setMgmtRestaurant(updated.find(r => r.id === mgmtRestaurant.id) || null);
    setShowItemModal(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!mgmtRestaurant) return;
    const updated = await db.deleteMenuItem(mgmtRestaurant.id, itemId);
    setRestaurants(updated);
    setMgmtRestaurant(updated.find(r => r.id === mgmtRestaurant.id) || null);
  };

  if (!currentUser) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000" className="w-full h-full object-cover" />
      </div>
      <div className="w-full max-w-md bg-[#1a1a1a] rounded-[3rem] p-10 border border-gray-800 shadow-2xl relative z-10 animate-fadeIn">
        <div className="text-center mb-10">
          <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <SparklesIcon className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2">FlavorDish</h2>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">{isRegistering ? 'Start your culinary journey' : 'Welcome back, foodie'}</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <input type="text" className="w-full bg-[#111] border border-gray-800 rounded-2xl py-4 px-6 text-white focus:border-red-500 outline-none" placeholder="Full Name" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} required />
          )}
          <input type="text" className="w-full bg-[#111] border border-gray-800 rounded-2xl py-4 px-6 text-white focus:border-red-500 outline-none" placeholder="Username" value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} required />
          <input type="password" className="w-full bg-[#111] border border-gray-800 rounded-2xl py-4 px-6 text-white focus:border-red-500 outline-none" placeholder="Password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} required />
          <button type="submit" disabled={isAuthLoading} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl tracking-widest uppercase transition-all shadow-xl shadow-red-500/20">{isAuthLoading ? 'PROCESSING...' : (isRegistering ? 'JOIN THE CLUB' : 'SIGN IN')}</button>
        </form>
        <div className="mt-8 text-center">
          <button onClick={() => setIsRegistering(!isRegistering)} className="text-gray-400 hover:text-white text-xs font-black uppercase tracking-widest">{isRegistering ? 'Already a member? Sign In' : 'New here? Create Account'}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-red-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[1000] bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div onClick={() => setCurrentView(currentUser.role === 'admin' ? 'admin-dashboard' : 'home')} className="flex items-center gap-3 cursor-pointer">
            <SparklesIcon className="text-red-500 w-8 h-8" />
            <span className="text-2xl font-black tracking-tighter">FlavorDish</span>
          </div>
          <div className="flex items-center gap-8 text-xs font-black uppercase tracking-widest">
            {currentUser.role === 'admin' ? (
              <>
                <button onClick={() => setCurrentView('admin-dashboard')} className={currentView === 'admin-dashboard' ? 'text-red-500' : 'text-gray-400 hover:text-white'}>Dashboard</button>
                <button onClick={() => setCurrentView('admin-orders')} className={currentView === 'admin-orders' ? 'text-red-500' : 'text-gray-400 hover:text-white'}>Orders</button>
                <button onClick={() => setCurrentView('admin-menu')} className={currentView === 'admin-menu' ? 'text-red-500' : 'text-gray-400 hover:text-white'}>Restaurants</button>
              </>
            ) : (
              <>
                <button onClick={() => setCurrentView('home')} className={currentView === 'home' ? 'text-red-500' : 'text-gray-400 hover:text-white'}>Home</button>
                <button onClick={() => setCurrentView('history')} className={currentView === 'history' ? 'text-red-500' : 'text-gray-400 hover:text-white'}>My Orders</button>
                <div onClick={() => setCurrentView('cart')} className="relative cursor-pointer">
                   <CartIcon className="w-6 h-6" />
                   {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 w-4 h-4 rounded-full flex items-center justify-center text-[8px]">{cart.length}</span>}
                </div>
              </>
            )}
            <button onClick={() => { db.logout(); setCurrentUser(null); }} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white transition-all">LOGOUT</button>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-20 container mx-auto px-6">
        {/* --- Customer Views --- */}
        {currentView === 'home' && (
          <div className="animate-fadeIn">
            <div className="relative h-80 rounded-[3rem] overflow-hidden mb-12 shadow-2xl">
              <img src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2000" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/20 flex flex-col items-center justify-center text-center px-4">
                <h1 className="text-5xl font-black tracking-tighter mb-4">Crave. Select. Enjoy.</h1>
                <p className="text-gray-200 font-bold uppercase tracking-widest text-sm bg-black/40 px-6 py-2 rounded-full backdrop-blur-md">Premium Amdavadi Flavors, Delivered.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {restaurants.map(res => (
                <RestaurantCard key={res.id} restaurant={res} onClick={() => { setMgmtRestaurant(res); setCurrentView('restaurant-detail'); }} />
              ))}
            </div>
          </div>
        )}

        {currentView === 'restaurant-detail' && mgmtRestaurant && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-end mb-12 border-b border-gray-800 pb-8">
               <div>
                 <h1 className="text-5xl font-black tracking-tighter text-white">{mgmtRestaurant.name}</h1>
                 <p className="text-red-500 font-bold uppercase tracking-widest text-sm mt-2">{mgmtRestaurant.cuisine}</p>
               </div>
               <button onClick={() => setCurrentView('home')} className="px-6 py-3 bg-gray-900 rounded-full font-black text-xs uppercase tracking-widest">Back to Explore</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {mgmtRestaurant.menu.map(item => (
                <div key={item.id} className="bg-[#1a1a1a] rounded-3xl p-6 flex items-center gap-6 border border-gray-800 group hover:border-red-500/30 transition-all">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                    <img src={item.image} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" />
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h6 className="text-lg font-black text-white">{item.name}</h6>
                      <span className="text-red-500 font-black">₹{item.price}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-4 line-clamp-2">{item.description}</p>
                    <button onClick={() => {
                      setCart(prev => {
                        const existing = prev.find(i => i.id === item.id);
                        if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
                        return [...prev, { ...item, quantity: 1, restaurantName: mgmtRestaurant.name }];
                      });
                    }} className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:text-white transition-colors">Add to Cart +</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'cart' && (
          <div className="animate-fadeIn max-w-4xl mx-auto">
            <div className="bg-[#1a1a1a] rounded-[3rem] p-10 border border-gray-800 shadow-2xl">
              <h2 className="text-4xl font-black tracking-tighter mb-10">Your Basket</h2>
              {cart.length === 0 ? (
                <div className="text-center py-20 opacity-30">
                   <CartIcon className="w-20 h-20 mx-auto mb-6" />
                   <p className="font-black uppercase tracking-widest text-xs">Your basket is empty</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="max-h-96 overflow-auto pr-4 no-scrollbar">
                    {cart.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-4 border-b border-gray-800/50">
                        <div className="flex items-center gap-4">
                          <img src={item.image} className="w-16 h-16 rounded-xl object-cover" />
                          <div>
                            <p className="font-black text-white">{item.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-black">{item.restaurantName} x {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-black text-red-500">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-8 border-t border-gray-800 flex justify-between items-center h3">
                    <span className="font-black text-gray-400 uppercase tracking-widest text-sm">Grand Total</span>
                    <span className="text-3xl font-black text-white">₹{cart.reduce((a, b) => a + (b.price * b.quantity), 40)}</span>
                  </div>
                  <button onClick={handlePlaceOrder} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-[2rem] text-xl tracking-tighter transition-all mt-8">CONFIRM & PAY</button>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'history' && (
          <div className="animate-fadeIn space-y-8">
            <h2 className="text-4xl font-black tracking-tighter">Order History</h2>
            {orders.map(o => (
              <div key={o.id} className="bg-[#1a1a1a] rounded-[2.5rem] p-8 border border-gray-800">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-red-500 font-black text-xs uppercase tracking-widest">#{o.id}</span>
                    <h5 className="text-xl font-black text-white mt-1">{o.items?.[0]?.restaurantName || 'Order'}</h5>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-white">₹{o.total}</p>
                    <p className="text-xs text-gray-500">{new Date(o.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
                <StatusStepper status={o.status} />
                <div className="mt-8 pt-6 border-t border-gray-800/40 flex justify-between items-center">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Items: {o.items?.length}</p>
                   <button className="text-[10px] font-black uppercase tracking-widest text-red-500 border border-red-500/20 px-4 py-2 rounded-full hover:bg-red-500 hover:text-white transition-all">Support</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- Admin Views --- */}
        {currentView === 'admin-dashboard' && (
          <div className="animate-fadeIn space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-[#1a1a1a] p-8 rounded-[2rem] border border-gray-800 text-center">
                   <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Total Revenue</p>
                   <h2 className="text-4xl font-black text-white tracking-tighter">₹{adminStats.revenue}</h2>
                </div>
                <div className="bg-[#1a1a1a] p-8 rounded-[2rem] border border-gray-800 text-center">
                   <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Active Orders</p>
                   <h2 className="text-4xl font-black text-red-500 tracking-tighter">{adminStats.activeOrders}</h2>
                </div>
                <div className="bg-[#1a1a1a] p-8 rounded-[2rem] border border-gray-800 text-center">
                   <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Partners</p>
                   <h2 className="text-4xl font-black text-white tracking-tighter">{restaurants.length}</h2>
                </div>
             </div>
             
             <div className="bg-[#1a1a1a] p-10 rounded-[3rem] border border-gray-800 h-96">
                <h4 className="text-xl font-black mb-8 tracking-tighter">Revenue Analytics</h4>
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={adminStats.data}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }} />
                      <Area type="monotone" dataKey="value" stroke="#ef4444" fillOpacity={1} fill="url(#colorVal)" />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        )}

        {currentView === 'admin-orders' && (
          <div className="animate-fadeIn card border-0 rounded-[2.5rem] bg-[#1a1a1a] border border-gray-800 p-8">
             <h4 className="text-2xl font-black mb-8 tracking-tighter">Order Command</h4>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="border-b border-gray-800">
                      <tr className="text-xs font-black text-gray-500 uppercase tracking-widest">
                         <th className="py-4 px-6">ID</th>
                         <th className="py-4 px-6">Status</th>
                         <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-800">
                      {orders.map(o => (
                        <tr key={o.id} className="hover:bg-white/5 transition-all">
                           <td className="py-6 px-6 font-black text-red-500">#{o.id}</td>
                           <td className="py-6 px-6">
                              <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase rounded-full tracking-widest border border-yellow-500/20">{o.status}</span>
                           </td>
                           <td className="py-6 px-6 text-right">
                              <select 
                                value={o.status} 
                                onChange={(e) => db.updateOrderStatus(o.id, e.target.value).then(setOrders)}
                                className="bg-[#111] border border-gray-800 rounded-xl px-4 py-2 text-xs font-black uppercase outline-none focus:border-red-500"
                              >
                                {['preparing', 'picked_up', 'delivering', 'delivered'].map(s => <option key={s} value={s}>{s}</option>)}
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
          <div className="animate-fadeIn space-y-12">
            <div className="flex justify-between items-center">
               <h4 className="text-2xl font-black tracking-tighter">Menu Management</h4>
               <button onClick={() => { setMgmtRestaurant({ name: '', cuisine: '', image: '', rating: 4.5, deliveryTime: '30 min', deliveryFee: 40, id: '', menu: [] }); setCurrentView('admin-rest-edit'); }} className="bg-red-600 px-6 py-3 rounded-full text-xs font-black tracking-widest uppercase flex items-center gap-2"><PlusIcon /> New Partner</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {restaurants.map(res => (
                 <div key={res.id} className="bg-[#1a1a1a] rounded-[2rem] overflow-hidden border border-gray-800 p-6">
                    <div className="flex items-center gap-4 mb-6">
                       <img src={res.image} className="w-16 h-16 rounded-2xl object-cover" />
                       <div>
                          <h6 className="font-black text-lg text-white mb-1 leading-none">{res.name}</h6>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{res.cuisine}</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <button onClick={() => { setMgmtRestaurant(res); setCurrentView('admin-menu-deep'); }} className="bg-gray-800/50 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all">Manage Menu</button>
                       <button onClick={() => { setMgmtRestaurant(res); setCurrentView('admin-rest-edit'); }} className="bg-gray-800/50 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Edit Info</button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {currentView === 'admin-menu-deep' && mgmtRestaurant && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-10">
               <div>
                 <h2 className="text-4xl font-black tracking-tighter">{mgmtRestaurant.name}</h2>
                 <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Deep Menu Management</p>
               </div>
               <div className="flex gap-4">
                 <button onClick={() => { setMgmtItem({ name: '', description: '', price: 0, image: '', category: 'Main' }); setShowItemModal(true); }} className="bg-red-600 px-6 py-3 rounded-full text-xs font-black tracking-widest uppercase flex items-center gap-2"><PlusIcon /> Add Dish</button>
                 <button onClick={() => setCurrentView('admin-menu')} className="bg-gray-800 px-6 py-3 rounded-full text-xs font-black tracking-widest uppercase">Back</button>
               </div>
            </div>
            <div className="bg-[#1a1a1a] rounded-[3rem] border border-gray-800 p-8 overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="border-b border-gray-800">
                    <tr className="text-xs font-black text-gray-500 uppercase tracking-widest">
                       <th className="py-4 px-4">Dish</th>
                       <th className="py-4 px-4">Price</th>
                       <th className="py-4 px-4">Category</th>
                       <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-800">
                    {mgmtRestaurant.menu.map(item => (
                      <tr key={item.id} className="hover:bg-white/5 transition-all">
                        <td className="py-4 px-4">
                           <div className="flex items-center gap-4">
                              <img src={item.image} className="w-12 h-12 rounded-xl object-cover" />
                              <span className="font-black text-white">{item.name}</span>
                           </div>
                        </td>
                        <td className="py-4 px-4 font-black text-red-500">₹{item.price}</td>
                        <td className="py-4 px-4 text-xs font-bold uppercase text-gray-400">{item.category}</td>
                        <td className="py-4 px-4 text-right">
                           <div className="flex justify-end gap-2">
                              <button onClick={() => { setMgmtItem(item); setShowItemModal(true); }} className="p-2 bg-gray-800 rounded-lg hover:text-white transition-all"><EditIcon className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteItem(item.id)} className="p-2 bg-gray-800 rounded-lg hover:text-red-500 transition-all"><TrashIcon className="w-4 h-4" /></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}
      </div>

      {/* --- Modals --- */}
      {showItemModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
           <div className="bg-[#1a1a1a] w-full max-w-lg rounded-[2.5rem] p-10 border border-gray-800 shadow-2xl animate-fadeIn">
              <h3 className="text-2xl font-black mb-8 tracking-tighter">{mgmtItem?.id ? 'Edit Dish' : 'Add New Dish'}</h3>
              <form onSubmit={handleSaveItem} className="space-y-4">
                 <input type="text" className="w-full bg-[#111] border border-gray-800 rounded-2xl py-4 px-6 text-white" placeholder="Dish Name" value={mgmtItem?.name} onChange={e => setMgmtItem({...mgmtItem, name: e.target.value})} required />
                 <input type="number" className="w-full bg-[#111] border border-gray-800 rounded-2xl py-4 px-6 text-white" placeholder="Price (₹)" value={mgmtItem?.price} onChange={e => setMgmtItem({...mgmtItem, price: parseInt(e.target.value)})} required />
                 <input type="text" className="w-full bg-[#111] border border-gray-800 rounded-2xl py-4 px-6 text-white" placeholder="Image URL" value={mgmtItem?.image} onChange={e => setMgmtItem({...mgmtItem, image: e.target.value})} required />
                 <textarea className="w-full bg-[#111] border border-gray-800 rounded-2xl py-4 px-6 text-white" placeholder="Description" rows={3} value={mgmtItem?.description} onChange={e => setMgmtItem({...mgmtItem, description: e.target.value})} required />
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 bg-gray-800 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs">Cancel</button>
                    <button type="submit" className="flex-1 bg-red-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-red-500/20">Save Dish</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* AI Voice Support Overlay */}
      <button onClick={() => setIsSupportOpen(true)} className="fixed bottom-10 right-10 w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl z-[1000] border-4 border-black/50 hover:scale-110 transition-transform">
         <SparklesIcon className="w-8 h-8 text-white animate-pulse" />
      </button>

      {/* Live Support Panel */}
      <LiveSupportPanel isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
};

export default App;