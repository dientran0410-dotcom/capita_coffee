const FRANCHISE_STATUS_CFG = {
  ACTIVE: { label: 'Active', cls: 'bg-green-100 text-green-700' },
  SUSPENDED: { label: 'Suspended', cls: 'bg-red-100 text-red-700' },
  PENDING: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' },
  INACTIVE: { label: 'Inactive', cls: 'bg-gray-100 text-gray-600' },
};

const ONBOARDING_STATUS_CFG = {
  COMPLETE: { label: 'Complete', cls: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-amber-100 text-amber-700' },
  NOT_STARTED: { label: 'Not Started', cls: 'bg-gray-100 text-gray-500' },
};

const FRANCHISE_STATUS_ALIASES = {
  ACTIVE: ['ACTIVE', 'LIVE', 'ENABLED', 'OPEN'],
  SUSPENDED: ['SUSPENDED', 'SUSPENSED', 'SUSPENSE', 'PAUSED', 'ON_HOLD', 'HOLD'],
  PENDING: ['PENDING', 'ONBOARDING', 'PENDING_APPROVAL', 'PENDING_ACTIVATION'],
  INACTIVE: ['INACTIVE', 'DEACTIVATED', 'DISABLED', 'CLOSED', 'ARCHIVED'],
};

const ONBOARDING_STATUS_ALIASES = {
  COMPLETE: ['COMPLETE', 'COMPLETED', 'DONE'],
  IN_PROGRESS: ['IN_PROGRESS', 'INPROGRESS', 'PROCESSING', 'ONGOING', 'ON_GOING'],
  NOT_STARTED: ['NOT_STARTED', 'NOTSTARTED', 'PENDING', 'TODO'],
};

function normalizeKey(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function resolveCanonicalStatus(status, aliasMap, fallbackStatus) {
  const key = normalizeKey(status);
  if (!key) return fallbackStatus;
  for (const [canonical, aliases] of Object.entries(aliasMap)) {
    if (aliases.includes(key)) return canonical;
  }
  return key;
}

function toLabel(value, fallbackLabel) {
  const key = normalizeKey(value);
  if (!key) return fallbackLabel;
  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part[0] + part.slice(1).toLowerCase())
    .join(' ');
}

export function normalizeFranchiseStatus(status) {
  return resolveCanonicalStatus(status, FRANCHISE_STATUS_ALIASES, 'PENDING');
}

export function normalizeOnboardingStatus(status) {
  return resolveCanonicalStatus(status, ONBOARDING_STATUS_ALIASES, 'NOT_STARTED');
}

export function getFranchiseStatusMeta(status, options = {}) {
  const { bordered = false } = options;
  const normalizedStatus = normalizeFranchiseStatus(status);
  const base = FRANCHISE_STATUS_CFG[normalizedStatus] ?? {
    label: toLabel(status, 'Unknown'),
    cls: 'bg-gray-100 text-gray-600',
  };
  if (!bordered) return base;

  const borderMap = {
    ACTIVE: 'border-green-200',
    SUSPENDED: 'border-red-200',
    PENDING: 'border-yellow-200',
    INACTIVE: 'border-gray-200',
  };

  return {
    ...base,
    cls: `${base.cls} ${borderMap[normalizedStatus] || borderMap.INACTIVE}`,
  };
}

export function getOnboardingStatusMeta(status) {
  const normalizedStatus = normalizeOnboardingStatus(status);
  return ONBOARDING_STATUS_CFG[normalizedStatus] ?? {
    label: toLabel(status, 'Not Started'),
    cls: ONBOARDING_STATUS_CFG.NOT_STARTED.cls,
  };
}

export function FranchiseStatusBadge({ status, className = '', bordered = false }) {
  const meta = getFranchiseStatusMeta(status, { bordered });
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${meta.cls} ${className}`}>
      {meta.label}
    </span>
  );
}

export function OnboardingStatusBadge({ status, className = '' }) {
  const meta = getOnboardingStatusMeta(status);
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${meta.cls} ${className}`}>
      {meta.label}
    </span>
  );
}
