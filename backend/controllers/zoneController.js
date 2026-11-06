import Zone from '../models/Zone.js';
import Language from '../models/Language.js';

// Starting zones, copied from the mh-camp prototype (lib/masterData.ts)
export const DEFAULT_ZONES = [
  { name: 'Zone 1', states: [
    { name: 'Punjab', languages: ['pa', 'hi', 'en'] }, { name: 'Haryana', languages: ['hi', 'en'] },
    { name: 'Himachal Pradesh', languages: ['hi', 'en'] }, { name: 'Jammu & Kashmir', languages: ['hi', 'en'] },
    { name: 'Rajasthan', languages: ['hi', 'en'] },
  ] },
  { name: 'Zone 2', states: [
    { name: 'Uttar Pradesh', languages: ['hi', 'en'] }, { name: 'Uttarakhand', languages: ['hi', 'en'] },
    { name: 'Bihar', languages: ['hi', 'en'] },
  ] },
  { name: 'Zone 3', states: [
    { name: 'West Bengal', languages: ['bn', 'en'] }, { name: 'Odisha', languages: ['or', 'en'] },
    { name: 'Assam', languages: ['as', 'bn', 'en'] }, { name: 'Jharkhand', languages: ['hi', 'en'] },
  ] },
  { name: 'Zone 4', states: [
    { name: 'Tamil Nadu', languages: ['ta', 'en'] }, { name: 'Kerala', languages: ['ml', 'en'] },
    { name: 'Andhra Pradesh', languages: ['te', 'en'] }, { name: 'Telangana', languages: ['te', 'en'] },
  ] },
  { name: 'Zone 5', states: [
    { name: 'Karnataka', languages: ['kn', 'en'] }, { name: 'Maharashtra', languages: ['mr', 'hi', 'en'] },
    { name: 'Gujarat', languages: ['gu', 'en'] }, { name: 'Madhya Pradesh', languages: ['hi', 'en'] },
    { name: 'Chhattisgarh', languages: ['hi', 'en'] },
  ] },
];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nameRegex = (name) => ({ $regex: `^${escapeRegex(name)}$`, $options: 'i' });
const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
const cleanName = (v) => (typeof v === 'string' ? v.trim() : '');

// Codes of all active languages (documents without `active` count as active)
const activeLanguageCodes = async () =>
  new Set((await Language.find({ active: { $ne: false } }, 'code').lean()).map((l) => l.code));

// Validates a languages array; returns { error } or { languages }
const validateLanguages = async (languages) => {
  if (!Array.isArray(languages) || languages.some((c) => typeof c !== 'string')) {
    return { error: 'languages must be an array of language codes' };
  }
  const codes = languages.map((c) => c.trim().toLowerCase()).filter(Boolean);
  const dup = codes.find((c, i) => codes.indexOf(c) !== i);
  if (dup) return { error: `Language "${dup}" is listed twice` };
  const active = await activeLanguageCodes();
  const unknown = codes.filter((c) => !active.has(c));
  if (unknown.length) return { error: `Unknown or inactive language code(s): ${unknown.join(', ')}` };
  return { languages: codes };
};

// Finds a zone (other than `exceptZoneId`/`exceptState`) that already has a state with this name
const findStateOwner = async (stateName, exceptZoneId, exceptState) => {
  const zones = await Zone.find({ 'states.name': nameRegex(stateName) }).lean();
  for (const z of zones) {
    for (const s of z.states) {
      if (!sameName(s.name, stateName)) continue;
      const isSelf = exceptZoneId && String(z._id) === String(exceptZoneId) && exceptState && sameName(s.name, exceptState);
      if (!isSelf) return { zone: z, state: s };
    }
  }
  return null;
};

const handleError = (res, error, fallback) => {
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid zone id' });
  if (error.code === 11000) return res.status(400).json({ message: 'A zone with this name already exists' });
  console.error(fallback, error);
  return res.status(500).json({ message: fallback });
};

const findStateIndex = (zone, stateName) => zone.states.findIndex((s) => sameName(s.name, stateName));

// ---------- Zones ----------

// GET /api/masters/zones
export const getZones = async (req, res) => {
  try {
    const zones = await Zone.find().sort({ createdAt: 1 }).lean();
    res.status(200).json(zones);
  } catch (error) {
    handleError(res, error, 'Failed to fetch zones');
  }
};

// POST /api/masters/zones  body: { name }
export const createZone = async (req, res) => {
  const name = cleanName(req.body?.name);
  if (!name) return res.status(400).json({ message: 'Zone name is required' });
  try {
    if (await Zone.exists({ name: nameRegex(name) })) {
      return res.status(400).json({ message: `"${name}" already exists` });
    }
    const zone = await Zone.create({ name, states: [] });
    res.status(201).json(zone);
  } catch (error) {
    handleError(res, error, 'Failed to create zone');
  }
};

