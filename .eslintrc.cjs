/* eslint-env node */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', "plugin:react/recommended"],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', "react"],
  root: true,
  rules: {
    "no-useless-escape": "off",
    "no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "variable",
        "format": ["camelCase","PascalCase","UPPER_CASE"]
      }
    ],
    'react/jsx-uses-react': "error",
    'react/jsx-uses-vars': "error",
  }
};