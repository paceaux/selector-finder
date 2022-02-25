# Selector Hound: sniff out CSS Selectors on a site

`SelectorHound` lets you find CSS selectors on a public or local site. Rename, refactor, and delete unused CSS with a bloodhound on your side. 

A sitemap or a site URL is enough to get started. Provide a single CSS selector, a comma separated string of selectors, or even a stylesheet. 

Pages with _zero_ matches aren't put in the results. Pages with at least *one* match are in the result, and you find out which CSS selectors _aren't_ used. (That's right, it's a selector _finder_ **and** ... "not founder").

Optionally take a screenshot of the elements (though it may hurt performance).

Pages not showing up that should? Check the `log.txt` for any issues. 

## Installation

### Running on-demand:
Download this package. Then run

```console
npm install
```

### Globally via NPM

```console
npm i -g selector-hound
```

## Usage

Only scan the first 20 pages for `.yourthing`

```
SelectorHound --sitemap=https://wherever.com/xml --limit=20 --selector=".yourthing"
SelectorHound -u https://wherever.com/xml -l 20 -s ".yourthing"
```

Scan the first 20 pages and take screenshots
```
SelectorHound -u https://wherever.com/xml -l 20 -s ".yourthing" -c
```

Scan those pages, but treat them like Single Page Applications (`-d`), and search for all the selectors in `mystyles.css`
```
SelectorHound -u https://wherever.com/xml -f "mystyles.css" -d

```

Crawl the site, starting from a landing page
```
SelectorHound -u https://mysite.com/landing -r -s ".myClass"
```

### Options

| Option | Alias | Description   | Defaults  |
|---|---|---|---|
| `--sitemap` |`-u`  | Must be fully qualified URL to an XML Sitemap **or** fully qualified URL to a page **if** `crawl` is `true`. Required. | `https://frankmtaylor.com/sitemap.xml` |
| `--limit` | `-l`  |  Maximum number of pages to crawl. Optional. | `0`  |
| `--selector` | `-s`  |  A valid CSS selector. Required. |  `.title` |
| `--cssFile` | `-f`  | A CSS file to use instead of a single selector. Optional. |   |
| `--isSpa`| `-d`  | Uses Puppeteer instead of Cheerio (in case some content is dynamic). Optional. | `false`|
| `--takeScreenshots`| `-c`  | Takes screenshots with Puppeteer. Optional. | `false` |
| `--outputFileName` | `-o` | A provided value will be prepended to `pages.json` and will be output in your current directory. Оptional. | `pages.json` | 
| `--showElementDetails` | `-e`  | Show details for elements that match result (`tag`, `innerText`, `attributes`) . Optional. |   `false` |
| `--showHtml` | `-m` | Shows HTML of the elements that match the result. Optional. | `true` |
| `--crawl`| `-r` | Crawls the site instead of using a sitemap. Outputs a file called `<sitename>.sitemap.json`. Optional.  | `false` |



