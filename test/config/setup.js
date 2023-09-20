// setup.js
import fs from 'fs';
import os from 'os';
import path from 'path';
import mkdirp from 'mkdirp';
import puppeteer from 'puppeteer';

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup');

export default async () => {
  const browser = await puppeteer.launch();
  // store the browser instance so we can teardown it later
  // this global is only available in the teardown but not in TestEnvironments
  // eslint-disable-next-line no-underscore-dangle
  global.__BROWSER_GLOBAL__ = browser;

  // use the file system to expose the wsEndpoint for TestEnvironments
  mkdirp.sync(DIR);
  fs.writeFileSync(path.join(DIR, 'wsEndpoint'), browser.wsEndpoint());
};
