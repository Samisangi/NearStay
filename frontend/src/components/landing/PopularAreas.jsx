import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/axiosInstance';

const PopularAreas = () => {
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    api.get('/featured-areas')
      .then((res) => setAreas(res.data.areas || []))
      .catch(() => setAreas([]));
  }, []);

  if (areas.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      <h2 className="text-2xl mb-1">Start near a known spot</h2>
      <p className="text-ink-500 mb-6">Jump straight to listings around these areas.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {areas.map((area, i) => (
          <motion.button
            key={area._id}
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