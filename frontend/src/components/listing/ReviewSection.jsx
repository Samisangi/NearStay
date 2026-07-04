import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { selectCurrentUser } from '../../redux/authSlice';
import api from '../../api/axiosInstance';
import Skeleton from '../ui/Skeleton';
import Button from '../ui/Button';

const StarRating = ({ value, onChange, readonly = false, size = 20 }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? 'cursor-default' : 'cursor-pointer'}
          aria-label={`${star} star`}
        >
          <Star
            size={size}
            className={`transition-colors ${
              star <= (hovered || value)
                ? 'fill-warning-500 text-warning-500'
                : 'text-paper-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const ReviewCard = ({ review, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, delay: index * 0.05 }}
    className="bg-paper-50 border border-paper-200 rounded-card p-4"
  >
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-sm font-medium shrink-0">
        {review.seekerId?.profilePicture ? (
          <img
            src={review.seekerId.profilePicture}
            alt=""
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          review.seekerId?.name?.[0]?.toUpperCase() || 'U'
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-ink-900">
            {review.seekerId?.name || 'Anonymous'}
          </p>
          <p className="text-xs text-ink-400 shrink-0">
            {new Date(review.createdAt).toLocaleDateString('en-PK', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        <StarRating value={review.rating} readonly size={14} />
        {review.comment && (
          <p className="text-sm text-ink-600 mt-2 leading-relaxed">{review.comment}</p>
        )}
      </div>
    </div>
  </motion.div>
);

const RatingSummary = ({ reviews }) => {
  if (!reviews.length) return null;

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="bg-paper-100 rounded-card p-4 flex gap-6 items-center mb-6">
      <div className="text-center shrink-0">
        <p className="text-4xl font-display text-ink-900">{avg.toFixed(1)}</p>
        <StarRating value={Math.round(avg)} readonly size={16} />
        <p className="text-xs text-ink-500 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {counts.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-2">
            <span className="text-xs text-ink-500 w-3">{star}</span>
            <Star size={11} className="fill-warning-500 text-warning-500 shrink-0" />
            <div className="flex-1 h-1.5 bg-paper-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-warning-500 rounded-full transition-all duration-500"
                style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-xs text-ink-400 w-4 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReviewSection = ({ listingId }) => {
  const user = useSelector(selectCurrentUser);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    api.get(`/reviews/listing/${listingId}`)
      .then((res) => {
        const data = res.data.reviews || [];
        setReviews(data);
        if (user) {
          setHasReviewed(data.some((r) => r.seekerId?._id === user.id));
        }
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [listingId, user]);

  const handleSubmit = async () => {
    if (!rating) { setError('Please select a star rating'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/reviews', { listingId, rating, comment });
      setReviews((prev) => [res.data.review, ...prev]);
      setHasReviewed(true);
      setSuccess(true);
      setRating(0);
      setComment('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-base font-medium mb-4">
        Reviews {reviews.length > 0 && `(${reviews.length})`}
      </h2>

      {/* Rating summary */}
      {reviews.length > 0 && <RatingSummary reviews={reviews} />}

      {/* Write a review — only seekers who haven't reviewed yet */}
      {user?.role === 'seeker' && !hasReviewed && (
        <div className="bg-paper-50 border border-paper-200 rounded-card p-4 mb-6">
          <p className="text-sm font-medium mb-3">Leave a review</p>
          <div className="mb-3">
            <p className="text-xs text-ink-500 mb-1.5">Your rating</p>
            <StarRating value={rating} onChange={setRating} size={24} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Share your experience with this room or owner (optional)..."
            className="w-full rounded-control border border-paper-300 bg-paper-50 p-2.5 text-sm
              resize-none focus-visible:outline-2 focus-visible:outline-teal-500 mb-3"
          />
          {error && <p className="text-sm text-danger-500 mb-2">{error}</p>}
          {success && <p className="text-sm text-success-500 mb-2">Review submitted!</p>}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !rating}
            size="sm"
          >
            {submitting ? 'Submitting...' : 'Submit review'}
          </Button>
        </div>
      )}

      {user?.role === 'seeker' && hasReviewed && (
        <div className="bg-teal-50 border border-teal-100 rounded-card p-3 mb-6 text-sm text-teal-700">
          ✓ You've already reviewed this listing.
        </div>
      )}

      {!user && (
        <div className="bg-paper-100 rounded-card p-3 mb-6 text-sm text-ink-500 text-center">
          <a href="/login" className="text-teal-600 underline font-medium">Log in</a> to leave a review.
        </div>
      )}

      {/* Reviews list */}
      {loading && (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div className="text-center py-8 border border-dashed border-paper-300 rounded-card">
          <Star size={28} className="text-paper-300 mx-auto mb-2" />
          <p className="text-ink-500 text-sm">No reviews yet.</p>
          {user?.role === 'seeker' && (
            <p className="text-xs text-ink-400 mt-1">Be the first to review this room.</p>
          )}
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((review, i) => (
            <ReviewCard key={review._id} review={review} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;