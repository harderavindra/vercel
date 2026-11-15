// State-level declarations (read-only API). Records are written by the workflow actions
// (campaignV2ActionsController.js); there are no update or delete routes.
import DeclarationV2 from '../models/DeclarationV2.js';
import { DECLARATIONS, DECLARATION_TEXT_VERSION } from '../constants/declarationsV2.js';
import { loadCampaign, sendError } from '../utils/campaignV2Access.js';

// GET /api/campaigns-v2/declarations/texts → { textVersion, declarations: { zmm_submit, bm_review, zmm_creative } }
export const getDeclarationTexts = (req, res) => {
  res.status(200).json({ textVersion: DECLARATION_TEXT_VERSION, declarations: DECLARATIONS });
};

// GET /api/campaigns-v2/:id/declarations → newest first (same visibility as the campaign)
export const listDeclarations = async (req, res) => {
  try {
    const campaign = await loadCampaign(req.params.id, req.user);
    const list = await DeclarationV2.find({ campaign: campaign._id })
      .sort({ at: -1, _id: -1 })
      .select('-ip -userAgent')
      .populate('user', 'firstName lastName email profilePic')
      .lean();
    res.status(200).json(list);
  } catch (error) {
    sendError(res, error, 'Failed to load declarations');
  }
};
