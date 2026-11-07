// Campaigns v2 labels, copied from the backend constants/campaignV2Workflow.js (mh-camp FLOW / STATUS).
// Display only: the server decides what each user may do (campaign.permissions).

export const ROLE = {
  ZMM: "zonal_marketing_manager",
  BM: "brand_manager",
  MM: "marketing_manager",
  ADMIN: "admin",
  MASTER_ADMIN: "master_admin",
  AGENCY: "agency",
};
const AGENCY_REF = "AGENCY";
const HANDED_TO_REF = "HANDED_TO";
const MM_ADMIN = [ROLE.MM, ROLE.ADMIN, ROLE.MASTER_ADMIN];

export const ROLE_LABELS = {
  [ROLE.ZMM]: "Zonal Marketing Manager",
  [ROLE.BM]: "Brand Manager",
  [ROLE.MM]: "Marketing Manager",
  [ROLE.ADMIN]: "Admin",
  [ROLE.MASTER_ADMIN]: "Admin",
  [ROLE.AGENCY]: "Agency",
  moderator: "Moderator",
};

// Progress tracker steps
export const FLOW = [
  { label: "Campaign Created", roles: [ROLE.ZMM] },
  { label: "Offers Approved", roles: [ROLE.BM], decision: true },
  { label: "Assigned to Agency", roles: MM_ADMIN },
  { label: "Status Changed", roles: [AGENCY_REF] },
  { label: "Artwork Uploaded", roles: [AGENCY_REF] },
  { label: "Artwork Approved", roles: [ROLE.ZMM], decision: true },
  { label: "Creative Link Shared", roles: [AGENCY_REF] },
  { label: "Landing Page Added & Assigned", roles: MM_ADMIN },
  { label: "Campaign Status Change", roles: [HANDED_TO_REF] },
];

// step = how many tracker steps are complete; wait = who the campaign is waiting on; tone = pill colour
export const STATUS = {
  draft:                  { label: "Draft",                          wait: [ROLE.ZMM],     step: 0, tone: "draft" },
  pending_offer_approval: { label: "Awaiting offer approval",        wait: [ROLE.BM],      step: 1, tone: "wait" },
  offers_rejected:        { label: "Offers rejected (some states)",  wait: [ROLE.ZMM],     step: 1, tone: "bad" },
  offers_approved:        { label: "Offers approved",                wait: MM_ADMIN,       step: 2, tone: "wait" },
  assigned:               { label: "Assigned to agency",             wait: [AGENCY_REF],   step: 3, tone: "wait" },
  in_progress:            { label: "Agency preparing artwork",       wait: [AGENCY_REF],   step: 4, tone: "wait" },
  content_uploaded:       { label: "Awaiting artwork approval",      wait: [ROLE.ZMM],     step: 5, tone: "wait" },
  content_rejected:       { label: "Artwork rejected (some states)", wait: [AGENCY_REF],   step: 5, tone: "bad" },
  artwork_approved:       { label: "Awaiting creative links",        wait: [AGENCY_REF],   step: 6, tone: "wait" },
  links_submitted:        { label: "Awaiting landing pages",         wait: MM_ADMIN,       step: 7, tone: "wait" },
  completed:              { label: "Completed",                      wait: [],             step: 9, tone: "ok" },
};

export const TONE_CLASSES = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  wait: "bg-blue-50 text-blue-700 border-blue-200",
  bad: "bg-red-50 text-red-600 border-red-200",
  ok: "bg-green-50 text-green-700 border-green-200",
};

