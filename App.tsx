
import React, { useState, useEffect, useMemo } from 'react';
import { StarIcon, CartIcon, ClockIcon, SparklesIcon, TagIcon, RefreshIcon } from './components/Icons';
import { db } from './services/databaseService';

// --- Types ---
import { Restaurant, Order, MenuItem } from './types';

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
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [authPortal, setAuthPortal] = useState<'user' | 'partner' | 'fleet'>('user');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', password: '', phone: '', otp: '', name: '', email: '' });
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [selectedRes, setSelectedRes] = useState<Restaurant | null>(null);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    db.getRestaurants().then(setRestaurants);
    db.getOrders().then(setOrders);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      if (isRegistering && authPortal === 'user') {
        const user = await db.register({ 
            username: authForm.username, 
            password: authForm.password, 
            name: authForm.name, 
            email: authForm.email 
        });
        setCurrentUser(user);
        setCurrentView('home');
      } else if (authPortal === 'partner') {
        if (!otpSent) {
          setOtpSent(true);
          alert('Demo SMS: Your OTP is 1234');
        } else {
          const user = await db.loginWithPhone(authForm.phone, authForm.otp);
          setCurrentUser(user);
          setCurrentView('home'); // Assume partner goes to home or specialized dash
        }
      } else {
        const user = await db.login(authForm.username, authForm.password);
        setCurrentUser(user);
        setCurrentView('home');
      }
    } catch (err: any) {
      alert(err.message || 'Authentication failed');
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

  // --- Views ---

  const HomeView = () => (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="z-hero">
        <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000" className="z-hero-bg" alt="Food background" />
        <div className="z-hero-content">
          <h1 className="text-white text-6xl font-black italic tracking-tighter mb-4">FLAVORDISH</h1>
          <p className="text-white text-2xl font-medium mb-10 opacity-90">Find the best food, drinks, and more in Ahmedabad</p>
          
          <div className="z-search-bar mx-auto">
            <div className="d-flex align-items-center ps-3 text-danger">
              <MapPinIcon />
              <input type="text" className="z-input" style={{ width: '150px' }} defaultValue="Ahmedabad" />
            </div>
            <div className="z-input-separator"></div>
            <div className="d-flex align-items-center flex-grow-1">
              <SearchIcon className="text-muted" />
              <input type="text" className="z-input" placeholder="Search for restaurant, cuisine or a dish" />
            </div>
          </div>
        </div>
      </section>

      <div className="container py-5">
        {/* Collections */}
        <section className="mb-5">
          <div className="mb-4">
            <h2 className="h3 fw-bold mb-1">Collections</h2>
            <div className="d-flex justify-content-between align-items-center">
              <p className="text-secondary m-0">Explore curated lists of top restaurants, cafes, and bars in Ahmedabad</p>
              <button className="btn text-danger fw-600 p-0 d-flex align-items-center gap-1">All collections <ChevronRight /></button>
            </div>
          </div>
          <div className="row g-4">
            {[
              { title: "Trending this Week", places: "12 Places", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800" },
              { title: "Best of Ahmedabad", places: "24 Places", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800" },
              { title: "Newly Opened", places: "18 Places", img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800" },
              { title: "Hidden Gems", places: "15 Places", img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800" },
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

        {/* Localities */}
        <section className="mb-5">
          <h2 className="h3 fw-bold mb-4">Popular localities in and around Ahmedabad</h2>
          <div className="row g-3">
            {["Bodakdev", "Satellite", "Prahlad Nagar", "Vastrapur", "Gurukul", "Thaltej", "Navrangpura", "C G Road", "Ambawadi"].map((loc, i) => (
              <div key={i} className="col-md-4">
                <div className="locality-card">
                  <div>
                    <h6 className="m-0 fw-bold">{loc}</h6>
                    <span className="small text-muted">352 places</span>
                  </div>
                  <ChevronRight className="text-muted" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Main Food List */}
        <section>
          <h2 className="h3 fw-bold mb-4">Best Food in Ahmedabad</h2>
          <div className="row g-4">
            {restaurants.map(res => (
              <div key={res.id} className="col-md-4">
                <div className="z-card cursor-pointer h-100" onClick={() => { setSelectedRes(res); setCurrentView('restaurant'); }}>
                  <div className="position-relative h-64">
                    <img src={res.image} className="w-100 h-100 object-cover" alt={res.name} />
                    <div className="position-absolute bottom-3 left-3">
                      <span className="bg-white/90 text-danger px-2 py-1 rounded-1 fw-bold x-small">Flat ₹100 OFF</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <h5 className="h6 fw-bold m-0 text-truncate">{res.name}</h5>
                      <span className="z-rating-badge">{res.rating} <StarIcon className="w-2.5 h-2.5" /></span>
                    </div>
                    <div className="d-flex justify-content-between text-secondary small mb-3">
                      <span>{res.cuisine}</span>
                      <span>₹200 for two</span>
                    </div>
                    <div className="pt-3 border-top d-flex align-items-center gap-2">
                       <img src="https://b.zmtcdn.com/data/o2_assets/0b6963158948277c99fbfe10f72d8c511632705482.png" className="w-5 h-5" alt="safety" />
                       <span className="x-small text-muted">Follows all Max Safety measures to ensure your food is safe</span>
                    </div>
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
        <>
          <div className="container py-4">
            <nav className="small text-muted mb-4">
              Home / India / Ahmedabad / {selectedRes.name}
            </nav>
            <div className="row g-4 mb-4">
              <div className="col-md-8">
                <h1 className="display-6 fw-bold mb-1">{selectedRes.name}</h1>
                <p className="text-secondary mb-3">{selectedRes.cuisine}</p>
                <div className="d-flex gap-4">
                   <div className="d-flex align-items-center gap-2">
                      <span className="z-rating-badge py-1 px-2">{selectedRes.rating} ★</span>
                      <span className="small fw-bold">1.2k Delivery Ratings</span>
                   </div>
                </div>
              </div>
              <div className="col-md-4 text-end d-flex flex-column justify-content-center">
                 <button className="btn btn-z-primary mb-2">Order Online</button>
                 <button className="btn btn-z-outline">Book a Table</button>
              </div>
            </div>
          </div>

          <div className="bg-section-light py-5">
            <div className="container">
              <div className="row g-4">
                {selectedRes.menu.map(item => (
                  <div key={item.id} className="col-md-6">
                    <div className="z-card bg-white p-3 d-flex gap-4">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center gap-2 mb-1">
                           <span className="border border-success rounded-circle w-3 h-3 d-inline-block"></span>
                           <span className="x-small text-warning fw-bold">MUST TRY</span>
                        </div>
                        <h6 className="fw-bold mb-1">{item.name}</h6>
                        <span className="z-rating-badge bg-transparent text-warning border border-warning mb-2">★ ★ ★ ★ ★</span>
                        <p className="fw-bold mb-2">₹{item.price}</p>
                        <p className="small text-secondary line-clamp-2">{item.description}</p>
                      </div>
                      <div className="position-relative w-32 h-32 flex-shrink-0">
                        <img src={item.image} className="w-100 h-100 object-cover rounded-3" alt={item.name} />
                        <button 
                            onClick={() => addToCart(item, selectedRes)}
                            className="btn btn-z-primary btn-sm position-absolute bottom-0 start-50 translate-middle-x mb-[-12px] shadow-lg border border-white"
                        >
                            ADD +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const LoginPortal = () => (
    <div className="min-h-screen bg-light d-flex align-items-center justify-content-center p-4">
      <div className="z-card bg-white w-100 shadow-2xl overflow-hidden" style={{ maxWidth: '800px' }}>
        <div className="row g-0">
          <div className="col-md-5 bg-dark p-5 text-white d-flex flex-col justify-between">
            <div>
              <h2 className="display-6 fw-black italic mb-4">FLAVORDISH</h2>
              <p className="opacity-70">A smarter way to discover and order the best food in Ahmedabad.</p>
            </div>
            <div className="d-flex flex-col gap-3">
              <div className="locality-card bg-white/10 border-white/20 text-white cursor-pointer" onClick={() => setAuthPortal('user')}>
                <span>Customer Portal</span>
                <ChevronRight />
              </div>
              <div className="locality-card bg-white/10 border-white/20 text-white cursor-pointer" onClick={() => setAuthPortal('partner')}>
                <span>Partner Console</span>
                <ChevronRight />
              </div>
            </div>
          </div>
          <div className="col-md-7 p-5">
            <h3 className="fw-bold mb-4">{isRegistering ? 'Create Account' : `Login to ${authPortal}`}</h3>
            <form onSubmit={handleAuth} className="d-flex flex-column gap-3">
               {authPortal === 'partner' ? (
                 <>
                   <div className="form-group">
                     <label className="small fw-bold text-muted mb-1">Phone Number</label>
                     <input type="tel" className="form-control z-input border" placeholder="9876543210" value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} required disabled={otpSent} />
                   </div>
                   {otpSent && (
                     <div className="form-group animate-up">
                       <label className="small fw-bold text-muted mb-1">Enter 4-digit OTP</label>
                       <input type="text" className="form-control z-input border text-center fs-4 tracking-widest" maxLength={4} value={authForm.otp} onChange={e => setAuthForm({...authForm, otp: e.target.value})} required />
                     </div>
                   )}
                   <button type="submit" className="btn btn-z-primary w-100 py-3 mt-2">{otpSent ? 'Log In' : 'Send OTP'}</button>
                 </>
               ) : (
                 <>
                   {isRegistering && (
                     <input type="text" className="form-control z-input border" placeholder="Full Name" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} required />
                   )}
                   <input type="text" className="form-control z-input border" placeholder="Username" value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} required />
                   <input type="password" className="form-control z-input border" placeholder="Password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} required />
                   <button type="submit" className="btn btn-z-primary w-100 py-3 mt-2">{isRegistering ? 'Create Account' : 'Login'}</button>
                 </>
               )}
            </form>
            <div className="text-center mt-4">
                <button onClick={() => { setIsRegistering(!isRegistering); setOtpSent(false); }} className="btn text-danger small fw-bold">
                    {isRegistering ? 'Already have an account? Log in' : 'New here? Create account'}
                </button>
            </div>
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
             <SparklesIcon className="text-danger" />
             <span className="h4 m-0 fw-black italic">FLAVORDISH</span>
          </div>
          
          <div className="d-flex align-items-center gap-4">
             {currentUser ? (
               <>
                 <span className="small fw-bold text-muted">Hi, {currentUser.name}</span>
                 <div className="position-relative cursor-pointer">
                    <CartIcon className="text-muted" />
                    {cart.length > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '9px' }}>{cart.length}</span>}
                 </div>
                 <button onClick={() => { db.logout(); setCurrentUser(null); setCurrentView('home'); }} className="btn text-muted small fw-bold">Logout</button>
               </>
             ) : (
               <>
                 <button onClick={() => setCurrentView('login')} className="btn text-muted fw-bold">Log in</button>
                 <button onClick={() => setCurrentView('login')} className="btn btn-z-primary">Sign up</button>
               </>
             )}
          </div>
        </div>
      </nav>

      <main>
        {currentView === 'home' && <HomeView />}
        {currentView === 'login' && <LoginPortal />}
        {currentView === 'restaurant' && <RestaurantView />}
      </main>

      <footer className="z-footer-dark">
        <div className="container">
           <div className="row g-5 mb-5">
              <div className="col-md-3">
                 <h2 className="h4 fw-black italic mb-4">FLAVORDISH</h2>
                 <p className="text-secondary small">Ahmedabad's leading food discovery platform. Serving joy, one bite at a time.</p>
              </div>
              <div className="col-md-3">
                 <h6 className="fw-bold mb-3">ABOUT</h6>
                 <ul className="list-unstyled text-secondary small d-flex flex-column gap-2">
                    <li>Who We Are</li>
                    <li>Work With Us</li>
                    <li>Investor Relations</li>
                    <li>Report Fraud</li>
                 </ul>
              </div>
              <div className="col-md-3">
                 <h6 className="fw-bold mb-3">FOR RESTAURANTS</h6>
                 <ul className="list-unstyled text-secondary small d-flex flex-column gap-2">
                    <li>Partner With Us</li>
                    <li>Apps For You</li>
                 </ul>
              </div>
              <div className="col-md-3">
                 <h6 className="fw-bold mb-3">SOCIAL LINKS</h6>
                 <div className="d-flex gap-2">
                    <div className="rounded-circle bg-white/10 p-2"><StarIcon className="w-4 h-4" /></div>
                    <div className="rounded-circle bg-white/10 p-2"><ClockIcon className="w-4 h-4" /></div>
                    <div className="rounded-circle bg-white/10 p-2"><TagIcon className="w-4 h-4" /></div>
                 </div>
              </div>
           </div>
           <div className="pt-5 border-top border-white/10 text-secondary x-small text-center">
              By continuing past this page, you agree to our Terms of Service, Cookie Policy, Privacy Policy and Content Policies. All trademarks are properties of their respective owners. 2025 © FlavorDish Platform Ltd. All rights reserved.
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
