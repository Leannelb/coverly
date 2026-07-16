// Mock "backend": stands in for the API + Postgres layer in §4/§5 of the spec. State is
// persisted to localStorage so the prototype survives reloads without a real server.
// File blobs are never persisted (not meaningfully serializable) — only document metadata.

/* eslint-disable react-refresh/only-export-components -- this module intentionally
   pairs the store Provider with its hooks/selectors/actions as one cohesive API */
import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

const STORAGE_KEY = 'coverly.state.v1';

const STATUS_ORDER = [
  'referral_uploaded',
  'specialist_selected',
  'booking_requested',
  'confirmed',
  'attended',
  'claim_submitted',
  'rebate_received',
];

export const STATUS_LABELS = {
  referral_uploaded: 'Referral uploaded',
  specialist_selected: 'Specialist selected',
  booking_requested: 'Booking requested',
  confirmed: 'Confirmed',
  attended: 'Attended',
  claim_submitted: 'Claim submitted',
  rebate_received: 'Rebate received',
};

function initialState() {
  return {
    user: null,
    policy: null,
    consents: null,
    cases: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw);
    return { ...initialState(), ...parsed };
  } catch {
    return initialState();
  }
}

function nowIso() {
  return new Date().toISOString();
}

export function makeCaseId() {
  return `case-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function withStatus(kase, status) {
  return {
    ...kase,
    status,
    updatedAt: nowIso(),
    statusHistory: [...kase.statusHistory, { status, at: nowIso() }],
  };
}

function mapCase(state, caseId, fn) {
  return { ...state, cases: state.cases.map((c) => (c.id === caseId ? fn(c) : c)) };
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user };

    case 'SET_POLICY':
      return { ...state, policy: { ...action.policy, confirmedAt: nowIso() } };

    case 'SET_CONSENTS':
      return { ...state, consents: action.consents };

    case 'CREATE_CASE': {
      const id = action.caseId ?? makeCaseId();
      const kase = {
        id,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        referral: action.referral,
        category: action.category,
        specialistId: null,
        shortlist: [],
        status: 'referral_uploaded',
        statusHistory: [{ status: 'referral_uploaded', at: nowIso() }],
        appointment: null,
        preauthAcknowledged: false,
        rebateEstimate: null,
        rebateActual: null,
        documents: [
          {
            id: `doc-${id}-referral`,
            type: 'referral',
            name: action.referral.sourceFileName || 'Referral letter',
            uploadedAt: nowIso(),
          },
        ],
        review: null,
      };
      return { ...state, cases: [kase, ...state.cases] };
    }

    case 'TOGGLE_SHORTLIST':
      return mapCase(state, action.caseId, (c) => ({
        ...c,
        shortlist: c.shortlist.includes(action.specialistId)
          ? c.shortlist.filter((id) => id !== action.specialistId)
          : [...c.shortlist, action.specialistId],
      }));

    case 'SELECT_SPECIALIST':
      return mapCase(state, action.caseId, (c) =>
        withStatus(
          { ...c, specialistId: action.specialistId, rebateEstimate: action.rebateEstimate },
          'specialist_selected'
        )
      );

    case 'REQUEST_BOOKING':
      return mapCase(state, action.caseId, (c) =>
        withStatus(
          {
            ...c,
            appointment: { preferredNotes: action.notes, datetime: null },
            documents: [
              ...c.documents,
              { id: `doc-${c.id}-booking`, type: 'correspondence', name: 'Booking request sent', uploadedAt: nowIso() },
            ],
          },
          'booking_requested'
        )
      );

    case 'CONFIRM_BOOKING':
      return mapCase(state, action.caseId, (c) =>
        withStatus(
          {
            ...c,
            appointment: { ...c.appointment, datetime: action.datetime },
            documents: [
              ...c.documents,
              { id: `doc-${c.id}-confirm`, type: 'correspondence', name: 'Appointment confirmation', uploadedAt: nowIso() },
            ],
          },
          'confirmed'
        )
      );

    case 'ACK_PREAUTH':
      return mapCase(state, action.caseId, (c) => ({ ...c, preauthAcknowledged: true }));

    case 'MARK_ATTENDED':
      return mapCase(state, action.caseId, (c) => withStatus(c, 'attended'));

    case 'LOG_RECEIPT':
      return mapCase(state, action.caseId, (c) => ({
        ...c,
        rebateActual: { ...(c.rebateActual ?? {}), actualFee: action.actualFee, visitDate: action.visitDate },
        documents: [
          ...c.documents,
          { id: `doc-${c.id}-receipt`, type: 'receipt', name: action.fileName || 'Receipt', uploadedAt: nowIso() },
        ],
      }));

    case 'SUBMIT_CLAIM':
      return mapCase(state, action.caseId, (c) =>
        withStatus(
          {
            ...c,
            rebateActual: { ...(c.rebateActual ?? {}), submittedAt: nowIso(), claimReference: action.claimReference },
            documents: [
              ...c.documents,
              { id: `doc-${c.id}-claim`, type: 'correspondence', name: 'Claim submitted to insurer', uploadedAt: nowIso() },
            ],
          },
          'claim_submitted'
        )
      );

    case 'LOG_REBATE_RECEIVED':
      return mapCase(state, action.caseId, (c) =>
        withStatus(
          { ...c, rebateActual: { ...(c.rebateActual ?? {}), actualRebate: action.actualRebate, receivedAt: nowIso() } },
          'rebate_received'
        )
      );

    case 'ADD_REVIEW':
      return mapCase(state, action.caseId, (c) => ({
        ...c,
        review: { rating: action.rating, comment: action.comment, createdAt: nowIso() },
      }));

    case 'RESET_DEMO':
      return initialState();

    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function getCase(state, caseId) {
  return state.cases.find((c) => c.id === caseId) ?? null;
}

// Sums rebate exposure for a category: reserved (in-flight cases) + actual (completed),
// so estimates for a new visit account for allowance already committed this policy year.
export function allowanceUsedForCategory(state, category, excludeCaseId = null) {
  return state.cases.reduce((sum, c) => {
    if (c.id === excludeCaseId || c.category !== category) return sum;
    if (c.status === 'rebate_received') {
      return sum + (c.rebateActual?.actualRebate ?? c.rebateEstimate?.estimatedRebate ?? 0);
    }
    if (STATUS_ORDER.indexOf(c.status) >= STATUS_ORDER.indexOf('specialist_selected')) {
      return sum + (c.rebateEstimate?.estimatedRebate ?? 0);
    }
    return sum;
  }, 0);
}

export function specialtyToCategory(specialty) {
  return specialty === 'Physiotherapy' ? 'physio' : 'consultant';
}

// Derived "needs attention" banners — no separate notifications table, computed from case state.
export function buildReminders(cases) {
  const reminders = [];
  for (const c of cases) {
    if (c.status === 'confirmed' && c.rebateEstimate?.requiresPreauth && !c.preauthAcknowledged) {
      reminders.push({ id: `${c.id}-preauth`, caseId: c.id, text: `Pre-authorisation still needs to be submitted for your ${c.referral.specialty} visit.` });
    }
    if (c.status === 'attended') {
      reminders.push({ id: `${c.id}-receipt`, caseId: c.id, text: `Upload your receipt for your ${c.referral.specialty} visit to keep your rebate moving.` });
    }
    if (c.status === 'claim_submitted') {
      reminders.push({ id: `${c.id}-rebate`, caseId: c.id, text: `Log your rebate once it arrives for your ${c.referral.specialty} claim.` });
    }
  }
  return reminders;
}

export { STATUS_ORDER };
