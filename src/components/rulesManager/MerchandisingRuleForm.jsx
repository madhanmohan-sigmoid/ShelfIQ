import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
  TextField,
  Typography,
  Chip,
  Checkbox,
  RadioGroup,
  Radio,
  FormControlLabel,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import { ATTRIBUTES, TEXT_FIELD_STYLES } from "../../config/ruleModalConfig";
import AddProductGroupModal from "../Modals/AddProductGroupModal";
import { getProductGroupDisplayValues, transformProductGroup, reverseTransformProductGroup } from "../../utils/editPlanogramStep1Utils";

// Default attribute options fallback
const DEFAULT_ATTRIBUTE_OPTIONS = {
  brands: ["Brand A", "Brand B", "Brand C", "Brand D"],
  subCategories: ["Category 1", "Category 2", "Category 3", "Category 4"],
  intensities: ["Low", "Medium", "High", "Very High"],
  benchmarks: ["Benchmark 1", "Benchmark 2", "Benchmark 3", "Benchmark 4"],
  platforms: ["Platform 1", "Platform 2", "Platform 3", "Platform 4"],
  needState: ["State 1", "State 2", "State 3", "State 4"],
};

// Map attribute keys to their option keys in attributeOptions
const ATTRIBUTE_KEY_MAP = {
  "Brand": "brands",
  "Sub Category": "subCategories",
  "Intensities": "intensities",
  "Benchmarks": "benchmarks",
  "Platforms": "platforms",
  "Need State": "needState",
};

