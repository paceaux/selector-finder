// teardown.js
const os = require('os');
const path = require('path');
const rimraf = require('rimraf');

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup');
module.exports = async () => {
  // close the browser instance
  // eslint-disable-next-line no-underscore-dangle
  await global.__BROWSER_GLOBAL__.close();

  // clean-up the wsEndpoint file
  rimraf.sync(DIR);
};
