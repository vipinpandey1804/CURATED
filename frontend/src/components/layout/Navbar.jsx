import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

const navLinks = [
  { label: 'New Arrivals', to: '/new-arrivals' },
  { label: 'Collections', to: '/collections' },
  { label: 'Editorial', to: '/editorial' },
  { label: 'Lookbook', to: '/lookbook' },
];

export default function Navbar() {
  const { count } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close account dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    navigate('/');
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-sm' : 'bg-white/95 backdrop-blur-sm'
        }`}
      >
        {/* Announcement bar */}
        <div className="bg-brand-darker overflow-hidden py-2 text-xs tracking-widest text-white">
          <div className="announcement-track">
            {[0, 1].map((group) => (
              <div key={group} className="announcement-group" aria-hidden={group === 1}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <span key={`${group}-${index}`} className="announcement-item">
                    COMPLIMENTARY SHIPPING ON ORDERS OVER $250
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-8xl mx-auto px-6 lg:px-12">
          <div className="relative flex items-center h-16">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 -ml-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Desktop nav centered */}
            <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'border-b border-brand-dark' : ''}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* Logo — centered */}
            <Link
              to="/"
              className="font-serif text-2xl font-light tracking-widest2 uppercase text-brand-dark absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0"
            >
              CURATED
            </Link>

            {/* Right icons */}
            <div className="flex items-center gap-4 ml-auto">
              <button
                className="p-1 hover:text-brand-muted transition-colors"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
              >
                <Search size={18} />
              </button>
              <Link to="/wishlist" className="p-1 hover:text-brand-muted transition-colors relative" aria-label="Wishlist">
                <Heart size={18} />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-dark text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                    {wishlistItems.length}
                  </span>
                )}
              </Link>
              <Link to="/cart" className="p-1 hover:text-brand-muted transition-colors relative" aria-label="Cart">
                <ShoppingBag size={18} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-dark text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                    {count}
                  </span>
                )}
              </Link>
              {isAuthenticated ? (
                <div className="relative" ref={accountRef}>
                  <button
                    onClick={() => setAccountOpen(!accountOpen)}
                    className="p-1 hover:text-brand-muted transition-colors flex items-center gap-0.5"
                    aria-label="Account"
                  >
                    <User size={18} />
                    <ChevronDown size={12} />
                  </button>
                  {accountOpen && (
                    <div className="absolute right-0 top-full mt-2 w-44 bg-white shadow-lg border border-brand-border py-2 z-50">
                      <Link
                        to="/account/profile"
                        onClick={() => setAccountOpen(false)}
                        className="block px-4 py-2 text-xs text-brand-dark hover:bg-brand-border/20 transition-colors"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/account/addresses"
                        onClick={() => setAccountOpen(false)}
                        className="block px-4 py-2 text-xs text-brand-dark hover:bg-brand-border/20 transition-colors"
                      >
                        Addresses
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setAccountOpen(false)}
                        className="block px-4 py-2 text-xs text-brand-dark hover:bg-brand-border/20 transition-colors"
                      >
                        Orders
                      </Link>
                      <Link
                        to="/account/settings"
                        onClick={() => setAccountOpen(false)}
                        className="block px-4 py-2 text-xs text-brand-dark hover:bg-brand-border/20 transition-colors"
                      >
                        Settings
                      </Link>
                      <hr className="border-brand-border my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={12} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="p-1 hover:text-brand-muted transition-colors" aria-label="Sign in">
                  <User size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="border-t border-brand-border bg-white px-6 lg:px-12 py-4">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex items-center gap-4">
              <Search size={16} className="text-brand-muted flex-shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search for products, collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-brand-dark placeholder:text-brand-muted focus:outline-none"
              />
              <button type="button" onClick={() => setSearchOpen(false)}>
                <X size={16} className="text-brand-muted hover:text-brand-dark transition-colors" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-32 px-6 lg:hidden">
          <nav className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="text-xl font-serif font-light text-brand-dark"
              >
                {link.label}
              </NavLink>
            ))}
            <hr className="border-brand-border my-2" />
            {isAuthenticated ? (
              <>
                <Link to="/account/profile" onClick={() => setMenuOpen(false)} className="nav-link">My Profile</Link>
                <Link to="/orders" onClick={() => setMenuOpen(false)} className="nav-link">Orders</Link>
                <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="text-left text-sm text-red-600"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="nav-link">Sign In</Link>
            )}
            <Link to="/cart" onClick={() => setMenuOpen(false)} className="nav-link">
              Cart ({count})
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
