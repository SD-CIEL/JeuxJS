// eslint.config.cjs
const globals = require("globals");
const pluginJs = require("@eslint/js");

module.exports = [
    {
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            "indent": ["warn", 4],          // avertir une indentation de 4 espaces
            "linebreak-style": ["error", "windows"], // impose les fins de ligne Windows (\r\n)
            "quotes": ["error", "single"],   // impose l'usage de guillemets simples (' ')
            "semi": ["error", "always"]      // impose le point-virgule obligatoire
        },
    },
    pluginJs.configs.recommended,
];
