// Unit check for the Campaigns v2 workflow helpers. No database needed.
//   cd backend && node scripts/checkWorkflowV2.js
// Prints each result and exits with code 1 if any check fails.
import mongoose from 'mongoose';
import {
  statusAfter, offerCode, zoneCode, validPrice, campaignStates, canDo,
  STATUS, WORKFLOW, FLOW, MAX_ITEMS, MAX_FEATURES,
} from '../constants/campaignV2Workflow.js';
import CampaignV2 from '../models/CampaignV2.js';

let failed = 0;
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(58)} → ${JSON.stringify(actual)}${ok ? '' : `  (expected ${JSON.stringify(expected)})`}`);
};

console.log(`Statuses: ${Object.keys(STATUS).length}, actions: ${Object.keys(WORKFLOW).length}, tracker steps: ${FLOW.length}, MAX_ITEMS=${MAX_ITEMS}, MAX_FEATURES=${MAX_FEATURES}\n`);

// ---- statusAfter ----
const camp = { offers: [{ state: 'Punjab' }, { state: 'Haryana' }, { state: 'Punjab' }] };
check('campaignStates (unique, first-offer order)', campaignStates(camp), ['Punjab', 'Haryana']);
check('offers: no decisions yet → waiting', statusAfter('offers', camp, {}), 'pending_offer_approval');
check('offers: one approved, one undecided → waiting', statusAfter('offers', camp, { Punjab: { status: 'approved' } }), 'pending_offer_approval');
check('offers: one pending → waiting', statusAfter('offers', camp, { Punjab: { status: 'approved' }, Haryana: { status: 'pending' } }), 'pending_offer_approval');
check('offers: all approved → approved', statusAfter('offers', camp, { Punjab: { status: 'approved' }, Haryana: { status: 'approved' } }), 'offers_approved');
check('offers: one rejected → rejected', statusAfter('offers', camp, { Punjab: { status: 'approved' }, Haryana: { status: 'rejected' } }), 'offers_rejected');
check('content: all approved (Map input) → artwork_approved', statusAfter('content', camp, new Map([['Punjab', { status: 'approved' }], ['Haryana', { status: 'approved' }]])), 'artwork_approved');
check('content: one rejected → content_rejected', statusAfter('content', camp, { Punjab: { status: 'rejected' }, Haryana: { status: 'approved' } }), 'content_rejected');
check('content: undecided → content_uploaded', statusAfter('content', camp, { Punjab: { status: 'approved' } }), 'content_uploaded');

// ---- offerCode / zoneCode ----
check("zoneCode('Zone 1')", zoneCode('Zone 1'), 'Z1');
check("zoneCode('Zone 12')", zoneCode('Zone 12'), 'Z12');
check("zoneCode('North')", zoneCode('North'), 'NOR');
check("offerCode('Zone 1', '2026-10', 12)", offerCode('Zone 1', '2026-10', 12), 'Z1-OCT26-00012');
check("offerCode('Zone 5', '2027-01', 123456)", offerCode('Zone 5', '2027-01', 123456), 'Z5-JAN27-123456');

// ---- validPrice (6–9 digits, no leading zero) ----
check("validPrice('650000')", validPrice('650000'), true);
check('validPrice(100000) number', validPrice(100000), true);
check("validPrice('999999999') 9 digits", validPrice('999999999'), true);
check("validPrice('99999') 5 digits", validPrice('99999'), false);
check("validPrice('1000000000') 10 digits", validPrice('1000000000'), false);
check("validPrice('065000') leading zero", validPrice('065000'), false);
check("validPrice('6,50,000') commas", validPrice('6,50,000'), false);
check("validPrice('') empty", validPrice(''), false);

// ---- canDo (status + role, AGENCY = campaign.agency user) ----
const agencyId = new mongoose.Types.ObjectId();
const c = { status: 'offers_approved', agency: agencyId, handedTo: [] };
check('assign by marketing_manager at offers_approved', canDo('assign', c, { _id: 'u1', role: 'marketing_manager' }), true);
check('assign by master_admin at offers_approved', canDo('assign', c, { _id: 'u1', role: 'master_admin' }), true);
check('assign by brand_manager → no', canDo('assign', c, { _id: 'u1', role: 'brand_manager' }), false);
check('changeStatus by the assigned agency user', canDo('changeStatus', { ...c, status: 'assigned' }, { userId: String(agencyId), role: 'agency' }), true);
check('changeStatus by another agency user → no', canDo('changeStatus', { ...c, status: 'assigned' }, { userId: 'other', role: 'agency' }), false);
check('submit by zmm at draft', canDo('submit', { status: 'draft' }, { _id: 'u2', role: 'zonal_marketing_manager' }), true);
check('submit by zmm at assigned (wrong status) → no', canDo('submit', { status: 'assigned' }, { _id: 'u2', role: 'zonal_marketing_manager' }), false);

// ---- CampaignV2 schema rules (in memory, nothing saved) ----
const brandA = new mongoose.Types.ObjectId();
const errorsOf = (doc) => {
  const err = doc.validateSync();
  return err ? Object.values(err.errors).map((e) => e.message) : [];
};
const item = { brand: brandA, offerPrice: 650000, crossingPrice: 700000, features: [] };
check('valid campaign → no errors', errorsOf(new CampaignV2({ title: 'T', zone: 'Zone 1', month: '2026-10', offers: [{ serial: 1, state: 'Punjab', items: [item] }] })), []);
check('missing title/zone, bad month', errorsOf(new CampaignV2({ month: '2026-13' })).sort(), ['Month must be YYYY-MM', 'Path `title` is required.', 'Path `zone` is required.']);
check('offer with 0 items', errorsOf(new CampaignV2({ title: 'T', zone: 'Z', month: '2026-10', offers: [{ serial: 1, state: 'S', items: [] }] })), ['An offer needs 1 to 2 brand sections']);
check('offer with 3 items', errorsOf(new CampaignV2({ title: 'T', zone: 'Z', month: '2026-10', offers: [{ serial: 1, state: 'S', items: [{}, {}, {}] }] })), ['An offer needs 1 to 2 brand sections']);
check('duplicate serial in a campaign', errorsOf(new CampaignV2({ title: 'T', zone: 'Z', month: '2026-10', offers: [{ serial: 7, state: 'S', items: [item] }, { serial: 7, state: 'S', items: [item] }] })), ['An offer serial is used twice in this campaign']);
check('4 features in a section', errorsOf(new CampaignV2({ title: 'T', zone: 'Z', month: '2026-10', offers: [{ serial: 1, state: 'S', items: [{ ...item, features: [1, 2, 3, 4].map(() => new mongoose.Types.ObjectId()) }] }] })), ['A brand section can have at most 3 features']);
check('same brand twice in one offer', errorsOf(new CampaignV2({ title: 'T', zone: 'Z', month: '2026-10', offers: [{ serial: 1, state: 'S', items: [item, item] }] })), ['Each brand section of an offer must be a different brand']);
check('price with 5 digits', errorsOf(new CampaignV2({ title: 'T', zone: 'Z', month: '2026-10', offers: [{ serial: 1, state: 'S', items: [{ ...item, offerPrice: 99999 }] }] })), ['Offer price must be 6–9 digits']);
check('bad status value', errorsOf(new CampaignV2({ title: 'T', zone: 'Z', month: '2026-10', status: 'done' })).length, 1);

console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
