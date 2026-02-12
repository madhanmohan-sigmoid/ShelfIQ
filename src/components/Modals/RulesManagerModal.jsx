import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  X,
  Settings,
  Package,
  Pen,
  Loader2,
  Tag,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  selectPlanogramId,
} from "../../redux/reducers/planogramVisualizerSlice";
import { selectCategoryAccessType } from "../../redux/reducers/regionRetailerSlice";
import { getPlanogramRules } from "../../api/api";
import toast from "react-hot-toast";

const getStringKey = (value, fallback) => {
  const v = String(value ?? "").trim();
  return v || fallback;
};

const getRuleKey = (rule, index) =>
  getStringKey(rule?.group_name, `rule-${index}`) +
  "-" +
  getStringKey(rule?.rule_category, "category") +
  "-" +
  getStringKey(rule?.interaction || rule?.type, "interaction");

const getClauseKey = (clause, ruleIdx, clauseIdx) =>
  getStringKey(clause?.attribute, `rule-${ruleIdx}-clause-${clauseIdx}`) +
  "-" +
  (Array.isArray(clause?.values) ? clause.values.join("|") : "values");

const getPlanogramIdFromUrl = (location, params) => {
  const fromParams = params?.id || params?.planogramId || params?.planogram_instance_id;
  if (fromParams) return String(fromParams);

  const search = new URLSearchParams(location?.search || "");
  const fromSearch =
    search.get("id") ||
    search.get("planogramId") ||
    search.get("planogram_id") ||
    search.get("planogram_instance_id");
  if (fromSearch) return String(fromSearch);

  const path = String(location?.pathname || "");
  const segments = path.split("/").filter(Boolean);
  const last = segments.at(-1) || null;
  if (last && last.length > 10) return last; // best-effort (uuid-ish)
  return null;
};

