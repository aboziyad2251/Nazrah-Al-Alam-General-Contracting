import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/auditLog';
import { Drawer, Btn, FormField, Input, Label } from '@/components/ui/index';
import { toast } from 'sonner';
import { X, Upload } from 'lucide-react';

interface Props {
  open: boolean;
  item: any | null;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_OPTS = ['available', 'maintenance', 'retired'];

export default function EquipmentForm({ open, item, onClose, onSaved }: Props) {
  const [form, setForm] = useState<any>({});
  const [specs, setSpecs] = useState<{ k: string; v: string }[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('equipment_categories').select('*').order('sort_order');
      return data ?? [];
    },
  });

  useEffect(() => {
    if (item) {
      setForm({ ...item, category_id: item.category_id });
      setSpecs(item.specs ? Object.entries(item.specs).map(([k, v]) => ({ k, v: String(v) })) : []);
      setImages(item.image_urls ?? []);
    } else {
      setForm({ status: 'available', year: new Date().getFullYear() });
      setSpecs([]);
      setImages([]);
    }
  }, [item, open]);

  const set = (k: string, v: unknown) => setForm((f: any) => ({ ...f, [k]: v }));

  const uploadImages = async (files: FileList) => {
    setUploading(true);
    const urls: string[] = [...images];
    for (const file of Array.from(files).slice(0, 5 - images.length)) {
      const path = `equipment/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('equipment-images')
        .upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from('equipment-images').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setImages(urls);
    setUploading(false);
  };

  const save = async () => {
    if (!form.model_name || !form.category_id) {
      toast.error('Model name and category are required');
      return;
    }
    setSaving(true);
    const specsObj = specs.reduce((acc, { k, v }) => (k ? { ...acc, [k]: v } : acc), {});
    const payload = {
      model_name: form.model_name,
      brand: form.brand,
      year: Number(form.year),
      category_id: Number(form.category_id),
      capacity: form.capacity,
      hourly_rate_sar: Number(form.hourly_rate_sar) || null,
      daily_rate_sar: Number(form.daily_rate_sar) || null,
      weekly_rate_sar: Number(form.weekly_rate_sar) || null,
      monthly_rate_sar: Number(form.monthly_rate_sar) || null,
      status: form.status ?? 'available',
      location: form.location,
      image_urls: images,
      specs: specsObj,
    };

    if (item) {
      await supabase.from('equipment').update(payload).eq('id', item.id);
      await logAudit('update', 'equipment', item.id, payload);
      toast.success('Equipment updated');
    } else {
      const { data } = await supabase.from('equipment').insert(payload).select('id').single();
      if (data) await logAudit('create', 'equipment', data.id, payload);
      toast.success('Equipment added');
    }

    setSaving(false);
    onSaved();
  };

  return (
    <Drawer open={open} onClose={onClose} title={item ? 'Edit Equipment' : 'Add Equipment'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Model Name *">
            <Input
              value={form.model_name ?? ''}
              onChange={(e) => set('model_name', e.target.value)}
              placeholder="e.g. CAT D9N"
            />
          </FormField>
          <FormField label="Brand">
            <Input
              value={form.brand ?? ''}
              onChange={(e) => set('brand', e.target.value)}
              placeholder="Caterpillar"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FormField label="Year">
            <Input
              type="number"
              value={form.year ?? ''}
              onChange={(e) => set('year', e.target.value)}
            />
          </FormField>
          <FormField label="Capacity">
            <Input
              value={form.capacity ?? ''}
              onChange={(e) => set('capacity', e.target.value)}
              placeholder="e.g. 40T"
            />
          </FormField>
          <FormField label="Status">
            <select
              value={form.status ?? 'available'}
              onChange={(e) => set('status', e.target.value)}
              className="w-full rounded-lg border border-cloud px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            >
              {STATUS_OPTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Category *">
          <select
            value={form.category_id ?? ''}
            onChange={(e) => set('category_id', e.target.value)}
            className="w-full rounded-lg border border-cloud px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          >
            <option value="">Select category…</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Location">
          <Input
            value={form.location ?? ''}
            onChange={(e) => set('location', e.target.value)}
            placeholder="Riyadh depot"
          />
        </FormField>

        {/* Rates */}
        <div>
          <Label>Rates (SAR)</Label>
          <div className="grid grid-cols-2 gap-2">
            {['hourly', 'daily', 'weekly', 'monthly'].map((period) => (
              <div key={period}>
                <label className="text-[10px] capitalize text-ink-500">{period}</label>
                <Input
                  type="number"
                  value={form[`${period}_rate_sar`] ?? ''}
                  onChange={(e) => set(`${period}_rate_sar`, e.target.value)}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Specs */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label>Specs</Label>
            <button
              onClick={() => setSpecs((s) => [...s, { k: '', v: '' }])}
              className="text-xs text-navy hover:underline"
            >
              + Add
            </button>
          </div>
          {specs.map((spec, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <Input
                placeholder="Key"
                value={spec.k}
                onChange={(e) =>
                  setSpecs((s) => s.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)))
                }
              />
              <Input
                placeholder="Value"
                value={spec.v}
                onChange={(e) =>
                  setSpecs((s) => s.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))
                }
              />
              <button
                onClick={() => setSpecs((s) => s.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-600"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Images */}
        <div>
          <Label>Images (up to 5)</Label>
          <div className="mb-2 flex flex-wrap gap-2">
            {images.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} className="h-16 w-16 rounded-lg object-cover" alt="" />
                <button
                  onClick={() => setImages((imgs) => imgs.filter((_, j) => j !== i))}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-cloud transition-colors hover:border-navy">
                <Upload size={16} className="text-ink-500" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && uploadImages(e.target.files)}
                />
              </label>
            )}
          </div>
          {uploading && <p className="text-xs text-ink-500">Uploading…</p>}
        </div>

        <div className="flex gap-2 pt-2">
          <Btn variant="secondary" onClick={onClose}>
            Cancel
          </Btn>
          <Btn onClick={save} disabled={saving} className="flex-1">
            {saving ? 'Saving…' : item ? 'Update Equipment' : 'Add Equipment'}
          </Btn>
        </div>
      </div>
    </Drawer>
  );
}
