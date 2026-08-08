const html = require('/home/jules/.nvm/versions/node/v22.22.1/lib/node_modules/eslint-plugin-html');
module.exports = [
  {
    plugins: { html },
    files: ["**/*.html"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        alert: "readonly",
        Date: "readonly",
        parseInt: "readonly",
        JSON: "readonly"
      }
    }
  }
];