const RuleManagerModal = ({ onClose, isOrangeTheme = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const planogramIdFromRedux = useSelector(selectPlanogramId);
  const categoryAccessType = useSelector(selectCategoryAccessType);
  const canOptimisePlanogram = categoryAccessType === "CONTRIBUTORS";

  // Colors
  const mainColor = isOrangeTheme ? "#FFDDCA" : "#FFEBBF";
  const lightMainColorBg = isOrangeTheme ? "#ffe4d1" : "#d1f0e9";
  const lightMainColorBg2 = "#ECECEC";
  const darkTextColor = "#0f2925";
  const borderColor = "#e3e3e3";

  const planogramIdFromUrl = useMemo(
    () => getPlanogramIdFromUrl(location, params),
    [location, params]
  );

  const effectivePlanogramId =
    planogramIdFromRedux || planogramIdFromUrl || null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rulesPayload, setRulesPayload] = useState(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!effectivePlanogramId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getPlanogramRules(effectivePlanogramId);
        const data = res?.data?.data || null;
        if (!mounted) return;
        setRulesPayload(data);
      } catch (e) {
        console.error("Failed to fetch planogram rules:", e);
        if (!mounted) return;
        setRulesPayload(null);
        setError("Failed to load rules");
        toast.error("Failed to load planogram rules");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [effectivePlanogramId]);

  const ruleCount = useMemo(() => {
    if (!rulesPayload) return 0;
    if (typeof rulesPayload?.rule_count === "number") return rulesPayload.rule_count;
    if (Array.isArray(rulesPayload?.rules)) return rulesPayload.rules.length;
    return 0;
  }, [rulesPayload]);

  const rulesCountLabel = useMemo(() => {
    if (rulesPayload?.has_rules === false) return "No rules";
    const plural = ruleCount === 1 ? "" : "s";
    return `${ruleCount} Rule${plural}`;
  }, [ruleCount, rulesPayload?.has_rules]);

  const rules = useMemo(
    () => (Array.isArray(rulesPayload?.rules) ? rulesPayload.rules : []),
    [rulesPayload]
  );

  const optimizeTargetId =
    planogramIdFromRedux ||
    planogramIdFromUrl ||
    rulesPayload?.planogram_instance_id ||
    null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 100000,
      }}
      className="flex items-center justify-center p-4 capitalize"
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
        className="max-w-3xl w-full max-h-[90vh] overflow-y-auto relative"
      >
        {/* Sticky Header */}
        <div
          className="sticky top-0 z-10"
          style={{
            backgroundColor: "#ffffff",
            padding: "1.5rem",
            borderBottom: `1px solid ${borderColor}`,
          }}
        >
          {/* Close Button */}
          <button className="absolute top-4 right-4 " onClick={onClose}>
            <X className="w-6 h-6" />
          </button>

          <h1
            style={{ color: darkTextColor }}
            className="text-2xl font-bold mb-2"
          >
            Planogram Rules
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-gray-600">
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium">
                Instance: {rulesPayload?.planogram_instance_id || effectivePlanogramId || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">
                Rules: {ruleCount}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Top actions */}
          <div className="flex items-center justify-between mb-6 gap-3">
            <div
              style={{
                backgroundColor: mainColor,
                color: darkTextColor,
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg w-fit"
            >
              <Tag className="w-4 h-4" />
              <span className="font-medium">
                {rulesCountLabel}
              </span>
            </div>

            <button
              onClick={() => {
                if (!canOptimisePlanogram) {
                  toast.error("You do not have permission to optimise planograms. Only contributors can optimise planograms.");
                  return;
                }
                if (optimizeTargetId) {
                  navigate(`/my-planogram/edit-planogram/${optimizeTargetId}`);
                } else {
                  toast.error("Planogram id not found");
                }
              }}
              disabled={!canOptimisePlanogram}
              className={`flex items-center justify-center gap-x-2 text-sm font-semibold rounded-full px-3 py-1.5 border border-black ${
                canOptimisePlanogram ? "hover:bg-[#f0f0f0]" : "opacity-50 cursor-not-allowed"
              }`}
            >
              <Pen size={16} />
              <span>Optimise Planogram</span>
            </button>
          </div>

          {/* Content */}
          <div
            style={{
              border: `1px solid ${borderColor}`,
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                backgroundColor: mainColor,
                padding: "10px 12px",
                color: darkTextColor,
              }}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Rules</h2>
              </div>
              <span
                style={{
                  backgroundColor: "#ffffff",
                  padding: "2px 10px",
                  borderRadius: "9999px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                }}
              >
                {ruleCount}
              </span>
            </div>

            <div style={{ padding: "1rem" }}>
              {loading && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Loading rules…</span>
                </div>
              )}

              {!loading && error && (
                <div
                  className="text-sm font-medium"
                  style={{ color: "#a11" }}
                >
                  {error}
                </div>
              )}

              {!loading && !error && effectivePlanogramId == null && (
                <div className="text-sm font-medium text-gray-600">
                  Planogram id not found in URL or Redux state.
                </div>
              )}

              {!loading && !error && effectivePlanogramId != null && rules.length === 0 && (
                <div className="text-sm font-medium text-gray-600">
                  No rules available for this planogram.
                </div>
              )}

              {!loading && !error && rules.length > 0 && (
                <div className="grid md:grid-cols-2 gap-4">
                  {rules.map((rule, idx) => (
                    <div
                      key={getRuleKey(rule, idx)}
                      style={{
                        backgroundColor: lightMainColorBg2,
                        border: `1px solid ${lightMainColorBg}`,
                        borderRadius: "12px",
                        padding: "1rem",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3
                            style={{ color: darkTextColor }}
                            className="font-semibold text-base"
                          >
                            {rule?.group_name || "Rule"}
                          </h3>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {rule?.rule_category || "Uncategorised"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            style={{
                              backgroundColor: "#ffffff",
                              color: darkTextColor,
                              padding: "4px 10px",
                              borderRadius: "9999px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              border: `1px solid ${borderColor}`,
                            }}
                          >
                            {rule?.interaction || rule?.type || "rule"}
                          </span>
                          {rule?.type && rule?.interaction && rule.type !== rule.interaction && (
                            <span className="text-[11px] text-gray-500">
                              Type: {rule.type}
                            </span>
                          )}
                        </div>
                      </div>

                      {rule?.complement_with && (
                        <div className="text-sm mb-3">
                          <span className="text-gray-600">Complement with:</span>{" "}
                          <span style={{ color: darkTextColor }} className="font-semibold">
                            {String(rule.complement_with)}
                          </span>
                        </div>
                      )}

                      <div>
                        <div className="text-xs font-semibold text-gray-700 mb-2">
                          Clauses
                        </div>
                        <div className="space-y-2">
                          {(() => {
                            // Extract clauses from product_groups if present, otherwise use clauses array
                            let clausesToDisplay = [];
                            if (Array.isArray(rule?.product_groups) && rule.product_groups.length > 0) {
                              // Flatten clauses from all product groups
                              rule.product_groups.forEach((pg) => {
                                if (Array.isArray(pg?.clauses) && pg.clauses.length > 0) {
                                  clausesToDisplay.push(...pg.clauses);
                                }
                              });
                            } else if (Array.isArray(rule?.clauses)) {
                              clausesToDisplay = rule.clauses;
                            }
                            return clausesToDisplay;
                          })().map(
                            (clause, cIdx) => (
                              <div
                                key={getClauseKey(clause, idx, cIdx)}
                                style={{
                                  backgroundColor: "#ffffff",
                                  border: `1px solid ${borderColor}`,
                                  borderRadius: "10px",
                                  padding: "10px",
                                }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-gray-600">
                                    Attribute
                                  </span>
                                  <span
                                    className="text-sm font-semibold"
                                    style={{ color: darkTextColor }}
                                  >
                                    {clause?.attribute || "N/A"}
                                  </span>
                                </div>

                                <div className="mt-2">
                                  <div className="text-xs text-gray-600 mb-1">
                                    Values
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {(Array.isArray(clause?.values)
                                      ? clause.values
                                      : []
                                    ).map((v, vIdx) => (
                                      <span
                                        key={`${clause?.attribute || "attr"}-${String(v)}-${vIdx}`}
                                        style={{
                                          backgroundColor: isOrangeTheme
                                            ? "#FFE4D1"
                                            : "#C6F3E6",
                                          color: isOrangeTheme
                                            ? "#C04D0B"
                                            : "#04795d",
                                          padding: "4px 10px",
                                          borderRadius: "9999px",
                                          fontSize: "0.75rem",
                                          fontWeight: "600",
                                        }}
                                      >
                                        {String(v)}
                                      </span>
                                    ))}
                                    {(!Array.isArray(clause?.values) ||
                                      clause.values.length === 0) && (
                                      <span className="text-xs text-gray-500">
                                        No values
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                          {(() => {
                            // Check if there are any clauses to display
                            let hasClauses = false;
                            if (Array.isArray(rule?.product_groups) && rule.product_groups.length > 0) {
                              hasClauses = rule.product_groups.some(
                                (pg) => Array.isArray(pg?.clauses) && pg.clauses.length > 0
                              );
                            } else if (Array.isArray(rule?.clauses) && rule.clauses.length > 0) {
                              hasClauses = true;
                            }
                            return !hasClauses;
                          })() && (
                            <div className="text-sm text-gray-600">
                              No clauses
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuleManagerModal;

RuleManagerModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isOrangeTheme: PropTypes.bool,
};
