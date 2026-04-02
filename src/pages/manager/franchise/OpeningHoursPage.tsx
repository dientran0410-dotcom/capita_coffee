import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, LoaderCircle, Save } from 'lucide-react';
import {
  getOpeningHours,
  updateOpeningHours,
} from '../../../services/franchiseService';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

type DaySchedule = {
  open: string;
  close: string;
  closed: boolean;
};

type WeeklySchedule = Record<DayKey, DaySchedule>;

type ApiTime =
  | string
  | number[]
  | {
      hour?: number;
      minute?: number;
      second?: number;
      nano?: number;
    }
  | null
  | undefined;

type OpeningHourItem = {
  franchiseId?: string;
  dayOfWeek?: string;
  openTime?: ApiTime;
  closeTime?: ApiTime;
  isClosed?: boolean;
};

type OpeningHoursPageProps = {
  franchiseId?: string | null;
  showHeader?: boolean;
  title?: string;
  description?: string;
};

const DAYS: Array<{ key: DayKey; label: string; apiValue: string }> = [
  { key: 'monday', label: 'Monday', apiValue: 'MONDAY' },
  { key: 'tuesday', label: 'Tuesday', apiValue: 'TUESDAY' },
  { key: 'wednesday', label: 'Wednesday', apiValue: 'WEDNESDAY' },
  { key: 'thursday', label: 'Thursday', apiValue: 'THURSDAY' },
  { key: 'friday', label: 'Friday', apiValue: 'FRIDAY' },
  { key: 'saturday', label: 'Saturday', apiValue: 'SATURDAY' },
  { key: 'sunday', label: 'Sunday', apiValue: 'SUNDAY' },
];

const DEFAULT_HOURS: Record<DayKey, { open: string; close: string }> = {
  monday: { open: '07:00', close: '22:00' },
  tuesday: { open: '07:00', close: '22:00' },
  wednesday: { open: '07:00', close: '22:00' },
  thursday: { open: '07:00', close: '22:00' },
  friday: { open: '07:00', close: '23:00' },
  saturday: { open: '07:00', close: '23:00' },
  sunday: { open: '08:00', close: '21:00' },
};

function createEmptySchedule(): WeeklySchedule {
  return {
    monday: { ...DEFAULT_HOURS.monday, closed: true },
    tuesday: { ...DEFAULT_HOURS.tuesday, closed: true },
    wednesday: { ...DEFAULT_HOURS.wednesday, closed: true },
    thursday: { ...DEFAULT_HOURS.thursday, closed: true },
    friday: { ...DEFAULT_HOURS.friday, closed: true },
    saturday: { ...DEFAULT_HOURS.saturday, closed: true },
    sunday: { ...DEFAULT_HOURS.sunday, closed: true },
  };
}

function cloneSchedule(schedule: WeeklySchedule): WeeklySchedule {
  return {
    monday: { ...schedule.monday },
    tuesday: { ...schedule.tuesday },
    wednesday: { ...schedule.wednesday },
    thursday: { ...schedule.thursday },
    friday: { ...schedule.friday },
    saturday: { ...schedule.saturday },
    sunday: { ...schedule.sunday },
  };
}

function toDayKey(dayOfWeek?: string): DayKey | null {
  const normalized = String(dayOfWeek || '').toLowerCase();
  return DAYS.find((day) => day.key === normalized)?.key ?? null;
}

