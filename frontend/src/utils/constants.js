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
  "North Zone": ["Jammu & Kashmir", "Himachal Pradesh", "Punjab", "Uttarakhand", "Haryana", "Delhi", "Rajasthan", "Uttar Pradesh", "Chandigarh"],
  "South Zone": ["Andhra Pradesh", "Karnataka", "Kerala", "Tamil Nadu", "Telangana", "Puducherry", "Lakshadweep"],
  "East Zone": ["Bihar", "Jharkhand", "Odisha", "West Bengal", "Andaman & Nicobar Islands"],
  "West Zone": ["Goa", "Gujarat", "Maharashtra", "Madhya Pradesh", "Chhattisgarh", "Dadra & Nagar Haveli and Daman & Diu"],
  "North-East Zone": ["Arunachal Pradesh", "Assam", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Sikkim", "Tripura"]
};

export const LANGUAGES = [
  "Hindi", "English", "Bengali", "Telugu", "Marathi",
  "Tamil", "Urdu", "Gujarati", "Malayalam", "Kannada",
  "Odia", "Punjabi", "Assamese", "Maithili", "Santali",
  "Kashmiri", "Nepali", "Konkani", "Sindhi", "Dogri",
  "Manipuri", "Bodo", "Sanskrit"
];
export const BRAND_TREASURY_DOCUMENTS = {
  LOGO: "logo",
  BRAND_GUIDELINES: "brand_guidelines",
  TYPOGRAPHY: "typography",
  COLOR_PALETTE: "color_palette",
  ICONOGRAPHY: "iconography",
  BRAND_TEMPLATES: "brand_templates",
  MARKETING_MATERIALS: "marketing_materials",
  OTHER: "other",
};
export const CONTENT_TYPE_DOCUMENTS = {
  SOURCE_FILES: "source_files",
  print: "print",
  
};

export const PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};