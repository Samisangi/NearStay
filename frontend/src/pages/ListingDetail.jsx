import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { MapPin, Wifi, Snowflake, Car, Bath, Sofa, ChefHat, Star, ArrowLeft } from 'lucide-react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../redux/authSlice';
import api from '../api/axiosInstance';
import { MOCK_LISTINGS } from '../mocks/listings';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';

const AMENITY_MAP = {
  wifi: { label: 'WiFi', icon: Wifi },
  ac: { label: 'AC', icon: Snowflake },
  parking: { label: 'Parking', icon: Car },
  attached_bath: { label: 'Attached Bath', icon: Bath },
  furnished: { label: 'Furnished', icon: Sofa },
  kitchen_access: { label: 'Kitchen', icon: ChefHat },
};

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/listings/${id}`);
        setListing(res.data.listing);
      } catch {
        // fallback to mock during development
        const mock = MOCK_LISTINGS.find((l) => l._id === id);
        setListing(mock || null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleInquiry = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.post('/inquiries', { listingId: id, message });
      setSent(true);
    } catch {
      alert('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-4">
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );

  if (!listing) return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-center">
      <p className="text-ink-500">Listing not found.</p>
      <Button onClick={() => navigate('/search')} className="mt-4">Back to search</Button>
    </div>
  );

  const [lng, lat] = listing.location.coordinates;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-6">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Photo gallery */}
      <div className="rounded-card overflow-hidden bg-paper-200 h-72 mb-2 flex items-center justify-center">
        {listing.photos?.length > 0 ? (
          <img src={listing.photos[activePhoto]} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <span className="text-ink-300">No photos available</span>
        )}
      </div>
      {listing.photos?.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {listing.photos.map((p, i) => (
            <img
              key={i}
              src={p}
              onClick={() => setActivePhoto(i)}
              className={`h-16 w-20 object-cover rounded-control cursor-pointer shrink-0 ${i === activePhoto ? 'ring-2 ring-teal-500' : ''}`}
              alt=""
            />
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left: details */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl">{listing.title}</h1>
              <span className="text-xl font-semibold text-teal-600 shrink-0">
                Rs {listing.rent?.toLocaleString()}/mo
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <MapPin size={14} className="text-ink-400" />
              <span className="text-sm text-ink-500">{listing.address}</span>
              {listing.distance != null && (
                <Badge variant="coral" mono>{(listing.distance / 1000).toFixed(1)} km</Badge>
              )}
            </div>
            {listing.averageRating > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star size={14} className="fill-warning-500 text-warning-500" />
                <span className="text-sm font-medium">{listing.averageRating.toFixed(1)}</span>
                <span className="text-sm text-ink-400">({listing.reviewCount} reviews)</span>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-base font-medium mb-2">About this room</h2>
            <p className="text-sm text-ink-600 leading-relaxed">{listing.description || 'No description provided.'}</p>
          </div>

          {listing.amenities?.length > 0 && (
            <div>
              <h2 className="text-base font-medium mb-3">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((a) => {
                  const info = AMENITY_MAP[a];
                  if (!info) return null;
                  const Icon = info.icon;
                  return (
                    <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 bg-paper-200 rounded-pill text-sm text-ink-700">
                      <Icon size={14} /> {info.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Map */}
          <div>
            <h2 className="text-base font-medium mb-3">Location</h2>
            <div className="h-48 rounded-card overflow-hidden">
              <MapContainer center={[lat, lng]} zoom={15} className="h-full w-full" zoomControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[lat, lng]} />
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Right: contact */}
        <div className="space-y-4">
          <div className="bg-paper-50 border border-paper-200 rounded-card p-4">
            <p className="text-sm font-medium mb-1">Listed by</p>
            <p className="text-ink-700">{listing.owner?.name || listing.ownerId?.name || 'Owner'}</p>
            {listing.owner?.phone && <p className="text-sm text-ink-500">{listing.owner.phone}</p>}
          </div>

          {user?.role === 'seeker' && !sent && (
            <div className="bg-paper-50 border border-paper-200 rounded-card p-4 space-y-3">
              <p className="text-sm font-medium">Send inquiry</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Hi, I'm interested in this room..."
                className="w-full rounded-control border border-paper-300 bg-paper-50 p-2.5 text-sm resize-none focus-visible:outline-2 focus-visible:outline-teal-500"
              />
              <Button onClick={handleInquiry} disabled={sending || !message.trim()} className="w-full">
                {sending ? 'Sending...' : 'Send message'}
              </Button>
            </div>
          )}
          {sent && (
            <div className="bg-teal-50 border border-teal-100 rounded-card p-4 text-sm text-teal-700">
              Message sent! The owner will respond soon.
            </div>
          )}
          {!user && (
            <Button variant="secondary" className="w-full" onClick={() => navigate('/login')}>
              Log in to contact owner
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;