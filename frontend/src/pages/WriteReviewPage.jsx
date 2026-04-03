import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Upload, ArrowLeft } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { catalogService } from '../services/catalogService';
import { reviewService } from '../services/miscServices';
import { normalizeProduct } from '../utils/normalizers';

export default function WriteReviewPage() {
  const { id: slug } = useParams();
  const navigate = useNavigate();

  const { data: product } = useApi(
    () => catalogService.getProduct(slug).then(normalizeProduct),
    [slug],
  );

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!rating) errs.rating = 'Please select a rating';
    if (!title.trim()) errs.title = 'Required';
    if (body.trim().length < 20) errs.body = 'Review must be at least 20 characters';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await reviewService.createReview({
        product: product?.id,
        rating,
        title,
        body,
      });
      setSubmitted(true);
    } catch (err) {
      setErrors({ body: err?.response?.data?.detail || 'Failed to submit review.' });
    } finally {
      setSubmitting(false);
    }
  }

  const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  if (submitted) {
    return (
      <main className="pt-[96px] min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="inline-flex gap-1 mb-2">
          {[1,2,3,4,5].map((s) => (
            <Star key={s} size={20} className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-brand-border'} />
          ))}
        </div>
        <h1 className="font-serif text-3xl font-light text-brand-dark">Thank You!</h1>
        <p className="text-sm text-brand-muted max-w-sm">Your review for <span className="text-brand-dark font-medium">{product.name}</span> has been submitted and will appear after moderation.</p>
        <div className="flex gap-3 mt-2">
          <Link to={`/products/${product?.slug || slug}`} className="btn-primary">Back to Product</Link>
          <Link to="/products" className="btn-secondary">Continue Shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-[96px] min-h-screen">
      <div className="max-w-2xl mx-auto px-6 lg:px-12 py-10">
        {/* Back */}
        <Link to={`/products/${product?.slug || slug}`} className="flex items-center gap-2 text-xs text-brand-muted hover:text-brand-dark transition-colors mb-8">
          <ArrowLeft size={13} /> Back to {product.name}
        </Link>

        <div className="flex gap-4 mb-8 pb-8 border-b border-brand-border items-center">
          <div className="w-16 h-20 bg-brand-border/30 overflow-hidden flex-shrink-0">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="section-label mb-0.5">{product.category}</p>
            <p className="font-serif text-xl font-light text-brand-dark">{product.name}</p>
            <p className="text-sm text-brand-muted">${product.price.toLocaleString()}</p>
          </div>
        </div>

        <p className="section-label mb-2">Write a Review</p>
        <h1 className="font-serif text-3xl font-light text-brand-dark mb-8">Share Your Experience</h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Star rating */}
          <div>
            <label className="block text-xs text-brand-muted mb-3">Overall Rating</label>
            <div className="flex items-center gap-2 mb-1">
              {[1,2,3,4,5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setRating(s); if (errors.rating) setErrors({ ...errors, rating: undefined }); }}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={s <= (hovered || rating) ? 'text-amber-400 fill-amber-400' : 'text-brand-border'}
                  />
                </button>
              ))}
              {(hovered || rating) > 0 && (
                <span className="text-xs text-brand-muted ml-2">{RATING_LABELS[hovered || rating]}</span>
              )}
            </div>
            {errors.rating && <p className="text-xs text-red-500">{errors.rating}</p>}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-brand-muted mb-1">Review Title</label>
            <input
              type="text"
              placeholder="Summarise your experience..."
              value={title}
              maxLength={80}
              onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors({ ...errors, title: undefined }); }}
              className={`input-box w-full ${errors.title ? 'border-red-400' : ''}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-0.5">{errors.title}</p>}
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs text-brand-muted mb-1">Your Review</label>
            <textarea
              rows={5}
              placeholder="Tell others about the quality, fit, and styling..."
              value={body}
              onChange={(e) => { setBody(e.target.value); if (errors.body) setErrors({ ...errors, body: undefined }); }}
              className={`input-box w-full resize-none ${errors.body ? 'border-red-400' : ''}`}
            />
            <div className="flex items-center justify-between mt-0.5">
              {errors.body ? <p className="text-xs text-red-500">{errors.body}</p> : <span />}
              <p className="text-xs text-brand-muted">{body.length} / 500</p>
            </div>
          </div>

          {/* Photo upload (UI only) */}
          <div>
            <label className="block text-xs text-brand-muted mb-2">Add Photos (optional)</label>
            <label className="flex flex-col items-center justify-center border border-dashed border-brand-border p-6 cursor-pointer hover:border-brand-muted transition-colors text-center">
              <Upload size={20} className="text-brand-border mb-2" />
              <p className="text-xs text-brand-muted">Drag photos here or click to browse</p>
              <p className="text-[10px] text-brand-border mt-1">JPG or PNG, max 5MB each</p>
              <input type="file" accept="image/*" multiple className="hidden" />
            </label>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </div>
    </main>
  );
}
