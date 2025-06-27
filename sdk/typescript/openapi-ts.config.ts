import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../../specification/api/notify-supplier.yml',
  output: 'src',
  plugins: ['@hey-api/client-fetch'],
});
