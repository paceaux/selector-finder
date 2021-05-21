# Selector Finder

Find CSS Selectors on a site. You can provide a single CSS selector, a comma separated string of selectors, or even a stylesheet. Pages with _zero_ matches aren't put in the results. Pages with at least *one* match are in the result, and you find out which CSS selectors _aren't_ used. (That's right, it's a selector _finder_ **and** ... "not founder").

Optionally take a screenshot of the elements (though it may hurt performance).

Pages not showing up that should? Check the `log.txt` for any issues. 
## Pre-Requisites

* Node 12+
* NPM

## Installation

Download this package. Then run
```
npm install
```

## Usage
This is a command line app

1. Download it. 
2. Go to the folder. 
3. Then:


Only scan the first 20 pages for `.yourthing`
```
node index.js --sitemap=https://wherever.com/xml --limit=20 --selector=".yourthing"
node index.js -u https://wherever.com/xml -l 20 -s ".yourthing"
```

Scan the first 20 pages and take screenshots
```
node index.js -u https://wherever.com/xml -l 20 -s ".yourthing" -c
```

Scan those pages, but treat them like Single Page Applications (`-d`), and search for all the selectors in `mystyles.css`
```
node index.js -u https://wherever.com/xml -f "mystyles.css" -d

```

### Parameters

| Parameter | Details   | Description   |
|---|---|---|
| --sitemap, -u  |  String. Required. | Must be fully qualified URL to an XML Sitemap  |
| --limit, -l  |  Integer. Optional. Default: `0` | Maximum number of pages to crawl |
| --selector, -s  |  String. Required. | A valid CSS selector |
| --cssFile, -f  |  String. Оptional. | A CSS file to use instead of a single selector |
| --isSpa, -d  |  Boolean. Оptional. Default: `false` | Switches to Puppeteer b/c content is dynamic |
| --takeScreenshots, -c  |  Boolean. Оptional. Default: `false` | Will take screenshots with Puppeteer |
| --outputFileName, -o  |  String. Оptional. Default: `pages.json` | A provided value will be prepended to `pages.json`. It will be JSON |
| --showElementDetails, -e  |  Boolean. Оptional. Default is `false`. | Show details for elements that match result (`tag`, `innerText`, `attributes`) |
| --showHtml, -m | Boolean. Optional. Default is `true`. | Shows HTML of the elements that match the result |


