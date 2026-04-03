import { Link } from 'react-router-dom';
import { Instagram, Twitter, Globe } from 'lucide-react';
import { useState } from 'react';

const footerLinks = {
  Company: [
    { label: 'About Us', to: '/about-us' },
    { label: 'Contact', to: '/contact' },
  ],
  Shop: [
    { label: 'New Arrivals', to: '/new-arrivals' },
    { label: 'Collections', to: '/collections' },
    { label: 'Editorial', to: '/editorial' },
  ],
  Support: [
    { label: 'FAQ', to: '#' },
    { label: 'Shipping', to: '#' },
    { label: 'Returns', to: '#' },
    { label: 'Contact Us', to: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '#' },
    { label: 'Terms of Service', to: '#' },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    setEmail('');
    alert('Thank you for subscribing!');
  };

  return (
    <footer className="bg-brand-darker text-white mt-24">
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <p className="font-serif text-2xl tracking-widest2 uppercase mb-4">CURATED</p>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-xs">
              Premium commerce for the contemporary individual. Curated selections, timeless utility, and mindful design.
            </p>
            <p className="text-xs tracking-widest uppercase text-gray-500 mb-3">Follow</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram size={16} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter size={16} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Website">
                <Globe size={16} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <p className="text-xs tracking-widest uppercase text-gray-500 mb-4">{title}</p>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="border-t border-white/10 mt-12 pt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="font-serif text-xl font-light mb-1">Join the Collective.</p>
            <p className="text-sm text-gray-400">
              Early access to seasonal drops and exclusive editorial content.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex gap-0">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="flex-1 bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/40 transition-colors"
            />
            <button
              type="submit"
              className="bg-white text-brand-darker text-xs tracking-widest uppercase font-medium px-6 py-3 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © 2024 CURATED Nordic Commerce. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-gray-500">EN</span>
            <span className="text-xs text-gray-500">USD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