const MerchandisingRuleForm = ({ ruleType, onDataChange, attributeOptions = {} }) => {
  const [cdtRows, setCdtRows] = useState([
    { id: 1, rank: 1, attributeName: null },
  ]);

  const [flowRows, setFlowRows] = useState([
    { id: 1, attributeName: null, attributeValues: [] },
  ]);

  const [flowDirection, setFlowDirection] = useState("L2R");

  // Block Fixture Affinity state
  const [blockFixtureProductGroups, setBlockFixtureProductGroups] = useState([]);
  const [blockFixtureFixture, setBlockFixtureFixture] = useState("Bay");
  const [blockFixtureCompliance, setBlockFixtureCompliance] = useState("");
  const [isProductGroupModalOpen, setIsProductGroupModalOpen] = useState(false);
  const [editingProductGroupIndex, setEditingProductGroupIndex] = useState(null);

  // Block Orientation Preference state
  const [blockOrientationProductGroups, setBlockOrientationProductGroups] = useState([]);
  const [blockOrientation, setBlockOrientation] = useState("Horizontal");
  const [isOrientationProductGroupModalOpen, setIsOrientationProductGroupModalOpen] = useState(false);
  const [editingOrientationProductGroupIndex, setEditingOrientationProductGroupIndex] = useState(null);

  // Block Anti Affinity state
  const [blockAntiAffinityProductGroups, setBlockAntiAffinityProductGroups] = useState([]);
  const [blockAntiAffinityType, setBlockAntiAffinityType] = useState("Horizontal");
  const [isAntiAffinityProductGroupModalOpen, setIsAntiAffinityProductGroupModalOpen] = useState(false);
  const [editingAntiAffinityProductGroupIndex, setEditingAntiAffinityProductGroupIndex] = useState(null);

  // Private Label Placement state
  const [privateLabelProductGroups, setPrivateLabelProductGroups] = useState([]);
  const [privateLabelPlacement, setPrivateLabelPlacement] = useState("Adjacent to national equivalent");
  const [isPrivateLabelProductGroupModalOpen, setIsPrivateLabelProductGroupModalOpen] = useState(false);
  const [editingPrivateLabelProductGroupIndex, setEditingPrivateLabelProductGroupIndex] = useState(null);

  const handleAddRow = () => {
    const newRank = cdtRows.length + 1;
    setCdtRows([
      ...cdtRows,
      { id: Date.now(), rank: newRank, attributeName: null },
    ]);
  };

  const handleDeleteRow = (id) => {
    setCdtRows((prevRows) =>
      prevRows
        .filter((row) => row.id !== id)
        .map((row, index) => ({
          ...row,
          rank: index + 1,
        }))
    );
  };

  const handleAttributeChange = (id, newValue) => {
    setCdtRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id ? { ...row, attributeName: newValue } : row
      )
    );
  };

  // Notify parent whenever cdtRows changes
  useEffect(() => {
    if (ruleType === "CDT" && typeof onDataChange === "function") {
      const data = cdtRows.map((row) => ({
        rank: row.rank,
        attributeName: row.attributeName,
      }));
      onDataChange(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cdtRows, ruleType]);

  // Notify parent whenever flowRows or flowDirection changes
  useEffect(() => {
    if (ruleType === "Flow L2R / T2B" && typeof onDataChange === "function") {
      const data = {
        direction: flowDirection,
        rows: flowRows.map((row) => ({
          attributeName: row.attributeName,
          attributeValues: row.attributeValues,
        })),
      };
      onDataChange(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowRows, flowDirection, ruleType]);

  // Notify parent whenever Block Fixture Affinity data changes
  useEffect(() => {
    if (ruleType === "Block Fixture Affinity" && typeof onDataChange === "function") {
      const transformedProductGroups = blockFixtureProductGroups.map(transformProductGroup);
      const data = {
        productGroups: transformedProductGroups,
        fixture: blockFixtureFixture,
        compliance: blockFixtureCompliance || null,
      };
      onDataChange(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockFixtureProductGroups, blockFixtureFixture, blockFixtureCompliance, ruleType]);

  // Notify parent whenever Block Orientation Preference data changes
  useEffect(() => {
    if (ruleType === "Block Orientation Preference" && typeof onDataChange === "function") {
      const transformedProductGroups = blockOrientationProductGroups.map(transformProductGroup);
      const data = {
        productGroups: transformedProductGroups,
        orientation: blockOrientation,
      };
      onDataChange(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockOrientationProductGroups, blockOrientation, ruleType]);

  // Notify parent whenever Block Anti Affinity data changes
  useEffect(() => {
    if (ruleType === "Block Anti Affinity" && typeof onDataChange === "function") {
      const transformedProductGroups = blockAntiAffinityProductGroups.map(transformProductGroup);
      const data = {
        productGroups: transformedProductGroups,
        affinityType: blockAntiAffinityType,
      };
      onDataChange(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockAntiAffinityProductGroups, blockAntiAffinityType, ruleType]);

  // Notify parent whenever Private Label Placement data changes
  useEffect(() => {
    if (ruleType === "Private Label Placement" && typeof onDataChange === "function") {
      const transformedProductGroups = privateLabelProductGroups.map(transformProductGroup);
      const data = {
        productGroups: transformedProductGroups,
        placementType: privateLabelPlacement,
      };
      onDataChange(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privateLabelProductGroups, privateLabelPlacement, ruleType]);

  // Get attribute options for autocomplete (labels)
  const attributeLabels = ATTRIBUTES.map((attr) => attr.label);

  // Render CDT form
  if (ruleType === "CDT") {
    return (
      <div className="mb-6">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography fontSize={14} fontWeight={600} color="#222">
            Attribute Ranking
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add sx={{ fontSize: 16 }} />}
            onClick={handleAddRow}
            sx={{
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 10,
              px: 3,
              py: 1.5,
              textTransform: "none",
              borderColor: "#FFAE80",
              color: "#FF782C",
              "&:hover": {
                borderColor: "#FF782C",
                bgcolor: "#FFF5EE",
              },
            }}
          >
            Add Row
          </Button>
        </Box>

        <Box
          sx={{
            border: "1px solid #E5E7EB",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#222",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  Rank
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#222",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  Attribute Name
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#222",
                    borderBottom: "1px solid #E5E7EB",
                    width: 80,
                  }}
                ></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cdtRows.map((row) => (
                <TableRow key={row.id} sx={{ "&:hover": { bgcolor: "#FAFAFA" } }}>
                  <TableCell
                    sx={{
                      fontSize: 13,
                      color: "#222",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    {row.rank}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: 13,
                      color: "#222",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    <Autocomplete
                      options={attributeLabels}
                      value={row.attributeName || null}
                      onChange={(event, newValue) => {
                        handleAttributeChange(row.id, newValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Select Attribute"
                          size="small"
                          sx={TEXT_FIELD_STYLES}
                        />
                      )}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: 13,
                      color: "#222",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteRow(row.id)}
                      sx={{
                        color: "#EF4444",
                        "&:hover": {
                          bgcolor: "#FEE2E2",
                        },
                      }}
                    >
                      <Delete sx={{ fontSize: 18 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </div>
    );
  }

  // Flow L2R/T2B handlers
  const handleAddFlowRow = () => {
    setFlowRows([
      ...flowRows,
      { id: Date.now(), attributeName: null, attributeValues: [] },
    ]);
  };

  const handleDeleteFlowRow = (id) => {
    setFlowRows((prevRows) => prevRows.filter((row) => row.id !== id));
  };

  const handleFlowAttributeChange = (id, newValue) => {
    setFlowRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id
          ? { ...row, attributeName: newValue, attributeValues: [] } // Reset values when attribute changes
          : row
      )
    );
  };

  const handleFlowAttributeValuesChange = (id, newValues) => {
    setFlowRows((prevRows) =>
      prevRows.map((row) =>
        row.id === id ? { ...row, attributeValues: newValues || [] } : row
      )
    );
  };

  // Get attribute values for a selected attribute
  const getAttributeValues = (attributeLabel) => {
    if (!attributeLabel) return [];
    const optionKey = ATTRIBUTE_KEY_MAP[attributeLabel];
    if (!optionKey) return [];
    
    // Use attributeOptions if available, otherwise fallback to defaults
    const values = Array.isArray(attributeOptions[optionKey]) &&
      attributeOptions[optionKey].length > 0
      ? attributeOptions[optionKey]
      : DEFAULT_ATTRIBUTE_OPTIONS[optionKey] || [];
    
    return values;
  };

  // Render Flow L2R/T2B form
  if (ruleType === "Flow L2R / T2B") {
    return (
      <div className="mb-6">
        {/* Direction Selection Section */}
        <Box mb={3}>
          <Typography fontSize={14} fontWeight={600} color="#222" mb={2}>
            Select Direction of flow
          </Typography>
          <RadioGroup
            value={flowDirection}
            onChange={(e) => setFlowDirection(e.target.value)}
            row
            sx={{ gap: 3 }}
          >
            <FormControlLabel
              value="L2R"
              control={
                <Radio
                  size="small"
                  sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
                />
              }
              label={<Typography fontSize={13}>Left to right (L2R)</Typography>}
            />
            <FormControlLabel
              value="TTB"
              control={
                <Radio
                  size="small"
                  sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
                />
              }
              label={<Typography fontSize={13}>Top to Bottom (TTB)</Typography>}
            />
          </RadioGroup>
        </Box>

        {/* Attribute Selection Section */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography fontSize={14} fontWeight={600} color="#222">
            Select Attribute name from CDT Hierarchy
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add sx={{ fontSize: 16 }} />}
            onClick={handleAddFlowRow}
            sx={{
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 10,
              px: 3,
              py: 1.5,
              textTransform: "none",
              borderColor: "#FFAE80",
              color: "#FF782C",
              "&:hover": {
                borderColor: "#FF782C",
                bgcolor: "#FFF5EE",
              },
            }}
          >
            Add Row
          </Button>
        </Box>

        <Box
          sx={{
            border: "1px solid #E5E7EB",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#222",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  Attribute Name
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#222",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  Attribute Value
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#222",
                    borderBottom: "1px solid #E5E7EB",
                    width: 80,
                  }}
                ></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flowRows.map((row) => {
                const attributeValues = getAttributeValues(row.attributeName);
                
                return (
                  <TableRow key={row.id} sx={{ "&:hover": { bgcolor: "#FAFAFA" } }}>
                    <TableCell
                      sx={{
                        fontSize: 13,
                        color: "#222",
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      <Autocomplete
                        options={attributeLabels}
                        value={row.attributeName || null}
                        onChange={(event, newValue) => {
                          handleFlowAttributeChange(row.id, newValue);
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Select Attribute"
                            size="small"
                            sx={TEXT_FIELD_STYLES}
                          />
                        )}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: 13,
                        color: "#222",
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      <Autocomplete
                        multiple
                        disabled={!row.attributeName}
                        options={attributeValues}
                        value={row.attributeValues || []}
                        onChange={(event, newValue) => {
                          handleFlowAttributeValuesChange(row.id, newValue);
                        }}
                        disableCloseOnSelect
                        limitTags={1}
                        getLimitTagsText={(more) => `+${more}`}
                        ListboxProps={{
                          sx: {
                            "& .MuiAutocomplete-option": {
                              fontSize: 12,
                            },
                          },
                        }}
                        renderOption={(props, option, { selected }) => (
                          <li {...props}>
                            <Checkbox
                              checked={selected}
                              sx={{
                                color: "#222",
                                "&.Mui-checked": { color: "#222" },
                              }}
                            />
                            {option}
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder={
                              row.attributeName
                                ? "Select values..."
                                : "Select attribute first"
                            }
                            size="small"
                            sx={TEXT_FIELD_STYLES}
                          />
                        )}
                        renderTags={(selected = [], getTagProps = () => ({})) => {
                          const visible = selected.filter((value) => value);
                          if (visible.length === 0) return null;

                          const [firstValue, ...rest] = visible;
                          const label = String(firstValue);
                          const truncatedLabel = label.length > 10 ? `${label.slice(0, 10)}…` : label;

                          return (
                            <>
                              <Chip
                                label={truncatedLabel}
                                size="small"
                                {...getTagProps({ index: 0 })}
                                sx={{
                                  fontSize: "0.75rem",
                                  height: 22,
                                  maxWidth: "90%",
                                }}
                              />
                              {rest.length > 0 && (
                                <Chip
                                  label={`+${rest.length}`}
                                  size="small"
                                  sx={{
                                    fontSize: "0.75rem",
                                    height: 22,
                                  }}
                                />
                              )}
                            </>
                          );
                        }}
                        sx={{
                          width: "100%",
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        fontSize: 13,
                        color: "#222",
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteFlowRow(row.id)}
                        sx={{
                          color: "#EF4444",
                          "&:hover": {
                            bgcolor: "#FEE2E2",
                          },
                        }}
                      >
                        <Delete sx={{ fontSize: 18 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </div>
    );
  }

  // Block Fixture Affinity handlers
  const handleAddProductGroup = () => {
    setEditingProductGroupIndex(null);
    setIsProductGroupModalOpen(true);
  };

  const handleEditProductGroup = (index) => {
    setEditingProductGroupIndex(index);
    setIsProductGroupModalOpen(true);
  };

  const handleCloseProductGroupModal = () => {
    setIsProductGroupModalOpen(false);
    setEditingProductGroupIndex(null);
  };

  const handleSubmitProductGroup = (selectedAttributes) => {
    const transformedGroup = transformProductGroup(selectedAttributes);
    const currentProductGroups = [...blockFixtureProductGroups];
    
    if (editingProductGroupIndex !== null && editingProductGroupIndex >= 0) {
      currentProductGroups[editingProductGroupIndex] = transformedGroup;
    } else {
      currentProductGroups.push(transformedGroup);
    }
    
    setBlockFixtureProductGroups(currentProductGroups);
    handleCloseProductGroupModal();
  };

  // Block Orientation Preference handlers
  const handleAddOrientationProductGroup = () => {
    setEditingOrientationProductGroupIndex(null);
    setIsOrientationProductGroupModalOpen(true);
  };

  const handleEditOrientationProductGroup = (index) => {
    setEditingOrientationProductGroupIndex(index);
    setIsOrientationProductGroupModalOpen(true);
  };

  const handleCloseOrientationProductGroupModal = () => {
    setIsOrientationProductGroupModalOpen(false);
    setEditingOrientationProductGroupIndex(null);
  };

  const handleSubmitOrientationProductGroup = (selectedAttributes) => {
    const transformedGroup = transformProductGroup(selectedAttributes);
    const currentProductGroups = [...blockOrientationProductGroups];
    
    if (editingOrientationProductGroupIndex !== null && editingOrientationProductGroupIndex >= 0) {
      currentProductGroups[editingOrientationProductGroupIndex] = transformedGroup;
    } else {
      currentProductGroups.push(transformedGroup);
    }
    
    setBlockOrientationProductGroups(currentProductGroups);
    handleCloseOrientationProductGroupModal();
  };

  // Render Block Fixture Affinity form
  if (ruleType === "Block Fixture Affinity") {
    return (
      <>
        <div className="mb-6">
          {/* Product Group Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Product Group</h3>
            
            {blockFixtureProductGroups.length === 0 ? (
              <Button
                variant="contained"
                size="small"
                startIcon={<Add sx={{ fontSize: 16 }} />}
                onClick={handleAddProductGroup}
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 10,
                  px: 3,
                  py: 1.5,
                  textTransform: "none",
                  bgcolor: "#FFAE80",
                  color: "#000",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#FF9D66",
                    boxShadow: "none",
                  },
                }}
              >
                Add Product Group
              </Button>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {blockFixtureProductGroups.map((productGroup, index) => {
                  if (!productGroup || typeof productGroup !== 'object') {
                    return null;
                  }
                  
                  const { subCategory, brand } = getProductGroupDisplayValues(productGroup);
                  
                  if (!subCategory && !brand) return null;
                  
                  const groupKey = `pg-${index}-${subCategory || ''}-${brand || ''}`;
                  
                  return (
                    <Box
                      key={groupKey}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      p={1.5}
                      bgcolor="#F9FAFB"
                      borderRadius={2}
                      border="1px solid #E5E7EB"
                    >
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Typography fontSize={12} fontWeight={600} color="#222">
                          PG{index + 1}:
                        </Typography>
                        {subCategory && (
                          <>
                            <Chip
                              label={subCategory}
                              size="small"
                              sx={{
                                height: 24,
                                fontSize: 12,
                                fontWeight: 500,
                                bgcolor: "#E0E0E0",
                                color: "#222",
                                borderRadius: 1,
                                "& .MuiChip-label": {
                                  px: 1.5,
                                },
                              }}
                            />
                            {brand && (
                              <>
                                <Typography fontSize={12} color="#222" mx={0.5}>
                                  -
                                </Typography>
                                <Chip
                                  label={brand}
                                  size="small"
                                  sx={{
                                    height: 24,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    bgcolor: "#E0E0E0",
                                    color: "#222",
                                    borderRadius: 1,
                                    "& .MuiChip-label": {
                                      px: 1.5,
                                    },
                                  }}
                                />
                              </>
                            )}
                          </>
                        )}
                        {!subCategory && brand && (
                          <Chip
                            label={brand}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: 12,
                              fontWeight: 500,
                              bgcolor: "#E0E0E0",
                              color: "#222",
                              borderRadius: 1,
                              "& .MuiChip-label": {
                                px: 1.5,
                              },
                            }}
                          />
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleEditProductGroup(index)}
                        sx={{
                          color: "#FF782C",
                          "&:hover": {
                            bgcolor: "#FFF5EE",
                          },
                        }}
                      >
                        <Edit sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  );
                })}
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add sx={{ fontSize: 16 }} />}
                  onClick={handleAddProductGroup}
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 10,
                    px: 3,
                    py: 1.5,
                    textTransform: "none",
                    borderColor: "#FFAE80",
                    color: "#FF782C",
                    alignSelf: "flex-start",
                    "&:hover": {
                      borderColor: "#FF782C",
                      bgcolor: "#FFF5EE",
                    },
                  }}
                >
                  Add Product Group
                </Button>
              </Box>
            )}
          </div>

          {/* Select Fixture Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Select fixture</h3>
            <RadioGroup
              value={blockFixtureFixture}
              onChange={(e) => setBlockFixtureFixture(e.target.value)}
              row
              sx={{ gap: 3 }}
            >
              <FormControlLabel
                value="Bay"
                control={
                  <Radio
                    size="small"
                    sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
                  />
                }
                label={<Typography fontSize={13}>Bay</Typography>}
              />
              <FormControlLabel
                value="Shelf"
                control={
                  <Radio
                    size="small"
                    sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
                  />
                }
                label={<Typography fontSize={13}>Shelf</Typography>}
              />
              <FormControlLabel
                value="Combination of bay and shelf"
                control={
                  <Radio
                    size="small"
                    sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
                  />
                }
                label={<Typography fontSize={13}>Combination of bay and shelf</Typography>}
              />
            </RadioGroup>
          </div>

          {/* Compliance Required Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Compliance required (optional)</h3>
            <TextField
              placeholder="enter value in %"
              value={blockFixtureCompliance}
              onChange={(e) => setBlockFixtureCompliance(e.target.value)}
              size="small"
              sx={{
                ...TEXT_FIELD_STYLES,
                width: "200px",
              }}
            />
          </div>
        </div>

        {/* Add Product Group Modal */}
        {isProductGroupModalOpen && (
          <AddProductGroupModal
            open={isProductGroupModalOpen}
            onClose={handleCloseProductGroupModal}
            onSubmit={handleSubmitProductGroup}
            attributeOptions={attributeOptions || {}}
            initialValues={
              editingProductGroupIndex !== null && 
              editingProductGroupIndex >= 0 &&
              blockFixtureProductGroups[editingProductGroupIndex] &&
              typeof blockFixtureProductGroups[editingProductGroupIndex] === 'object'
                ? reverseTransformProductGroup(blockFixtureProductGroups[editingProductGroupIndex])
                : null
            }
            editingIndex={editingProductGroupIndex}
          />
        )}
      </>
    );
  }

  // Render Block Orientation Preference form
  if (ruleType === "Block Orientation Preference") {
    return (
      <>
        <div className="mb-6">
          {/* Product Group Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Product Group</h3>
            
            {blockOrientationProductGroups.length === 0 ? (
              <Button
                variant="contained"
                size="small"
                startIcon={<Add sx={{ fontSize: 16 }} />}
                onClick={handleAddOrientationProductGroup}
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 10,
                  px: 3,
                  py: 1.5,
                  textTransform: "none",
                  bgcolor: "#FFAE80",
                  color: "#000",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#FF9D66",
                    boxShadow: "none",
                  },
                }}
              >
                Add Product Group
              </Button>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {blockOrientationProductGroups.map((productGroup, index) => {
                  if (!productGroup || typeof productGroup !== 'object') {
                    return null;
                  }
                  
                  const { subCategory, brand } = getProductGroupDisplayValues(productGroup);
                  
                  if (!subCategory && !brand) return null;
                  
                  const groupKey = `pg-${index}-${subCategory || ''}-${brand || ''}`;
                  
                  return (
                    <Box
                      key={groupKey}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      p={1.5}
                      bgcolor="#F9FAFB"
                      borderRadius={2}
                      border="1px solid #E5E7EB"
                    >
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Typography fontSize={12} fontWeight={600} color="#222">
                          PG{index + 1}:
                        </Typography>
                        {subCategory && (
                          <>
                            <Chip
                              label={subCategory}
                              size="small"
                              sx={{
                                height: 24,
                                fontSize: 12,
                                fontWeight: 500,
                                bgcolor: "#E0E0E0",
                                color: "#222",
                                borderRadius: 1,
                                "& .MuiChip-label": {
                                  px: 1.5,
                                },
                              }}
                            />
                            {brand && (
                              <>
                                <Typography fontSize={12} color="#222" mx={0.5}>
                                  -
                                </Typography>
                                <Chip
                                  label={brand}
                                  size="small"
                                  sx={{
                                    height: 24,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    bgcolor: "#E0E0E0",
                                    color: "#222",
                                    borderRadius: 1,
                                    "& .MuiChip-label": {
                                      px: 1.5,
                                    },
                                  }}
                                />
                              </>
                            )}
                          </>
                        )}
                        {!subCategory && brand && (
                          <Chip
                            label={brand}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: 12,
                              fontWeight: 500,
                              bgcolor: "#E0E0E0",
                              color: "#222",
                              borderRadius: 1,
                              "& .MuiChip-label": {
                                px: 1.5,
                              },
                            }}
                          />
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleEditOrientationProductGroup(index)}
                        sx={{
                          color: "#FF782C",
                          "&:hover": {
                            bgcolor: "#FFF5EE",
                          },
                        }}
                      >
                        <Edit sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  );
                })}
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add sx={{ fontSize: 16 }} />}
                  onClick={handleAddOrientationProductGroup}
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 10,
                    px: 3,
                    py: 1.5,
                    textTransform: "none",
                    borderColor: "#FFAE80",
                    color: "#FF782C",
                    alignSelf: "flex-start",
                    "&:hover": {
                      borderColor: "#FF782C",
                      bgcolor: "#FFF5EE",
                    },
                  }}
                >
                  Add Product Group
                </Button>
              </Box>
            )}
          </div>

          {/* Select Orientation Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Select Orientation</h3>
            <RadioGroup
              value={blockOrientation}
              onChange={(e) => setBlockOrientation(e.target.value)}
              row
              sx={{ gap: 3 }}
            >
              <FormControlLabel
                value="Horizontal"
                control={
                  <Radio
                    size="small"
                    sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
                  />
                }
                label={<Typography fontSize={13}>Horizontal</Typography>}
              />
              <FormControlLabel
                value="Vertical"
                control={
                  <Radio
                    size="small"
                    sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
                  />
                }
                label={<Typography fontSize={13}>Vertical</Typography>}
              />
            </RadioGroup>
          </div>
        </div>

        {/* Add Product Group Modal */}
        {isOrientationProductGroupModalOpen && (
          <AddProductGroupModal
            open={isOrientationProductGroupModalOpen}
            onClose={handleCloseOrientationProductGroupModal}
            onSubmit={handleSubmitOrientationProductGroup}
            attributeOptions={attributeOptions || {}}
            initialValues={
              editingOrientationProductGroupIndex !== null && 
              editingOrientationProductGroupIndex >= 0 &&
              blockOrientationProductGroups[editingOrientationProductGroupIndex] &&
              typeof blockOrientationProductGroups[editingOrientationProductGroupIndex] === 'object'
                ? reverseTransformProductGroup(blockOrientationProductGroups[editingOrientationProductGroupIndex])
                : null
            }
            editingIndex={editingOrientationProductGroupIndex}
          />
        )}
      </>
    );
  }

  // Block Anti Affinity handlers
  const handleAddAntiAffinityProductGroup = () => {
    setEditingAntiAffinityProductGroupIndex(null);
    setIsAntiAffinityProductGroupModalOpen(true);
  };

  const handleEditAntiAffinityProductGroup = (index) => {
    setEditingAntiAffinityProductGroupIndex(index);
    setIsAntiAffinityProductGroupModalOpen(true);
  };

  const handleCloseAntiAffinityProductGroupModal = () => {
    setIsAntiAffinityProductGroupModalOpen(false);
    setEditingAntiAffinityProductGroupIndex(null);
  };

  const handleSubmitAntiAffinityProductGroup = (selectedAttributes) => {
    const transformedGroup = transformProductGroup(selectedAttributes);
    const currentProductGroups = [...blockAntiAffinityProductGroups];
    
    if (editingAntiAffinityProductGroupIndex !== null && editingAntiAffinityProductGroupIndex >= 0) {
      currentProductGroups[editingAntiAffinityProductGroupIndex] = transformedGroup;
    } else {
      currentProductGroups.push(transformedGroup);
    }
    
    setBlockAntiAffinityProductGroups(currentProductGroups);
    handleCloseAntiAffinityProductGroupModal();
  };

  // Private Label Placement handlers
  const handleAddPrivateLabelProductGroup = () => {
    setEditingPrivateLabelProductGroupIndex(null);
    setIsPrivateLabelProductGroupModalOpen(true);
  };

  const handleEditPrivateLabelProductGroup = (index) => {
    setEditingPrivateLabelProductGroupIndex(index);
    setIsPrivateLabelProductGroupModalOpen(true);
  };

  const handleClosePrivateLabelProductGroupModal = () => {
    setIsPrivateLabelProductGroupModalOpen(false);
    setEditingPrivateLabelProductGroupIndex(null);
  };

  const handleSubmitPrivateLabelProductGroup = (selectedAttributes) => {
    const transformedGroup = transformProductGroup(selectedAttributes);
    const currentProductGroups = [...privateLabelProductGroups];
    
    if (editingPrivateLabelProductGroupIndex !== null && editingPrivateLabelProductGroupIndex >= 0) {
      currentProductGroups[editingPrivateLabelProductGroupIndex] = transformedGroup;
    } else {
      currentProductGroups.push(transformedGroup);
    }
    
    setPrivateLabelProductGroups(currentProductGroups);
    handleClosePrivateLabelProductGroupModal();
  };

  // Render Block Anti Affinity form
  if (ruleType === "Block Anti Affinity") {
    return (
      <>
        <div className="mb-6">
          {/* Product Group Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Product Group</h3>
            
            {blockAntiAffinityProductGroups.length === 0 ? (
              <Button
                variant="contained"
                size="small"
                startIcon={<Add sx={{ fontSize: 16 }} />}
                onClick={handleAddAntiAffinityProductGroup}
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 10,
                  px: 3,
                  py: 1.5,
                  textTransform: "none",
                  bgcolor: "#FFAE80",
                  color: "#000",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#FF9D66",
                    boxShadow: "none",
                  },
                }}
              >
                Add Product Group
              </Button>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {blockAntiAffinityProductGroups.map((productGroup, index) => {
                  if (!productGroup || typeof productGroup !== 'object') {
                    return null;
                  }
                  
                  const { subCategory, brand } = getProductGroupDisplayValues(productGroup);
                  
                  if (!subCategory && !brand) return null;
                  
                  const groupKey = `pg-${index}-${subCategory || ''}-${brand || ''}`;
                  
                  return (
                    <Box
                      key={groupKey}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      p={1.5}
                      bgcolor="#F9FAFB"
                      borderRadius={2}
                      border="1px solid #E5E7EB"
                    >
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Typography fontSize={12} fontWeight={600} color="#222">
                          PG{index + 1}:
                        </Typography>
                        {subCategory && (
                          <>
                            <Chip
                              label={subCategory}
                              size="small"
                              sx={{
                                height: 24,
                                fontSize: 12,
                                fontWeight: 500,
                                bgcolor: "#E0E0E0",
                                color: "#222",
                                borderRadius: 1,
                                "& .MuiChip-label": {
                                  px: 1.5,
                                },
                              }}
                            />
                            {brand && (
                              <>
                                <Typography fontSize={12} color="#222" mx={0.5}>
                                  -
                                </Typography>
                                <Chip
                                  label={brand}
                                  size="small"
                                  sx={{
                                    height: 24,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    bgcolor: "#E0E0E0",
                                    color: "#222",
                                    borderRadius: 1,
                                    "& .MuiChip-label": {
                                      px: 1.5,
                                    },
                                  }}
                                />
                              </>
                            )}
                          </>
                        )}
                        {!subCategory && brand && (
                          <Chip
                            label={brand}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: 12,
                              fontWeight: 500,
                              bgcolor: "#E0E0E0",
                              color: "#222",
                              borderRadius: 1,
                              "& .MuiChip-label": {
                                px: 1.5,
                              },
                            }}
                          />
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleEditAntiAffinityProductGroup(index)}
                        sx={{
                          color: "#FF782C",
                          "&:hover": {
                            bgcolor: "#FFF5EE",
                          },
                        }}
                      >
                        <Edit sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  );
                })}
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add sx={{ fontSize: 16 }} />}
                  onClick={handleAddAntiAffinityProductGroup}
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 10,
                    px: 3,
                    py: 1.5,
                    textTransform: "none",
                    borderColor: "#FFAE80",
                    color: "#FF782C",
                    alignSelf: "flex-start",
                    "&:hover": {
                      borderColor: "#FF782C",
                      bgcolor: "#FFF5EE",
                    },
                  }}
                >
                  Add Product Group
                </Button>
              </Box>
            )}
          </div>

          {/* Select Affinity Type Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Select Affinity Type</h3>
            <RadioGroup
              value={blockAntiAffinityType}
              onChange={(e) => setBlockAntiAffinityType(e.target.value)}
              row
              sx={{ gap: 3 }}
            >
              <FormControlLabel
                value="Horizontal"
                control={
                  <Radio
                    size="small"
                    sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
                  />
                }
                label={<Typography fontSize={13}>Horizontal</Typography>}
              />
              <FormControlLabel
                value="Vertical"
                control={
                  <Radio
                    size="small"
                    sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
                  />
                }
                label={<Typography fontSize={13}>Vertical</Typography>}
              />
            </RadioGroup>
          </div>
        </div>

        {/* Add Product Group Modal */}
        {isAntiAffinityProductGroupModalOpen && (
          <AddProductGroupModal
            open={isAntiAffinityProductGroupModalOpen}
            onClose={handleCloseAntiAffinityProductGroupModal}
            onSubmit={handleSubmitAntiAffinityProductGroup}
            attributeOptions={attributeOptions || {}}
            initialValues={
              editingAntiAffinityProductGroupIndex !== null && 
              editingAntiAffinityProductGroupIndex >= 0 &&
              blockAntiAffinityProductGroups[editingAntiAffinityProductGroupIndex] &&
              typeof blockAntiAffinityProductGroups[editingAntiAffinityProductGroupIndex] === 'object'
                ? reverseTransformProductGroup(blockAntiAffinityProductGroups[editingAntiAffinityProductGroupIndex])
                : null
            }
            editingIndex={editingAntiAffinityProductGroupIndex}
          />
        )}
      </>
    );
  }

  // Render Private Label Placement form
  if (ruleType === "Private Label Placement") {
    return (
      <>
        <div className="mb-6">
          {/* Product Group Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Product Group</h3>
            
            {privateLabelProductGroups.length === 0 ? (
              <Button
                variant="contained"
                size="small"
                startIcon={<Add sx={{ fontSize: 16 }} />}
                onClick={handleAddPrivateLabelProductGroup}
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 10,
                  px: 3,
                  py: 1.5,
                  textTransform: "none",
                  bgcolor: "#FFAE80",
                  color: "#000",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "#FF9D66",
                    boxShadow: "none",
                  },
                }}
              >
                Add Product Group
              </Button>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {privateLabelProductGroups.map((productGroup, index) => {
                  if (!productGroup || typeof productGroup !== 'object') {
                    return null;
                  }
                  
                  const { subCategory, brand } = getProductGroupDisplayValues(productGroup);
                  
                  if (!subCategory && !brand) return null;
                  
                  const groupKey = `pg-${index}-${subCategory || ''}-${brand || ''}`;
                  
                  return (
                    <Box
                      key={groupKey}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      p={1.5}
                      bgcolor="#F9FAFB"
                      borderRadius={2}
                      border="1px solid #E5E7EB"
                    >
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Typography fontSize={12} fontWeight={600} color="#222">
                          PG{index + 1}:
                        </Typography>
                        {subCategory && (
                          <>
                            <Chip
                              label={subCategory}
                              size="small"
                              sx={{
                                height: 24,
                                fontSize: 12,
                                fontWeight: 500,
                                bgcolor: "#E0E0E0",
                                color: "#222",
                                borderRadius: 1,
                                "& .MuiChip-label": {
                                  px: 1.5,
                                },
                              }}
                            />
                            {brand && (
                              <>
                                <Typography fontSize={12} color="#222" mx={0.5}>
                                  -
                                </Typography>
                                <Chip
                                  label={brand}
                                  size="small"
                                  sx={{
                                    height: 24,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    bgcolor: "#E0E0E0",
                                    color: "#222",
                                    borderRadius: 1,
                                    "& .MuiChip-label": {
                                      px: 1.5,
                                    },
                                  }}
                                />
                              </>
                            )}
                          </>
                        )}
                        {!subCategory && brand && (
                          <Chip
                            label={brand}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: 12,
                              fontWeight: 500,
                              bgcolor: "#E0E0E0",
                              color: "#222",
                              borderRadius: 1,
                              "& .MuiChip-label": {
                                px: 1.5,
                              },
                            }}
                          />
                        )}
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleEditPrivateLabelProductGroup(index)}
                        sx={{
                          color: "#FF782C",
                          "&:hover": {
                            bgcolor: "#FFF5EE",
                          },
                        }}
                      >
                        <Edit sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  );
                })}
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add sx={{ fontSize: 16 }} />}
                  onClick={handleAddPrivateLabelProductGroup}
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 10,
                    px: 3,
                    py: 1.5,
                    textTransform: "none",
                    borderColor: "#FFAE80",
                    color: "#FF782C",
                    alignSelf: "flex-start",
                    "&:hover": {
                      borderColor: "#FF782C",
                      bgcolor: "#FFF5EE",
                    },
                  }}
                >
                  Add Product Group
                </Button>
              </Box>
            )}
          </div>

          {/* Select Placement Type Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Select Placement Type</h3>
            <RadioGroup
              value={privateLabelPlacement}
              onChange={(e) => setPrivateLabelPlacement(e.target.value)}
              row
              sx={{ gap: 3 }}
            >
              <FormControlLabel
                value="Adjacent to national equivalent"
                control={
                  <Radio
                    size="small"
                    sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
                  />
                }
                label={<Typography fontSize={13}>Adjacent to national equivalent</Typography>}
              />
              <FormControlLabel
                value="Independent block"
                control={
                  <Radio
                    size="small"
                    sx={{ color: "#222", "&.Mui-checked": { color: "#222" } }}
                  />
                }
                label={<Typography fontSize={13}>Independent block</Typography>}
              />
            </RadioGroup>
          </div>
        </div>

        {/* Add Product Group Modal */}
        {isPrivateLabelProductGroupModalOpen && (
          <AddProductGroupModal
            open={isPrivateLabelProductGroupModalOpen}
            onClose={handleClosePrivateLabelProductGroupModal}
            onSubmit={handleSubmitPrivateLabelProductGroup}
            attributeOptions={attributeOptions || {}}
            initialValues={
              editingPrivateLabelProductGroupIndex !== null && 
              editingPrivateLabelProductGroupIndex >= 0 &&
              privateLabelProductGroups[editingPrivateLabelProductGroupIndex] &&
              typeof privateLabelProductGroups[editingPrivateLabelProductGroupIndex] === 'object'
                ? reverseTransformProductGroup(privateLabelProductGroups[editingPrivateLabelProductGroupIndex])
                : null
            }
            editingIndex={editingPrivateLabelProductGroupIndex}
          />
        )}
      </>
    );
  }

  // Placeholder for other rule types
  return (
    <div className="mb-6">
      <Typography fontSize={14} fontWeight={600} color="#222">
        {ruleType} configuration coming soon
      </Typography>
    </div>
  );
};

MerchandisingRuleForm.propTypes = {
  ruleType: PropTypes.string.isRequired,
  onDataChange: PropTypes.func,
  attributeOptions: PropTypes.object,
};

export default MerchandisingRuleForm;

