
import React, { useState, useEffect } from 'react';
import { StarIcon, CartIcon, SparklesIcon } from './components/Icons';
import { db } from './services/databaseService';
import { enhanceMenuDescriptions } from './services/geminiService';

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
const SearchIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);

const App = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState('home'); 
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [authPortal, setAuthPortal] = useState<'user' | 'partner' | 'fleet'>('user');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', password: '', phone: '', otp: '', name: '', email: '', resName: '' });
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [selectedRes, setSelectedRes] = useState<any>(null);
  const [partnerInvites, setPartnerInvites] = useState<any[]>([]);
  
  // AI-Enhanced Descriptions state
  const [enhancedDescriptions, setEnhancedDescriptions] = useState<Record<string, string>>({});
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'admin') setCurrentView('admin-dashboard');
    }
    db.getRestaurants().then(setRestaurants);
    db.getOrders().then(setOrders);
    db.getPartnerInvites().then(setPartnerInvites);
    setEnhancedDescriptions(db.getMenuEnhancements());
  }, []);

  // Trigger AI enhancement when a restaurant is selected
  useEffect(() => {
    if (selectedRes && selectedRes.menu) {
      const itemsToEnhance = selectedRes.menu.filter((item: any) => !enhancedDescriptions[item.id]);
      if (itemsToEnhance.length > 0) {
        setIsEnhancing(true);
        enhanceMenuDescriptions(itemsToEnhance).then(results => {
          if (results) {
            const updated = db.saveMenuEnhancements(results);
            setEnhancedDescriptions(updated);
          }
          setIsEnhancing(false);
        }).catch(() => setIsEnhancing(false));
      }
    }
  }, [selectedRes]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      if (isRegistering) {
        if (authPortal === 'user') {
          const user = await db.register({ username: authForm.username, password: authForm.password, name: authForm.name, email: authForm.email });
          setCurrentUser(user);
          setCurrentView('home');
        } else {
          alert('Partner application submitted! We will contact you soon.');
          setIsRegistering(false);
        }
      } else if (authPortal === 'partner') {
        if (!otpSent) {
          setOtpSent(true);
          alert('Demo OTP: 1234');
        } else {
          const user = await db.loginWithPhone(authForm.phone, authForm.otp);
          setCurrentUser(user);
          setCurrentView('home');
        }
      } else {
        const user = await db.login(authForm.username, authForm.password);
        setCurrentUser(user);
        setCurrentView(user.role === 'admin' ? 'admin-dashboard' : 'home');
      }
    } catch (err: any) {
      alert(err.message || 'Authentication failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const addToCart = (item: any, restaurant: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1, restaurantId: restaurant.id, restaurantName: restaurant.name }];
    });
  };

  const HomeView = () => (
    <div className="fade-in">
      <section className="z-hero">
        <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000" className="z-hero-bg" alt="Hero" />
        <div className="z-hero-content">
          <h1 className="text-white text-7xl font-black italic tracking-tighter mb-4">FLAVORDISH</h1>
          <p className="text-white text-2xl font-medium mb-10 opacity-90">Discover the best food & drinks in Ahmedabad</p>
          <div className="z-search-bar mx-auto">
            <div className="d-flex align-items-center ps-3 text-danger">
              <MapPinIcon />
              <input type="text" className="z-input" style={{ width: '150px' }} defaultValue="Ahmedabad" />
            </div>
            <div className="z-input-separator"></div>
            <div className="d-flex align-items-center flex-grow-1 pe-3">
              <SearchIcon className="text-muted" />
              <input type="text" className="z-input" placeholder="Search for restaurant, cuisine or a dish" />
            </div>
          </div>
        </div>
      </section>

      <div className="container py-5">
        <section className="mb-5">
          <h2 className="h3 fw-bold mb-4">Collections</h2>
          <div className="row g-4">
            {[
              { title: "Trending this Week", places: "12 Places", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800" },
              { title: "Authentic Gujarati", places: "24 Places", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800" },
              { title: "Insta-worthy Spots", places: "18 Places", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800" },
              { title: "Newly Opened", places: "15 Places", img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800" },
            ].map((c, i) => (
              <div key={i} className="col-md-3">
                <div className="collection-card">
                  <img src={c.img} alt={c.title} />
                  <div className="collection-overlay">
                    <h5 className="m-0 fw-bold">{c.title}</h5>
                    <p className="small m-0 d-flex align-items-center gap-1">{c.places} <ChevronRight /></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="h3 fw-bold mb-4">Top Restaurants in Ahmedabad</h2>
          <div className="row g-4">
            {restaurants.map(res => (
              <div key={res.id} className="col-md-4">
                <div className="z-card cursor-pointer h-100" onClick={() => { setSelectedRes(res); setCurrentView('restaurant'); }}>
                  <div className="position-relative h-64 overflow-hidden">
                    <img src={res.image} className="w-100 h-100 object-cover" alt={res.name} />
                  </div>
                  <div className="p-3">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <h5 className="h6 fw-bold m-0 text-truncate">{res.name}</h5>
                      <span className="z-rating-badge">{res.rating} ★</span>
                    </div>
                    <p className="text-secondary small mb-3">{res.cuisine} • ₹200 for two</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const RestaurantView = () => (
    <div className="fade-in pb-5">
      {selectedRes && (
        <div className="container py-4">
          <div className="row mb-5">
            <div className="col-md-8">
              <h1 className="display-5 fw-bold mb-1">{selectedRes.name}</h1>
              <p className="text-secondary mb-3">{selectedRes.cuisine} • Ahmedabad Central</p>
              <div className="d-flex gap-4 align-items-center">
                 <span className="z-rating-badge py-1 px-3 fs-6">{selectedRes.rating} ★</span>
                 <span className="text-muted fw-bold small">1.5k Delivery Reviews</span>
              </div>
            </div>
            <div className="col-md-4 text-end d-flex flex-column justify-content-center gap-2">
               <button className="btn btn-z-primary">Order Online</button>
               <button className="btn btn-z-outline">Book a Table</button>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 mb-4">
            <h2 className="h4 fw-bold m-0">Menu</h2>
            {isEnhancing && (
              <div className="d-flex align-items-center gap-2 ms-3">
                <SparklesIcon className="text-danger animate-spin" />
                <span className="text-danger x-small fw-bold uppercase tracking-widest">AI is crafting gourmet descriptions...</span>
              </div>
            )}
          </div>

          <div className="row g-4">
            {selectedRes.menu.map((item: any) => {
              const hasEnhanced = !!enhancedDescriptions[item.id];
              return (
                <div key={item.id} className="col-md-6">
                  <div className="z-card bg-white p-3 d-flex gap-4 h-100">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                         <span className="border border-success rounded-circle w-2 h-2 d-inline-block"></span>
                         {hasEnhanced && (
                           <div className="d-flex align-items-center gap-1 bg-danger/5 px-2 py-0.5 rounded border border-danger/10">
                              <SparklesIcon className="text-danger w-3 h-3" />
                              <span className="text-danger fw-bold" style={{ fontSize: '9px' }}>AI ENHANCED</span>
                           </div>
                         )}
                      </div>
                      <h6 className="fw-bold mb-1">{item.name}</h6>
                      <p className="fw-bold mb-2 text-dark">₹{item.price}</p>
                      <p className={`small leading-relaxed ${hasEnhanced ? 'text-dark italic fw-medium' : 'text-secondary'}`}>
                        {enhancedDescriptions[item.id] || item.description}
                      </p>
                    </div>
                    <div className="position-relative w-32 h-32 flex-shrink-0">
                      <img src={item.image} className="w-100 h-100 object-cover rounded-3" alt={item.name} />
                      <button onClick={() => addToCart(item, selectedRes)} className="btn btn-z-primary btn-sm position-absolute bottom-0 start-50 translate-middle-x mb-[-10px] shadow border border-white">ADD +</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const LoginPortal = () => (
    <div className="min-h-screen bg-light d-flex align-items-center justify-content-center p-4">
      <div className="z-card bg-white w-100 shadow-lg overflow-hidden" style={{ maxWidth: '800px' }}>
        <div className="row g-0">
          <div className="col-md-5 bg-dark p-5 text-white">
            <h2 className="display-6 fw-bold italic mb-4">FLAVORDISH</h2>
            <p className="opacity-70">A smarter way to order food in Ahmedabad.</p>
          </div>
          <div className="col-md-7 p-5">
            <h3 className="fw-bold mb-4">{isRegistering ? 'Create Account' : `Login`}</h3>
            <form onSubmit={handleAuth} className="d-flex flex-column gap-3">
               <input type="text" className="form-control z-input border" placeholder="Username" value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} required />
               <input type="password" className="form-control z-input border" placeholder="Password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} required />
               <button type="submit" className="btn btn-z-primary w-100 py-3">{isRegistering ? 'Register' : 'Login'}</button>
            </form>
            <button onClick={() => setIsRegistering(!isRegistering)} className="btn text-danger small fw-bold w-100 mt-3">
              {isRegistering ? 'Already have an account? Login' : 'New here? Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <nav className="z-nav">
        <div className="container d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
             <SparklesIcon className="text-danger w-8 h-8" />
             <span className="h4 m-0 fw-black italic">FLAVORDISH</span>
          </div>
          <div className="d-flex align-items-center gap-4">
             {currentUser ? (
               <div className="d-flex align-items-center gap-3">
                 <span className="small fw-bold text-muted">Hi, {currentUser.name}</span>
                 <div className="position-relative cursor-pointer" onClick={() => setCurrentView('checkout')}>
                    <CartIcon className="text-muted" />
                    {cart.length > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '9px' }}>{cart.length}</span>}
                 </div>
                 <button onClick={() => { db.logout(); setCurrentUser(null); setCurrentView('home'); }} className="btn text-muted small fw-bold">Logout</button>
               </div>
             ) : (
               <button onClick={() => setCurrentView('login')} className="btn btn-z-primary">Sign up</button>
             )}
          </div>
        </div>
      </nav>

      <main>
        {currentView === 'home' && <HomeView />}
        {currentView === 'login' && <LoginPortal />}
        {currentView === 'restaurant' && <RestaurantView />}
        {currentView === 'checkout' && (
          <div className="container py-5 fade-in">
             <div className="z-card bg-white p-5 mx-auto" style={{ maxWidth: '600px' }}>
                <h2 className="fw-bold mb-4">Your Cart</h2>
                {cart.map((item, idx) => (
                  <div key={idx} className="d-flex justify-content-between py-2 border-bottom">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="fw-bold">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="pt-3 h5 fw-bold d-flex justify-content-between"><span>Total</span><span className="text-danger">₹{cart.reduce((a, b) => a + (b.price * b.quantity), 0)}</span></div>
                <button className="btn btn-z-primary w-100 py-3 mt-4" onClick={() => { alert('Order Placed!'); setCart([]); setCurrentView('home'); }}>Confirm Order</button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
