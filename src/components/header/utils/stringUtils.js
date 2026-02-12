/**
 * Converts a full name to initials
 * @param {string} name - The full name
 * @returns {string} - The initials (e.g., "John Doe" -> "JD")
 */
export function stringToInitials(name) {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Formats user name from backend format to display format
 * Example: "Mehra, Gaurav [Non-Kenvue]" → "Gaurav Mehra"
 * @param {string} name - Name from backend
 * @returns {string} - Formatted name
 */
export function formatUserName(name) {
  if (!name) return "";

  // Remove anything in square brackets without using regex to avoid ReDoS flags
  const removeBracketedSections = (value) => {
    if (!value.includes("[")) return value;
    let result = "";
    let cursor = 0;

    while (cursor < value.length) {
      const openIdx = value.indexOf("[", cursor);
      if (openIdx === -1) {
        result += value.slice(cursor);
        break;
      }

      result += value.slice(cursor, openIdx);
      const closeIdx = value.indexOf("]", openIdx + 1);
      cursor = closeIdx === -1 ? value.length : closeIdx + 1;
    }

    return result;
  };

  let cleanName = removeBracketedSections(name).trim();
  
  // Check if name is in "Surname, Firstname" format
  if (cleanName.includes(",")) {
    const parts = cleanName.split(",").map(part => part.trim());
    if (parts.length >= 2) {
      // Reverse to "Firstname Surname"
      return `${parts[1]} ${parts[0]}`;
    }
  }
  
  // Return as-is if not in expected format
  return cleanName;
} 