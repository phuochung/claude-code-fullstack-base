// eslint-config-next v16 ships native flat configs, so they are spread directly.
// Do NOT wrap them in FlatCompat: that double-wraps an already-flat config and
// ESLint dies with "Converting circular structure to JSON" (the react plugin
// self-reference). FlatCompat was only needed while this package shipped legacy
// eslintrc-style configs.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**"],
  },
];

export default eslintConfig;
