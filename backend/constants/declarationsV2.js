// State-level declarations (TruCadence accountability). One declaration per state, named, dated and
// time-stamped. Needed only to SUBMIT schemes (ZMM) and to APPROVE (Brand Manager offers, ZMM artwork);
// rejections need just the remark. The text is the single source of truth: the frontend reads it from
// GET /api/campaigns-v2/declarations/texts, and every record stores a snapshot of what was confirmed.
// Change the wording → bump DECLARATION_TEXT_VERSION.
export const DECLARATION_TEXT_VERSION = 1;

export const DECLARATIONS = {
  zmm_submit: {
    step: '01',
    role: 'ZMM',
    stage: 'Scheme submission',
    action: 'submit',
    title: 'ZMM declaration before submitting schemes',
    note: 'Completed only after all schemes for the selected state and period have been entered.',
    intro: 'I confirm that, for the selected state and scheme period:',
    items: [
      { id: 'a', text: 'Every scheme has been discussed with the Sales Team, and alignment has been obtained.' },
      { id: 'b', text: 'The prices and commercial terms used in all price-led campaigns have been agreed with the Sales Team.' },
      { id: 'c', text: 'The features entered are accurate, relevant to the selected state, and not overstated.' },
      { id: 'd', text: 'All schemes entered are applicable to the selected scheme period.' },
    ],
    footer: "Submission records the declaration and routes the state's schemes to the Brand Manager for review.",
  },
  bm_review: {
    step: '02',
    role: 'Brand Manager',
    stage: 'Scheme review and decision',
    action: 'decideOffers',
    title: 'Brand Manager declaration after reviewing schemes',
    note: 'The decision is recorded at state level after reviewing every scheme under the relevant brand.',
    intro: 'I confirm that, for my brand in the selected state and scheme period:',
    items: [
      { id: 'a', text: 'Every submitted scheme has been reviewed in full.' },
      { id: 'b', text: 'The model and variant selected for each scheme are correct.' },
      { id: 'c', text: 'The features stated are accurate and supported by approved product information.' },
      { id: 'd', text: 'A clear reason has been recorded for every rejected scheme, together with actionable feedback wherever correction is required.' },
    ],
    footer: 'Approval releases accepted schemes for creative development; rejected schemes return with recorded reasons and feedback.',
  },
  zmm_creative: {
    step: '03',
    role: 'ZMM',
    stage: 'Creative review and sign-off',
    action: 'decideContent',
    title: 'ZMM declaration before approving creatives',
    note: 'Completed after the creative, translation, vehicle depiction, offer and response stimulus are reviewed.',
    intro: 'I confirm that, for the selected state and approved schemes:',
    items: [
      { id: 'a', text: 'Every creative has been reviewed against the corresponding approved scheme.' },
      { id: 'b', text: 'The regional-language translation in every creative has been checked, and specific feedback has been provided wherever correction is required.' },
      { id: 'c', text: 'The model and variant shown in every creative have been checked, and specific feedback has been provided wherever a mismatch or concern is identified.' },
      { id: 'd', text: 'All creatives approved by me accurately reflect the offer, use the correct translation, and contain the correct campaign stimulus and call to action.' },
    ],
    footer: 'Final sign-off releases only approved creative assets for the selected state and preserves the complete audit trail.',
  },
};

export const DECLARATION_KINDS = Object.keys(DECLARATIONS);

/** What a record stores as the text that was confirmed. */
export const declarationSnapshot = (kind) => {
  const d = DECLARATIONS[kind];
  return { title: d.title, intro: d.intro, items: d.items, footer: d.footer };
};

/** True when `accepted` ticks every item of the declaration (and nothing unknown). */
export const acceptsAll = (kind, accepted) => {
  const ids = DECLARATIONS[kind].items.map((i) => i.id);
  const given = new Set(Array.isArray(accepted) ? accepted.map(String) : []);
  return given.size === ids.length && ids.every((id) => given.has(id));
};
