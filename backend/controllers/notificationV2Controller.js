// Campaigns v2 in-app notifications for the logged-in user.
import NotificationV2 from '../models/NotificationV2.js';
import { notificationsEnabled } from '../utils/notifyCampaignV2.js';
import { HttpError, sendError, isId } from '../utils/campaignV2Access.js';

const unreadCount = (userId) => NotificationV2.countDocuments({ user: userId, readAt: null });

// GET /api/campaigns-v2/notifications → { enabled, unreadCount, notifications: newest 50 }
export const getMyNotifications = async (req, res) => {
  try {
    const [notifications, unread] = await Promise.all([
      NotificationV2.find({ user: req.user.userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('campaign', 'title zone month status')
        .lean(),
      unreadCount(req.user.userId),
    ]);
    res.status(200).json({ enabled: notificationsEnabled(), unreadCount: unread, notifications });
  } catch (error) {
    sendError(res, error, 'Failed to fetch notifications');
  }
};

// POST /api/campaigns-v2/notifications/read  body: { ids: [id] } or { all: true }  (only your own)
export const markNotificationsRead = async (req, res) => {
  try {
    const { ids, all } = req.body || {};
    const filter = { user: req.user.userId, readAt: null };
    if (all !== true) {
      if (!Array.isArray(ids) || !ids.length || !ids.every((id) => isId(String(id)))) {
        throw new HttpError(400, 'Send { ids: [notificationId] } or { all: true }');
      }
      filter._id = { $in: ids };
    }
    const result = await NotificationV2.updateMany(filter, { $set: { readAt: new Date() } });
    res.status(200).json({ marked: result.modifiedCount, unreadCount: await unreadCount(req.user.userId) });
  } catch (error) {
    sendError(res, error, 'Failed to mark notifications read');
  }
};
