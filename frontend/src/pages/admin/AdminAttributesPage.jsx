import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { adminCatalogService } from '../../services/adminCatalogService';
import { AdminButton } from '../../components/admin/ui/AdminButton';

const inputClass = 'h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400';

export default function AdminAttributesPage() {
  const [attributes, setAttributes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newAttrName, setNewAttrName] = useState('');
  const [newValueText, setNewValueText] = useState('');
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminCatalogService.getAttributes()
      .then((d) => {
        const list = d.results || d;
        setAttributes(list);
        if (selected) {
          setSelected(list.find((a) => a.id === selected.id) || null);
        }
      })
      .finally(() => setLoading(false));
  }, [selected]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function handleCreateAttr(e) {
    e.preventDefault();
    if (!newAttrName.trim()) return;
    try {
      await adminCatalogService.createAttribute({ name: newAttrName.trim() });
      setNewAttrName('');
      load();
    } catch (err) {
      setError('Failed to create attribute');
    }
  }

  async function handleDeleteAttr(id) {
    try {
      await adminCatalogService.deleteAttribute(id);
      if (selected?.id === id) setSelected(null);
      load();
    } catch {
      setError('Failed to delete attribute type');
    }
  }

  async function handleAddValue(e) {
    e.preventDefault();
    if (!newValueText.trim() || !selected) return;
    try {
      await adminCatalogService.createAttributeValue({
        attribute_type: selected.id,
        value: newValueText.trim(),
      });
      setNewValueText('');
      load();
    } catch {
      setError('Failed to add value');
    }
  }

  async function handleDeleteValue(valueId) {
    try {
      await adminCatalogService.deleteAttributeValue(valueId);
      load();
    } catch {
      setError('Failed to delete value');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Attributes</h1>
        <p className="text-sm text-gray-500 mt-1">Manage product attribute types and their values (e.g. Size → XS, S, M, L)</p>
      </div>

      {error && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle className="h-4 w-4" />{error}</div>}

      <div className="grid grid-cols-2 gap-6">
        {/* Attribute types list */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Attribute Types</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {attributes.map((attr) => (
              <div
                key={attr.id}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${selected?.id === attr.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                onClick={() => setSelected(attr)}
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{attr.name}</p>
                  <p className="text-xs text-gray-400">{attr.values?.length ?? 0} values</p>
                </div>
                <AdminButton
                  size="icon"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleDeleteAttr(attr.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </AdminButton>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-100">
            <form onSubmit={handleCreateAttr} className="flex gap-2">
              <input
                className={`${inputClass} flex-1`}
                placeholder="New attribute name…"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
              />
              <AdminButton type="submit" size="sm"><Plus className="h-3.5 w-3.5" /></AdminButton>
            </form>
          </div>
        </div>

        {/* Values panel */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              {selected ? `Values for "${selected.name}"` : 'Select an attribute type'}
            </h2>
          </div>
          {selected ? (
            <>
              <div className="divide-y divide-gray-50">
                {selected.values?.map((v) => (
                  <div key={v.id} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-gray-700">{v.value}</span>
                    <AdminButton size="icon" variant="ghost" onClick={() => handleDeleteValue(v.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </AdminButton>
                  </div>
                ))}
                {selected.values?.length === 0 && (
                  <p className="px-4 py-4 text-sm text-gray-400">No values yet.</p>
                )}
              </div>
              <div className="px-4 py-3 border-t border-gray-100">
                <form onSubmit={handleAddValue} className="flex gap-2">
                  <input
                    className={`${inputClass} flex-1`}
                    placeholder="Add value (e.g. XS, Red…)"
                    value={newValueText}
                    onChange={(e) => setNewValueText(e.target.value)}
                  />
                  <AdminButton type="submit" size="sm"><Plus className="h-3.5 w-3.5" /></AdminButton>
                </form>
              </div>
            </>
          ) : (
            <div className="px-4 py-8 text-sm text-gray-400 text-center">
              Click an attribute type on the left to manage its values.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
