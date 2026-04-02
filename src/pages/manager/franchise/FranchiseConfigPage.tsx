import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, ChevronDown } from 'lucide-react';
import { getManagerFranchises } from '../../../services/franchiseService';
import { resolveManagerSelectableFranchise } from '../../../utils/managerFranchiseSelection';
import { OpeningHoursPage } from './OpeningHoursPage';

type FranchiseItem = {
  franchiseId?: string;
  franchiseCode?: string;
  franchiseName?: string;
  region?: string;
  status?: string;
};

export function FranchiseConfigPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedFranchiseId = searchParams.get('id');

  const [franchises, setFranchises] = useState<FranchiseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFranchise, setSelectedFranchise] = useState<FranchiseItem | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadFranchises() {
      setLoading(true);
      setError('');

      try {
        const response = await getManagerFranchises();
        const list = response?.data?.content ?? response?.content ?? response?.data ?? response;

        if (!mounted) return;

        if (!Array.isArray(list) || list.length === 0) {
          setFranchises([]);
          setSelectedFranchise(null);
          return;
        }

        const items = (list as FranchiseItem[]).filter((item) =>
          resolveManagerSelectableFranchise(item),
        );

        if (items.length === 0) {
          setFranchises([]);
          setSelectedFranchise(null);
          return;
        }

        const matched =
          items.find((item) => item.franchiseId === selectedFranchiseId) ?? items[0];

        setFranchises(items);
        setSelectedFranchise(matched);

        if (matched?.franchiseId && matched.franchiseId !== selectedFranchiseId) {
          setSearchParams({ id: matched.franchiseId }, { replace: true });
        }
      } catch (err: unknown) {
        if (mounted) {
          const message =
            err instanceof Error ? err.message : 'Failed to load franchises';
          setError(message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadFranchises();

    return () => {
      mounted = false;
    };
  }, [selectedFranchiseId, setSearchParams]);

  const handleSelectFranchise = (franchise: FranchiseItem) => {
    setSelectedFranchise(franchise);
    setShowDropdown(false);

    if (franchise.franchiseId) {
      setSearchParams({ id: franchise.franchiseId });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Franchise Configuration</h1>
        <p className="mt-1 text-gray-600">
          View and update opening hours for your franchises
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-2 font-semibold text-gray-900">Your Franchises</h3>

        {loading && <p className="text-sm text-gray-600">Loading franchises...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && franchises.length === 0 && (
          <p className="text-sm text-gray-600">No franchises found.</p>
        )}

        {franchises.length > 0 && selectedFranchise && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown((current) => !current)}
              className="flex w-full items-center justify-between rounded-lg border bg-white p-4 text-left transition-colors hover:bg-gray-50"
            >
              <div>
                <div className="font-medium text-gray-900">
                  {selectedFranchise.franchiseName || selectedFranchise.franchiseCode}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {selectedFranchise.franchiseCode} | {selectedFranchise.region || '-'}
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  showDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showDropdown && (
              <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-lg border bg-white shadow-lg">
                {franchises.map((franchise) => (
                  <button
                    key={franchise.franchiseId || franchise.franchiseCode}
                    onClick={() => handleSelectFranchise(franchise)}
                    className={`w-full border-b p-3 text-left transition-colors last:border-b-0 hover:bg-amber-50 ${
                      selectedFranchise.franchiseId === franchise.franchiseId
                        ? 'bg-amber-100'
                        : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900 text-sm">
                      {franchise.franchiseName || franchise.franchiseCode}
                    </div>
                    <div className="text-xs text-gray-500">
                      {franchise.franchiseCode} | {franchise.region || '-'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
              <Building2 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">Opening Hours</p>
              <p className="mt-1 text-sm text-gray-500">
                {selectedFranchise
                  ? `Manage weekly schedule for ${selectedFranchise.franchiseName || selectedFranchise.franchiseCode}`
                  : 'Select a franchise to view opening hours'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <OpeningHoursPage
            franchiseId={selectedFranchise?.franchiseId ?? null}
            showHeader={false}
          />
        </div>
      </div>
    </div>
  );
}
