import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, RefreshCw, Mail, Phone } from 'lucide-react';
import franchiseService from '@/services/franchiseService';
import { http } from '@/utils/axiosClient';

export type Franchise = {
  franchiseId?: string;
  franchiseCode?: string;
  franchiseName?: string;
  address?: string;
  region?: string;
  timezone?: string;
  status?: string;
  [key: string]: unknown;
};

function getStatusColor(status?: string): string {
  if (status === 'ACTIVE') return 'bg-green-100 text-green-800';
  if (status === 'SUSPENDED') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
}

// 1. COMPONENT HIỂN THỊ STAFF ĐÃ ĐƯỢC FIX LỖI LỌC THEO CHI NHÁNH
const ManagerCurrentStaff: React.FC<{ branchId: string }> = ({ branchId }) => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      // Truyền cả branchId và franchiseId để phòng hờ Backend dùng tên nào
      const q = new URLSearchParams({ page: '0', size: '1000', branchId, franchiseId: branchId });
      const res: any = await http(`/api/shift-service/staffs?${q.toString()}`);
      
      const rawData = res?.content || res || [];

      // FIX BUG Ở ĐÂY: Ép lọc dữ liệu ở Frontend để chắc chắn 100% không bị lọt nhân viên chi nhánh khác
      const currentBranchStaff = rawData.filter((staff: any) => 
        staff.branchId === branchId || staff.franchiseId === branchId
      );

      setStaffList(currentBranchStaff);
    } catch (err) {
      console.error("Failed to fetch staff", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) fetchStaff();
  }, [branchId]);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mt-6">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Current Staff ({staffList.length})
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách nhân viên đang làm việc tại chi nhánh này. Để thêm hoặc chuyển công tác, vui lòng sử dụng chức năng Update bên trang <b>Staff Management</b>.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button 
            onClick={() => navigate('/manager/staff/list')} 
            className="text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Go to Staff Management
          </button>
          <button 
            onClick={fetchStaff} 
            className="text-sm flex items-center gap-1.5 text-gray-600 hover:text-blue-600 border border-gray-200 px-3 py-2 rounded-lg bg-gray-50 hover:bg-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[200px] relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        )}
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff ID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loading && staffList.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-sm">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Chưa có nhân viên nào thuộc chi nhánh này.</p>
                </td>
              </tr>
            ) : (
              staffList.map((staff, idx) => (
                <tr key={staff.id || idx} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded text-xs font-bold">
                      {staff.staffCode || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-gray-900">{staff.name || staff.staffName}</div>
                      {staff.gender && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          staff.gender === 'MALE' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-pink-50 text-pink-600 border-pink-100'
                        }`}>
                          {staff.gender}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                      <Mail className="w-3 h-3" /> {staff.email || 'No email'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> {staff.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      staff.status === 'INACTIVE' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${staff.status === 'INACTIVE' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                      {staff.status === 'INACTIVE' ? 'Inactive' : 'Working'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 2. MAIN COMPONENT PAGE
export const ManagerFranchiseStaffPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFranchiseDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        throw new Error('Franchise ID is missing');
      }

      const res = await franchiseService.getById(id);
      const franchiseData = (res?.data ?? res) as Franchise | null;

      if (!franchiseData) {
        throw new Error('Failed to load franchise details');
      }

      setFranchise(franchiseData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load franchise';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const memoizedLoad = useCallback(() => {
    if (!id) {
      setError('Franchise ID not provided');
      setLoading(false);
      return;
    }
    loadFranchiseDetail();
  }, [id]);

  useEffect(() => {
    memoizedLoad();
  }, [memoizedLoad]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={loadFranchiseDetail}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!franchise) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto text-center text-gray-600">
          Franchise not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Navigation */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {franchise.franchiseName || franchise.franchiseCode}
          </h1>
          <p className="text-gray-600 mt-2">
            Franchise Overview & Staff Details
          </p>
        </div>

        {/* Franchise Info Card */}
        <div className="p-6 bg-white rounded-lg shadow border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 font-medium">Franchise Code</p>
              <p className="text-lg text-gray-900 font-semibold mt-1">
                {franchise.franchiseCode || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Region</p>
              <p className="text-lg text-gray-900 font-semibold mt-1">
                {franchise.region || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Status</p>
              <span
                className={`inline-block px-3 py-1 text-sm font-semibold rounded-full mt-1 ${
                  getStatusColor(franchise.status)
                }`}
              >
                {franchise.status || 'UNKNOWN'}
              </span>
            </div>
            {franchise.address && (
              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-sm text-gray-600 font-medium">Address</p>
                <p className="text-gray-900 mt-1">{franchise.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. HIỂN THỊ DANH SÁCH STAFF SAU KHI ĐÃ LỌC */}
        {id && <ManagerCurrentStaff branchId={id} />}
        
      </div>
    </div>
  );
};

export default ManagerFranchiseStaffPage;