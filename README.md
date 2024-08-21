# Selector Hound: sniff out CSS Selectors on a site

`SelectorHound` lets you find CSS selectors on a public or local site. Rename, refactor, and delete unused CSS with a bloodhound on your side.

A sitemap or a site URL is enough to get started. Provide a single CSS selector, a comma separated string of selectors, or even a stylesheet.

Pages with _zero_ matches aren't put in the results. Pages with at least _one_ match are in the result, and you find out which CSS selectors _aren't_ used. (That's right, it's a selector _finder_ **and** ... "not founder").

Optionally take a screenshot of the elements (though it may hurt performance).

Pages not showing up that should? Check the `log.txt` for any issues.

## Installation

### Prerequisites

- Node LTS (as of August 2024, Node 20.16.0)

#### Some possible Puppeteer setup for Mac Users

If you want to use the `-d` or `-c` (`--isSpa` and `--takeScreenshots` ) options, this requires Puppeteer which in turn requires Chromium.

You may (or may not) need `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` and `PUPPETEER_EXECUTABLE_PATH` environment variables set. They were necessary for older versions of Puppeteer and seem to be unnecessary for new ones.

If you're having issues, run `printenv` in your terminal to see if those variables are set. If they are, you may need to unset them with `unset PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` and `unset PUPPETEER_EXECUTABLE_PATH`. Then `source ~/.bashrc` or `source ~/.zshrc` to be sure, and run `printenv` once again.

But if they aren't set, you may need to do this.

After you play with those variables, reinstall this package.

### Running on-demand

Download this package. Then run

```shell
npm install
```

### Globally via NPM

```shell
npm i -g selector-hound
```

## Usage

### Basic Scanning

Only scan the first 20 pages for `.yourthing`

```shell
SelectorHound --sitemap=https://wherever.com/xml --limit=20 --selector=".yourthing"
SelectorHound -u https://wherever.com/xml -l 20 -s ".yourthing"
```

### Re-using, regenerating, and providing a list of links

Before the site scanning begins, this generates a `<site>.sitemap.json` file containing all of the links it will scan. This file is generated from the `sitemap.xml` file you provided **or** from crawling the site looking for links. To improve performance, SelectorHound will look for this file _first_ before attempting to retrieve/generate a sitemap.

If you want to re-generate this `<site>.sitemap.json` file, you can force it:

```shell
SelectorHound --sitemap=https://wherever.com/xml  --selector=".yourthing" --dontUseExportedSitemap
SelectorHound -u https://mysite.com/landing -r -s '.yourThing' -X
```

#### Formatting

By default, SelectorHound will generate a format that's based off of how sitemap XML looks, which is an array of objects with a `loc` property:

```JavaScript
[
    {
        'loc': 'https://mysite.com/path'
    },
    {
        'loc': 'https://mysite.com/another'
    }
]
```

However, you can also provide your own list of links as just an array of strings:

```JavaScript
    [
        "https://mysite.com/path",
        "https://mysite.com/another"
    ]
```

### Crawling instead of using a sitemap

Crawl the site, starting from a landing page.

```shell
SelectorHound -u https://mysite.com/landing -r -s ".myClass"
```

### Taking Screenshots or dealing with SPAs

Scan the first 20 pages and take screenshots

```shell
SelectorHound -u https://wherever.com/xml -l 20 -s ".yourthing" -c
```

Scan those pages, but treat them like Single Page Applications (`-d`), and search for all the selectors in `mystyles.css`

```shell
SelectorHound -u https://wherever.com/xml -f "mystyles.css" -d

```

### Options

| Option | Alias | Description   | Defaults  |
|---|---|---|---|
| `--sitemap` |`-u`  | Must be fully qualified URL to an XML Sitemap **or** fully qualified URL to a page **if** `crawl` is `true`. Required. | `https://frankmtaylor.com/sitemap.xml` |
| `--dontUseExportedSitemap` |`-X`  | if a `<site>.sitemap.json` file has been already been created, ignore it and generate a new one. Optional. | `false` |
| `--limit` | `-l`  |  Maximum number of pages to crawl. Optional. | `0`  |
| `--selector` | `-s`  |  A valid CSS selector. Required. |  `.title` |
| `--cssFile` | `-f`  | A CSS file to use instead of a single selector. Optional. |   |
| `--isSpa`| `-d`  | Uses Puppeteer instead of Cheerio (in case some content is dynamic). Optional. | `false`|
| `--takeScreenshots`| `-c`  | Takes screenshots with Puppeteer. Optional. | `false` |
| `--outputFileName` | `-o` | A provided value will be prepended to `pages.json` and will be output in your current directory. Оptional. | `pages.json` |
| `--showElementDetails` | `-e`  | Show details for elements that match result (`tag`, `innerText`, `attributes`) . Optional. |   `false` |
| `--showHtml` | `-m` | Shows HTML of the elements that match the result. Optional. | `true` |
| `--crawl`| `-r` | Crawls the site instead of using a sitemap. Outputs a file called `<sitename>.sitemap.json`. Optional.  | `false` |
