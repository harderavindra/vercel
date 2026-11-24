// Campaigns v2: download a campaign's offers as an Excel sheet (client's format, from mh-camp app/api/campaigns/[id]/excel).
import writeXlsxFile from 'write-excel-file/node';
import Language from '../models/Language.js';
import { fmtMonth, zoneCode } from '../constants/campaignV2Workflow.js';
import { HttpError, sendError, loadCampaign } from '../utils/campaignV2Access.js';

// Serif font, khaki header, thin black borders, centred wrapped text (as in the client's sheet)
const base = { fontFamily: 'Times New Roman', fontSize: 12, borderStyle: 'thin', borderColor: '#000000', align: 'center', alignVertical: 'center', wrap: true };
const head = (value) => ({ ...base, value, fontWeight: 'bold', backgroundColor: '#DCDC9E' });
const text = (value) => ({ ...base, value: value ? String(value) : '' });
// A web address becomes a clickable blue link; anything else stays plain text.
// Excel stores formulas without the leading "=".
const link = (url) => {
  if (!/^https?:\/\//i.test(url || '')) return text(url);
  const q = url.replace(/"/g, '""');
  return { ...base, type: 'Formula', value: `HYPERLINK("${q}","${q}")`, textColor: '#0000EE', textDecoration: { underline: true }, align: 'left' };
};

/** Rupees to lacs as the client writes them: 900000 → "9.0", 651000 → "6.51", 1031000 → "10.31". */
const lacs = (v) => {
  const n = Math.round(Number(v) / 1000) / 100;
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
};

/** The offer on separate lines, features as bullets (the cell wraps):
 *  Special Combo Offer: <details>
 *  @ 9.0 lacs On Road
 *  Key features:
 *  • A
 *  • B */
const offerDetails = (it) => {
  // feature text is a Map (language code → text); the sheet uses English
  const features = (it.features || []).map((f) => (f?.text instanceof Map ? f.text.get('en') : f?.text?.en)).filter(Boolean);
  const price = it.offerPrice
    ? `@ ${lacs(it.offerPrice)} lacs${it.priceType ? ` ${it.priceType}` : ''}${it.crossingPrice ? ` (was ${lacs(it.crossingPrice)} lacs)` : ''}`
    : '';
  return [
    [it.type, (it.details || '').trim()].filter(Boolean).join(': '),
    price,
    features.length > 0 && 'Key features:',
    ...features.map((f) => `• ${f.trim()}`),
  ].filter(Boolean).join('\n');
};
// Offer Details reads top-down, so it is left-aligned
const detailsCell = (value) => ({ ...text(value), align: 'left', alignVertical: 'top' });

const COLUMNS = [
  ['Offer Code', 20], ['State/UT', 14], ['Language', 12], ['Brand', 16], ['HP segment', 14], ['Model', 36],
  ['Offer Details', 60], ['Creative Links', 32], ['Landing Page', 32],
];

// GET /api/campaigns-v2/:id/excel  → .xlsx, one row per brand section of each offer.
// Anyone who can see the campaign can download it; links are blank until they are added.
export const downloadCampaignExcel = async (req, res) => {
  try {
    const campaign = await loadCampaign(req.params.id, req.user);
    if (!campaign.offers.length) throw new HttpError(409, 'This campaign has no offers yet');
    await campaign.populate({ path: 'offers.items.features', select: 'text' });
    const languages = new Map((await Language.find({}, 'code name').lean()).map((l) => [l.code, l.name]));

    const rows = [COLUMNS.map(([h]) => head(h))];
    campaign.offers.forEach((o) => o.items.forEach((it) => {
      rows.push([
        text(o.code),
        text(o.state),
        text(o.languages.map((code) => languages.get(code) || code).join(', ')),
        text(it.brandName),
        text(it.hp),
        text(it.modelName),
        detailsCell(offerDetails(it)),
        link(o.creativeLink),
        link(o.landingPage),
      ]);
    }));

    const buffer = await writeXlsxFile(rows, {
      sheet: 'Offers', stickyRowsCount: 1, columns: COLUMNS.map(([, width]) => ({ width })),
    }).toBuffer();

    const title = (campaign.title || 'campaign').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'campaign';
    const fileName = `${title}_${zoneCode(campaign.zone)}-${fmtMonth(campaign.month).replace('-', '')}.xlsx`;
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    });
    res.status(200).send(buffer);
  } catch (error) {
    sendError(res, error, 'Failed to create the Excel file');
  }
};
