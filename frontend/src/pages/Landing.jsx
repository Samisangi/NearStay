import { motion } from 'framer-motion';
import { MapPin, SlidersHorizontal } from 'lucide-react';
import HeroSearchBar from '../components/landing/HeroSearchBar';
import PopularAreas from '../components/landing/PopularAreas';
import { MessageCircle } from 'lucide-react';
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
      {/* WhatsApp floating button */}
<a
  href="https://wa.me/923001234567"
  target="_blank"
  rel="noopener noreferrer"
  className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-green-500 text-white flex items-center justify-center shadow-popover hover:bg-green-600 transition-colors"
  aria-label="Chat on WhatsApp"
>
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.862L.057 23.428a.5.5 0 00.609.61l5.633-1.474A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.954a9.952 9.952 0 01-5.103-1.402l-.364-.216-3.747.981.999-3.648-.239-.375A9.956 9.956 0 012.046 12C2.046 6.512 6.512 2.046 12 2.046S21.954 6.512 21.954 12 17.488 21.954 12 21.954z"/>
  </svg>
</a>
    </div>
  );
};

export default Landing;
