import React, { useCallback, useEffect, useRef, useState } from "react";
import { useGridFilter } from "ag-grid-react";
import { Button, Divider, InputBase } from "@mui/material";
import PropTypes from "prop-types";

const MultiFilter = (props) => {
  const { model, onModelChange, colDef, api } = props;
  const refInput = useRef(null);
const getUniqueValues = (field) => {
  const set = new Set();
  // Use all rows, not just filtered ones
  api?.forEachNode((node) => {
    const v = node.data?.[field];
    if (Array.isArray(v)) {
      for (const it of v) {
        if (it?.name) set.add(it.name);
      }
    } else if (v != null) set.add(v);
  });
  return Array.from(set);
};

  const initialFilterArr = () => model?.map((el) => el) || [];

  const initialCheckBoxArr = () => {
    const allOptions = getUniqueValues(colDef.field || "").map((el) => {
      return initialFilterArr().length
        ? { field: el, checked: initialFilterArr().some((f) => f.field === el) }
        : { field: el, checked: true };
    });

    // Pin checked ones at the top, sort both groups alphabetically
    return allOptions.sort((a, b) => {
      if (a.checked === b.checked) {
        return String(a.field).localeCompare(String(b.field));
      }
      return a.checked ? -1 : 1;
    });
  };

  const [checkBoxArr, setCheckBoxArr] = useState(initialCheckBoxArr());
  const [searchText, setSearchText] = useState("");

  const sortByCheckedThenAlpha = (left, right) => {
    if (left.checked === right.checked) {
      return String(left.field).localeCompare(String(right.field));
    }

    return left.checked ? -1 : 1;
  };

  const getEmptyStateMessage = () => {
    if (searchText) {
      return "No matches found";
    }

    if (checkBoxArr.length === 0) {
      return "Loading options...";
    }

    return "No options available";
  };

  useEffect(() => {
    if (model === null) {
      setCheckBoxArr((prev) =>
        prev.map((item) => ({ ...item, checked: true }))
      );
    }
  }, [model]);

  useEffect(() => {
    if (!api) return;

    const onFilterChanged = () => {
      const options = getUniqueValues(colDef.field || "");
      const selected = new Set(
        (model || []).map((m) => m.field ?? m?.name ?? m)
      );
      // keep existing selections if present; otherwise default to checked
      setCheckBoxArr(
        options
          .map((f) => ({
            field: f,
            checked: selected.size ? selected.has(f) : true,
          }))
          // keep your “checked first, then alpha” ordering
          .sort(sortByCheckedThenAlpha)
      );
    };

    api.addEventListener("filterChanged", onFilterChanged);
    // run once so opening a column after other filters shows reduced values
    onFilterChanged();

    return () => api.removeEventListener("filterChanged", onFilterChanged);
  }, [api, colDef.field, model]);

  useEffect(() => {
    const newCheckBoxArr = initialCheckBoxArr();
    setCheckBoxArr(newCheckBoxArr);
  }, [colDef.field, api]);

  const doesFilterPass = useCallback(
    (params) => {
      const { node } = params;
      const cellValue = node.data?.[colDef.field];

      // No model => this column is NOT active => row must pass here
      if (!model || model.length === 0) return true;

      const eq = (m, v) => {
        const left = String(m?.name ?? m?.field ?? m ?? "").toLowerCase();
        const right = String(v?.name ?? v ?? "").toLowerCase();
        return left === right;
      };

      if (Array.isArray(cellValue)) {
        // OR within this column: any selected option matches any array item
        return model.some((m) => cellValue.some((v) => eq(m, v)));
      }
      return model.some((m) => eq(m, cellValue));
    },
    [model, colDef.field]
  );

  const afterGuiAttached = useCallback((params) => {
    if (!params?.suppressFocus) {
      refInput.current?.focus();
    }
  }, []);

  useGridFilter({
    doesFilterPass,
    isFilterActive: () => Array.isArray(model) && model.length > 0,
    afterGuiAttached,
  });

  useEffect(() => {
    if (api) api.onFilterChanged();
  }, [model, api]);

  const closeFilterPopup = () => {
    api?.hidePopupMenu?.();
    api?.closeFilterFloatingWindow?.();
    api?.filterManager?.hidePopupMenu?.();
  };

  const applyFilter = () => {
    const selectedFilters = checkBoxArr.filter((el) => el.checked);
    onModelChange(
      selectedFilters.length === checkBoxArr.length ? null : selectedFilters
    );

    // Keep pinned order after Apply
    setCheckBoxArr((prev) =>
      [...prev].sort((a, b) => {
        return sortByCheckedThenAlpha(a, b);
      })
    );

    setTimeout(closeFilterPopup, 50);
  };

  const destroyFilter = () => {
    onModelChange(null);
    const resetArr = getUniqueValues(colDef.field || "").map((el) => ({
      field: el,
      checked: true,
    }));
    // return to pure alphabetical order (not pinned)
    const sortedArr = resetArr.toSorted((a, b) => String(a.field).localeCompare(String(b.field)));
    setCheckBoxArr(sortedArr);
    setTimeout(closeFilterPopup, 50);
  };

  const checkBoxHandler = useCallback((key) => {
    if (key === "selectAll") {
      setCheckBoxArr((prev) =>
        prev.every((el) => el.checked)
          ? prev.map((el) => ({ ...el, checked: false }))
          : prev.map((el) => ({ ...el, checked: true }))
      );
    } else {
      setCheckBoxArr((prev) =>
        prev.map((el) =>
          el.field === key ? { ...el, checked: !el.checked } : el
        )
      );
    }
  }, []);

  const filteredCheckBoxArr = checkBoxArr.filter((el) =>
    String(el.field || "")
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  return (
    <div className="min-w-[280px] max-w-[500px] w-auto p-4 bg-white shadow-md text-sm font-sans text-gray-700 rounded-lg">
      {/* Search */}
      <InputBase
        inputRef={refInput}
        type="text"
        placeholder="Search..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        sx={{
          display: "block",
          border: "1px solid #E0E0E0",
          borderRadius: 1.5,
          fontSize: 14,
          background: "#fafbfc",
          px: 1.5,
          py: 0.5,
          width: "100%",
          height: 32,
          color: "text.primary",
          "& input": { p: 0, m: 0 },
          mb: 1,
        }}
      />
      <Divider />

      {/* Checkbox list */}
      <div className="min-h-[120px] max-h-[300px] overflow-y-auto mb-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {filteredCheckBoxArr.length ? (
          <>
            {/* Select All */}
            <button
              type="button"
              className="flex w-full items-center cursor-pointer py-2.5 px-3 rounded-md hover:bg-black/5 transition text-left"
              onClick={() => checkBoxHandler("selectAll")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  checkBoxHandler("selectAll");
                }
              }}
            >
              <div className="relative w-4 h-4 mr-3">
                <input
                  type="checkbox"
                  checked={checkBoxArr.every((el) => el.checked)}
                  readOnly
                  className="absolute opacity-0 w-full h-full cursor-pointer z-10"
                />
                <div className="w-4 h-4 border-2 rounded-sm border-black bg-white flex items-center justify-center">
                  {checkBoxArr.every((el) => el.checked) && (
                    <svg
                      className="w-[10px] h-[10px] pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="#ffffff"
                      strokeWidth={5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <span className="font-medium text-black">Select All</span>
            </button>

            {/* Individual Checkboxes */}
            {filteredCheckBoxArr.map((el, i) => (
              <button
                type="button"
                key={el.field || i}
                className="flex w-full items-center cursor-pointer py-2.5 px-3 rounded-md hover:bg-black/5 transition text-left"
                onClick={() => checkBoxHandler(el.field)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    checkBoxHandler(el.field);
                  }
                }}
              >
                <div className="relative w-4 h-4 mr-3">
                  <input
                    type="checkbox"
                    checked={el.checked}
                    readOnly
                    className="absolute opacity-0 w-full h-full cursor-pointer z-10"
                  />
                  <div
                    className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${
                      el.checked
                        ? "bg-black border-black"
                        : "bg-white border-black"
                    }`}
                  >
                    {el.checked && (
                      <svg
                        className="w-[10px] h-[10px] pointer-events-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="#ffffff"
                        strokeWidth={5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span
                  className="text-sm text-black break-words flex-1 min-w-0"
                  title={el.field || ""}
                >
                  {el.field || "blank"}
                </span>
              </button>
            ))}
          </>
        ) : (
          <p className="text-center text-black mt-4">
            {getEmptyStateMessage()}
          </p>
        )}
      </div>
      <Divider />

      {/* Buttons */}
      <div className="flex justify-between mt-3">
        <Button
          variant="outlined"
          size="medium"
          onClick={destroyFilter}
          disabled={!checkBoxArr.length}
          sx={{
            flex: 1,
            marginRight: "8px",
            borderColor: "#000",
            color: "#000",
            textTransform: "none",
            padding: "8px 16px",
          }}
        >
          Clear
        </Button>
        <Button
          onClick={applyFilter}
          variant="contained"
          size="medium"
          disabled={!checkBoxArr.length}
          sx={{
            flex: 1,
            backgroundColor: "#000",
            color: "#fff",
            textTransform: "none",
            padding: "8px 16px",
            "&:hover": {
              backgroundColor: "#111",
            },
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  );
};

export default MultiFilter

MultiFilter.propTypes = {
  model: PropTypes.array,
  onModelChange: PropTypes.func.isRequired,
  colDef: PropTypes.shape({
    field: PropTypes.string,
  }).isRequired,
  api: PropTypes.any,
};