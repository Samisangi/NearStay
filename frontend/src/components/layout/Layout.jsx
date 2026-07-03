import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { LifeBuoy } from 'lucide-react';

/**
 * Top-level shell rendered once; <Outlet/> swaps in the matched page.
 * AnimatePresence + location.pathname as the key gives every route change
 * a subtle fade/slide, per the spec's animation requirements.
 */
const Layout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-paper-100">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
