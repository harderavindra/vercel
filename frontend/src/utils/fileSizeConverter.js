export const convertSizeToMB = (bytes, precision = 2) => {
  if (bytes == null) return "N/A"; // Handle null/undefined cases
  if (isNaN(bytes)) return "Invalid Size"; // Handle non-numeric values

  // Convert bytes to megabytes and append " MB"
  return (bytes / (1024 * 1024)).toFixed(precision) + " MB";
};
 