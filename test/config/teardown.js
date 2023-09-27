// teardown.js
import os from 'os';
import path from 'path';
import rimraf from 'rimraf';

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup');
export default async () => {
  // close the browser instance
  // eslint-disable-next-line no-underscore-dangle
  await global.__BROWSER_GLOBAL__.close();

  // clean-up the wsEndpoint file
  rimraf.sync(DIR);
};
