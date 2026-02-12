import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import PropTypes from "prop-types";

const geoUrl = "/world-countries.json";

const REGIONS = [
  {
    name: "EMEA",
    center: [20, 50],
    scale: 150,
    countries: [
      // Europe (47)
      "Albania",
      "Andorra",
      "Armenia",
      "Austria",
      "Azerbaijan",
      "Belarus",
      "Belgium",
      "Bosnia and Herzegovina",
      "Bulgaria",
      "Croatia",
      "Cyprus",
      "Czech Republic",
      "Denmark",
      "Estonia",
      "Finland",
      "France",
      "Georgia",
      "Germany",
      "Greece",
      "Hungary",
      "Iceland",
      "Ireland",
      "Italy",
      "Kosovo",
      "Latvia",
      "Liechtenstein",
      "Lithuania",
      "Luxembourg",
      "Malta",
      "Moldova",
      "Monaco",
      "Montenegro",
      "Netherlands",
      "North Macedonia",
      "Norway",
      "Poland",
      "Portugal",
      "Romania",
      "San Marino",
      "Serbia",
      "Slovakia",
      "Slovenia",
      "Spain",
      "Sweden",
      "Switzerland",
      "Ukraine",
      "United Kingdom",
      "Vatican City",

      // Middle East (17)
      "Bahrain",
      "Iran",
      "Iraq",
      "Israel",
      "Jordan",
      "Kuwait",
      "Lebanon",
      "Oman",
      "Palestine",
      "Qatar",
      "Saudi Arabia",
      "Syria",
      "Turkey",
      "United Arab Emirates",
      "Yemen",
      "Armenia",
      "Azerbaijan",

      // Africa (54)
      "Algeria",
      "Angola",
      "Benin",
      "Botswana",
      "Burkina Faso",
      "Burundi",
      "Cabo Verde",
      "Cameroon",
      "Central African Republic",
      "Chad",
      "Comoros",
      "Congo (Brazzaville)",
      "Congo (Kinshasa)",
      "Djibouti",
      "Egypt",
      "Equatorial Guinea",
      "Eritrea",
      "Eswatini",
      "Ethiopia",
      "Gabon",
      "Gambia",
      "Ghana",
      "Guinea",
      "Guinea-Bissau",
      "Ivory Coast",
      "Kenya",
      "Lesotho",
      "Liberia",
      "Libya",
      "Madagascar",
      "Malawi",
      "Mali",
      "Mauritania",
      "Mauritius",
      "Morocco",
      "Mozambique",
      "Namibia",
      "Niger",
      "Nigeria",
      "Rwanda",
      "Sao Tome and Principe",
      "Senegal",
      "Seychelles",
      "Sierra Leone",
      "Somalia",
      "South Africa",
      "South Sudan",
      "Sudan",
      "Tanzania",
      "Togo",
      "Tunisia",
      "Uganda",
      "Zambia",
      "Zimbabwe",
      "Dem. Rep. Congo",
      "Central African Rep.",
      "S. Sudan",
      "Congo",
      "Côte d'Ivoire",
      "Greenland",
    ],
  },
  {
    name: "North America",
    center: [-100, 40],
    scale: 120,
    countries: [
      // North America (3)
      "Canada",
      "United States of America",
    ],
  },
  {
    name: "APAC",
    center: [100, 30],
    scale: 100,
    countries: [
      // East and North East Asia (ENEA)
      "China",
      "Hong Kong, China",
      "Japan",
      "North Korea",
      "South Korea",
      "Macao, China",
      "Mongolia",

      // North and Central Asia (NCA)
      "Kazakhstan",
      "Kyrgyzstan",
      "Russia",
      "Tajikistan",
      "Turkmenistan",
      "Uzbkistan",

      // South and South West Asia (SSWA)
      "Afghanistan",
      "Bangladesh",
      "Bhutan",
      "India",
      "Maldives",
      "Nepal",
      "Pakistan",
      "Sri Lanka",

      // South East Asia (SEA)
      "Brunei",
      "Cambodia",
      "Indonesia",
      "Laos",
      "Malaysia",
      "Myanmar",
      "Philippines",
      "Singapore",
      "Thailand",
      "Timor-Leste",
      "Vietnam",

      // The Pacific (PACIFIC)
      "American Samoa",
      "Australia",
      "Cook Islands",
      "Fiji",
      "French Polynesia",
      "Guam",
      "Kiribati",
      "Marshall Islands",
      "Micronesia",
      "Nauru",
      "New Caledonia",
      "New Zealand",
      "Niue",
      "Northern Mariana Islands",
      "Palau",
      "Papua New Guinea",
      "Samoa",
      "Solomon Islands",
      "Tonga",
      "Tuvalu",
      "Vanuatu",
    ],
  },
  {
    name: "LATAM",
    center: [-60, -15],
    scale: 80,
    countries: [
      // South America (12)
      "Argentina",
      "Bolivia",
      "Brazil",
      "Chile",
      "Colombia",
      "Ecuador",
      "Guyana",
      "Paraguay",
      "Peru",
      "Suriname",
      "Uruguay",
      "Venezuela",

      // Central America (7)
      "Belize",
      "Costa Rica",
      "El Salvador",
      "Guatemala",
      "Honduras",
      "Nicaragua",
      "Panama",
      "Mexico",

      // Caribbean (13 UN members + 3 more widely included)
      "Antigua and Barbuda",
      "Bahamas",
      "Barbados",
      "Cuba",
      "Dominica",
      "Dominican Republic",
      "Grenada",
      "Haiti",
      "Jamaica",
      "Saint Kitts and Nevis",
      "Saint Lucia",
      "Saint Vincent and the Grenadines",
      "Trinidad and Tobago",
      "Saint Martin",
      "Aruba",
      "Curacao",
    ],
  },
];

