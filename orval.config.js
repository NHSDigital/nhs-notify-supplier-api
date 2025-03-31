// orval.config.js
module.exports = {
  client: {
    input: 'specification/api/notify-supplier.yml',
    output: {
      mode: 'single',
      target: 'sdk/typescript/api.ts',
      client: 'axios',
      schemas: 'sdk/typescript/types', // Assuming openapi-typescript outputs here
      override: {
        useDates: true,
      },
    },
  },
};
