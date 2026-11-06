import Setting from '../models/Setting.js';

export const SETTING_KEYS = ['hpSegments', 'offerTypes', 'agencyStatuses'];

// GET /api/masters/settings → { hpSegments: [], offerTypes: [], agencyStatuses: [] }
export const getSettings = async (req, res) => {
  try {
    const docs = await Setting.find({ key: { $in: SETTING_KEYS } }).lean();
    const result = {};
    SETTING_KEYS.forEach((key) => {
      const doc = docs.find((d) => d.key === key);
      result[key] = doc ? doc.values : [];
    });
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

// PUT /api/masters/settings/:key  body: { values: string[] }
export const updateSetting = async (req, res) => {
  const { key } = req.params;
  const { values } = req.body || {};

  if (!SETTING_KEYS.includes(key)) {
    return res.status(400).json({ message: `Unknown setting key: ${key}` });
  }
  if (!Array.isArray(values) || values.some((v) => typeof v !== 'string')) {
    return res.status(400).json({ message: 'values must be an array of strings' });
  }

  const cleaned = values.map((v) => v.trim()).filter(Boolean);

  // Reject duplicates (case-insensitive)
  const seen = new Set();
  for (const v of cleaned) {
    const lower = v.toLowerCase();
    if (seen.has(lower)) {
      return res.status(400).json({ message: `Duplicate value: ${v}` });
    }
    seen.add(lower);
  }

  try {
    const doc = await Setting.findOneAndUpdate(
      { key },
      { $set: { values: cleaned } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ key: doc.key, values: doc.values });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ message: 'Failed to update setting' });
  }
};
