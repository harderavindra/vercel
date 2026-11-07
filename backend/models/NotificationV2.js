import mongoose from 'mongoose';

// In-app notification for Campaigns v2 (one per recipient per workflow step).
const NotificationV2Schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'CampaignV2', required: true },
    event: { type: String, required: true },
    body: { type: String, default: '' },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'notifications_v2' }
);

NotificationV2Schema.index({ user: 1, readAt: 1, createdAt: -1 });

export default mongoose.model('NotificationV2', NotificationV2Schema);
