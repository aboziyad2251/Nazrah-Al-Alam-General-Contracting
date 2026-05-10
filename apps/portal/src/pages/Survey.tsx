import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useCartStore } from '@/stores/cartStore';
import { PageHeader } from '@/components/ui';
import { Upload, Camera, Loader2, CheckCircle, X, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

async function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];
      resolve({ data: base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Extract equipment list from AI markdown response
function parseEquipmentLines(text: string): string[] {
  const lines = text.split('\n');
  const equipment: string[] = [];
  let inSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/equipment|معدات|recommended/i.test(trimmed)) {
      inSection = true;
      continue;
    }
    if (inSection && /^#{1,3}\s/.test(trimmed) && !/equipment|معدات/i.test(trimmed)) {
      inSection = false;
    }
    if (inSection && /^[-*•]\s/.test(trimmed)) {
      const name = trimmed
        .replace(/^[-*•]\s/, '')
        .split(':')[0]
        .trim();
      if (name) equipment.push(name);
    }
  }
  return equipment.slice(0, 8);
}

export default function SurveyPage() {
  const { user } = useAuthStore();
  const { locale } = useUIStore();
  const { addItem } = useCartStore();
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const isAr = locale === 'ar';

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 6 - photos.length);
    setPhotos((p) => [...p, ...arr]);
    arr.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((p) => [...p, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (i: number) => {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const analyze = async () => {
    if (!photos.length || !user) return;
    setLoading(true);
    setResult(null);
    setEquipment([]);

    try {
      // Convert photos to base64 for gateway payload
      const imagePayloads = await Promise.all(photos.map(fileToBase64));

      // Upload to Storage in parallel (for the survey record)
      const uploadJobs = photos.map(async (f) => {
        const path = `surveys/${user.id}/${Date.now()}_${f.name}`;
        const { error } = await supabase.storage.from('site-photos').upload(path, f);
        if (error) return null;
        return supabase.storage.from('site-photos').getPublicUrl(path).data.publicUrl;
      });

      // Call gateway — site_photo_analysis (non-streaming, Gemini 2.5 Pro)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-gateway`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: 'site_photo_analysis',
          payload: {
            notes: notes.trim() || 'Site survey via client portal',
            images: imagePayloads,
          },
          user_id: session.user.id,
          locale,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error ?? `Gateway ${res.status}`);
      }

      const json = await res.json();
      const analysisText =
        typeof json.content === 'string' ? json.content : JSON.stringify(json.content);
      const extractedEq = parseEquipmentLines(analysisText);

      // Resolve Storage URLs
      const photoUrls = (await Promise.all(uploadJobs)).filter(Boolean) as string[];

      // Save survey record
      await supabase.from('site_surveys').insert({
        profile_id: user.id,
        photos: photoUrls,
        ai_analysis: { text: analysisText, model: json.model, cost_usd: json.costUsd },
        recommended_equipment: extractedEq,
      });

      setResult(analysisText);
      setEquipment(extractedEq);
      toast.success(isAr ? 'اكتمل تحليل الموقع!' : 'Site analysis complete!');
    } catch (e) {
      console.error('[survey] error:', e);
      toast.error(isAr ? 'فشل التحليل، حاول مجدداً.' : 'Analysis failed — please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addEquipmentToQuote = (name: string) => {
    addItem({
      equipment_id: Date.now(), // placeholder — no DB id for AI-suggested equipment
      model_name: name,
      brand: '',
      category: 'AI Suggested',
      daily_rate_sar: 0,
      qty: 1,
      days: 1,
      with_operator: false,
    });
    toast.success(`${name} added to quote`);
  };

  return (
    <div className="mx-auto max-w-2xl" dir={isAr ? 'rtl' : 'ltr'}>
      <PageHeader
        title={isAr ? 'مسح الموقع بالذكاء الاصطناعي' : 'AI Site Survey'}
        subtitle={
          isAr
            ? 'ارفع صوراً من الموقع وسيحلل الذكاء الاصطناعي المشهد ويوصي بالمعدات.'
            : 'Upload site photos and our AI will analyze conditions and recommend the right equipment.'
        }
      />

      <div className="rounded-2xl border border-[#E8EAED] bg-white p-6">
        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          className="mb-4 cursor-pointer rounded-xl border-2 border-dashed border-[#E8EAED] p-8 text-center transition-all hover:border-[#0E1F3A] hover:bg-[#D9DCE0]/30"
        >
          <Camera size={32} className="mx-auto mb-3 text-[#5A6573]" />
          <p className="font-medium text-[#0F1117]">
            {isAr ? 'رفع صور الموقع' : 'Upload Site Photos'}
          </p>
          <p className="mt-1 text-sm text-[#5A6573]">
            {isAr
              ? 'اسحب وأفلت أو انقر · حتى 6 صور · JPG, PNG'
              : 'Drag & drop or click · Max 6 photos · JPG, PNG'}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => addPhotos(e.target.files)}
          />
        </div>

        {/* Preview grid */}
        {previews.length > 0 && (
          <div className="mb-5 grid grid-cols-3 gap-3">
            {previews.map((src, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Optional notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder={
            isAr ? 'ملاحظات الموقع (اختياري)…' : 'Site notes / project description (optional)…'
          }
          className="mb-4 w-full resize-none rounded-xl border border-[#E8EAED] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0E1F3A]"
        />

        <button
          type="button"
          onClick={analyze}
          disabled={loading || photos.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E1F3A] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0A1628] disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> {isAr ? 'جاري التحليل…' : 'Analyzing…'}
            </>
          ) : (
            <>
              <Upload size={16} /> {isAr ? 'تحليل الموقع' : 'Analyze Site'}
            </>
          )}
        </button>

        {/* Results */}
        {result && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle size={18} />
              <span className="text-sm font-semibold">
                {isAr ? 'اكتمل التحليل' : 'Analysis Complete'}
              </span>
            </div>

            {/* AI analysis text */}
            <div className="prose prose-sm max-w-none rounded-xl bg-[#D9DCE0] p-4">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#0F1117]">
                {result}
              </div>
            </div>

            {/* Equipment suggestions */}
            {equipment.length > 0 && (
              <div>
                <p className="mb-3 text-sm font-semibold text-[#0F1117]">
                  {isAr ? 'المعدات الموصى بها' : 'Recommended Equipment'}
                </p>
                <div className="space-y-2">
                  {equipment.map((e) => (
                    <div
                      key={e}
                      className="flex items-center justify-between rounded-xl bg-[#0E1F3A] px-4 py-2.5 text-sm font-medium text-white"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="shrink-0 text-[#E8B339]" />
                        <span>{e}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => addEquipmentToQuote(e)}
                        title="Add to quote"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8B339] text-[#0E1F3A] transition-colors hover:bg-[#F2C75B]"
                      >
                        <ShoppingCart size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[#5A6573]">
                  {isAr
                    ? 'انقر على السلة لإضافة المعدة إلى عرض الأسعار.'
                    : 'Click the cart icon to add any item to your quote.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
