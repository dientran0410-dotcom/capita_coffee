import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Search,
  RefreshCw,
  Trash2,
  CheckCheck,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
} from 'lucide-react';
import notificationService, { type EmailLog, type EmailTemplate } from '../../services/NotificationService';
import { apiUtils } from '../../api/axios';

type AdminNotificationType = 'ERROR' | 'WARNING' | 'SUCCESS' | 'INFO';

type AdminNotification = {
  id: number;
  type: AdminNotificationType;
  title: string;
  message: string;
  source: string;
  timestamp: string;
  status: 'read' | 'unread';
  email?: string;
  name?: string;
};

type TabType = 'logs' | 'templates';

const TYPE_CONFIG: Record<string, any> = {
  ERROR: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', badge: 'bg-red-100 text-red-700' },
  WARNING: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100', badge: 'bg-yellow-100 text-yellow-700' },
  SUCCESS: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', badge: 'bg-green-100 text-green-700' },
  INFO: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-100', badge: 'bg-blue-100 text-blue-700' },
};

function SummaryCard({ label, value, icon: Icon, colorClass }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function TypeBadge({ type }: any) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.INFO;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
      <Icon className="w-3 h-3" />
      {type}
    </span>
  );
}

const normalizeLogs = (emailLogs: EmailLog[]): AdminNotification[] => {
  return (Array.isArray(emailLogs) ? emailLogs : []).map((log: EmailLog) => ({
    id: log.id,
    type: log.status === 'SUCCESS' ? 'SUCCESS' : 'ERROR',
    title: log.type || 'Email Notification',
    message: log.errorMessage || (log.status === 'SUCCESS' ? 'Email sent successfully' : 'Failed to send email'),
    source: log.email || 'Unknown',
    timestamp: log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : '',
    status: 'read',
    email: log.email,
    name: log.name,
  }));
};

