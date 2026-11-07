// Campaigns v2 workflow, ported from the mh-camp prototype (lib/masterData.ts and lib/logic.ts).
// Pure data and functions only: no database access, so it can be unit-checked
// (see backend/scripts/checkWorkflowV2.js).
//
// Role references:
//   live role strings  e.g. 'zonal_marketing_manager' (prototype zmm), 'brand_manager' (bm),
//                      'marketing_manager' (mm), 'admin' / 'master_admin' (prototype admin)
//   AGENCY             the agency USER assigned to the campaign (campaign.agency)
//   HANDED_TO          the agency USERS the campaign is handed to at the end (campaign.handedTo)

export const ROLE = {
  ZMM: 'zonal_marketing_manager',
  BM: 'brand_manager',
  MM: 'marketing_manager',
  ADMIN: 'admin',
  MASTER_ADMIN: 'master_admin',
  AGENCY_ROLE: 'agency', // users with this role can be assigned as campaign.agency / handedTo
};
export const AGENCY = 'AGENCY';
export const HANDED_TO = 'HANDED_TO';

// Prototype ref → live role refs
const ZMM = [ROLE.ZMM];
const BM = [ROLE.BM];
const MM = [ROLE.MM];
const ADMIN = [ROLE.ADMIN, ROLE.MASTER_ADMIN];
const MM_ADMIN = [...MM, ...ADMIN];

// Tracker steps shown on a campaign (prototype FLOW).
export const FLOW = [
  { label: 'Campaign Created', roles: ZMM },
  { label: 'Offers Approved', roles: BM, decision: true },
  { label: 'Assigned to Agency', roles: MM_ADMIN },
  { label: 'Status Changed', roles: [AGENCY] },
  { label: 'Artwork Uploaded', roles: [AGENCY] },
  { label: 'Artwork Approved', roles: ZMM, decision: true },
  { label: 'Creative Link Shared', roles: [AGENCY] },
  { label: 'Landing Page Added & Assigned', roles: MM_ADMIN },
  { label: 'Campaign Status Change', roles: [HANDED_TO] },
];

// step = how many tracker steps are complete; wait = who the campaign is waiting for.
export const STATUS = {
  draft:                  { label: 'Draft',                          wait: ZMM,       step: 0, cls: 'draft' },
  pending_offer_approval: { label: 'Awaiting offer approval',        wait: BM,        step: 1 },
  offers_rejected:        { label: 'Offers rejected (some states)',  wait: ZMM,       step: 1, cls: 'bad' },
  offers_approved:        { label: 'Offers approved',                wait: MM_ADMIN,  step: 2 },
  assigned:               { label: 'Assigned to agency',             wait: [AGENCY],  step: 3 },
  in_progress:            { label: 'Agency preparing artwork',       wait: [AGENCY],  step: 4 },
  content_uploaded:       { label: 'Awaiting artwork approval',      wait: ZMM,       step: 5 },
  content_rejected:       { label: 'Artwork rejected (some states)', wait: [AGENCY],  step: 5, cls: 'bad' },
  artwork_approved:       { label: 'Awaiting creative links',        wait: [AGENCY],  step: 6 },
  links_submitted:        { label: 'Awaiting landing pages',         wait: MM_ADMIN,  step: 7 },
  completed:              { label: 'Completed',                      wait: [],        step: 9, cls: 'ok' },
};
export const STATUS_KEYS = Object.keys(STATUS);

// One row per flowchart transition: who may act, from which statuses, where it goes, who is mailed.
export const WORKFLOW = {
  submit:         { event: 'Campaign created',                    from: ['draft', 'offers_rejected'],        roles: ZMM,       to: 'pending_offer_approval', mail: [...MM_ADMIN, ...ZMM, ...BM] },
  approveOffers:  { event: 'Offers approved',                     from: ['pending_offer_approval'],          roles: BM,        to: 'offers_approved',        mail: [...MM_ADMIN, ...ZMM, ...BM] },
  rejectOffers:   { event: 'Offers rejected',                     from: ['pending_offer_approval'],          roles: BM,        to: 'offers_rejected',        mail: [...MM_ADMIN, ...ZMM, ...BM] },
  assign:         { event: 'Assigned to agency',                  from: ['offers_approved'],                 roles: MM_ADMIN,  to: 'assigned',               mail: [AGENCY, ...MM_ADMIN] },
  changeStatus:   { event: 'Status changed',                      from: ['assigned', 'in_progress'],         roles: [AGENCY],  to: 'in_progress',            mail: [AGENCY, ...MM_ADMIN] },
  uploadContent:  { event: 'Artwork uploaded',                    from: ['in_progress', 'content_rejected'], roles: [AGENCY],  to: 'content_uploaded',       mail: [] },
  approveContent: { event: 'Artwork approved',                    from: ['content_uploaded'],                roles: ZMM,       to: 'artwork_approved',       mail: [AGENCY, ...MM_ADMIN, ...ZMM] },
  rejectContent:  { event: 'Artwork rejected',                    from: ['content_uploaded'],                roles: ZMM,       to: 'content_rejected',       mail: [AGENCY, ...ZMM, ...BM, ...MM_ADMIN] },
  submitLinks:    { event: 'Creative links shared',               from: ['artwork_approved'],                roles: [AGENCY],  to: 'links_submitted',        mail: [...MM_ADMIN, ...ZMM] },
  assignSecond:   { event: 'Landing pages added and handed over', from: ['links_submitted'],                 roles: MM_ADMIN,  to: 'completed',              mail: [HANDED_TO, AGENCY, ...MM_ADMIN, ...ZMM] },
};
export const ACTION_KEYS = Object.keys(WORKFLOW);