const DEFAULT_REGION_COLORS = {
  EMEA: "#FFB000",
  "North America": "#D3BDF2",
  APAC: "#FFAE80",
  LATAM: "#00B097",
  retailer: "#BCD530",
};

function hexToRgba(hex = "#000", alpha = 1) {
  const clean = (hex || "#000").replace("#", "");
  const r = Number.parseInt(clean.substring(0, 2), 16);
  const g = Number.parseInt(clean.substring(2, 4), 16);
  const b = Number.parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getRegionByCountry(countryName) {
  if (!countryName) return null;
  for (const r of REGIONS) {
    // match exact or trimmed name variants
    if (r.countries.includes(countryName)) return r.name;
  }
  return null;
}

function getFillColor({
  region,
  isCountrySelected,
  selectedRegion,
  selectedRetailer,
  regionColors,
}) {
  const neutral = "#F3F3F3";
  if (isCountrySelected) return "#111111";

  if (selectedRetailer) {
    if (!region) return neutral;
    if (region === selectedRegion) return "#111111";
    const retailerHex =
      regionColors[selectedRetailer] ||
      DEFAULT_REGION_COLORS[selectedRetailer] ||
      DEFAULT_REGION_COLORS.retailer;
    return hexToRgba(retailerHex, 1);
  }

  if (selectedRegion) {
    if (!region) return neutral;
    if (region === selectedRegion) return "#111111";
    const selHex =
      regionColors[selectedRegion] ||
      DEFAULT_REGION_COLORS[selectedRegion] ||
      "#DADADA";
    return hexToRgba(selHex, 0.9);
  }

  if (!region) return neutral;
  const defaultHex =
    regionColors.default || DEFAULT_REGION_COLORS.default;
  return hexToRgba(defaultHex, 1);
}

const WorldMap = ({
  selectedRegion,
  selectedCountry,
  selectedRetailer,
  onRegionSelect,
  onCountrySelect,
  regionColors = DEFAULT_REGION_COLORS,
}) => {
  // Zoom a bit more than previously (user asked "zoom in a little")
  const projectionConfig = { scale: 200, center: [0, 20] };

  return (
    <div className="flex items-center justify-center w-full h-full">
      <ComposableMap
        projection="geoNaturalEarth1"
        width={1200}
        height={700}
        style={{ width: "100%", height: "100%" }}
        projectionConfig={projectionConfig}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryName = geo.properties.name;
              const region = getRegionByCountry(countryName);
              const isCountrySelected = selectedCountry === countryName;

              // use default color (FF782C) when no region is selected
              const fill = getFillColor({
                region,
                isCountrySelected,
                selectedRegion,
                selectedRetailer,
                regionColors,
              });

              const stroke = isCountrySelected ? "#000" : "rgba(0,0,0,0.12)";
              const strokeWidth = isCountrySelected ? 1 : 0.4;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => {
                    if (region) {
                      onRegionSelect?.(region);
                      onCountrySelect?.(countryName);
                    }
                  }}
                  style={{
                    default: {
                      fill,
                      outline: "none",
                      stroke,
                      strokeWidth,
                      cursor: region ? "pointer" : "default",
                    },
                    hover: {
                      // hovering should emphasize (black), user requested hover -> black allowed
                      fill: "#111111",
                      outline: "none",
                      stroke: "#000",
                      strokeWidth: isCountrySelected ? 1 : 0.9,
                      cursor: region ? "pointer" : "default",
                    },
                    pressed: { fill: "#000", outline: "none", strokeWidth: 1 },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
};

export default WorldMap;

WorldMap.propTypes = {
  selectedRegion: PropTypes.string,
  selectedCountry: PropTypes.string,
  selectedRetailer: PropTypes.string,
  onRegionSelect: PropTypes.func,
  onCountrySelect: PropTypes.func,
  regionColors: PropTypes.object,
};
