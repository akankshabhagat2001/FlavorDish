
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { StarIcon, CartIcon, ClockIcon, SparklesIcon, TagIcon, RefreshIcon, HeartIcon } from './components/Icons';
import { db } from './services/databaseService';

// --- Types ---
import { Restaurant, Order, MenuItem } from './types';

// --- Additional Icons ---
const StoreIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
);
const BikeIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const MailIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
);
const PhoneIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
);
const MapPinIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
const ChevronRight = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
);

const GlassCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-[2rem] p-6 shadow-xl transition-all duration-500 hover:shadow-2xl ${className} ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}>
    {children}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: 'red' | 'gold' | 'gray' }> = ({ children, color = 'red' }) => {
  const styles = {
    red: "bg-[#ff2d2d] text-white",
    gold: "bg-[#ffc107] text-black",
    gray: "bg-gray-100 text-gray-600"
  };
  return <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${styles[color]}`}>{children}</span>;
};

const App = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState('home'); 
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [authPortal, setAuthPortal] = useState<'user' | 'partner' | 'fleet'>('user');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', password: '', phone: '', otp: '', name: '', email: '' });
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [partnerInvites, setPartnerInvites] = useState<any[]>([]);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'admin') setCurrentView('partner-dashboard');
    }
    db.getRestaurants().then(setRestaurants);
    db.getOrders().then(setOrders);
    db.getPartnerInvites().then(setPartnerInvites);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      if (isRegistering && authPortal === 'user') {
        const user = await db.register({ username: authForm.username, password: authForm.password, name: authForm.name, email: authForm.email });
        setCurrentUser(user);
        setCurrentView('home');
      } else if (authPortal === 'partner') {
        if (!otpSent) {
          setOtpSent(true);
          alert('Demo SMS: Your OTP is 1234');
        } else {
          const user = await db.loginWithPhone(authForm.phone, authForm.otp);
          setCurrentUser(user);
          setCurrentView('partner-dashboard');
        }
      } else {
        const user = await db.login(authForm.username, authForm.password);
        setCurrentUser(user);
        setCurrentView(user.role === 'admin' ? 'partner-dashboard' : 'home');
      }
    } catch (err: any) {
      alert(err.message || 'Authentication failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!authForm.email || !authForm.name) return alert('Enter email and restaurant name');
    await db.sendPartnerInvite(authForm.email, authForm.name);
    setPartnerInvites(await db.getPartnerInvites());
    alert('Email automatically dispatched to partner.');
  };

  const HomeView = () => (
    <div className="animate-reveal">
      <section className="relative h-[600px] flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000" className="w-full h-full object-cover brightness-[0.4] scale-110" alt="Hero" />
        </div>
        <div className="relative z-10 w-full max-w-5xl px-8">
          <h1 className="text-9xl font-black text-white italic tracking-tighter mb-8 animate-reveal">FLAVORDISH.</h1>
          <p className="text-white text-3xl font-bold mb-16 opacity-90">Ahmedabad's Smartest Food Network</p>
          <div className="bg-white rounded-2xl flex items-center p-2 shadow-2xl w-full max-w-3xl mx-auto">
            <div className="flex items-center gap-3 px-6 py-4 border-r border-gray-100 w-1/3">
              <MapPinIcon className="text-[#ff2d2d]" />
              <input type="text" className="bg-transparent text-black font-semibold outline-none w-full" defaultValue="Ahmedabad" />
            </div>
            <div className="flex items-center gap-4 px-6 py-4 w-2/3">
              <input type="text" className="bg-transparent text-black font-semibold outline-none w-full" placeholder="Search for restaurant, cuisine or a dish" />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-8 py-24">
        <h2 className="text-5xl font-black text-white tracking-tighter mb-12">Top picks in Ahmedabad</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {restaurants.map(res => (
            <GlassCard key={res.id} onClick={() => { setCurrentView('restaurant'); }} className="p-0 overflow-hidden group border-none">
              <div className="h-72 overflow-hidden relative">
                <img src={res.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={res.name} />
                <div className="absolute top-6 right-6"><Badge color="gold">{res.rating} ★</Badge></div>
              </div>
              <div className="p-8">
                <h4 className="text-2xl font-black text-black tracking-tighter mb-1">{res.name}</h4>
                <p className="text-sm text-gray-500 font-bold mb-6">{res.cuisine}</p>
                <div className="pt-6 border-t border-gray-50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span>{res.deliveryTime}</span>
                  <ChevronRight />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );

  const LoginPortal = () => (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <div className="w-full max-w-6xl z-10 animate-reveal">
        <div className="text-center mb-16">
          <h2 className="text-6xl font-black text-[#ff2d2d] tracking-tighter mb-2 italic">FLAVORDISH.</h2>
          <p className="text-white/40 text-xs font-black uppercase tracking-[0.5em]">Authentication Node</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            { id: 'user', label: 'Customer', icon: <CartIcon /> },
            { id: 'partner', label: 'Partner', icon: <StoreIcon /> },
            { id: 'fleet', label: 'Fleet', icon: <BikeIcon /> }
          ].map(p => (
            <button 
              key={p.id}
              onClick={() => { setAuthPortal(p.id as any); setOtpSent(false); setIsRegistering(false); }}
              className={`bg-white p-12 rounded-[3rem] transition-all duration-500 flex flex-col items-center gap-6 ${authPortal === p.id ? 'ring-4 ring-[#ff2d2d] shadow-2xl scale-105' : 'opacity-40 hover:opacity-100'}`}
            >
              <div className={`p-6 rounded-[2rem] ${authPortal === p.id ? 'bg-[#ff2d2d] text-white' : 'bg-gray-100 text-black'}`}>{p.icon}</div>
              <h3 className="text-2xl font-black text-black tracking-tighter uppercase">{p.label}</h3>
            </button>
          ))}
        </div>

        <div className="max-w-xl mx-auto">
          <form onSubmit={handleAuth} className="space-y-6 bg-white p-12 rounded-[3rem] shadow-2xl">
            <h4 className="text-center text-black font-black uppercase tracking-widest text-[10px] mb-8">
              {isRegistering ? 'Create Account' : `Login as ${authPortal}`}
            </h4>
            
            <div className="space-y-4">
              {authPortal === 'partner' ? (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Phone Number</p>
                    <div className="flex gap-2">
                       <span className="bg-gray-50 border border-gray-100 rounded-2xl p-5 font-bold">+91</span>
                       <input type="tel" className="flex-grow bg-gray-50 border border-gray-100 rounded-2xl py-5 px-8 outline-none text-[#ff2d2d] text-xl font-bold" placeholder="9876543210" value={authForm.phone} onChange={e => setAuthForm({ ...authForm, phone: e.target.value })} required disabled={otpSent} />
                    </div>
                  </div>
                  {otpSent && (
                    <div className="space-y-1 animate-reveal">
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Enter OTP</p>
                      <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 px-8 outline-none text-[#ff2d2d] text-3xl font-black tracking-[1em] text-center" maxLength={4} value={authForm.otp} onChange={e => setAuthForm({ ...authForm, otp: e.target.value })} required />
                    </div>
                  )}
                  <button type="submit" disabled={isAuthLoading} className="w-full bg-black text-white py-6 rounded-2xl font-black text-xl uppercase tracking-widest hover:bg-[#ff2d2d] transition-all shadow-xl">
                    {isAuthLoading ? 'Processing...' : otpSent ? 'Login' : 'Send SMS OTP'}
                  </button>
                </>
              ) : (
                <>
                  {isRegistering && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Full Name</p>
                      <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 px-8 outline-none text-[#ff2d2d] text-lg font-bold" placeholder="Amdavadi Guest" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} required />
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Username</p>
                    <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 px-8 outline-none text-[#ff2d2d] text-lg font-bold" value={authForm.username} onChange={e => setAuthForm({ ...authForm, username: e.target.value })} required />
                  </div>
                  {isRegistering && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Email Address</p>
                      <input type="email" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 px-8 outline-none text-[#ff2d2d] text-lg font-bold" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} required />
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-black/30 ml-4">Password</p>
                    <input type="password" className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 px-8 outline-none text-[#ff2d2d] text-lg font-bold" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} required />
                  </div>
                  <button type="submit" disabled={isAuthLoading} className="w-full bg-black text-white py-6 rounded-2xl font-black text-xl uppercase tracking-widest hover:bg-[#ff2d2d] transition-all shadow-xl">
                    {isAuthLoading ? 'Connecting...' : isRegistering ? 'Register' : 'Connect'}
                  </button>
                </>
              )}
            </div>
          </form>
          <div className="text-center mt-8">
            <button onClick={() => { setIsRegistering(!isRegistering); setOtpSent(false); }} className="text-white/60 hover:text-white font-black uppercase text-[10px] tracking-widest mr-8">
              {isRegistering ? 'Back to Login' : 'Register via Online Form'}
            </button>
            <button onClick={() => setCurrentView('home')} className="text-white/40 hover:text-white font-black uppercase text-[10px] tracking-widest">Exit</button>
          </div>
        </div>
      </div>
    </div>
  );

  const AdminPanel = () => (
    <div className="min-h-screen bg-[#050505] p-12">
      <div className="flex justify-between items-end mb-20">
        <h2 className="text-7xl font-black text-white tracking-tighter italic">ADMIN<br/><span className="text-[#ff2d2d]">COMMAND.</span></h2>
        <div className="text-right"><Badge color="gold">System Master</Badge></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <GlassCard className="!bg-[#111] !text-white border-gray-800">
           <h4 className="text-2xl font-black mb-6 uppercase tracking-widest flex items-center gap-3"><MailIcon className="text-[#ff2d2d]" /> Auto-Onboarding (Email)</h4>
           <div className="space-y-4">
              <input type="text" className="w-full bg-black border border-gray-800 rounded-xl py-4 px-6 outline-none text-[#ff2d2d]" placeholder="Restaurant Name" onChange={e => setAuthForm({...authForm, name: e.target.value})} />
              <input type="email" className="w-full bg-black border border-gray-100 rounded-xl py-4 px-6 outline-none text-[#ff2d2d]" placeholder="Partner Email" onChange={e => setAuthForm({...authForm, email: e.target.value})} />
              <button onClick={sendInvite} className="bg-[#ff2d2d] text-white w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest">Dispatch Welcome Pack</button>
           </div>
           <div className="mt-8 pt-8 border-t border-gray-800">
              <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Recent Dispatches</h5>
              {partnerInvites.map(inv => (
                <div key={inv.id} className="flex justify-between text-sm mb-2 opacity-80">
                   <span>{inv.restaurantName} ({inv.email})</span>
                   <span className="text-[#ff2d2d]">{inv.status}</span>
                </div>
              ))}
           </div>
        </GlassCard>

        <GlassCard className="!bg-[#111] !text-white border-gray-800">
           <h4 className="text-2xl font-black mb-6 uppercase tracking-widest">Logistics Feed</h4>
           <div className="space-y-4">
              {orders.map(o => (
                <div key={o.id} className="bg-black/50 p-6 rounded-2xl flex justify-between items-center border border-gray-800">
                   <div>
                      <h6 className="font-black text-white">{o.id}</h6>
                      <p className="text-xs text-gray-500">{o.status}</p>
                   </div>
                   <button onClick={() => db.updateOrderStatus(o.id, 'delivered').then(() => db.getOrders().then(setOrders))} className="text-[10px] font-black text-[#ff2d2d] border border-[#ff2d2d]/20 px-4 py-2 rounded-lg">Finalize</button>
                </div>
              ))}
           </div>
        </GlassCard>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505]">
      <nav className="fixed top-0 left-0 right-0 z-[1000] bg-black/80 backdrop-blur-md py-6 border-b border-white/5">
        <div className="container mx-auto px-8 flex justify-between items-center">
          <div onClick={() => setCurrentView('home')} className="flex items-center gap-2 cursor-pointer"><SparklesIcon className="text-[#ff2d2d]"/><span className="text-2xl font-black text-white italic">FLAVORDISH.</span></div>
          <div className="flex items-center gap-10 text-[10px] font-black uppercase text-white/60">
            {currentUser ? (
              <div className="flex items-center gap-6">
                 <span>Welcome, {currentUser.name}</span>
                 <button onClick={() => { db.logout(); setCurrentUser(null); setCurrentView('home'); }} className="text-[#ff2d2d] border border-[#ff2d2d]/20 px-4 py-2 rounded-full">Disconnect</button>
              </div>
            ) : (
              <button onClick={() => setCurrentView('login')} className="bg-[#ff2d2d] text-white px-8 py-3 rounded-full hover:scale-105 transition-all">Portal Access</button>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-24">
        {currentView === 'home' && <HomeView />}
        {currentView === 'login' && <LoginPortal />}
        {currentView === 'partner-dashboard' && <AdminPanel />}
      </div>
    </div>
  );
};

export default App;
