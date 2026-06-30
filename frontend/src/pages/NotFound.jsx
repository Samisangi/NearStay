import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <div className="text-8xl font-display text-paper-300 mb-4">404</div>
      <MapPin size={32} className="text-coral-500 mb-3" />
      <h1 className="text-2xl mb-2">This room doesn't exist</h1>
      <p className="text-ink-500 mb-6 max-w-xs">The page you're looking for has moved, or was never here.</p>
      <Button onClick={() => navigate('/')}>Back to home</Button>
    </div>
  );
};

export default NotFound;