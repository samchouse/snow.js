module.exports = {
  parser: 'babel-ts',
  semi: true,
  singleQuote: true,
  bracketSpacing: true,
  trailingComma: 'none',
  importOrder: ['^[./]'],
  importOrderSeparation: true,
  experimentalBabelParserPluginsList: ['typescript'],
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')]
};
