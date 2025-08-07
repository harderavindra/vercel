export const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

export const citySuggestions = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
  "Karnataka": ["Bangalore", "Mysore"],
  "Gujarat": ["Ahmedabad", "Surat"],
  "Tamil Nadu": ["Chennai", "Coimbatore"],
  "Delhi": ["New Delhi"],
};

export const designations = {
  "Internal": ["Manager", "Sales Manager"],
  "Vendor": ["Designer", "Content Writer"],
};


export const getFileIcon = (mimeType) => {
  const iconMap = {
    "image/png": "🖼️",
    "image/jpeg": "📷",
    "application/pdf": "📄",
    "text/plain": "📜",
    "application/msword": "📖",
    "application/vnd.ms-excel": "📊",
    "application/zip": "📦",
    "video/mp4": "🎥",
  };
  return iconMap[mimeType] || "📁"; // Default: Folder Icon
};


export const ZONES = {
  "Zone1": ["Haryana", "Himachal Pradesh", "J&K", "Punjab", "Rajasthan", "Rajasthan East", "Rajasthan West"],
  "Zone2": ["UP", "UP Central", "UP East", "UP West", "Uttarakhand"],
  "Zone3": ["Arunachal Pradesh", "Assam", "Bihar", "Jharkhand", "Manipur", "Meghalaya", "Nagaland", "Tripura", "West Bengal"],
  "Zone4": ["Chhattisgarh", "Madhya Pradesh", "Madhya Pradesh East", "Madhya Pradesh West", "Orissa"],
  "Zone5": ["Goa", "Gujarat", "Gujarat North", "Gujarat South", "Gujarat Rajkot", "Karnataka", "Maharashtra", "Maharashtra East", "Maharashtra West"],
  "Zone6": ["Andhra Pradesh", "Kerala", "Tamilnadu", "Telangana"]
};

export const LANGUAGES = [
  "English", "Hindi", "Punjabi", "Odia", "Bengali", "Assamese", "Tamil", "Telugu", "Kannada", "Marathi", "Gujarati","Malayalam"

];
export const BRAND_TREASURY_DOCUMENTS = [
 "3d renders", "product images", "video", "aston bands", "backdrop", "backlit led", "balloon branding", "banner", "behind the scenes bts", "booklet", "brand stickers", "brochure", "bus shelter", "catalogue", "certificate", "coupon", "cover page design", "danglers", "dealer boards", "digital post gif", "digital post static", "digital post video", "discount coupons", "flange", "floor sticker", "gantry", "gate arch", "gate branding", "hoarding", "image purchase", "inshop branding", "kiosks", "leaflets", "logo", "magazine ads", "merchandise", "metro wrap", "other",  "packaging", "panel designs", "pillar branding", "pole kiosks", "postcards", "poster", "press ad", "price list", "radio", "range board", "segment development booklet",  "shelf strips", "side panel", "standee", "stickers", "streamers", "take home price list", "tempo branding", "train wrap", "truck branding", "tvc", "van branding", "web banners", "POSM"

];
export const CONTENT_TYPE_DOCUMENTS = [
  "source files",
  "print",

];

export const PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};


export const ARTWORK_TYPES = [
  'whatsapp/digital',
  'banner',
  'leaflet',
  'van',
  'standee',
  'poster',
];

export const OFFER_TYPES = [
  'ldp (low down payment)',
  'fix price offer',
  'combo offer',
  'feature promotion',
  'subsidy',
  'other',
];