// ---------- Limits ----------
export const MAX_ITEMS = 2;    // brand sections per offer
export const MAX_FEATURES = 3; // features per brand section
export const MIN_PRICE_DIGITS = 6;
export const MAX_PRICE_DIGITS = 9;
export const ARTWORK_TYPES = ['image/png', 'image/jpeg'];
export const MAX_ARTWORK_MB = 5;

// ---------- Helpers ----------
const idString = (v) => (v == null ? '' : String(v._id ?? v));

/** Does the user match one role ref, given the campaign (for AGENCY / HANDED_TO)? */
export const matchesRoleRef = (ref, campaign, user) => {
  if (!user) return false;
  const userId = idString(user._id ?? user.userId);
  if (ref === AGENCY) return !!campaign?.agency && idString(campaign.agency) === userId;
  if (ref === HANDED_TO) return (campaign?.handedTo || []).some((u) => idString(u) === userId);
  return user.role === ref;
};

/** Can this user run this action on the campaign right now? (status + role) */
export const canDo = (action, campaign, user) => {
  const row = WORKFLOW[action];
  if (!row || !campaign) return false;
  return row.from.includes(campaign.status) && row.roles.some((ref) => matchesRoleRef(ref, campaign, user));
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** '2026-10' → 'OCT-26' */
export const fmtMonth = (month) => {
  if (!MONTH_PATTERN.test(month || '')) return '';
  const [y, m] = month.split('-');
  return `${MONTHS[Number(m) - 1]}-${y.slice(2)}`;
};

/** 'Zone 1' → 'Z1'; other names → their first three letters ('North' → 'NOR'). */
export const zoneCode = (zone) => {
  const n = String(zone || '').match(/\d+/)?.[0];
  return n ? `Z${n}` : String(zone || '').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'Z';
};

/** Offer code from zone, month and serial, e.g. Z1-OCT26-00012. */
export const offerCode = (zone, month, serial) =>
  `${zoneCode(zone)}-${fmtMonth(month).replace('-', '')}-${String(serial).padStart(5, '0')}`;

/** Prices are whole rupees with 6–9 digits (₹1,00,000 to ₹99,99,99,999), no leading zero. */
export const validPrice = (v) =>
  (typeof v === 'number' || typeof v === 'string') &&
  new RegExp(`^[1-9]\\d{${MIN_PRICE_DIGITS - 1},${MAX_PRICE_DIGITS - 1}}$`).test(String(v).trim());

/** States that have offers in the campaign, in first-offer order. */
export const campaignStates = (campaign) => [...new Set((campaign?.offers || []).map((o) => o.state).filter(Boolean))];

// The two approvals that run state by state: offers (Brand Manager) and content/artwork (Zonal Manager).
const OUTCOME = {
  offers: ['pending_offer_approval', 'offers_rejected', 'offers_approved'],
  content: ['content_uploaded', 'content_rejected', 'artwork_approved'],
};

const approvalStatus = (approvals, state) => {
  if (!approvals) return undefined;
  const entry = approvals instanceof Map ? approvals.get(state) : approvals[state];
  return entry?.status;
};

/**
 * Campaign status after per-state decisions change.
 * Waits while any state is undecided; then goes back if any state was rejected; else approved.
 * kind: 'offers' | 'content'; approvals: Map or plain object keyed by state name.
 */
export const statusAfter = (kind, campaign, approvals) => {
  const outcome = OUTCOME[kind];
  if (!outcome) throw new Error(`Unknown approval kind: ${kind}`);
  const [waiting, rejected, approved] = outcome;
  const decisions = campaignStates(campaign).map((s) => approvalStatus(approvals, s));
  if (decisions.some((d) => d !== 'approved' && d !== 'rejected')) return waiting;
  return decisions.includes('rejected') ? rejected : approved;
};
