import { motion } from 'framer-motion';
import { Heart, MapPin, Wifi, Snowflake, Bath, Sofa, Car, ChefHat } from 'lucide-react';
import { cn } from '../../lib/cn';
import Badge from '../ui/Badge';

const AMENITY_ICONS = {
  wifi: Wifi,
  ac: Snowflake,
  attached_bath: Bath,
  furnished: Sofa,
  parking: Car,
  kitchen_access: ChefHat,
};

const ROOM_TYPE_LABELS = {
  single: 'Single',
  shared: 'Shared',
  apartment: 'Apartment',
};

/**
 * Card shown in Search results and Favorites grid.
 *
 * Props:
 *  listing       – listing object (matches backend/mock schema)
 *  index         – stagger index for entrance animation
 *  isFavorited   – whether the current user has saved this listing
 *  onToggleFavorite(id) – callback when heart is clicked
 *  onHover(id|null)     – callback when card is hovered (for map sync)
 *  isHighlighted        – true when the matching map marker is active
 *  onClick(listing)     – callback when the card body is clicked
 */
const ListingCard = ({
  listing,
  index = 0,
  isFavorited = false,
  onToggleFavorite,
  onHover,
  isHighlighted = false,
  onClick,
}) => {
  const { _id, title, rent, address, distance, roomType, amenities = [], coverPhoto, photos, averageRating } = listing;
  const photo = coverPhoto || photos?.[0] || null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onMouseEnter={() => onHover?.(_id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        'group relative bg-paper-50 rounded-card border transition-all duration-200 cursor-pointer overflow-hidden',
        isHighlighted
          ? 'border-teal-400 shadow-card-hover ring-1 ring-teal-300'
          : 'border-paper-200 hover:border-teal-200 hover:shadow-card'
      )}
      onClick={() => onClick?.(listing)}
    >
      {/* Photo */}
      <div className="relative h-40 bg-paper-200 overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <MapPin size={28} className="text-paper-300" />
          </div>
        )}

        {/* Heart toggle */}
        {onToggleFavorite && (
          <button
            type="button"
            aria-label={isFavorited ? 'Remove from saved' : 'Save listing'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(_id);
            }}
            className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-paper-50/90 backdrop-blur-sm flex items-center justify-center shadow-card transition-colors hover:bg-paper-50"
          >
            <Heart
              size={16}
              className={cn(
                'transition-colors',
                isFavorited ? 'fill-coral-500 text-coral-500' : 'text-ink-400'
              )}
            />
          </button>
        )}

        {/* Room type badge */}
        <span className="absolute top-2.5 left-2.5">
          <Badge variant="teal">{ROOM_TYPE_LABELS[roomType] || roomType}</Badge>
        </span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-ink-900 line-clamp-2 leading-snug">{title}</p>
          <p className="text-sm font-bold text-teal-600 shrink-0">
            Rs {rent?.toLocaleString()}
            <span className="text-xs font-normal text-ink-400">/mo</span>
          </p>
        </div>

        {/* Address + distance */}
        <div className="flex items-center gap-1 text-xs text-ink-500">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">{address}</span>
          {distance != null && (
            <Badge variant="coral" mono className="ml-auto shrink-0">
              {distance >= 1000
                ? `${(distance / 1000).toFixed(1)} km`
                : `${Math.round(distance)} m`}
            </Badge>
          )}
        </div>

        {/* Rating */}
        {averageRating > 0 && (
          <p className="text-xs text-ink-500">
            ★ <span className="font-medium text-ink-700">{averageRating.toFixed(1)}</span>
          </p>
        )}

        {/* Amenity icons */}
        {amenities.length > 0 && (
          <div className="flex gap-1.5 pt-0.5 flex-wrap">
            {amenities.slice(0, 4).map((a) => {
              const Icon = AMENITY_ICONS[a];
              return Icon ? (
                <span
                  key={a}
                  title={a.replace('_', ' ')}
                  className="h-6 w-6 rounded-full bg-paper-200 flex items-center justify-center"
                >
                  <Icon size={12} className="text-ink-500" />
                </span>
              ) : null;
            })}
            {amenities.length > 4 && (
              <span className="text-xs text-ink-400 self-center">+{amenities.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
};

export default ListingCard;
