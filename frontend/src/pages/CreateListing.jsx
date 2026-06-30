import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useForm } from 'react-hook-form';
import api from '../api/axiosInstance';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const STEPS = ['Basic Info', 'Location', 'Amenities', 'Photos'];
const AMENITIES = ['wifi', 'ac', 'attached_bath', 'furnished', 'parking', 'kitchen_access'];
const AMENITY_LABELS = { wifi: 'WiFi', ac: 'AC', attached_bath: 'Attached Bath', furnished: 'Furnished', parking: 'Parking', kitchen_access: 'Kitchen Access' };

const LocationPicker = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick(e.latlng) });
  return null;
};

const CreateListing = () => {
  const { id } = useParams(); // if present, edit mode
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [step, setStep] = useState(0);
  const [pickedLatLng, setPickedLatLng] = useState(null);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleAmenity = (a) =>
    setSelectedAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

  const onSubmit = async (data) => {
    if (!pickedLatLng && !data.address) {
      setError('Pick a location on the map or enter an address.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const form = new FormData();
      form.append('title', data.title);
      form.append('description', data.description);
      form.append('rent', data.rent);
      form.append('roomType', data.roomType);
      form.append('address', data.address || '');
      if (pickedLatLng) {
        form.append('lat', pickedLatLng.lat);
        form.append('lng', pickedLatLng.lng);
      }
      selectedAmenities.forEach((a) => form.append('amenities', a));
      photos.forEach((f) => form.append('photos', f));

      if (id) {
        await api.patch(`/listings/${id}`, form);
      } else {
        await api.post('/listings', form);
      }
      navigate('/owner/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl mb-2">{id ? 'Edit listing' : 'Create a listing'}</h1>

      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`h-7 w-7 rounded-full text-xs font-medium flex items-center justify-center
                ${i === step ? 'bg-teal-500 text-white' : i < step ? 'bg-teal-100 text-teal-700 cursor-pointer' : 'bg-paper-200 text-ink-400'}`}
            >
              {i + 1}
            </button>
            <span className={`text-sm hidden sm:inline ${i === step ? 'text-ink-900 font-medium' : 'text-ink-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="h-px w-6 bg-paper-300" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-4">
            <Input label="Title" placeholder="Cozy single room near SIBAU" error={errors.title?.message}
              {...register('title', { required: 'Title is required' })} />
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Description</label>
              <textarea rows={4} placeholder="Describe the room, nearby facilities, rules..."
                className="w-full rounded-control border border-paper-300 bg-paper-50 p-3 text-sm resize-none focus-visible:outline-2 focus-visible:outline-teal-500"
                {...register('description', { required: true })} />
            </div>
            <Input label="Monthly rent (Rs)" type="number" error={errors.rent?.message}
              {...register('rent', { required: 'Rent is required', min: { value: 1, message: 'Must be > 0' } })} />
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Room type</label>
              <select className="w-full h-11 rounded-control border border-paper-300 bg-paper-50 px-3 text-sm"
                {...register('roomType', { required: true })}>
                <option value="single">Single room</option>
                <option value="shared">Shared room</option>
                <option value="apartment">Full apartment</option>
              </select>
            </div>
            <Button type="button" onClick={() => setStep(1)} className="w-full">Next</Button>
          </div>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <div className="space-y-4">
            <Input label="Address (or pick on map below)" placeholder="Airport Road, Sukkur"
              {...register('address')} />
            <p className="text-sm text-ink-500">Click anywhere on the map to drop a pin.</p>
            <div className="h-72 rounded-card overflow-hidden">
              <MapContainer center={[27.7032, 68.8589]} zoom={13} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker onPick={setPickedLatLng} />
                {pickedLatLng && <Marker position={pickedLatLng} />}
              </MapContainer>
            </div>
            {pickedLatLng && (
              <p className="text-xs text-teal-600">
                Pin set: {pickedLatLng.lat.toFixed(5)}, {pickedLatLng.lng.toFixed(5)}
              </p>
            )}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(0)} className="flex-1">Back</Button>
              <Button type="button" onClick={() => setStep(2)} className="flex-1">Next</Button>
            </div>
          </div>
        )}

        {/* Step 2: Amenities */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-ink-500">Select all that apply.</p>
            <div className="grid grid-cols-2 gap-3">
              {AMENITIES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`p-3 rounded-control border text-sm text-left transition-colors
                    ${selectedAmenities.includes(a) ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-paper-300 bg-paper-50 text-ink-700'}`}
                >
                  {AMENITY_LABELS[a]}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button type="button" onClick={() => setStep(3)} className="flex-1">Next</Button>
            </div>
          </div>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Photos (max 10)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setPhotos(Array.from(e.target.files))}
                className="text-sm"
              />
              {photos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {photos.map((f, i) => (
                    <img key={i} src={URL.createObjectURL(f)} alt=""
                      className="h-20 w-24 object-cover rounded-control" />
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-danger-500">{error}</p>}

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(2)} className="flex-1">Back</Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Saving...' : id ? 'Save changes' : 'Publish listing'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateListing;