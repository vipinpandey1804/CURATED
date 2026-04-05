import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Upload, X } from 'lucide-react';
import { adminCatalogService } from '../../services/adminCatalogService';
import { AdminButton } from '../../components/admin/ui/AdminButton';
import { AdminSwitch } from '../../components/admin/ui/AdminSwitch';

function Field({ label, children, required }) {
  if (!label) return <div>{children}</div>;

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = 'h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400';
const textareaClass = 'min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400';

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    basePrice: '',
    basePriceCurrency: 'USD',
    compareAtPrice: '',
    compareAtPriceCurrency: 'USD',
    material: '',
    origin: '',
    isActive: true,
    isNew: false,
    isFeatured: false,
  });
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [pendingAiImages, setPendingAiImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [aiLoading, setAiLoading] = useState({
    description: false,
    details: false,
    image: false,
  });

  useEffect(() => {
    adminCatalogService.getCategories({ page_size: 200 }).then((data) => setCategories(data.results || data));

    if (!isNew) {
      adminCatalogService.getProduct(id).then((product) => {
        setForm({
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          category: product.category || '',
          basePrice: product.basePrice || '',
          basePriceCurrency: product.basePriceCurrency || 'USD',
          compareAtPrice: product.compareAtPrice || '',
          compareAtPriceCurrency: product.compareAtPriceCurrency || 'USD',
          material: product.material || '',
          origin: product.origin || '',
          isActive: product.isActive ?? true,
          isNew: product.isNew ?? false,
          isFeatured: product.isFeatured ?? false,
        });
        setImages(product.images || []);
      });
    }
  }, [id, isNew]);

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function getCategoryName() {
    return categories.find((category) => category.id === form.category)?.name || '';
  }

  function buildAiPayload() {
    return {
      name: form.name.trim(),
      categoryName: getCategoryName(),
      description: form.description.trim(),
      material: form.material.trim(),
      origin: form.origin.trim(),
    };
  }

  function ensureAiContext() {
    if (form.name.trim()) return true;
    setError('Enter the product name first so AI has enough context.');
    return false;
  }

  function getGeneratedImageDataUrl(image) {
    return `data:${image.mimeType || 'image/png'};base64,${image.imageBase64}`;
  }

  async function createGeneratedImageFormData(image, sortOrder) {
    const response = await fetch(getGeneratedImageDataUrl(image));
    const blob = await response.blob();
    const extension = (image.mimeType || 'image/png').split('/')[1] || 'png';
    const safeName = (form.name || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'product';
    const file = new File([blob], `${safeName}-ai-${Date.now()}.${extension}`, {
      type: image.mimeType || 'image/png',
    });
    const fd = new FormData();
    fd.append('image', file);
    fd.append('alt_text', image.altText || `${form.name} product image`);
    fd.append('sort_order', String(sortOrder));
    return fd;
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
        if (pendingAiImages.length) {
          for (let index = 0; index < pendingAiImages.length; index += 1) {
            const fd = await createGeneratedImageFormData(pendingAiImages[index], index);
            await adminCatalogService.uploadProductImage(product.id, fd);
          }
        }
        navigate(`/admin-panel/products/${product.id}`);
      } else {
        await adminCatalogService.updateProduct(id, payload);
      }
    } catch (err) {
      const detail = err.response?.data;
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateDescription() {
    if (!ensureAiContext()) return;
    setError(null);
    setAiLoading((current) => ({ ...current, description: true }));

    try {
      const result = await adminCatalogService.generateProductDescription(buildAiPayload());
      set('description', result.description || '');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate description.');
    } finally {
      setAiLoading((current) => ({ ...current, description: false }));
    }
  }

  async function handleGenerateDetails() {
    if (!ensureAiContext()) return;
    setError(null);
    setAiLoading((current) => ({ ...current, details: true }));

    try {
      const result = await adminCatalogService.generateProductDetails(buildAiPayload());
      setForm((current) => ({
        ...current,
        material: result.material || '',
        origin: result.origin || '',
      }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate details.');
    } finally {
      setAiLoading((current) => ({ ...current, details: false }));
    }
  }

  async function handleGenerateImage() {
    if (!ensureAiContext()) return;
    setError(null);
    setAiLoading((current) => ({ ...current, image: true }));

    try {
      const result = await adminCatalogService.generateProductImage(buildAiPayload());
      if (isNew) {
        setPendingAiImages((current) => [...current, result]);
      } else {
        const fd = await createGeneratedImageFormData(result, images.length);
        const uploadedImage = await adminCatalogService.uploadProductImage(id, fd);
        setImages((current) => [...current, uploadedImage]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate image.');
    } finally {
      setAiLoading((current) => ({ ...current, image: false }));
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
    setImages((prev) => prev.filter((image) => image.id !== imgId));
  }

  function handleRemovePendingImage(indexToRemove) {
    setPendingAiImages((current) => current.filter((_, index) => index !== indexToRemove));
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <AdminButton variant="ghost" size="icon" onClick={() => navigate('/admin-panel/products')}>
          <ArrowLeft className="h-4 w-4" />
        </AdminButton>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{isNew ? 'New Product' : 'Edit Product'}</h1>
        </div>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name" required>
              <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </Field>
            <Field label="Slug">
              <input className={inputClass} value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="Auto-generated if blank" />
            </Field>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="block text-xs font-medium text-gray-600">Description</span>
            <AdminButton type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={aiLoading.description}>
              <Sparkles className="h-3.5 w-3.5" />
              {aiLoading.description ? 'Generating...' : 'Generate with AI'}
            </AdminButton>
          </div>
          <Field label="">
            <textarea className={textareaClass} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>

          <Field label="Category">
            <select className={inputClass} value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">-- No category --</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700">Pricing</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Base Price" required>
              <div className="flex gap-2">
                <input type="number" step="0.01" className={`${inputClass} flex-1`} value={form.basePrice} onChange={(e) => set('basePrice', e.target.value)} required />
                <input className="h-9 w-20 rounded-md border border-gray-300 px-2 text-sm" value={form.basePriceCurrency} onChange={(e) => set('basePriceCurrency', e.target.value)} maxLength={3} />
              </div>
            </Field>
            <Field label="Compare-at Price">
              <div className="flex gap-2">
                <input type="number" step="0.01" className={`${inputClass} flex-1`} value={form.compareAtPrice} onChange={(e) => set('compareAtPrice', e.target.value)} />
                <input className="h-9 w-20 rounded-md border border-gray-300 px-2 text-sm" value={form.compareAtPriceCurrency} onChange={(e) => set('compareAtPriceCurrency', e.target.value)} maxLength={3} />
              </div>
            </Field>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-700">Details</h2>
            <AdminButton type="button" variant="outline" size="sm" onClick={handleGenerateDetails} disabled={aiLoading.details}>
              <Sparkles className="h-3.5 w-3.5" />
              {aiLoading.details ? 'Generating...' : 'Generate with AI'}
            </AdminButton>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Material">
              <input className={inputClass} value={form.material} onChange={(e) => set('material', e.target.value)} />
            </Field>
            <Field label="Origin">
              <input className={inputClass} value={form.origin} onChange={(e) => set('origin', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Visibility & Flags</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'isActive', label: 'Active' },
              { key: 'isNew', label: 'Mark as New' },
              { key: 'isFeatured', label: 'Featured' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <AdminSwitch checked={form[key]} onCheckedChange={(value) => set(key, value)} />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Images</h2>
              {isNew && <p className="mt-1 text-xs text-gray-500">Generated previews will upload automatically after you create the product.</p>}
            </div>
            <div className="flex items-center gap-2">
              <AdminButton type="button" variant="outline" size="sm" onClick={handleGenerateImage} disabled={aiLoading.image}>
                <Sparkles className="h-3.5 w-3.5" />
                {aiLoading.image ? 'Generating...' : 'Generate with AI'}
              </AdminButton>
              {!isNew && (
                <label className="cursor-pointer">
                  <AdminButton type="button" variant="outline" size="sm" onClick={() => fileRef.current.click()} disabled={uploadingImg}>
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingImg ? 'Uploading...' : 'Upload'}
                  </AdminButton>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!isNew && images.map((image) => (
              <div key={image.id} className="group relative">
                <img src={image.url} alt={image.altText || ''} className="h-20 w-20 rounded-lg border border-gray-200 object-cover" />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(image.id)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {isNew && pendingAiImages.map((image, index) => (
              <div key={`${image.altText || 'generated'}-${index}`} className="group relative">
                <img src={getGeneratedImageDataUrl(image)} alt={image.altText || ''} className="h-20 w-20 rounded-lg border border-gray-200 object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemovePendingImage(index)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {((!isNew && images.length === 0) || (isNew && pendingAiImages.length === 0)) && (
              <p className="text-sm text-gray-400">No images yet. Upload one or generate with AI.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <AdminButton type="button" variant="outline" onClick={() => navigate('/admin-panel/products')}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" disabled={saving}>
            {saving ? 'Saving...' : isNew ? 'Create Product' : 'Save Changes'}
          </AdminButton>
        </div>
      </form>
    </div>
  );
}
