# Selector Finder

Find an element matching a particular CSS selector on an entire site

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

```
node index.js --sitemap=https://wherever.com/xml --limit=20 --selector=".yourthing"
node index.js -u https://wherever.com/xml -l 20 -s ".yourthing"
node index.js -u https://wherever.com/xml -l 20 -s ".yourthing" -c
node index.js -u https://wherever.com/xml -l 20 -f "mystyles.css" -d

```

parameters
|   |   |
|---|---|
| --sitemap, -u  |  String. Required. Must be fully qualified URL to an XML Sitemap  |
| --limit, -l  |  Integer. Optional. Maximum number of pages to crawl |
| --selector, -s  |  String. Required. A valid CSS selector |
| --cssFile, -f  |  String. Оptional. A CSS file to use instead of a single selector |
| --isSpa, -d  |  Boolean. Оptional. Switches to Puppeteer b/c content is dynamic |
| --takeScreenshots, -c  |  Boolean. Оptional. Will take screenshots with Puppeteer |
| --outputFileName, -o  |  String. Оptional. will be prepended to `pages.json`. It will be JSON |
| --showElementDetails, -e  |  Boolean. Оptional. Default is `true`. Show details for elements that match result (`tag`, `innerText`, `attributes`) |


