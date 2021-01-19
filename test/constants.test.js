const {
  LOG_FILE_NAME,
  DEFAULT_SITEMAP_URL,
  DEFAULT_OUTPUT_FILE,
  DEFAULT_SELECTOR,
  DEFAULT_IS_SPA,
  DEFAULT_LIMIT,
  DEFAULT_TAKE_SCREENSHOTS,
} = require('../src/constants');

describe('constants', () => {
  test('log file', () => {
    expect(LOG_FILE_NAME).toBeTruthy();
    expect(typeof LOG_FILE_NAME).toEqual('string');
    expect(LOG_FILE_NAME).toEqual('log.txt');
  });
  test('sitemap url', () =>{
    expect(DEFAULT_SITEMAP_URL).toBeTruthy();
    expect(typeof DEFAULT_SITEMAP_URL).toEqual('string');
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
    expect(DEFAULT_IS_SPA).toBeFalsy();
    expect(typeof DEFAULT_IS_SPA).toEqual('boolean');
  });
  test('limit', () =>{
    expect(typeof DEFAULT_LIMIT).toEqual('number');
  });
  test('take screenshots', () =>{
    expect(typeof DEFAULT_TAKE_SCREENSHOTS).toEqual('boolean');
  });
});
