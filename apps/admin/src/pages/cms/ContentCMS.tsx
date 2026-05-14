import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/auditLog';
import { PageHeader, Card, Btn, FormField, Input, Textarea, Modal } from '@/components/ui/index';
import { toast } from 'sonner';
import { Plus, Eye, EyeOff, Upload, X } from 'lucide-react';

const TABS = ['Homepage', 'Portfolio', 'Blog', 'Equipment'] as const;
type Tab = (typeof TABS)[number];

// ── Homepage editor ────────────────────────────────────────────────────────────
function HomepageTab() {
  const qc = useQueryClient();
  const { data: entries = [] } = useQuery({
    queryKey: ['cms-homepage'],
    queryFn: async () => {
      const { data } = await supabase.from('cms_homepage').select('*').order('key');
      return data ?? [];
    },
  });
  const [edits, setEdits] = useState<Record<number, { value_en: string; value_ar: string }>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    for (const [id, vals] of Object.entries(edits)) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase
        .from('cms_homepage')
        .update({ ...vals, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq('id', id);
      await logAudit('update', 'cms_homepage', id, vals);
    }
    toast.success('Homepage content saved');
    setSaving(false);
    setEdits({});
    qc.invalidateQueries({ queryKey: ['cms-homepage'] });
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Btn onClick={save} disabled={saving || Object.keys(edits).length === 0}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Btn>
      </div>
      <div className="space-y-4">
        {entries.map((e: any) => (
          <Card key={e.id} className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              {e.key}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] text-ink-500">English</label>
                <Input
                  value={edits[e.id]?.value_en ?? e.value_en ?? ''}
                  onChange={(ev) =>
                    setEdits((d) => ({
                      ...d,
                      [e.id]: {
                        value_en: ev.target.value,
                        value_ar: d[e.id]?.value_ar ?? e.value_ar ?? '',
                      },
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-ink-500">Arabic</label>
                <Input
                  dir="rtl"
                  value={edits[e.id]?.value_ar ?? e.value_ar ?? ''}
                  onChange={(ev) =>
                    setEdits((d) => ({
                      ...d,
                      [e.id]: {
                        value_en: d[e.id]?.value_en ?? e.value_en ?? '',
                        value_ar: ev.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Portfolio tab ─────────────────────────────────────────────────────────────
function PortfolioTab() {
  const qc = useQueryClient();
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({
    name_en: '',
    name_ar: '',
    location: '',
    category: 'commercial',
    featured: false,
  });
  const [saving, setSaving] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ['cms-portfolio'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects_portfolio')
        .select('*')
        .order('id', { ascending: false });
      return data ?? [];
    },
  });

  const toggleFeatured = async (p: any) => {
    await supabase.from('projects_portfolio').update({ featured: !p.featured }).eq('id', p.id);
    await logAudit('toggle_featured', 'projects_portfolio', p.id, { featured: !p.featured });
    qc.invalidateQueries({ queryKey: ['cms-portfolio'] });
  };

  const saveProject = async () => {
    if (!form.name_en) {
      toast.error('Name required');
      return;
    }
    setSaving(true);
    const { data } = await supabase
      .from('projects_portfolio')
      .insert({
        name_en: form.name_en,
        name_ar: form.name_ar,
        location: (form as any).location,
        category: form.category,
        featured: form.featured,
      })
      .select('id')
      .single();
    if (data) await logAudit('create', 'projects_portfolio', data.id, form);
    toast.success('Project added');
    setSaving(false);
    setAddModal(false);
    qc.invalidateQueries({ queryKey: ['cms-portfolio'] });
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Btn onClick={() => setAddModal(true)}>
          <Plus size={14} /> Add Project
        </Btn>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {projects.map((p: any) => (
          <Card key={p.id} className="overflow-hidden">
            {p.image_urls?.[0] && (
              <img src={p.image_urls[0]} className="h-36 w-full object-cover" alt="" />
            )}
            <div className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{p.name_en}</p>
                  <p className="text-xs text-ink-500">
                    {p.location} · {p.completion_year}
                  </p>
                </div>
                <button onClick={() => toggleFeatured(p)} title="Toggle featured">
                  {p.featured ? (
                    <Eye size={16} className="text-gold" />
                  ) : (
                    <EyeOff size={16} className="text-ink-400" />
                  )}
                </button>
              </div>
              <span className="text-ink-600 mt-2 inline-block rounded-full bg-stone px-2 py-0.5 text-[10px] font-medium capitalize">
                {p.category}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Portfolio Project">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Name (EN) *">
              <Input
                value={form.name_en}
                onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
              />
            </FormField>
            <FormField label="Name (AR)">
              <Input
                dir="rtl"
                value={form.name_ar}
                onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <select
                title="Project category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border border-cloud px-3 py-2 text-sm focus:outline-none"
              >
                {['residential', 'commercial', 'maintenance'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Featured">
              <div className="flex h-10 items-center">
                <input
                  type="checkbox"
                  title="Featured on homepage"
                  checked={form.featured}
                  onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                  className="mr-2 accent-navy"
                />
                <span className="text-ink-700 text-sm">Show on homepage</span>
              </div>
            </FormField>
          </div>
          <div className="flex gap-2 pt-2">
            <Btn variant="secondary" onClick={() => setAddModal(false)}>
              Cancel
            </Btn>
            <Btn onClick={saveProject} disabled={saving} className="flex-1">
              {saving ? 'Saving…' : 'Add'}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Blog tab ──────────────────────────────────────────────────────────────────
function BlogTab() {
  const qc = useQueryClient();
  const [editPost, setEditPost] = useState<any | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: posts = [] } = useQuery({
    queryKey: ['cms-blog'],
    queryFn: async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const newPost = () =>
    setEditPost({
      slug: '',
      title_en: '',
      title_ar: '',
      body_en: '',
      body_ar: '',
      published: false,
    });

  const savePost = async () => {
    if (!editPost?.slug || !editPost?.title_en) {
      toast.error('Slug and title required');
      return;
    }
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (editPost.id) {
      await supabase
        .from('blog_posts')
        .update({ ...editPost, updated_at: new Date().toISOString() })
        .eq('id', editPost.id);
      await logAudit('update', 'blog_post', editPost.id, editPost);
    } else {
      const { data } = await supabase
        .from('blog_posts')
        .insert({ ...editPost, author_id: user?.id })
        .select('id')
        .single();
      if (data) await logAudit('create', 'blog_post', data.id, editPost);
    }
    toast.success('Post saved');
    setSaving(false);
    setEditPost(null);
    qc.invalidateQueries({ queryKey: ['cms-blog'] });
  };

  const togglePublish = async (post: any) => {
    const published = !post.published;
    await supabase
      .from('blog_posts')
      .update({ published, published_at: published ? new Date().toISOString() : null })
      .eq('id', post.id);
    await logAudit('toggle_publish', 'blog_post', post.id, { published });
    qc.invalidateQueries({ queryKey: ['cms-blog'] });
  };

  if (editPost) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setEditPost(null)}
            className="text-sm text-ink-500 hover:text-ink-900"
          >
            ← Back to posts
          </button>
          <div className="flex gap-2">
            <Btn size="sm" variant="ghost" onClick={() => setPreviewMode(!previewMode)}>
              {previewMode ? (
                <>
                  <Eye size={12} /> Edit
                </>
              ) : (
                <>
                  <Eye size={12} /> Preview
                </>
              )}
            </Btn>
            <Btn size="sm" onClick={savePost} disabled={saving}>
              {saving ? 'Saving…' : 'Save Post'}
            </Btn>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormField label="Slug (URL)">
              <Input
                value={editPost.slug}
                onChange={(e) => {
                  const slug = e.target.value.toLowerCase().split(' ').join('-');
                  setEditPost((p: any) => ({ ...p, slug }));
                }}
                placeholder="my-blog-post"
              />
            </FormField>
            <FormField label="Title (EN)">
              <Input
                value={editPost.title_en}
                onChange={(e) => setEditPost((p: any) => ({ ...p, title_en: e.target.value }))}
              />
            </FormField>
            <FormField label="Title (AR)">
              <Input
                dir="rtl"
                value={editPost.title_ar}
                onChange={(e) => setEditPost((p: any) => ({ ...p, title_ar: e.target.value }))}
              />
            </FormField>
            <FormField label="Body (EN — Markdown)">
              <Textarea
                value={editPost.body_en}
                onChange={(e) => setEditPost((p: any) => ({ ...p, body_en: e.target.value }))}
                rows={12}
                className="font-mono text-xs"
              />
            </FormField>
          </div>
          <div>
            <FormField label="Body (AR — Markdown)">
              <Textarea
                dir="rtl"
                value={editPost.body_ar}
                onChange={(e) => setEditPost((p: any) => ({ ...p, body_ar: e.target.value }))}
                rows={12}
                className="font-mono text-xs"
              />
            </FormField>
            {previewMode && (
              <Card className="prose prose-sm mt-3 max-w-none p-4">
                <h2>{editPost.title_en}</h2>
                <pre className="whitespace-pre-wrap text-xs">{editPost.body_en}</pre>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Btn onClick={newPost}>
          <Plus size={14} /> New Post
        </Btn>
      </div>
      <div className="space-y-3">
        {posts.map((post: any) => (
          <Card key={post.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-ink-900">{post.title_en}</p>
              <p className="text-xs text-ink-500">{post.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${post.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
              >
                {post.published ? 'Published' : 'Draft'}
              </span>
              <Btn size="sm" variant="ghost" onClick={() => setEditPost(post)}>
                Edit
              </Btn>
              <Btn size="sm" variant="secondary" onClick={() => togglePublish(post)}>
                {post.published ? 'Unpublish' : 'Publish'}
              </Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Equipment featured tab ─────────────────────────────────────────────────────
function EquipmentTab() {
  const qc = useQueryClient();
  const { data: equipment = [] } = useQuery({
    queryKey: ['cms-equipment'],
    queryFn: async () => {
      const { data } = await supabase
        .from('equipment')
        .select('id, model_name, brand, image_urls, status')
        .order('model_name');
      return data ?? [];
    },
  });

  // The equipment table doesn't have featured yet — store in a simple local state for now
  const [featured, setFeatured] = useState<Set<number>>(new Set());

  const toggle = async (id: number) => {
    setFeatured((f) => {
      const n = new Set(f);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
    await logAudit('toggle_featured', 'equipment', id, { featured: !featured.has(id) });
  };

  return (
    <div>
      <p className="mb-4 text-sm text-ink-500">
        Toggle which machines appear as featured on the website homepage.
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {equipment.map((eq: any) => (
          <div
            key={eq.id}
            className={`cursor-pointer rounded-xl border border-stone/50 bg-white p-3 transition-all ${featured.has(eq.id) ? 'ring-2 ring-gold' : ''}`}
            onClick={() => toggle(eq.id)}
          >
            {eq.image_urls?.[0] && (
              <img
                src={eq.image_urls[0]}
                className="mb-2 h-24 w-full rounded-lg object-cover"
                alt=""
              />
            )}
            <p className="truncate text-sm font-medium text-ink-900">{eq.model_name}</p>
            <p className="text-xs text-ink-500">{eq.brand}</p>
            {featured.has(eq.id) && (
              <span className="mt-1 inline-block text-[10px] font-medium text-gold">
                ★ Featured
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main CMS page ─────────────────────────────────────────────────────────────
export default function ContentCMSPage() {
  const [tab, setTab] = useState<Tab>('Homepage');

  return (
    <div>
      <PageHeader title="Content CMS" subtitle="Manage website content" />

      <div className="mb-6 flex gap-1 border-b border-stone">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'border-navy text-navy'
                : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Homepage' && <HomepageTab />}
      {tab === 'Portfolio' && <PortfolioTab />}
      {tab === 'Blog' && <BlogTab />}
      {tab === 'Equipment' && <EquipmentTab />}
    </div>
  );
}
