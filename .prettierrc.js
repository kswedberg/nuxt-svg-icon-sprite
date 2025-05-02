/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  proseWrap: 'always',
  semi: false,
  singleQuote: true,
  arrowParens: 'always',
  printWidth: 80,
  trailingComma: 'all',
  overrides: [
    {
      files: '*.svg',
      options: {
        parser: 'html',
      },
    },
  ],
}

export default config
