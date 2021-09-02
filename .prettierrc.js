module.exports = {
  semi: true,
  singleQuote: true,
  bracketSpacing: true,
  trailingComma: 'none',
  importOrder: ['^[./]'],
  importOrderSeparation: true,
  experimentalBabelParserPluginsList: ['typescript'],
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')],
  overrides: [
    {
      files: ['*.ts'],
      options: {
        parser: 'babel-ts',
      },
    }
  ]
};
