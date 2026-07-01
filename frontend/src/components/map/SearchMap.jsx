import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { cn } from '../../lib/cn';

// Fix Leaflet's default icon path issue when bundled with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Teal marker for highlighted/hovered listings
const highlightIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 28px; height: 28px;
    background: #0F4C42;
    border: 3px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
});

// Coral marker for normal listings
const normalIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 22px; height: 22px;
    background: #FF6B4A;
    border: 2.5px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 1px 5px rgba(0,0,0,0.2);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -24],
});

/**
 * Keeps the map centred on the `center` prop when it changes
 * (e.g. user selects a different area from PopularAreas).
 */
const RecenterControl = ({ center }) => {
  const map = useMap();
  const prevCenter = useRef(center);

  useEffect(() => {
    if (
      prevCenter.current[0] !== center[0] ||
      prevCenter.current[1] !== center[1]
    ) {
      map.flyTo(center, map.getZoom(), { duration: 0.8 });
      prevCenter.current = center;
    }
  }, [center, map]);

  return null;
};

/**
 * Full-height split-view map for the Search page.
 *
 * Props:
 *   center          – [lat, lng] for the search origin
 *   listings        – array of listing objects (must have location.coordinates)
 *   highlightedId   – _id of the currently hovered listing card
 *   onMarkerHover(id|null) – callback when a marker is hovered
 *   onMarkerClick(listing) – callback when a marker is clicked
 */
const SearchMap = ({ center, listings = [], highlightedId, onMarkerHover, onMarkerClick }) => {
  return (
    <div className="h-full w-full rounded-card overflow-hidden shadow-card">
      <MapContainer
        center={center}
        zoom={14}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <RecenterControl center={center} />

        {/* Search radius indicator (subtle) */}
        <Circle
          center={center}
          radius={5000}
          pathOptions={{
            color: '#0F4C42',
            fillColor: '#0F4C42',
            fillOpacity: 0.04,
            weight: 1,
            dashArray: '5 5',
          }}
        />

        {listings.map((listing) => {
          // GeoJSON coords are [lng, lat]; Leaflet expects [lat, lng]
          const [lng, lat] = listing.location.coordinates;
          const isHighlighted = listing._id === highlightedId;

          return (
            <Marker
              key={listing._id}
              position={[lat, lng]}
              icon={isHighlighted ? highlightIcon : normalIcon}
              eventHandlers={{
                mouseover: () => onMarkerHover?.(listing._id),
                mouseout: () => onMarkerHover?.(null),
                click: () => onMarkerClick?.(listing),
              }}
              zIndexOffset={isHighlighted ? 1000 : 0}
            >
              <Popup closeButton={false} className="listing-popup">
                <div className="text-sm">
                  <p className="font-semibold text-ink-900 mb-0.5">{listing.title}</p>
                  <p className="text-teal-600 font-medium">Rs {listing.rent?.toLocaleString()}/mo</p>
                  {listing.distance != null && (
                    <p className="text-xs text-ink-400 mt-0.5">
                      {listing.distance >= 1000
                        ? `${(listing.distance / 1000).toFixed(1)} km away`
                        : `${Math.round(listing.distance)} m away`}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default SearchMap;
