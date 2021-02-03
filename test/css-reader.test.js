const {promises} = require('fs');

const Logger = require('../src/logger');
const CSSReader = require('../src/css-reader');
const Outputter = require('../src/outputter');

const logger = new Logger('test.log.txt');
const outputter = new Outputter('', logger);

const sampleCSS = `
body {
    color: blue;
}
[class] {
    outline: 1px solid blue;
}
#heading {
    font-size: 2em;
    line-height: 2;
}
h2, h3 {
  font-weight: bold;
}
.title.small {
    display: none;
}`;

const testFileName = 'test.css';
describe('CSS Reader', () => {
  beforeAll(async () => {
    // create a test CSS file
    await outputter.writeFileAsync(sampleCSS, testFileName);
  });
  afterAll(async () => {
    // remove test css file
    await promises.unlink(testFileName);
    // await promises.unlink(logger.logFile);
  });
  describe('instantiation', () => {
    test('It sets a filename prop', () => {
      const cssReader = new CSSReader(testFileName);
      expect(cssReader).toHaveProperty('fileName');
    });
  });

  describe('rawCSS', () => {
    test('no rawCSS when instantiated', () => {
      const cssReader = new CSSReader(testFileName);

      expect(cssReader.rawCSS).toBeUndefined();
    });
    test('rawCSS happens when a file is read', async () => {
      const cssReader = new CSSReader(testFileName);
      await cssReader.readFileAsync();
      expect(cssReader.rawCSS).toBeTruthy();
    });
    test('rawCSS can be set', async () => {
      const cssReader = new CSSReader();
      cssReader.setRawCSS(sampleCSS);
      expect(cssReader.rawCSS).toBeTruthy();
      expect(cssReader.rawCSS).toEqual(sampleCSS);
    });
  });
  describe('readingFile', () => {
    test('readFileContents: reads file', async () => {
      const fileContents = await CSSReader.readFileContents(testFileName);
      expect(fileContents).toEqual(sampleCSS);
    });
    test('readFileContents: null with empty file', async () => {
      const fileContents = await CSSReader.readFileContents('foo');
      expect(fileContents).toBeNull();
    });
    test('readFileContents: throws without filename', async () => {
      await expect(CSSReader.readFileContents()).rejects.toThrow();
    });
    test('readFileAsync: returns rawCSS and sets it as prop', async () => {
      const cssReader = new CSSReader(testFileName);
      const fileContents = await cssReader.readFileAsync(testFileName);
      expect(fileContents).toEqual(sampleCSS);
      expect(cssReader).toHaveProperty('rawCSS', sampleCSS);
    });
    test('readFileAsync: without a file, it fails', async () => {
      const cssReader = new CSSReader();
      await expect(cssReader.readFileAsync()).rejects.toThrow();
    });
  });

  describe('parsingCSS', () => {
    test('it has parsedCSS', async () => {
      const cssReader = new CSSReader(testFileName);
      await cssReader.readFileAsync();
      expect(cssReader).toHaveProperty('parsedCSS');
    });
    test('it doesn\'t have parsedCSS on an empty file', async () => {
      const cssReader = new CSSReader(testFileName);
      expect(cssReader.parsedCSS).toBeUndefined();
    });
    test('parsedCSS has cssRules', async () => {
      const cssReader = new CSSReader(testFileName);
      await cssReader.readFileAsync();
      expect(cssReader).toHaveProperty('parsedCSS');
      expect(cssReader.parsedCSS).toHaveProperty('cssRules');
      expect(cssReader.parsedCSS.cssRules.length).toBeGreaterThan(0);
    });
  });
  describe('selectors', () => {
    test('it returns selectors', async () => {
      const cssReader = new CSSReader(testFileName);
      await cssReader.readFileAsync();

      expect(cssReader).toHaveProperty('selectors');
      expect(cssReader.selectors.length).toBeGreaterThan(3);
    });
    test('it has the correct selectors', async () => {
      const cssReader = new CSSReader(testFileName);
      await cssReader.readFileAsync();

      expect(cssReader.selectors).toEqual(expect.arrayContaining(['body', '[class]', '#heading', 'h2, h3']));
    });
    test('duplicate selectors are removed', async () => {
      const cssReader = new CSSReader(testFileName);
      const duplicatedCSS = sampleCSS + sampleCSS;
      cssReader.setRawCSS(duplicatedCSS);

      expect(cssReader).toHaveProperty('selectors');
      expect(cssReader.selectors).toHaveLength(5);
    });
  });
});