export const userName = (u) =>
  u && typeof u === "object" ? [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "" : "";

/** "Zonal Marketing Manager (Zone 1)", "Brand Manager", "Agency: Acme" … for a campaign's status. */
export const waitingOn = (campaign) => {
  const refs = STATUS[campaign?.status]?.wait || [];
  const out = [];
  refs.forEach((r) => {
    let label;
    if (r === AGENCY_REF) label = campaign.agency ? `Agency: ${userName(campaign.agency) || "assigned agency"}` : "Agency";
    else if (r === ROLE.ZMM) label = `${ROLE_LABELS[r]}${campaign.zone ? ` (${campaign.zone})` : ""}`;
    else label = ROLE_LABELS[r] || r;
    if (!out.includes(label)) out.push(label);
  });
  return out;
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
/** "2026-10" → "OCT-26" */
export const fmtMonth = (m) => {
  if (!/^\d{4}-\d{2}$/.test(m || "")) return m || "";
  const [y, mo] = m.split("-");
  return `${MONTHS[Number(mo) - 1]}-${y.slice(2)}`;
};

/** Indian grouping: 650000 → ₹6,50,000 */
export const fmtINR = (v) => (v === "" || v === null || v === undefined ? "" : `₹${Number(v).toLocaleString("en-IN")}`);

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

export const MAX_ITEMS = 2;
export const MAX_FEATURES = 3;
export const MIN_PRICE_DIGITS = 6;
export const MAX_PRICE_DIGITS = 9;
export const validPrice = (v) => new RegExp(`^[1-9]\\d{${MIN_PRICE_DIGITS - 1},${MAX_PRICE_DIGITS - 1}}$`).test(String(v));

/** Roles that see Campaigns v2 pages (same list as the route in App.jsx). */
export const CAMPAIGN_V2_ROLES = [ROLE.MM, ROLE.ADMIN, ROLE.MASTER_ADMIN, ROLE.ZMM, ROLE.BM, ROLE.AGENCY];
export const canCreateCampaign = (user) =>
  !!user && ((user.role === ROLE.ZMM && !!user.zone) || [ROLE.ADMIN, ROLE.MASTER_ADMIN].includes(user.role));

// History event → StatusBubble icon and colour (icons/colours as on the artwork job page)
const EVENT_STYLE = {
  "Campaign draft started": { icon: "clock", status: "success" },
  "Campaign details edited": { icon: "pad", status: "info" },
  "Campaign created": { icon: "rocket", status: "info" },
  "Offers approved": { icon: "check", status: "success" },
  "Offers rejected": { icon: "reject", status: "error" },
  "Assigned to agency": { icon: "user", status: "info" },
  "Status changed": { icon: "clock", status: "warning" },
  "Artwork uploaded": { icon: "pad", status: "info" },
  "Artwork approved": { icon: "shieldcheck", status: "success" },
  "Artwork rejected": { icon: "reject", status: "error" },
  "Creative links saved": { icon: "pad", status: "info" },
  "Creative links shared": { icon: "pad", status: "info" },
  "Landing pages saved": { icon: "pad", status: "info" },
  "Landing pages added and handed over": { icon: "done", status: "success" },
};
export const eventStyle = (event = "") =>
  EVENT_STYLE[event] || (event.startsWith("Campaign duplicated") ? { icon: "clock", status: "success" } : { icon: "clock", status: "info" });

// History events that complete each FLOW step (same order as FLOW); the timeline shows who did it.
export const STEP_EVENTS = [
  ["Campaign created"],
  ["Offers approved"],
  ["Assigned to agency"],
  ["Status changed"],
  ["Artwork uploaded"],
  ["Artwork approved"],
  ["Creative links shared"],
  ["Landing pages added and handed over"],
  [],
];

// "2026-11" → "Nov 2026"
export const fmtMonthLong = (m) => {
  if (!/^\d{4}-\d{2}$/.test(m || "")) return m || "";
  const [y, mo] = m.split("-");
  return `${new Date(Number(y), Number(mo) - 1, 1).toLocaleString("en-IN", { month: "short" })} ${y}`;
};

// What the waiting role has to do next, per status
export const NEXT_STEP = {
  draft: "add the offers and submit them for approval",
  pending_offer_approval: "approve or reject the offers",
  offers_rejected: "fix the rejected offers and submit again",
  offers_approved: "assign the campaign to an agency",
  assigned: "start work on the artwork",
  in_progress: "upload the artwork",
  content_uploaded: "approve or reject the artwork",
  content_rejected: "upload new artwork for the rejected states",
  artwork_approved: "share the creative links",
  links_submitted: "add the landing pages and hand over the campaign",
};
