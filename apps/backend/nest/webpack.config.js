const path = require('path');

module.exports = (options) => ({
  ...options,
  resolve: {
    ...options.resolve,
    alias: {
      '@common/model': path.resolve(__dirname, '../../../libs/model/index.ts'),
      '@common/database': path.resolve(
        __dirname,
        '../../../libs/database/index.ts',
      ),
    },
  },
});
