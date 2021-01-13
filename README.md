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

```

parameters
|   |   |
|---|---|
| --sitemap, -u  |  String. Required. Must be fully qualified URL to an XML Sitemap  |
| --limit, -l  |  Integer. Optional. Maximum number of pages to crawl |
| --selector, -s  |  String. Required. A valid CSS selector |
| --outputFileName, -o  |  String. Оptional. will be prepended to `pages.json`. It will be JSON |
| --isSpa, -d  |  Boolean. Оptional. Switches to Puppeteer b/c content is dynamic |
| --takeScreenshots, -c  |  Boolean. Оptional. Will take screenshots with Puppeteer |


