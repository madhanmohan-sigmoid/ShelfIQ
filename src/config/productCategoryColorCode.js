export function getProductCategoryColor(category) {
  const productCategoryColorMap = {
    "SENSITIVE TOOTHPASTE": "#F44336",   // Red
    "REGULAR TOOTHPASTE": "#2196F3",     // Blue
    "DENTURE": "#9C27B0",                // Purple
    "KIDS": "#FF9800",                   // Orange
    "POWERED BRUSH": "#4CAF50",          // Green
    "WHITENING TOOTHPASTE": "#00BCD4",   // Cyan
    "DENTAL ACCESSORIES": "#795548",     // Brown
    "MOUTHWASH": "#3F51B5",              // Indigo
    "MANUAL BRUSH": "#8BC34A",           // Light Green
  };

  return productCategoryColorMap[category.toUpperCase()] || "#9E9E9E";
}

// Get brand color fallback using hash-based color selection for consistency
export function getBrandColorFallback(brandName) {
  if (!brandName) return "#9E9E9E"; // Default gray

  // Hash-based color for consistency (same brand name always gets same color)
  const hash = brandName.split("").reduce((a, b) => {
    const codePoint = b.codePointAt(0) ?? 0;
    a = (a << 5) - a + codePoint;
    return a & a;
  }, 0);

  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
    "#82E0AA",
    "#F1948A",
    "#85C1E9",
    "#D7BDE2",
    "#F9E79F",
    "#ABEBC6",
    "#FAD7A0",
    "#AED6F1",
    "#D5A6BD",
  ];

  return colors[Math.abs(hash) % colors.length];
}