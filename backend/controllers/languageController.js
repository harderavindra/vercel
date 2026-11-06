import Language from '../models/Language.js';

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

// English can never be deleted: offer features are always shown in English
const PROTECTED_CODES = ['en'];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Make a short unique code from the name: first 2 letters, else full name, else name + number
const makeCode = (name, existingCodes) => {
  const base = name.toLowerCase().replace(/[^a-z]/g, '') || 'lang';
  let code = base.slice(0, 2);
  if (existingCodes.has(code)) code = base;
  for (let n = 2; existingCodes.has(code); n++) code = `${base}${n}`;
  return code;
};

// GET /api/masters/languages
export const getLanguages = async (req, res) => {
  try {
    const languages = await Language.find().sort({ createdAt: 1 }).lean();
    res.status(200).json(languages);
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ message: 'Failed to fetch languages' });
  }
};

// POST /api/masters/languages  body: { name }
export const addLanguage = async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) return res.status(400).json({ message: 'Language name is required' });

  try {
    const exists = await Language.findOne({ name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } });
    if (exists) return res.status(400).json({ message: `"${name}" already exists` });

    const codes = new Set((await Language.find({}, 'code').lean()).map((l) => l.code));
    const language = await Language.create({ name, code: makeCode(name, codes) });
    res.status(201).json(language);
  } catch (error) {
    console.error('Error adding language:', error);
    res.status(500).json({ message: 'Failed to add language' });
  }
};

// DELETE /api/masters/languages/:id
export const deleteLanguage = async (req, res) => {
  try {
    const language = await Language.findById(req.params.id);
    if (!language) return res.status(404).json({ message: 'Language not found' });
    if (PROTECTED_CODES.includes(language.code)) {
      return res.status(400).json({ message: `${language.name} cannot be deleted` });
    }
    await language.deleteOne();
    res.status(200).json({ message: 'Language deleted', _id: language._id, code: language.code });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid language id' });
    console.error('Error deleting language:', error);
    res.status(500).json({ message: 'Failed to delete language' });
  }
};

// POST /api/masters/languages/defaults → adds any default languages that are missing (by code or name)
export const loadDefaultLanguages = async (req, res) => {
  try {
    const existing = await Language.find().lean();
    const codes = new Set(existing.map((l) => l.code));
    const names = new Set(existing.map((l) => l.name.toLowerCase()));
    const missing = DEFAULT_LANGUAGES.filter((l) => !codes.has(l.code) && !names.has(l.name.toLowerCase()));
    if (missing.length) await Language.insertMany(missing);
    const languages = await Language.find().sort({ createdAt: 1 }).lean();
    res.status(200).json({ added: missing.length, languages });
  } catch (error) {
    console.error('Error loading default languages:', error);
    res.status(500).json({ message: 'Failed to load default languages' });
  }
};
