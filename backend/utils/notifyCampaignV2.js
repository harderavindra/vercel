// Campaigns v2 notifications (ported from mh-camp store.tsx perform(): who is mailed per WORKFLOW step).
//
// Switched OFF by default. Environment flags:
//   NOTIFY_V2_ENABLED=true   store in-app notifications (NotificationV2)
//   MAIL_V2_ENABLED=true     also send emails (only when NOTIFY_V2_ENABLED is on too)
// Keep both unset on preview/staging; turn them on once Campaigns v2 is tested and live.
//
// Never throws: a notification or email problem is logged and must not fail the workflow action.
import User from '../models/User.js';
import NotificationV2 from '../models/NotificationV2.js';
import { sendEmail } from './emailService.js';
import { WORKFLOW, AGENCY, HANDED_TO, ROLE, fmtMonth } from '../constants/campaignV2Workflow.js';

export const notificationsEnabled = () => process.env.NOTIFY_V2_ENABLED === 'true';
export const mailEnabled = () => notificationsEnabled() && process.env.MAIL_V2_ENABLED === 'true';

const ROLE_LABEL = {
  [ROLE.ZMM]: 'Zonal Marketing Manager',
  [ROLE.BM]: 'Brand Manager',
  [ROLE.MM]: 'Marketing Manager',
  [ROLE.ADMIN]: 'Admin',
  [ROLE.MASTER_ADMIN]: 'Master Admin',
  [ROLE.AGENCY_ROLE]: 'Agency',
};
const ACTIVE = { status: { $ne: 'inactive' } };
const idOf = (v) => String(v?._id ?? v);
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const campaignLabel = (c) => `${c.title} (${c.zone} · ${fmtMonth(c.month)})`;

/**
 * WORKFLOW[action].mail → active users:
 *   zonal_marketing_manager: that role AND zone == campaign.zone
 *   other live roles (brand_manager, marketing_manager, admin, master_admin): every active user with the role
 *   AGENCY: campaign.agency   HANDED_TO: campaign.handedTo
 */
export const resolveRecipients = async (campaign, workflowKey) => {
  const refs = WORKFLOW[workflowKey]?.mail || [];
  if (!refs.length) return [];
  const or = [];
  const roles = refs.filter((r) => r !== AGENCY && r !== HANDED_TO && r !== ROLE.ZMM);
  if (roles.length) or.push({ role: { $in: roles } });
  if (refs.includes(ROLE.ZMM)) or.push({ role: ROLE.ZMM, zone: campaign.zone });
  const ids = [];
  if (refs.includes(AGENCY) && campaign.agency) ids.push(idOf(campaign.agency));
  if (refs.includes(HANDED_TO)) ids.push(...(campaign.handedTo || []).map(idOf));
  if (ids.length) or.push({ _id: { $in: ids } });
  if (!or.length) return [];
  return User.find({ $or: or, ...ACTIVE }, 'email firstName lastName role').lean();
};

/** Text like the prototype's mail body. */
export const buildBody = (campaign, event, actor, note, remark) => {
  const who = [actor?.name, actor?.role && `(${ROLE_LABEL[actor.role] || actor.role})`].filter(Boolean).join(' ');
  return `${who} — ${event.toLowerCase()}${note ? ` (${note})` : ''} for campaign ${campaignLabel(campaign)}, ${campaign.offers?.length || 0} offer(s).`
    + (remark ? ` Remark: "${remark}"` : '');
};

const emailHtml = (campaign, event, body, link) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 24px;">
      <h2 style="color: #333333; margin-top: 0;">${escapeHtml(event)}</h2>
      <p style="color: #555555;">${escapeHtml(body)}</p>
      <div style="text-align: center; margin-top: 24px;">
        <a href="${escapeHtml(link)}" style="background: #ef4444; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Open campaign</a>
      </div>
    </div>
  </div>`;

/**
 * Notify everyone WORKFLOW[workflowKey].mail names about a step, except the actor.
 * campaign: the UPDATED campaign. actor: req.user ({ userId, role, name }).
 * Returns { notified, emailed } for logging/tests.
 */
export const notifyCampaignV2 = async (campaign, workflowKey, actor, note = '', remark = '') => {
  if (!notificationsEnabled()) return { notified: 0, emailed: 0, skipped: 'NOTIFY_V2_ENABLED is not true' };
  try {
    const event = WORKFLOW[workflowKey]?.event;
    if (!event) return { notified: 0, emailed: 0 };
    const recipients = (await resolveRecipients(campaign, workflowKey)).filter((u) => idOf(u) !== idOf(actor?.userId));
    if (!recipients.length) return { notified: 0, emailed: 0 };

    const body = buildBody(campaign, event, actor, note, remark);
    await NotificationV2.insertMany(recipients.map((u) => ({ user: u._id, campaign: campaign._id, event, body })));

    let emailed = 0;
    if (mailEnabled()) {
      const base = (process.env.FRONTEND_URL || 'https://www.adbee.in').replace(/\/$/, '');
      const link = `${base}/campaigns-v2/${campaign._id}`;
      const subject = `[Campaign] ${event} – ${campaign.title}`;
      const html = emailHtml(campaign, event, `${body}`, link);
      // sendEmail has no BCC option, so each recipient gets their own copy (addresses stay private)
      const results = await Promise.allSettled(
        recipients.filter((u) => u.email).map((u) => sendEmail({ to: u.email, subject, html }))
      );
      results.forEach((r) => { if (r.status === 'rejected') console.error('Campaign v2 email failed:', r.reason?.message || r.reason); });
      emailed = results.filter((r) => r.status === 'fulfilled').length;
    }
    return { notified: recipients.length, emailed };
  } catch (error) {
    console.error('Campaign v2 notification failed:', error);
    return { notified: 0, emailed: 0, error: error.message };
  }
};

export default notifyCampaignV2;
