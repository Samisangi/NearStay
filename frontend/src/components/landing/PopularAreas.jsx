import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Real, specific anchors rather than generic "browse by city" copy.
// Coordinates verified via search - not guessed, since wrong coordinates
// here would silently put search results in the wrong place.
const AREAS = [
  { label: 'Sukkur IBA University', lat: 27.72575, lng: 68.81913, city: 'Sukkur' },
  { label: 'Gulberg', lat: 31.5378, lng: 74.3477, city: 'Lahore' },
  { label: 'Johar Town', lat: 31.4622, lng: 74.2942, city: 'Lahore' },
  { label: 'Lahore city centre', lat: 31.5497, lng: 74.3436, city: 'Lahore' },
  { label: 'Sukkur city centre', lat: 27.7032, lng: 68.8589, city: 'Sukkur' },
];

const PopularAreas = () => {
  const navigate = useNavigate();

  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      <h2 className="text-2xl mb-1">Start near a known spot</h2>
      <p className="text-ink-500 mb-6">Jump straight to listings around these areas.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {AREAS.map((area, i) => (
          <motion.button
            key={area.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            onClick={() =>
              navigate(`/search?lat=${area.lat}&lng=${area.lng}&label=${encodeURIComponent(area.label)}`)
            }
            className="text-left p-4 rounded-card border border-paper-200 bg-paper-50 hover:border-teal-300 hover:shadow-card transition-all duration-200"
          >
            <p className="font-medium text-ink-900 text-sm">{area.label}</p>
            <p className="text-xs text-ink-500 mt-0.5">{area.city}</p>
          </motion.button>
        ))}
      </div>
    </section>
  );
};

export default PopularAreas;
