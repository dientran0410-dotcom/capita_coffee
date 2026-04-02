import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import FranchiseStaffManagement from '@/components/franchise/FranchiseStaffManagement';
import franchiseService from '@/services/franchiseService';

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

export const FranchiseStaffPage: React.FC = () => {
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
        <div className="text-lg text-gray-600">Loading...</div>
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
            <ChevronLeft className="w-4 h-4" />
            Back
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
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {franchise.franchiseName || franchise.franchiseCode}
          </h1>
          <p className="text-gray-600 mt-2">
            Manage staff assignments for this franchise
          </p>
        </div>

        {/* Franchise Info Card */}
        <div className="mb-6 p-6 bg-white rounded-lg shadow border border-gray-200">
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

        {/* Staff Management Component */}
        {id && (
          <div className="bg-white rounded-lg shadow">
            <FranchiseStaffManagement
              franchiseId={id}
              franchiseName={franchise.franchiseName}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FranchiseStaffPage;
