export default () => ({
  ROOT_PATH: process.cwd() + '/src',
  APP_PORT: parseInt(process.env.APP_PORT || '8080', 10) || 8080,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/base-dev',
});
