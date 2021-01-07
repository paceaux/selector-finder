# Selector Finder

Find an element matching a particular CSS selector on an entire site

## Pre-Requisits

* Node 12+
* NPM

## Installation

Download this package. Then run
```
npm install
```

## Usage
This is a command line app
Download it. Go to the folder. Then:

```
node index.js --sitemap=https://wherever.com/xml --limit=20 --selector=".yourthing"
node index.js -u https://wherever.com/xml -l 20 -s ".yourthing"

```

parameters
|   |   |
|---|---|
| --sitemap, -u  |  String. Required. Must be fully qualified URL to an XML Sitemap  |
| --limit, -l  |  Integer. optional. Maximum number of pages to crawl |
| --selector, -s  |  String. Required. A valid CSS selector |
| --outputFileName, -o  |  String. Required. Name of the file. It will be JSON |