export function Notification() {
  const [activeTab, setActiveTab] = useState<TabType>('logs');
  const [logs, setLogs] = useState<AdminNotification[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [emailTypeFilter, setEmailTypeFilter] = useState('ALL');
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupDays, setCleanupDays] = useState<number>(30);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>>({
    type: 'REGISTER_SUCCESS',
    subject: '',
    title: '',
    message: ''
  });
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminNotification | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ step: 1 | 2; id: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteTemplateConfirm, setDeleteTemplateConfirm] = useState<{ step: 1 | 2; id: number } | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [updatingTemplate, setUpdatingTemplate] = useState(false);

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(logs.length / PAGE_SIZE);

  const [logsLoaded, setLogsLoaded] = useState(false);

  const fetchLogs = useCallback(async (forceRefresh = false) => {
    // Skip if already loaded and not forcing refresh
    if (logsLoaded && !forceRefresh) return;
    
    setLoading(true);
    try {
      const result = await notificationService.getNotifications({
        page: 0,
        size: 100,
        sortBy: 'createdAt',
        direction: 'DESC',
      });

      const emailLogs = result?.content || [];
      setLogs(normalizeLogs(emailLogs));
      setLogsLoaded(true);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [logsLoaded]);

  useEffect(() => {
    // Only fetch logs when logs tab is active
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, fetchLogs]);

  const filtered = useMemo(() => {
    return logs.filter((n) => {
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'SUCCESS' && n.type === 'SUCCESS') ||
        (statusFilter === 'FAIL' && n.type === 'ERROR');
      const matchEmailType = emailTypeFilter === 'ALL' || n.title === emailTypeFilter;
      const matchSearch =
        !search ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase()) ||
        n.source.toLowerCase().includes(search.toLowerCase()) ||
        (n.email && n.email.toLowerCase().includes(search.toLowerCase())) ||
        (n.name && n.name.toLowerCase().includes(search.toLowerCase()));
      return matchStatus && matchEmailType && matchSearch;
    });
  }, [logs, search, statusFilter, emailTypeFilter]);

  const summary = useMemo(() => {
    const errors = logs.filter((x) => x.type === 'ERROR').length;
    const warnings = logs.filter((x) => x.type === 'WARNING').length;
    const successes = logs.filter((x) => x.type === 'SUCCESS').length;
    return {
      total: logs.length,
      unread: errors,
      errors,
      warnings,
      successes,
    };
  }, [logs]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const filteredTotalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleMarkRead = async () => {
    try {
      console.warn('Email Logs API does not support marking as read');
    } catch (err) {
      console.error('Action not available:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      console.warn('Email Logs API does not support marking all as read');
    } catch (err) {
      console.error('Action not available:', err);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteConfirm({ step: 1, id });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.step === 1) {
      setDeleteConfirm({ step: 2, id: deleteConfirm.id });
    } else {
      setDeleting(true);
      try {
        await apiUtils.delete(`/api/notification-service/logs/${deleteConfirm.id}`);
        setLogs((prev) => prev.filter((n) => n.id !== deleteConfirm.id));
        if (selected?.id === deleteConfirm.id) setSelected(null);
        setDeleteConfirm(null);
      } catch (err) {
        console.error('Failed to delete notification:', err);
        alert('Failed to delete notification');
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleDeleteTemplateClick = (id: number) => {
    setDeleteTemplateConfirm({ step: 1, id });
  };

  const handleConfirmDeleteTemplate = async () => {
    if (!deleteTemplateConfirm) return;

    if (deleteTemplateConfirm.step === 1) {
      setDeleteTemplateConfirm({ step: 2, id: deleteTemplateConfirm.id });
    } else {
      setDeletingTemplate(true);
      try {
        await notificationService.deleteTemplate(deleteTemplateConfirm.id);
        setTemplates((prev) => prev.filter((t) => t.id !== deleteTemplateConfirm.id));
        setDeleteTemplateConfirm(null);
      } catch (err) {
        console.error('Failed to delete template:', err);
        alert('Failed to delete template');
      } finally {
        setDeletingTemplate(false);
      }
    }
  };

  const handleCancelDeleteTemplate = () => {
    setDeleteTemplateConfirm(null);
  };

  const handleEditTemplateClick = (template: EmailTemplate) => {
    setEditingTemplate({ ...template });
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    setUpdatingTemplate(true);
    try {
      await notificationService.updateTemplate(editingTemplate.id, {
        type: editingTemplate.type,
        subject: editingTemplate.subject,
        title: editingTemplate.title,
        message: editingTemplate.message,
      });
      
      setTemplates((prev) =>
        prev.map((t) => (t.id === editingTemplate.id ? editingTemplate : t))
      );
      setEditingTemplate(null);
    } catch (err) {
      console.error('Failed to update template:', err);
      alert('Failed to update template');
    } finally {
      setUpdatingTemplate(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
  };

  const handleCleanupClick = () => {
    setShowCleanupModal(true);
  };

  const handleConfirmCleanup = async () => {
    if (cleanupDays <= 0) return;

    setIsCleaningUp(true);
    try {
      await notificationService.cleanupLogs(cleanupDays);
      
      // Refresh logs after cleanup
      setLogsLoaded(false);
      await fetchLogs(true);
      
      setShowCleanupModal(false);
      console.log(`Successfully cleaned up logs older than ${cleanupDays} days`);
    } catch (err) {
      console.error('Failed to cleanup logs:', err);
      alert('Failed to cleanup logs');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleCancelCleanup = () => {
    setShowCleanupModal(false);
    setCleanupDays(30);
  };

  const handleCreateTemplateClick = () => {
    setShowCreateTemplate(true);
  };

  const handleSaveNewTemplate = async () => {
    if (!newTemplate.type || !newTemplate.subject || !newTemplate.title || !newTemplate.message) {
      alert('Please fill in all fields');
      return;
    }

    setCreatingTemplate(true);
    try {
      const createdTemplate = await notificationService.createTemplate(newTemplate);
      setTemplates((prev) => [...prev, createdTemplate]);
      setShowCreateTemplate(false);
      setNewTemplate({
        type: 'REGISTER_SUCCESS',
        subject: '',
        title: '',
        message: ''
      });
    } catch (err) {
      console.error('Failed to create template:', err);
      alert('Failed to create template');
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleCancelCreateTemplate = () => {
    setShowCreateTemplate(false);
    setNewTemplate({
      type: 'REGISTER_SUCCESS',
      subject: '',
      title: '',
      message: ''
    });
  };

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    setTemplateError(null);
    try {
      const result = await notificationService.getTemplates();
      console.log('Templates result:', result);
      setTemplates(Array.isArray(result) ? result : []);
    } catch (err: any) {
      console.error('Failed to fetch templates:', err);
      setTemplateError(err?.message || 'Failed to load templates');
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    }
  }, [activeTab, fetchTemplates]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            Notification Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage notification logs and email templates.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab('logs');
            setPage(0);
          }}
          className={`px-6 py-3 font-medium text-sm transition-all border-b-2 ${
            activeTab === 'logs'
              ? 'text-indigo-600 border-indigo-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Notification Log
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-6 py-3 font-medium text-sm transition-all border-b-2 ${
            activeTab === 'templates'
              ? 'text-indigo-600 border-indigo-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Email Templates
        </button>
      </div>

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="flex gap-2">
            <button
              onClick={() => fetchLogs(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleCleanupClick}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Cleanup Old Logs
            </button>
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard label="Total Emails" value={summary.total} icon={Bell} colorClass="bg-indigo-100 text-indigo-600" />
            <SummaryCard label="Failed" value={summary.unread} icon={XCircle} colorClass="bg-red-100 text-red-600" />
            <SummaryCard label="Success" value={summary.successes} icon={CheckCircle} colorClass="bg-green-100 text-green-600" />
            <SummaryCard
              label="Total Types"
              value={logs.length > 0 ? new Set(logs.map((l) => l.title)).size : 0}
              icon={Info}
              colorClass="bg-blue-100 text-blue-600"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, message, source..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All status</option>
                <option value="SUCCESS">Success</option>
                <option value="FAIL">Failed</option>
              </select>
              <select
                value={emailTypeFilter}
                onChange={(e) => {
                  setEmailTypeFilter(e.target.value);
                  setPage(0);
                }}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All email types</option>
                <option value="REGISTER_SUCCESS">REGISTER_SUCCESS</option>
                <option value="PAYMENT_SUCCESS">PAYMENT_SUCCESS</option>
                <option value="ORDER_SUCCESS">ORDER_SUCCESS</option>
                <option value="ADD_NEW_COUPON">ADD_NEW_COUPON</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-40 hidden md:table-cell">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-32">Email Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Message</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-40 hidden lg:table-cell">Timestamp</th>
                    <th className="px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        Loading emails...
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        No emails found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((n) => {
                      const isError = n.type === 'ERROR';
                      return (
                        <tr
                          key={n.id}
                          onClick={() => setSelected(n)}
                          className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                            isError ? 'bg-red-50/30' : 'bg-green-50/30'
                          } ${selected?.id === n.id ? 'bg-indigo-50' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <TypeBadge type={n.type} />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            <a href={`mailto:${n.email}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                              {n.email}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{n.name || '-'}</td>
                          <td className="px-4 py-3 text-gray-700 font-medium">{n.title}</td>
                          <td className="px-4 py-3 text-gray-600 text-sm line-clamp-1">{n.message}</td>
                          <td className="px-4 py-3 text-gray-500 hidden lg:table-cell whitespace-nowrap text-xs">{n.timestamp}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                title="Delete"
                                onClick={() => handleDeleteClick(n.id)}
                                className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {filteredTotalPages >= 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700">
                    Showing <span className="font-semibold text-gray-900">{page * PAGE_SIZE + 1}</span>-<span className="font-semibold text-gray-900">{Math.min((page + 1) * PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-gray-900">{filtered.length}</span>
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage(0)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 transition-colors"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: filteredTotalPages }, (_, i) => {
                        const showPage = i === 0 || i === filteredTotalPages - 1 || Math.abs(i - page) <= 1;
                        
                        if (!showPage && i === 1 && page > 2) {
                          return <span key="dots1" className="px-2 py-2 text-gray-400 text-sm">•••</span>;
                        }
                        if (!showPage && i === filteredTotalPages - 2 && page < filteredTotalPages - 3) {
                          return <span key="dots2" className="px-2 py-2 text-gray-400 text-sm">•••</span>;
                        }
                        
                        if (!showPage) return null;
                        
                        return (
                          <button
                            key={i}
                            onClick={() => setPage(i)}
                            className={`w-9 h-9 text-sm font-semibold rounded-lg transition-all flex items-center justify-center ${
                              i === page
                                ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      disabled={page === filteredTotalPages - 1}
                      onClick={() => setPage(filteredTotalPages - 1)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {selected && (
              <div className="w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4 self-start sticky top-6">
                <div className="flex items-start justify-between">
                  <TypeBadge type={selected.type} />
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selected.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{selected.message}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">ID</span>
                    <span className="font-mono text-gray-700">{selected.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Source</span>
                    <span className="text-gray-700">{selected.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Timestamp</span>
                    <span className="text-gray-700 text-xs">{selected.timestamp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Read</span>
                  </div>
                </div>
                <button
                  onClick={handleMarkRead}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as read
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex gap-2">
            <button
              onClick={fetchTemplates}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${templatesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleCreateTemplateClick}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          </div>

          {templateError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Error Loading Templates</h4>
                <p className="text-sm text-red-700 mt-1">{templateError}</p>
              </div>
            </div>
          )}

          {templatesLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates Found</h3>
              <p className="text-gray-600">No email templates available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium mb-2">
                        {template.type}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{template.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">{template.message}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Updated: {new Date(template.updatedAt).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTemplateClick(template)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTemplateClick(template.id)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {deleteConfirm.step === 1 ? 'Delete Email Log?' : 'Confirm Delete?'}
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              {deleteConfirm.step === 1
                ? 'Are you sure you want to delete this email log? This action cannot be undone.'
                : 'This is your final confirmation. Click "Delete" again to permanently remove this email log.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {deleteConfirm.step === 1 ? 'Delete' : 'Delete Permanently'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Template Confirmation Modal */}
      {deleteTemplateConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {deleteTemplateConfirm.step === 1 ? 'Delete Template?' : 'Confirm Delete?'}
              </h3>
            </div>

            <p className="text-gray-600 mb-6">
              {deleteTemplateConfirm.step === 1
                ? 'Are you sure you want to delete this email template? This action cannot be undone.'
                : 'This is your final confirmation. Click "Delete" again to permanently remove this template.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancelDeleteTemplate}
                disabled={deletingTemplate}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteTemplate}
                disabled={deletingTemplate}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingTemplate ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {deleteTemplateConfirm.step === 1 ? 'Delete' : 'Delete Permanently'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Create New Email Template</h3>
              <button
                onClick={handleCancelCreateTemplate}
                disabled={creatingTemplate}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="REGISTER_SUCCESS">REGISTER_SUCCESS</option>
                  <option value="PAYMENT_SUCCESS">PAYMENT_SUCCESS</option>
                  <option value="ORDER_SUCCESS">ORDER_SUCCESS</option>
                  <option value="ADD_NEW_COUPON">ADD_NEW_COUPON</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Email subject line"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Email title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={newTemplate.message}
                  onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Email message content"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelCreateTemplate}
                disabled={creatingTemplate}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewTemplate}
                disabled={creatingTemplate}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creatingTemplate ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cleanup Old Email Logs</h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-600">
                Delete email logs older than the specified number of days. This action cannot be undone.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delete logs older than (days):
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={cleanupDays}
                  onChange={(e) => setCleanupDays(parseInt(e.target.value) || 30)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="30"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: Enter 30 to delete logs older than 30 days
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelCleanup}
                disabled={isCleaningUp}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCleanup}
                disabled={isCleaningUp || cleanupDays <= 0}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCleaningUp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Logs
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Email Template</h3>
              <button
                onClick={handleCancelEdit}
                disabled={updatingTemplate}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={editingTemplate.type}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="REGISTER_SUCCESS">REGISTER_SUCCESS</option>
                  <option value="PAYMENT_SUCCESS">PAYMENT_SUCCESS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={editingTemplate.subject}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editingTemplate.title}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={editingTemplate.message}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, message: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                disabled={updatingTemplate}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={updatingTemplate}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updatingTemplate ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
