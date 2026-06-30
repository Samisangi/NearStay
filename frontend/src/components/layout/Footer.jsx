import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-paper-200 bg-paper-50 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <div className="flex items-center gap-1.5 font-display text-lg text-teal-500 mb-2">
            <MapPin size={18} className="text-coral-500" aria-hidden="true" />
            NearStay
          </div>
          <p className="text-sm text-ink-500 max-w-xs">
            Find rooms near your campus by real distance, not guesswork.
          </p>
        </div>

        <nav className="flex gap-8 text-sm">
          <div className="space-y-2">
            <p className="text-ink-900 font-medium">Explore</p>
            <Link to="/search" className="block text-ink-500 hover:text-teal-500">Search rooms</Link>
            <Link to="/register" className="block text-ink-500 hover:text-teal-500">List a room</Link>
          </div>
          <div className="space-y-2">
            <p className="text-ink-900 font-medium">Company</p>
            <a href="#" className="block text-ink-500 hover:text-teal-500">About</a>
            <a href="#" className="block text-ink-500 hover:text-teal-500">Contact</a>
          </div>
        </nav>
      </div>
      <div className="border-t border-paper-200 py-4 text-center text-xs text-ink-300">
        © {new Date().getFullYear()} NearStay. Built for students in Sukkur and Lahore.
      </div>
    </footer>
  );
};

export default Footer;
