import nextConfig from 'eslint-config-next';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const config = [
  ...nextConfig,
  eslintPluginPrettierRecommended,
  {
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
];

export default config;
