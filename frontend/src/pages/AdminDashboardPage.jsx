import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  Image,
  Upload,
  PlusCircle,
  TrendingUp,
  CreditCard,
  Layers,
  Trash2,
  Edit,
  Eye,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // overview, media, add-media, orders, messages
  const [stats, setStats] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add media form state
  const [newMedia, setNewMedia] = useState({
    title: '',
    description: '',
    mediaType: 'photo',
    category: 'Landscapes',
    tags: '',
    price: 99,
    previewUrl: '',
    originalFileKey: '',
    allowDownload: true,
    isPublished: true
  });
  const [previewFile, setPreviewFile] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('pay_unlock_admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, mediaRes, ordersRes, msgRes] = await Promise.all([
        api.getDashboardStats().catch(() => ({ stats: {} })),
        api.getAdminMedia().catch(() => ({ data: [] })),
        api.getAdminOrders().catch(() => ({ orders: [] })),
        api.getAdminMessages().catch(() => ({ messages: [] }))
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (mediaRes.success) setMediaList(mediaRes.data || []);
      if (ordersRes.success) setOrders(ordersRes.orders || []);
      if (msgRes.success) setMessages(msgRes.messages || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      if (err.status === 401) {
        localStorage.removeItem('pay_unlock_admin_token');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pay_unlock_admin_token');
    localStorage.removeItem('pay_unlock_admin_user');
    addToast('Signed out of admin portal.', 'info');
    navigate('/admin/login');
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      const res = await api.updateAdminMedia(id, { isPublished: !currentStatus });
      if (res.success) {
        setMediaList(prev => prev.map(m => m._id === id ? { ...m, isPublished: !currentStatus } : m));
        addToast(`Media ${!currentStatus ? 'published' : 'unpublished'} successfully!`, 'success');
      }
    } catch (err) {
      addToast(err.message || 'Failed to update media status', 'error');
    }
  };

  const handleDeleteMedia = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;

    try {
      const res = await api.deleteAdminMedia(id);
      if (res.success) {
        setMediaList(prev => prev.filter(m => m._id !== id));
        addToast(`Deleted "${title}" successfully.`, 'info');
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete media', 'error');
    }
  };

  const handleCreateMediaSubmit = async (e) => {
    e.preventDefault();
    if (!newMedia.title) {
      addToast('Please enter a title for the media item.', 'error');
      return;
    }

    setFormSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', newMedia.title);
      formData.append('description', newMedia.description);
      formData.append('mediaType', newMedia.mediaType);
      formData.append('category', newMedia.category);
      formData.append('tags', newMedia.tags);
      formData.append('price', newMedia.price);
      formData.append('allowDownload', newMedia.allowDownload);
      formData.append('isPublished', newMedia.isPublished);

      if (previewFile) {
        formData.append('previewFile', previewFile);
      } else if (newMedia.previewUrl) {
        formData.append('previewUrl', newMedia.previewUrl);
      }

      if (originalFile) {
        formData.append('originalFile', originalFile);
      } else if (newMedia.originalFileKey) {
        formData.append('originalFileKey', newMedia.originalFileKey);
      }

      const res = await api.createAdminMedia(formData);
      if (res.success) {
        addToast('Media uploaded and added to catalog successfully!', 'success');
        setNewMedia({
          title: '',
          description: '',
          mediaType: 'photo',
          category: 'Landscapes',
          tags: '',
          price: 99,
          previewUrl: '',
          originalFileKey: '',
          allowDownload: true,
          isPublished: true
        });
        setPreviewFile(null);
        setOriginalFile(null);
        setActiveTab('media');
        loadAllData();
      }
    } catch (err) {
      console.error('Upload failed:', err);
      addToast(err.message || 'Upload failed', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleRefundOrder = async (orderId) => {
    if (!window.confirm('Process refund for this order? This will revoke user access.')) return;

    try {
      const res = await api.refundAdminOrder(orderId);
      if (res.success) {
        addToast('Order marked as refunded and access revoked.', 'info');
        loadAllData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to refund order', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Admin Top Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
            Administrative Control Panel
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 mt-2">
            UnlockMedia Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage ₹99 digital assets, monitor transactions, and handle customer recovery inquiries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Verified Revenue</span>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
              ₹{stats.totalRevenue || 0}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold block">
              {stats.paidOrdersCount || 0} Successful Unlocks
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Catalog Media</span>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
              {stats.totalMedia || 0}
            </div>
            <span className="text-[11px] text-slate-500 font-semibold block">
              {stats.photosCount || 0} Photos • {stats.videosCount || 0} Videos
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Order Invocations</span>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
              {stats.totalOrdersCount || 0}
            </div>
            <span className="text-[11px] text-brand-600 font-semibold block">
              Razorpay Checkouts
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Inquiries</span>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
              {messages.length}
            </div>
            <span className="text-[11px] text-amber-600 font-semibold block">
              {stats.unreadMessages || 0} Open Tickets
            </span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Recent Activity
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'media' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Media Catalog ({mediaList.length})
        </button>
        <button
          onClick={() => setActiveTab('add-media')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'add-media' ? 'bg-brand-600 text-white shadow-sm' : 'text-brand-600 hover:bg-brand-50'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Upload New Media</span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'orders' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Orders & Transactions ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'messages' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Support Inquiries ({messages.length})
        </button>
      </div>

      {/* Tab: Overview / Recent Orders */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-display font-bold text-lg text-slate-900">
            Recent Authoritative Transactions
          </h3>
          {orders.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No orders recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                    <th className="pb-3">Order / Payment ID</th>
                    <th className="pb-3">Item Title</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Recovery Code</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 8).map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50">
                      <td className="py-3 font-mono font-semibold text-slate-700">
                        {order.paymentId || order.orderId}
                      </td>
                      <td className="py-3 font-medium text-slate-900 truncate max-w-xs">
                        {order.mediaId?.title || 'Unknown Media'}
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        ₹{order.amount / 100}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-slate-600">
                        {order.purchase?.recoveryCode || 'N/A'}
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Media Catalog Management */}
      {activeTab === 'media' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-slate-900">
              Media Catalog Items ({mediaList.length})
            </h3>
            <button
              onClick={() => setActiveTab('add-media')}
              className="px-3.5 py-1.5 rounded-xl bg-brand-600 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add New Media</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                  <th className="pb-3">Preview</th>
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Unlocks</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mediaList.map((media) => (
                  <tr key={media._id} className="hover:bg-slate-50">
                    <td className="py-2.5">
                      <img
                        src={media.previewUrl}
                        alt={media.title}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-900"
                      />
                    </td>
                    <td className="py-2.5 font-medium text-slate-900 max-w-xs truncate">
                      {media.title}
                    </td>
                    <td className="py-2.5 uppercase font-bold text-[10px] text-slate-500">
                      {media.mediaType}
                    </td>
                    <td className="py-2.5 text-slate-600">
                      {media.category}
                    </td>
                    <td className="py-2.5 font-bold text-slate-900">
                      ₹{media.price}
                    </td>
                    <td className="py-2.5 text-emerald-600 font-semibold">
                      {media.unlockCount || 0} unlocks
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => handleTogglePublish(media._id, media.isPublished)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          media.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {media.isPublished ? 'Published' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-2.5 text-right space-x-2">
                      <button
                        onClick={() => handleDeleteMedia(media._id, media.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Media Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Add New Media */}
      {activeTab === 'add-media' && (
        <div className="max-w-3xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="font-display font-bold text-xl text-slate-900">
              Upload New Pay-to-Unlock Media
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Provide public preview file and protected master asset. Sets default price to ₹99.
            </p>
          </div>

          <form onSubmit={handleCreateMediaSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Asset Title *
              </label>
              <input
                type="text"
                required
                value={newMedia.title}
                onChange={(e) => setNewMedia({ ...newMedia, title: e.target.value })}
                placeholder="e.g. 8K Dramatic Alpine Ridge at Sunset"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Media Type *
                </label>
                <select
                  value={newMedia.mediaType}
                  onChange={(e) => setNewMedia({ ...newMedia, mediaType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold"
                >
                  <option value="photo">Photo (Master Image)</option>
                  <option value="video">Video (4K Reel / Clip)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={newMedia.category}
                  onChange={(e) => setNewMedia({ ...newMedia, category: e.target.value })}
                  placeholder="e.g. Landscapes, Ocean, Drone"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Price (INR)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newMedia.price}
                  onChange={(e) => setNewMedia({ ...newMedia, price: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Description & Technical Notes
              </label>
              <textarea
                rows={3}
                value={newMedia.description}
                onChange={(e) => setNewMedia({ ...newMedia, description: e.target.value })}
                placeholder="Details regarding camera sensors, resolution, dynamic range, location..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Search Tags (comma separated)
              </label>
              <input
                type="text"
                value={newMedia.tags}
                onChange={(e) => setNewMedia({ ...newMedia, tags: e.target.value })}
                placeholder="mountain, sunset, 8k, prores, nature"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
              />
            </div>

            {/* File Upload Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Public Preview Image / Teaser *
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setPreviewFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Or provide preview image URL below:</span>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newMedia.previewUrl}
                  onChange={(e) => setNewMedia({ ...newMedia, previewUrl: e.target.value })}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Protected Master Asset File *
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setOriginalFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-600 file:text-white hover:file:bg-brand-700"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Or provide master file key:</span>
                <input
                  type="text"
                  placeholder="master_file_name.mp4"
                  value={newMedia.originalFileKey}
                  onChange={(e) => setNewMedia({ ...newMedia, originalFileKey: e.target.value })}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newMedia.allowDownload}
                  onChange={(e) => setNewMedia({ ...newMedia, allowDownload: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>Allow Unlocked File Download</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newMedia.isPublished}
                  onChange={(e) => setNewMedia({ ...newMedia, isPublished: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>Publish Immediately</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={formSubmitting}
              className="w-full py-3.5 px-4 rounded-xl font-display font-bold text-sm text-white bg-slate-900 hover:bg-brand-600 active:scale-[0.99] transition-all duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {formSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading Asset...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload & Publish to Gallery</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Tab: Orders & Transactions */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-display font-bold text-lg text-slate-900">
            Payment Records & Orders
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                  <th className="pb-3">Razorpay Order ID</th>
                  <th className="pb-3">Payment ID</th>
                  <th className="pb-3">Item</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Recovery Code</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50">
                    <td className="py-3 font-mono font-semibold text-slate-800">
                      {order.orderId}
                    </td>
                    <td className="py-3 font-mono text-slate-600">
                      {order.paymentId || 'Pending / Aborted'}
                    </td>
                    <td className="py-3 font-medium text-slate-900 max-w-xs truncate">
                      {order.mediaId?.title || 'Unknown Media'}
                    </td>
                    <td className="py-3 font-bold text-slate-900">
                      ₹{order.amount / 100}
                    </td>
                    <td className="py-3 font-mono font-bold text-emerald-700">
                      {order.purchase?.recoveryCode || '-'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {order.status === 'paid' && (
                        <button
                          onClick={() => handleRefundOrder(order._id)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Support Messages */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-display font-bold text-lg text-slate-900">
            Customer Inquiries & Support Messages ({messages.length})
          </h3>
          {messages.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No messages submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{msg.name}</span>
                      <span className="text-xs text-slate-400">• {msg.email}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-brand-50 text-brand-600">
                        {msg.category}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-xs text-slate-800">
                    Subject: {msg.subject} {msg.orderRef ? `(Ref: ${msg.orderRef})` : ''}
                  </h4>

                  <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