// PUT /api/masters/zones/:id  body: { name }  (rename)
export const updateZone = async (req, res) => {
  const name = cleanName(req.body?.name);
  if (!name) return res.status(400).json({ message: 'Zone name is required' });
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });
    if (await Zone.exists({ _id: { $ne: zone._id }, name: nameRegex(name) })) {
      return res.status(400).json({ message: `"${name}" already exists` });
    }
    zone.name = name;
    await zone.save();
    res.status(200).json(zone);
  } catch (error) {
    handleError(res, error, 'Failed to update zone');
  }
};

// DELETE /api/masters/zones/:id  (removes the zone and its states; campaigns keep their saved zone text)
export const deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });
    res.status(200).json({ message: 'Zone deleted', _id: zone._id });
  } catch (error) {
    handleError(res, error, 'Failed to delete zone');
  }
};

// ---------- States ----------

// POST /api/masters/zones/:id/states  body: { name, languages? }  (languages default to ['en'] when English is active)
export const addState = async (req, res) => {
  const name = cleanName(req.body?.name);
  if (!name) return res.status(400).json({ message: 'State name is required' });
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });

    const owner = await findStateOwner(name);
    if (owner) return res.status(400).json({ message: `"${owner.state.name}" is already in ${owner.zone.name}` });

    let languages;
    if (req.body?.languages !== undefined) {
      const result = await validateLanguages(req.body.languages);
      if (result.error) return res.status(400).json({ message: result.error });
      languages = result.languages;
    } else {
      languages = (await activeLanguageCodes()).has('en') ? ['en'] : [];
    }

    zone.states.push({ name, languages });
    await zone.save();
    res.status(201).json(zone);
  } catch (error) {
    handleError(res, error, 'Failed to add state');
  }
};

// PUT /api/masters/zones/:id/states/:stateName  body: { name?, languages? }
// Rename a state and/or set its languages (order matters: first = default).
export const updateState = async (req, res) => {
  const { stateName } = req.params;
  const { name, languages } = req.body || {};
  if (name === undefined && languages === undefined) {
    return res.status(400).json({ message: 'Nothing to update' });
  }
  if (name !== undefined && !cleanName(name)) {
    return res.status(400).json({ message: 'State name cannot be empty' });
  }
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });
    const index = findStateIndex(zone, stateName);
    if (index === -1) return res.status(404).json({ message: `State "${stateName}" not found in ${zone.name}` });

    if (name !== undefined) {
      const newName = cleanName(name);
      const owner = await findStateOwner(newName, zone._id, zone.states[index].name);
      if (owner) return res.status(400).json({ message: `"${owner.state.name}" is already in ${owner.zone.name}` });
      zone.states[index].name = newName;
    }
    if (languages !== undefined) {
      const result = await validateLanguages(languages);
      if (result.error) return res.status(400).json({ message: result.error });
      zone.states[index].languages = result.languages;
    }

    await zone.save();
    res.status(200).json(zone);
  } catch (error) {
    handleError(res, error, 'Failed to update state');
  }
};

// DELETE /api/masters/zones/:id/states/:stateName
export const deleteState = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) return res.status(404).json({ message: 'Zone not found' });
    const index = findStateIndex(zone, req.params.stateName);
    if (index === -1) return res.status(404).json({ message: `State "${req.params.stateName}" not found in ${zone.name}` });
    zone.states.splice(index, 1);
    await zone.save();
    res.status(200).json(zone);
  } catch (error) {
    handleError(res, error, 'Failed to delete state');
  }
};

// POST /api/masters/zones/defaults → adds the prototype's zones/states that are missing.
// Skips zones whose name exists and states that already exist in any zone;
// keeps only language codes that are currently active.
export const loadDefaultZones = async (req, res) => {
  try {
    const existing = await Zone.find().lean();
    const zoneNames = new Set(existing.map((z) => z.name.toLowerCase()));
    const stateNames = new Set(existing.flatMap((z) => z.states.map((s) => s.name.toLowerCase())));
    const active = await activeLanguageCodes();

    const toInsert = DEFAULT_ZONES
      .filter((z) => !zoneNames.has(z.name.toLowerCase()))
      .map((z) => ({
        name: z.name,
        states: z.states
          .filter((s) => !stateNames.has(s.name.toLowerCase()))
          .map((s) => ({ name: s.name, languages: s.languages.filter((c) => active.has(c)) })),
      }));

    if (toInsert.length) await Zone.insertMany(toInsert);
    const zones = await Zone.find().sort({ createdAt: 1 }).lean();
    res.status(200).json({ added: toInsert.length, zones });
  } catch (error) {
    handleError(res, error, 'Failed to load default zones');
  }
};
