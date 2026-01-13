import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Still ignore Next build output
    ignores: [".next"],

    // No extends, no rules, no type-checking, no Next presets.
    // ESLint will run, but with zero active rules.
    rules: {},
  }
);
