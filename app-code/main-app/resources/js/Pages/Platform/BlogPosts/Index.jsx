import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Plus, Edit, Trash2, BookOpen, Check, X, FileText } from 'lucide-react';

export default function BlogPostsIndex({ posts = [] }) {
    const [editingPost, setEditingPost] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: 'Financial Truth',
        author: 'VenQore Editorial',
        image: '/images/blog/default.jpg',
        meta_title: '',
        meta_description: '',
        is_published: true,
    });

    const openCreate = () => {
        reset();
        setEditingPost(null);
        setIsCreating(true);
    };

    const openEdit = (p) => {
        setEditingPost(p);
        setIsCreating(false);
        setData({
            title: p.title || '',
            slug: p.slug || '',
            excerpt: p.excerpt || '',
            content: p.content || '',
            category: p.category || 'Financial Truth',
            author: p.author || 'VenQore Editorial',
            image: p.image || '/images/blog/default.jpg',
            meta_title: p.meta_title || '',
            meta_description: p.meta_description || '',
            is_published: !!p.is_published,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingPost) {
            put(route('platform.blog-posts.update', editingPost.id), {
                onSuccess: () => {
                    setEditingPost(null);
                    reset();
                }
            });
        } else {
            post(route('platform.blog-posts.store'), {
                onSuccess: () => {
                    setIsCreating(false);
                    reset();
                }
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this blog post?')) {
            destroy(route('platform.blog-posts.destroy', id));
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
            <Head title="SuperAdmin — Blog Engine" />

            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            <BookOpen className="text-indigo-500" size={32} />
                            Blog Engine Management
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Manage global public marketing posts, SEO metadata, and JSON-LD articles.</p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
                    >
                        <Plus size={18} /> New Blog Post
                    </button>
                </div>

                {/* Form Drawer / Modal */}
                {(isCreating || editingPost) && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                            <h2 className="text-xl font-bold text-white">
                                {editingPost ? `Edit Post: ${editingPost.title}` : 'Create New Blog Post'}
                            </h2>
                            <button
                                onClick={() => { setIsCreating(false); setEditingPost(null); }}
                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Title</label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                        required
                                    />
                                    {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Slug (URL Path)</label>
                                    <input
                                        type="text"
                                        value={data.slug}
                                        onChange={e => setData('slug', e.target.value)}
                                        placeholder="auto-generated from title"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                    {errors.slug && <p className="text-red-400 text-xs mt-1">{errors.slug}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Category</label>
                                    <input
                                        type="text"
                                        value={data.category}
                                        onChange={e => setData('category', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Author</label>
                                    <input
                                        type="text"
                                        value={data.author}
                                        onChange={e => setData('author', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Hero Image URL</label>
                                    <input
                                        type="text"
                                        value={data.image}
                                        onChange={e => setData('image', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Excerpt</label>
                                <textarea
                                    value={data.excerpt}
                                    onChange={e => setData('excerpt', e.target.value)}
                                    rows={2}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Full Content (Markdown Supported)</label>
                                <textarea
                                    value={data.content}
                                    onChange={e => setData('content', e.target.value)}
                                    rows={8}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Meta Title (SEO)</label>
                                    <input
                                        type="text"
                                        value={data.meta_title}
                                        onChange={e => setData('meta_title', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Meta Description (SEO)</label>
                                    <input
                                        type="text"
                                        value={data.meta_description}
                                        onChange={e => setData('meta_description', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.is_published}
                                        onChange={e => setData('is_published', e.target.checked)}
                                        className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                    />
                                    <span className="text-sm font-bold text-slate-300">Published Live</span>
                                </label>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setIsCreating(false); setEditingPost(null); }}
                                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30"
                                    >
                                        {editingPost ? 'Save Changes' : 'Publish Post'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Posts Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/50 text-2xs uppercase tracking-wider text-slate-400 font-bold">
                                <th className="p-4">Post Title</th>
                                <th className="p-4">Slug</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Author</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-sm">
                            {posts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        No blog posts found. Click "New Blog Post" to publish one.
                                    </td>
                                </tr>
                            ) : (
                                posts.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="p-4 font-bold text-white">
                                            <div className="flex items-center gap-2">
                                                <FileText size={16} className="text-indigo-400 shrink-0" />
                                                <span>{p.title}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-400 font-mono text-xs">/blog/{p.slug}</td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-indigo-300 text-xs font-bold">
                                                {p.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-300">{p.author}</td>
                                        <td className="p-4">
                                            {p.is_published ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                                    <Check size={12} /> Published
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold">
                                                    Draft
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(p)}
                                                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
