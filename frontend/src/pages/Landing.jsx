import { motion } from 'framer-motion';
import { MapPin, SlidersHorizontal, MessageCircle } from 'lucide-react';
import HeroSearchBar from '../components/landing/HeroSearchBar';
import PopularAreas from '../components/landing/PopularAreas';

const STEPS = [
  {
    icon: MapPin,
    title: 'Search by real distance',
    body: 'Drop a pin or type your campus gate. We measure straight-line distance to every listing, not just matching city names.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Filter what matters',
    body: 'Rent range, room type, and amenities like WiFi or attached bath - narrow it down before you waste a single visit.',
  },
  {
    icon: MessageCircle,
    title: 'Message the owner directly',
    body: 'No agent, no middleman fee. Ask your questions and arrange a visit straight from the listing.',
  },
];

const Landing = () => {
  return (
    <div>
      {/* Hero - the search bar IS the page's job, not a banner above one */}
      <section className="px-6 pt-16 pb-12 flex flex-col items-center text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl sm:text-5xl max-w-2xl mb-3"
        >
          Find a room within walking distance, not a guess.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="text-ink-500 max-w-md mb-8 text-[15px]"
        >
          Search rooms near your campus or area by actual distance, in Sukkur and Lahore.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="flex justify-center w-full"
        >
          <HeroSearchBar />
        </motion.div>
      </section>

      <PopularAreas />

      {/* How it works - grounded in the actual product mechanics, not generic value props */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-paper-200">
        <h2 className="text-2xl mb-8 text-center">How it actually works</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              <div className="h-11 w-11 rounded-control bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <step.icon size={20} aria-hidden="true" />
              </div>
              <h3 className="text-base mb-1.5">{step.title}</h3>
              <p className="text-sm text-ink-500 leading-relaxed">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Landing;