function toTimeInputValue(value: ApiTime, fallback: string): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    return trimmed.slice(0, 5);
  }

  if (Array.isArray(value)) {
    const [hour = 0, minute = 0] = value;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  if (value && typeof value === 'object') {
    const hour = value.hour ?? 0;
    const minute = value.minute ?? 0;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  return fallback;
}

function buildSchedule(items: OpeningHourItem[]): WeeklySchedule {
  const schedule = createEmptySchedule();

  items.forEach((item) => {
    const dayKey = toDayKey(item.dayOfWeek);
    if (!dayKey) return;

    schedule[dayKey] = {
      open: toTimeInputValue(item.openTime, DEFAULT_HOURS[dayKey].open),
      close: toTimeInputValue(item.closeTime, DEFAULT_HOURS[dayKey].close),
      closed: item.isClosed === true ? true : false,
    };
  });

  return schedule;
}

export function OpeningHoursPage({
  franchiseId: franchiseIdProp,
  showHeader = true,
  title = 'Opening Hours',
  description = 'View and update store opening hours for each day of the week',
}: OpeningHoursPageProps = {}) {
  const [searchParams] = useSearchParams();
  const resolvedFranchiseId =
    franchiseIdProp !== undefined ? franchiseIdProp : searchParams.get('id');

  const [schedule, setSchedule] = useState<WeeklySchedule>(() => createEmptySchedule());
  const [initialSchedule, setInitialSchedule] = useState<WeeklySchedule>(() =>
    createEmptySchedule()
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadOpeningHours() {
      if (!resolvedFranchiseId) {
        const emptySchedule = createEmptySchedule();
        if (mounted) {
          setInitialSchedule(emptySchedule);
          setSchedule(emptySchedule);
          setErrors({});
          setHasChanges(false);
        }
        return;
      }

      setLoading(true);

      try {
        const response = await getOpeningHours(resolvedFranchiseId);
        const list = response?.data ?? response;
        const nextSchedule = buildSchedule(
          Array.isArray(list) ? (list as OpeningHourItem[]) : []
        );

        if (mounted) {
          setInitialSchedule(nextSchedule);
          setSchedule(cloneSchedule(nextSchedule));
          setErrors({});
          setHasChanges(false);
        }
      } catch (err: unknown) {
        if (mounted) {
          const message =
            err instanceof Error ? err.message : 'Failed to load opening hours';
          showErrorToast(message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOpeningHours();

    return () => {
      mounted = false;
    };
  }, [resolvedFranchiseId]);

  const updateDay = (
    day: DayKey,
    field: 'open' | 'close' | 'closed',
    value: string | boolean
  ) => {
    setSchedule((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [field]: value,
      },
    }));
    setErrors((current) => ({ ...current, [day]: undefined }));
    setHasChanges(true);
  };

  const validate = () => {
    const nextErrors: Record<string, string | undefined> = {};

    for (const { key } of DAYS) {
      const day = schedule[key];
      if (!day.closed && day.open >= day.close) {
        nextErrors[key] = 'Close time must be after open time';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (!resolvedFranchiseId) {
        throw new Error('Missing franchise id');
      }

      const payloads = DAYS.map(({ key, apiValue }) => ({
          dayOfWeek: apiValue,
          openTime: `${schedule[key].open}:00`,
          closeTime: `${schedule[key].close}:00`,
          isClosed: schedule[key].closed,
        }));

      setSaving(true);
      await Promise.all(payloads.map((payload) => updateOpeningHours(resolvedFranchiseId, payload)));

      const refreshed = await getOpeningHours(resolvedFranchiseId);
      const refreshedList = refreshed?.data ?? refreshed;
      const nextSchedule = buildSchedule(
        Array.isArray(refreshedList) ? (refreshedList as OpeningHourItem[]) : []
      );

      setInitialSchedule(nextSchedule);
      setSchedule(cloneSchedule(nextSchedule));
      setHasChanges(false);
      showSuccessToast('Opening hours saved successfully');
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Unknown error';
      showErrorToast(`Save failed: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSchedule(cloneSchedule(initialSchedule));
    setErrors({});
    setHasChanges(false);
  };

  const handleApplyAll = (day: DayKey) => {
    const source = schedule[day];
    setSchedule((current) => {
      const updated = cloneSchedule(current);
      for (const { key } of DAYS) {
        if (key !== day) {
          updated[key] = { ...source };
        }
      }
      return updated;
    });
    setHasChanges(true);
  };

  const openDays = DAYS.filter((day) => !schedule[day.key].closed).length;
  const closedDays = DAYS.length - openDays;

  const typicalHours =
    openDays > 0
      ? (() => {
          const opens = DAYS.filter((day) => !schedule[day.key].closed)
            .map((day) => schedule[day.key].open)
            .filter(Boolean)
            .sort();
          const closes = DAYS.filter((day) => !schedule[day.key].closed)
            .map((day) => schedule[day.key].close)
            .filter(Boolean)
            .sort()
            .reverse();
          const minOpen = opens[0] || '';
          const maxClose = closes[0] || '';
          return minOpen && maxClose ? `${minOpen}-${maxClose}` : '-';
        })()
      : '-';

  if (!resolvedFranchiseId) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
        Select a franchise to view and update opening hours.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="mt-1 text-gray-600">{description}</p>
          </div>

          {hasChanges && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-xs font-medium text-amber-700">Unsaved changes</span>
            </div>
          )}
        </div>
      )}

      {!showHeader && hasChanges && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-xs font-medium text-amber-700">Unsaved changes</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-2xl font-bold text-green-600">{openDays}</p>
          <p className="mt-0.5 text-sm text-gray-600">Days Open</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-2xl font-bold text-gray-500">{closedDays}</p>
          <p className="mt-0.5 text-sm text-gray-600">Days Closed</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-2xl font-bold text-amber-600">{typicalHours}</p>
          <p className="mt-0.5 text-sm text-gray-600">Typical Hours</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900">
            <Clock className="h-4 w-4 text-amber-600" />
            Weekly Schedule
          </h2>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {loading && (
              <span className="flex items-center gap-1">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                Loading saved hours
              </span>
            )}
            <span>Click "Apply to All" to copy a day's hours to all other days</span>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {DAYS.map(({ key, label }) => {
            const day = schedule[key];
            const isWeekend = key === 'saturday' || key === 'sunday';

            return (
              <div
                key={key}
                className={`flex items-center gap-4 px-6 py-4 ${
                  isWeekend ? 'bg-amber-50/40' : ''
                } ${day.closed ? 'opacity-60' : ''}`}
              >
                <div className="w-28 flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  {isWeekend && <span className="text-xs text-amber-600">Weekend</span>}
                </div>

                <label className="flex flex-shrink-0 select-none items-center gap-2">
                  <div
                    className={`relative h-5 w-10 rounded-full transition-colors ${
                      day.closed ? 'bg-gray-400' : 'bg-amber-600'
                    }`}
                    onClick={() => updateDay(key, 'closed', !day.closed)}
                  >
                    <div
                      className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        day.closed ? 'translate-x-0' : 'translate-x-5'
                      }`}
                    />
                  </div>

                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={day.closed}
                    onChange={(event) => updateDay(key, 'closed', event.target.checked)}
                  />
                  <span className="w-10 text-xs text-gray-500">
                    {day.closed ? 'Closed' : 'Open'}
                  </span>
                </label>

                <div className="flex flex-1 items-center gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-gray-500">Open</label>
                    <input
                      type="time"
                      value={day.open}
                      disabled={day.closed}
                      onChange={(event) => updateDay(key, 'open', event.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>

                  <span className="mt-4 text-sm text-gray-400">&rarr;</span>

                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-gray-500">Close</label>
                    <input
                      type="time"
                      value={day.close}
                      disabled={day.closed}
                      onChange={(event) => updateDay(key, 'close', event.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100 disabled:text-gray-400 ${
                        errors[key] ? 'border-red-400 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                  </div>
                </div>

                {!day.closed && !errors[key] && (
                  <div className="w-20 text-right text-xs text-gray-500">
                    {(() => {
                      const [openHour, openMinute] = day.open.split(':').map(Number);
                      const [closeHour, closeMinute] = day.close.split(':').map(Number);
                      const minutes =
                        closeHour * 60 + closeMinute - (openHour * 60 + openMinute);
                      const hours = Math.floor(minutes / 60);
                      const remainder = minutes % 60;
                      return minutes > 0
                        ? `${hours}h${remainder > 0 ? ` ${remainder}m` : ''}`
                        : '';
                    })()}
                  </div>
                )}

                {!day.closed && (
                  <button
                    onClick={() => handleApplyAll(key)}
                    className="whitespace-nowrap rounded-lg px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 hover:text-amber-800"
                  >
                    Apply to All
                  </button>
                )}

                {errors[key] && <p className="w-40 text-xs text-red-600">{errors[key]}</p>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300"
        >
          {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Opening Hours'}
        </button>

        <button
          onClick={handleReset}
          disabled={saving || loading}
          className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Reset to Saved
        </button>
      </div>
    </div>
  );
}
