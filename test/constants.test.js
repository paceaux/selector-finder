const {
  LOG_FILE_NAME,
  SITEMAP_URL,
  DEFAULT_OUTPUT_FILE,
  DEFAULT_SELECTOR,
  IS_SPA,
  LIMIT,
  TAKE_SCREENSHOTS,
} = require('../src/constants');

describe('constants', () => {
  test('log file', () => {
    expect(LOG_FILE_NAME).toBeTruthy();
    expect(typeof LOG_FILE_NAME).toEqual('string');
    expect(LOG_FILE_NAME).toEqual('log.txt');
  });
  test('sitemap url', () =>{
    expect(SITEMAP_URL).toBeTruthy();
    expect(typeof SITEMAP_URL).toEqual('string');
  });
  test('default file', () =>{
    expect(DEFAULT_OUTPUT_FILE).toBeTruthy();
    expect(typeof DEFAULT_OUTPUT_FILE).toEqual('string');
    expect(DEFAULT_OUTPUT_FILE).toEqual('pages.json');
  });
  test('default selector', () =>{
    expect(DEFAULT_SELECTOR).toBeTruthy();
    expect(typeof DEFAULT_SELECTOR).toEqual('string');
  });
  test('is spa', () =>{
    expect(IS_SPA).toBeFalsy();
    expect(typeof IS_SPA).toEqual('boolean');
    expect(IS_SPA).toEqual(false);
  });
  test('limit', () =>{
    expect(typeof LIMIT).toEqual('number');
    expect(LIMIT).toEqual(0);
  });
  test('take screenshots', () =>{
    expect(TAKE_SCREENSHOTS).toBeFalsy();
    expect(typeof TAKE_SCREENSHOTS).toEqual('boolean');
    expect(TAKE_SCREENSHOTS).toEqual(false);
  });
});
