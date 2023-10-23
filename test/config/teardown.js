// teardown.js
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup');
export default async () => {
  // close the browser instance
  // eslint-disable-next-line no-underscore-dangle
  await globalThis.__BROWSER_GLOBAL__.close();

  // clean-up the wsEndpoint file
  await fs.rm(DIR, { recursive: true, force: true });
};
