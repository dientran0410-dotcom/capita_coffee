import { useMemo, useState } from 'react';
import { RefreshCw, ChevronDown, Send, CheckCircle, Clock } from 'lucide-react';
import { showSuccessToast } from '@/utils/toast';

type Supplier = {
  id: string;
  name: string;
  category: string;
  contact?: string;
  since?: string;
};

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type SupplierRequestItem = {
  requestId: string;
  supplierId: string;
  supplierName: string;
  action: 'ADD' | 'REMOVE';
  reason: string;
  submittedAt: string;
  status: RequestStatus;
  reviewNote?: string;
};

const STATUS_CFG = {
  PENDING: { label: 'Pending Review', cls: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
};

export function SupplierRequestPage() {
  const [franchiseCode] = useState('');
  const [currentSuppliers] = useState<Supplier[]>([]);
  const [availableSuppliers] = useState<Supplier[]>([]);
  const [history, setHistory] = useState<SupplierRequestItem[]>([]);

  const [formSupplierId, setFormSupplierId] = useState('');
  const [formAction, setFormAction] = useState<'ADD' | 'REMOVE'>('ADD');
  const [formReason, setFormReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);

  const errors = {
    supplier: submitted && !formSupplierId ? 'Please select a supplier' : '',
    reason: submitted && !formReason ? 'Please provide a reason' : '',
  };

  const selectableSuppliers = useMemo(() => {
    return availableSuppliers.filter((s) => {
      const inCurrentMapping = currentSuppliers.some((cs) => cs.id === s.id);
      return formAction === 'ADD' ? !inCurrentMapping : inCurrentMapping;
    });
  }, [availableSuppliers, currentSuppliers, formAction]);

  const handleSubmit = () => {
    setSubmitted(true);
    if (!formSupplierId || !formReason) return;

    const supplier = availableSuppliers.find((x) => x.id === formSupplierId);
    const now = new Date().toLocaleString('vi-VN');
    const requestId = `sr-${Date.now()}`;

    const newRequest: SupplierRequestItem = {
      requestId,
      supplierId: formSupplierId,
      supplierName: supplier?.name || formSupplierId,
      action: formAction,
      reason: formReason,
      submittedAt: now,
      status: 'PENDING',
    };

    setHistory((prev) => [newRequest, ...prev]);
    setSuccess(true);
    setFormSupplierId('');
    setFormAction('ADD');
    setFormReason('');
    setSubmitted(false);
    showSuccessToast(
      `Request to ${newRequest.action === 'ADD' ? 'add' : 'remove'} "${newRequest.supplierName}" submitted for review`
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Supplier Mapping Request</h1>
        <p className="text-gray-600 mt-1">S30 - Request to add or remove a supplier from your franchise&apos;s approved list</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Current Approved Suppliers</h2>
            <p className="text-xs text-gray-500 mb-3">{franchiseCode || 'No franchise selected'}</p>
            <div className="space-y-3">
              {currentSuppliers.length === 0 ? (
                <div className="text-sm text-gray-500">No approved suppliers found.</div>
              ) : (
                currentSuppliers.map((sp) => (
                  <div key={sp.id} className="p-3 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-sm font-semibold text-gray-900">{sp.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{sp.category}</p>
                    {sp.contact && <p className="text-xs text-gray-400 mt-0.5">{sp.contact}</p>}
                    {sp.since && <p className="text-xs text-green-600 mt-1">Since {sp.since}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-amber-600" /> New Request
            </h2>

            {success && (
              <div className="p-3 mb-4 bg-green-50 rounded-xl flex gap-2 items-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <p className="text-sm text-green-700">Your request has been submitted and is pending Logistics Admin review.</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Request Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['ADD', 'REMOVE'] as const).map((act) => (
                    <label
                      key={act}
                      htmlFor={`action-${act}`}
                      className={`flex items-center gap-3 p-3 cursor-pointer rounded-xl border transition-colors ${formAction === act ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <input
                        id={`action-${act}`}
                        type="radio"
                        name="action"
                        value={act}
                        checked={formAction === act}
                        onChange={() => {
                          setFormAction(act);
                          setFormSupplierId('');
                        }}
                        className="w-4 h-4 accent-amber-600"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{act === 'ADD' ? 'Add Supplier' : 'Remove Supplier'}</p>
                        <p className="text-xs text-gray-400">{act === 'ADD' ? 'Request a new supplier' : 'Remove existing supplier'}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="req-supplier" className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="req-supplier"
                    value={formSupplierId}
                    onChange={(e) => setFormSupplierId(e.target.value)}
                    className={`w-full appearance-none px-4 py-2.5 pr-10 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white ${errors.supplier ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  >
                    <option value="">Select supplier to {formAction === 'ADD' ? 'add' : 'remove'}...</option>
                    {selectableSuppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {errors.supplier && <p className="text-xs text-red-600 mt-1">{errors.supplier}</p>}
                {selectableSuppliers.length === 0 && <p className="text-xs text-gray-400 mt-1">No suppliers available for this action type.</p>}
              </div>

              <div>
                <label htmlFor="req-reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason / Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="req-reason"
                  rows={4}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="Explain why you need this supplier change..."
                  className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none ${errors.reason ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
                {errors.reason && <p className="text-xs text-red-600 mt-1">{errors.reason}</p>}
              </div>

              <button onClick={handleSubmit} className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium">
                <Send className="w-4 h-4" /> Submit Request
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h2 className="font-semibold text-gray-900">Request History</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No request history yet.</div>
              ) : (
                history.map((req) => {
                  const sc = STATUS_CFG[req.status];
                  return (
                    <div key={req.requestId} className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${req.action === 'ADD' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{req.action}</span>
                            <p className="text-sm font-semibold text-gray-900">{req.supplierName}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{req.reason}</p>
                          {req.reviewNote && <p className="text-xs text-gray-400 mt-1 italic">&ldquo;{req.reviewNote}&rdquo;</p>}
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sc.cls}`}>{sc.label}</span>
                          <p className="text-xs text-gray-400 mt-1">{req.submittedAt}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
