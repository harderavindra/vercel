import Language from '../models/Language.js';
import Zone from '../models/Zone.js';

// Starting list, copied from the mh-camp prototype (lib/masterData.ts)
export const DEFAULT_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'or', name: 'Odia' },
  { code: 'bn', name: 'Bengali' },
  { code: 'as', name: 'Assamese' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'kn', name: 'Kannada' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ml', name: 'Malayalam' },
];

// English can never be deactivated: offer features are always shown in English
const PROTECTED_CODES = ['en'];
const CODE_PATTERN = /^[a-z][a-z0-9-]{1,11}$/;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nameRegex = (name) => ({ $regex: `^${escapeRegex(name)}$`, $options: 'i' });

// Make a short unique code from the name: first 2 letters, else full name, else name + number
const makeCode = (name, existingCodes) => {
  const base = name.toLowerCase().replace(/[^a-z]/g, '') || 'lang';
  let code = base.slice(0, 2);
  if (existingCodes.has(code)) code = base;
  for (let n = 2; existingCodes.has(code); n++) code = `${base}${n}`;
  return code;
};

const duplicateNameMessage = (existing) =>
  existing.active === false
    ? `"${existing.name}" already exists but is inactive. Restore it instead.`
    : `"${existing.name}" already exists`;

// GET /api/masters/languages        → active only
// GET /api/masters/languages?all=1  → active and inactive
export const getLanguages = async (req, res) => {
  try {
    // Documents created before `active` existed count as active
    const filter = req.query.all === '1' ? {} : { active: { $ne: false } };
    const languages = await Language.find(filter).sort({ createdAt: 1 }).lean();
    res.status(200).json(languages.map((l) => ({ ...l, active: l.active !== false })));
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ message: 'Failed to fetch languages' });
  }
};

// POST /api/masters/languages  body: { name, code? }  (code is generated when not given)
export const addLanguage = async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const rawCode = req.body?.code;
  if (!name) return res.status(400).json({ message: 'Language name is required' });
  if (rawCode !== undefined && rawCode !== '' && typeof rawCode !== 'string') {
    return res.status(400).json({ message: 'Code must be text' });
  }
  const givenCode = typeof rawCode === 'string' ? rawCode.trim().toLowerCase() : '';
  if (givenCode && !CODE_PATTERN.test(givenCode)) {
    return res.status(400).json({ message: 'Code must be 2-12 lowercase letters, digits or dashes, starting with a letter' });
  }

  try {
    const sameName = await Language.findOne({ name: nameRegex(name) }).lean();
    if (sameName) return res.status(400).json({ message: duplicateNameMessage(sameName) });

    const codes = new Set((await Language.find({}, 'code').lean()).map((l) => l.code));
    if (givenCode && codes.has(givenCode)) {
      return res.status(400).json({ message: `Code "${givenCode}" is already used` });
    }

    const language = await Language.create({ name, code: givenCode || makeCode(name, codes), active: true });
    res.status(201).json(language);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Duplicate language code or name' });
    console.error('Error adding language:', error);
    res.status(500).json({ message: 'Failed to add language' });
  }
};

// PUT /api/masters/languages/:id  body: { name?, active? }
// Rename and/or activate/deactivate. This is also how a language is "deleted" (active:false).
export const updateLanguage = async (req, res) => {
  const { name, active } = req.body || {};
  if (name === undefined && active === undefined) {
    return res.status(400).json({ message: 'Nothing to update' });
  }
  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    return res.status(400).json({ message: 'Language name cannot be empty' });
  }
  if (active !== undefined && typeof active !== 'boolean') {
    return res.status(400).json({ message: 'active must be true or false' });
  }

  try {
    const language = await Language.findById(req.params.id);
    if (!language) return res.status(404).json({ message: 'Language not found' });

    if (active === false && PROTECTED_CODES.includes(language.code)) {
      return res.status(400).json({ message: `${language.name} cannot be removed` });
    }

    // Refuse to deactivate a language that any zone state still uses
    if (active === false && language.active !== false) {
      const zones = await Zone.find({ 'states.languages': language.code }, 'name states').lean();
      const usedIn = zones.flatMap((z) =>
        z.states.filter((s) => s.languages.includes(language.code)).map((s) => `${s.name} (${z.name})`)
      );
      if (usedIn.length) {
        return res.status(409).json({
          message: `${language.name} is used by ${usedIn.length} state(s): ${usedIn.join(', ')}. Remove it from those states in Zones & States first.`,
          usedIn,
        });
      }
    }

    if (name !== undefined) {
      const newName = name.trim();
      const sameName = await Language.findOne({ _id: { $ne: language._id }, name: nameRegex(newName) }).lean();
      if (sameName) return res.status(400).json({ message: duplicateNameMessage(sameName) });
      language.name = newName;
    }
    if (active !== undefined) language.active = active;

    await language.save();
    res.status(200).json(language);
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid language id' });
    if (error.code === 11000) return res.status(400).json({ message: 'Duplicate language name' });
    console.error('Error updating language:', error);
    res.status(500).json({ message: 'Failed to update language' });
  }
};

// POST /api/masters/languages/defaults → adds any default languages that are missing (by code or name).
// Does not reactivate defaults an admin has removed.
export const loadDefaultLanguages = async (req, res) => {
  try {
    const existing = await Language.find().lean();
    const codes = new Set(existing.map((l) => l.code));
    const names = new Set(existing.map((l) => l.name.toLowerCase()));
    const missing = DEFAULT_LANGUAGES
      .filter((l) => !codes.has(l.code) && !names.has(l.name.toLowerCase()))
      .map((l) => ({ ...l, active: true }));
    if (missing.length) await Language.insertMany(missing);
    const languages = await Language.find().sort({ createdAt: 1 }).lean();
    res.status(200).json({ added: missing.length, languages: languages.map((l) => ({ ...l, active: l.active !== false })) });
  } catch (error) {
    console.error('Error loading default languages:', error);
    res.status(500).json({ message: 'Failed to load default languages' });
  }
};
