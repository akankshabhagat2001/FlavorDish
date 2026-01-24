
import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip
} from 'recharts';
import { StarIcon, CartIcon, ClockIcon, SparklesIcon, TagIcon, RefreshIcon } from './components/Icons';
import { db } from './services/databaseService';

// --- Icons ---
const MapPinIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
const StoreIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
);
const BikeIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const ChevronRight = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
);

const Badge: React.FC<{ children: React.ReactNode; color?: 'red' | 'gold' | 'gray' }> = ({ children, color = 'red' }) => {
  const styles = {
    red: "bg-[#E23744] text-white",
    gold: "bg-[#FFB300] text-white",
    gray: "bg-gray-100 text-gray-500"
  };
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${styles[color]}`}>{children}</span>;
};

const App = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState('home'); 
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [authPortal, setAuthPortal] = useState<'user' | 'partner' | 'fleet'>('user');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', password: '', phone: '', otp: '', name: '', email: '' });
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'admin') setCurrentView('partner-dashboard');
    }
    db.getRestaurants().then(setRestaurants);
    db.getOrders().then(setOrders);
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

  const HomeView = () => (
    <div className="animate-up">
      {/* Search Header */}
      <section className="relative h-[480px] flex items-center justify-center overflow-hidden bg-[#1c1c1c]">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000" className="w-full h-full object-cover opacity-30" alt="Hero" />
        </div>
        <div className="relative z-10 w-full max-w-4xl px-8 text-center">
          <h1 className="text-7xl font-black text-white italic tracking-tighter mb-6">FLAVORDISH.</h1>
          <p className="text-white/80 text-2xl font-medium mb-10">Find the best food in Ahmedabad</p>
          <div className="bg-white rounded-xl flex flex-col md:flex-row items-center p-1.5 shadow-2xl">
            <div className="flex items-center gap-3 px-6 py-3 border-r border-gray-100 w-full md:w-1/3">
              <MapPinIcon className="text-[#E23744]" />
              <input type="text" className="bg-transparent text-gray-800 font-medium border-none p-0 w-full" defaultValue="Ahmedabad" />
            </div>
            <div className="flex items-center gap-4 px-6 py-3 w-full md:w-2/3">
              <input type="text" className="bg-transparent text-gray-800 font-medium border-none p-0 w-full" placeholder="Search for restaurant, cuisine or a dish" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16 space-y-20">
        <section>
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Popular Collections</h2>
            <button className="text-[#E23744] text-sm font-bold flex items-center gap-1">All collections <ChevronRight /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { title: "Trending this Week", count: "12 Places", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800" },
              { title: "Authentic Gujarati", count: "24 Places", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800" },
              { title: "Insta-worthy Spots", count: "18 Places", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800" },
              { title: "Late Night Cravings", count: "15 Places", img: "https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=800" },
            ].map((col, i) => (
              <div key={i} className="relative h-72 rounded-2xl overflow-hidden group cursor-pointer shadow-sm">
                <img src={col.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={col.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-5 left-5 text-white">
                  <h4 className="font-bold text-lg leading-tight">{col.title}</h4>
                  <p className="text-xs opacity-80 flex items-center gap-1 mt-1">{col.count} <ChevronRight /></p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Top Restaurants near you</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {restaurants.map(res => (
              <div key={res.id} onClick={() => setCurrentView('restaurant')} className="glass-card overflow-hidden group border-none">
                <div className="h-56 relative overflow-hidden">
                  <img src={res.image} className="w-full h-full object-cover" alt={res.name} />
                  <div className="absolute top-4 right-4"><Badge color="gold">{res.rating} ★</Badge></div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xl font-bold text-gray-900">{res.name}</h4>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{res.deliveryTime}</span>
                  </div>
                  <p className="text-sm text-gray-500 font-medium mb-4">{res.cuisine}</p>
                  <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                    <span>Ahmedabad</span>
                    <span className="text-[#E23744]">ORDER NOW</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const LoginPortal = () => (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl animate-up">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-black text-[#E23744] italic tracking-tighter mb-2">FLAVORDISH.</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Amdavad's Culinary Network</p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-10">
          {[
            { id: 'user', label: 'Customer', icon: <CartIcon className="w-6 h-6" /> },
            { id: 'partner', label: 'Partner', icon: <StoreIcon className="w-6 h-6" /> },
            { id: 'fleet', label: 'Fleet', icon: <BikeIcon className="w-6 h-6" /> }
          ].map(p => (
            <button 
              key={p.id}
              onClick={() => { setAuthPortal(p.id as any); setOtpSent(false); setIsRegistering(false); }}
              className={`p-8 rounded-3xl transition-all duration-300 flex flex-col items-center gap-4 ${authPortal === p.id ? 'bg-[#E23744] text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
              <div className="p-4 rounded-2xl bg-white/20">{p.icon}</div>
              <h3 className="text-sm font-bold uppercase tracking-wider">{p.label}</h3>
            </button>
          ))}
        </div>

        <div className="max-w-md mx-auto glass-card !p-10 !shadow-lg border-none">
          <form onSubmit={handleAuth} className="space-y-6">
            <h4 className="text-center text-gray-900 font-black text-xl mb-4">
              {isRegistering ? 'Join the Grid' : `${authPortal === 'user' ? 'Customer' : authPortal.charAt(0).toUpperCase() + authPortal.slice(1)} Login`}
            </h4>
            
            <div className="space-y-4">
              {authPortal === 'partner' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Phone Number</label>
                    <div className="flex gap-2">
                       <span className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 font-bold text-gray-500">+91</span>
                       <input type="tel" className="flex-grow" placeholder="Enter number" value={authForm.phone} onChange={e => setAuthForm({ ...authForm, phone: e.target.value })} required disabled={otpSent} />
                    </div>
                  </div>
                  {otpSent && (
                    <div className="space-y-1 animate-up">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">4-Digit OTP</label>
                      <input type="text" className="w-full text-center text-2xl font-black tracking-[0.5em]" maxLength={4} value={authForm.otp} onChange={e => setAuthForm({ ...authForm, otp: e.target.value })} required />
                    </div>
                  )}
                  <button type="submit" disabled={isAuthLoading} className="btn-primary-dish w-full">
                    {isAuthLoading ? 'Please wait...' : otpSent ? 'Authorize Login' : 'Send OTP via SMS'}
                  </button>
                </>
              ) : (
                <>
                  {isRegistering && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                      <input type="text" className="w-full" placeholder="John Doe" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} required />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Username</label>
                    <input type="text" className="w-full" value={authForm.username} onChange={e => setAuthForm({ ...authForm, username: e.target.value })} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                    <input type="password" className="w-full" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} required />
                  </div>
                  <button type="submit" disabled={isAuthLoading} className="btn-primary-dish w-full">
                    {isAuthLoading ? 'Connecting...' : isRegistering ? 'Complete Registration' : 'Login'}
                  </button>
                </>
              )}
            </div>
          </form>
          <div className="text-center mt-6">
            <button onClick={() => { setIsRegistering(!isRegistering); setOtpSent(false); }} className="text-[#E23744] text-xs font-bold hover:underline">
              {isRegistering ? 'Already have an account? Login' : 'No account? Register as Customer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="nav-fixed fixed top-0 left-0 right-0 z-[1000] py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div onClick={() => setCurrentView('home')} className="flex items-center gap-2 cursor-pointer">
            <SparklesIcon className="text-[#E23744] w-6 h-6"/>
            <span className="text-2xl font-black text-gray-900 tracking-tighter italic">FLAVORDISH.</span>
          </div>
          <div className="flex items-center gap-8">
            {currentUser ? (
              <div className="flex items-center gap-5">
                 <span className="text-sm font-bold text-gray-700">Hi, {currentUser.name}</span>
                 <button onClick={() => { db.logout(); setCurrentUser(null); setCurrentView('home'); }} className="btn-outline-dish py-2 px-4 text-xs">Logout</button>
              </div>
            ) : (
              <button onClick={() => setCurrentView('login')} className="btn-primary-dish py-2.5 px-6 text-sm">Join the Club</button>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-20">
        {currentView === 'home' && <HomeView />}
        {currentView === 'login' && <LoginPortal />}
        {currentView === 'partner-dashboard' && (
          <div className="container mx-auto px-6 py-12">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-4xl font-black text-gray-900">Partner <span className="text-[#E23744]">Console</span></h2>
              <Badge color="gold">Verified Merchant</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-card p-8 col-span-2">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Revenue Overview</h4>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={orders.map((o, i) => ({ n: i, v: o.total }))}>
                         <Area type="monotone" dataKey="v" stroke="#E23744" strokeWidth={3} fill="#E23744" fillOpacity={0.05} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-8">
                <div className="glass-card p-8 bg-[#E23744] text-white border-none">
                  <h4 className="text-sm font-bold opacity-80 uppercase tracking-widest mb-4">Total Orders</h4>
                  <p className="text-5xl font-black">{orders.length}</p>
                </div>
                <div className="glass-card p-8">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Active Fleet</h4>
                  <p className="text-4xl font-black text-gray-900">12 Riders</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-[#1c1c1c] text-white py-16 mt-20">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-2xl font-black italic mb-6">FLAVORDISH.</h3>
            <p className="text-white/40 text-sm leading-relaxed">Making Amdavadi food culture accessible through smart logistics and elite curation.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:col-span-2">
            <div className="space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-widest text-white/20">Company</h5>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="hover:text-white cursor-pointer">About Us</li>
                <li className="hover:text-white cursor-pointer">Careers</li>
                <li className="hover:text-white cursor-pointer">Press</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-widest text-white/20">Partner</h5>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="hover:text-white cursor-pointer">Merchant Support</li>
                <li className="hover:text-white cursor-pointer">Rider Network</li>
                <li className="hover:text-white cursor-pointer">Brand Toolkit</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
