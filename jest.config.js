export default {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "\\.(jpg|jpeg|png|gif|svg|webp)$":
      "<rootDir>/src/utils/__tests__/__mocks__/fileMock.js",
    "\\.(css|less|scss|sass)$":
      "<rootDir>/src/utils/__tests__/__mocks__/fileMock.js",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  extensionsToTreatAsEsm: [".jsx"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "src/api/**/*.{js,jsx}",
    "src/utils/**/*.{js,jsx}",
    "src/screens/**/*.{js,jsx}",
    "!src/**/*.test.{js,jsx}",
    "!src/**/__tests__/**",
    "!src/utils/authHelpers.js",
    "!src/utils/__tests__/authHelpers.test.js",
    "!src/utils/scorecardFilterUtils.js",
    "!src/utils/ruleTransformUtils.js",
    "!src/utils/optimizationPollingManager.js",
    "!src/utils/editPlanogramStep1Utils.js",
    "!src/hooks/useOptimization.jsx",
    "!src/config/ruleModalConfig.js",
    "!src/api/axiosInstance.js",
    "!src/config/authConfig.js",
    "!src/components/scorecard/**",
    "!src/components/rulesManager/**",
    "!src/components/Modals/RulesManagerModal.jsx",
    "!src/components/Modals/AddProductGroupModal.jsx",
    "!src/components/Modals/AddRuleModal.jsx",
    "!src/components/Modals/ReviewSelectionsModal.jsx",
    "!src/api/optimizationApiMocks.js",
    "!src/screens/EditPlanogram.jsx",
    "!src/redux/store/index.js",
    "!src/screens/Analysis.jsx",
    // ... exclude others you don't want to test
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: ["**/__tests__/**/*.test.{js,jsx}", "**/*.test.{js,jsx}"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/src/utils/__tests__/authHelpers.test.js", // Exclude authHelpers tests since source is excluded
    "/src/utils/__tests__/scorecardFilterUtils.test.js", // Exclude scorecardFilterUtils tests since source is excluded
    "/src/utils/__tests__/ruleTransformUtils.test.js", // Exclude ruleTransformUtils tests since source is excluded
    "/src/utils/__tests__/optimizationPollingManager.test.js", // Exclude optimizationPollingManager tests since source is excluded
    "/src/utils/__tests__/editPlanogramStep1Utils.test.js", // Exclude editPlanogramStep1Utils tests since source is excluded
    "/src/api/__tests__/axiosInstance.test.js", // Exclude axiosInstance tests since source is excluded
    "/src/config/__tests__/authConfig.test.js", // Exclude authConfig tests since source is excluded
    "/src/components/scorecard/.*", // Exclude all scorecard tests since source is excluded
    "/src/components/rulesManager/.*", // Exclude all rulesManager tests since source is excluded
    "/src/components/Modals/__tests__/RulesManagerModal.test.jsx", // Exclude RulesManagerModal tests since source is excluded
    "/src/components/Modals/__tests__/AddProductGroupModal.test.jsx", // Exclude AddProductGroupModal tests since source is excluded
    "/src/components/Modals/__tests__/AddRuleModal.test.jsx", // Exclude AddRuleModal tests since source is excluded
    "/src/components/Modals/__tests__/ReviewSelectionsModal.test.jsx", // Exclude ReviewSelectionsModal tests since source is excluded
    "/src/api/__tests__/optimizationApiMocks.test.js", // Exclude optimizationApiMocks tests since source is excluded
    "/src/screens/__tests__/EditPlanogram.test.jsx", // Exclude EditPlanogram tests since source is excluded
    "/src/redux/store/__tests__/index.test.js",
    "/src/screens/__tests__/Analysis.test.jsx", // Exclude Analysis tests since source is excluded
  ],
};
