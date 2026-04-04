import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus, Trash2 } from 'lucide-react';
import { adminCatalogService } from '../../services/adminCatalogService';
import { AdminButton } from '../../components/admin/ui/AdminButton';
import { AdminSwitch } from '../../components/admin/ui/AdminSwitch';

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = 'w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400';
const textareaClass = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 min-h-[80px]';

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', slug: '', description: '', category: '',
    basePrice: '', basePriceCurrency: 'USD',
    compareAtPrice: '', compareAtPriceCurrency: 'USD',
    material: '', origin: '',
    isActive: true, isNew: false, isFeatured: false,
  });
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    adminCatalogService.getCategories({ page_size: 200 })
      .then((d) => setCategories(d.results || d));
    adminCatalogService.getAttributes()
      .then((d) => setAttributes(d.results || d));

    if (!isNew) {
      adminCatalogService.getProduct(id).then((p) => {
        setForm({
          name: p.name || '',
          slug: p.slug || '',
          description: p.description || '',
          category: p.category || '',
          basePrice: p.basePrice || '',
          basePriceCurrency: p.basePriceCurrency || 'USD',
          compareAtPrice: p.compareAtPrice || '',
          compareAtPriceCurrency: p.compareAtPriceCurrency || 'USD',
          material: p.material || '',
          origin: p.origin || '',
          isActive: p.isActive ?? true,
          isNew: p.isNew ?? false,
          isFeatured: p.isFeatured ?? false,
        });
        setImages(p.images || []);
        setVariants(p.variants || []);
      });
    }
  }, [id, isNew]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        description: form.description,
        category: form.category || null,
        base_price: form.basePrice,
        base_price_currency: form.basePriceCurrency,
        compare_at_price: form.compareAtPrice || null,
        compare_at_price_currency: form.compareAtPriceCurrency,
        material: form.material,
        origin: form.origin,
        is_active: form.isActive,
        is_new: form.isNew,
        is_featured: form.isFeatured,
      };
      if (isNew) {
        const product = await adminCatalogService.createProduct(payload);
        navigate(`/admin-panel/products/${product.id}`);
      } else {
        await adminCatalogService.updateProduct(id, payload);
      }
    } catch (e) {
      const d = e.response?.data;
      setError(typeof d === 'string' ? d : JSON.stringify(d));
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file || isNew) return;
    const fd = new FormData();
    fd.append('image', file);
    setUploadingImg(true);
    try {
      const img = await adminCatalogService.uploadProductImage(id, fd);
      setImages((prev) => [...prev, img]);
    } finally {
      setUploadingImg(false);
      fileRef.current.value = '';
    }
  }

  async function handleDeleteImage(imgId) {
    await adminCatalogService.deleteProductImage(id, imgId);
    setImages((prev) => prev.filter((i) => i.id !== imgId));
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AdminButton variant="ghost" size="icon" onClick={() => navigate('/admin-panel/products')}>
          <ArrowLeft className="h-4 w-4" />
        </AdminButton>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{isNew ? 'New Product' : 'Edit Product'}</h1>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" required>
              <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </Field>
            <Field label="Slug">
              <input className={inputClass} value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="Auto-generated if blank" />
            </Field>
          </div>
          <Field label="Description">
            <textarea className={textareaClass} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="Category">
            <select className={inputClass} value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">— No category —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Base Price" required>
              <div className="flex gap-2">
                <input type="number" step="0.01" className={`${inputClass} flex-1`} value={form.basePrice} onChange={(e) => set('basePrice', e.target.value)} required />
                <input className="w-20 h-9 px-2 border border-gray-300 rounded-md text-sm" value={form.basePriceCurrency} onChange={(e) => set('basePriceCurrency', e.target.value)} maxLength={3} />
              </div>
            </Field>
            <Field label="Compare-at Price">
              <div className="flex gap-2">
                <input type="number" step="0.01" className={`${inputClass} flex-1`} value={form.compareAtPrice} onChange={(e) => set('compareAtPrice', e.target.value)} />
                <input className="w-20 h-9 px-2 border border-gray-300 rounded-md text-sm" value={form.compareAtPriceCurrency} onChange={(e) => set('compareAtPriceCurrency', e.target.value)} maxLength={3} />
              </div>
            </Field>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Material">
              <input className={inputClass} value={form.material} onChange={(e) => set('material', e.target.value)} />
            </Field>
            <Field label="Origin">
              <input className={inputClass} value={form.origin} onChange={(e) => set('origin', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Flags */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Visibility & Flags</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'isActive', label: 'Active' },
              { key: 'isNew', label: 'Mark as New' },
              { key: 'isFeatured', label: 'Featured' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <AdminSwitch
                  checked={form[key]}
                  onCheckedChange={(v) => set(key, v)}
                />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Images — only shown when editing an existing product */}
        {!isNew && (
          <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Images</h2>
              <label className="cursor-pointer">
                <AdminButton type="button" variant="outline" size="sm" onClick={() => fileRef.current.click()} disabled={uploadingImg}>
                  <Upload className="h-3.5 w-3.5" />
                  {uploadingImg ? 'Uploading…' : 'Upload'}
                </AdminButton>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  <img src={img.url} alt={img.altText || ''} className="h-20 w-20 rounded-lg object-cover border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length === 0 && (
                <p className="text-sm text-gray-400">No images yet. Upload one above.</p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <AdminButton type="button" variant="outline" onClick={() => navigate('/admin-panel/products')}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Create Product' : 'Save Changes'}
          </AdminButton>
        </div>
      </form>
    </div>
  );
}
