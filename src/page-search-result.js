const ElementSearchResult = require('./element-search-result');

class PageSearchResult {
  constructor(url) {
    this.url = url;
    this.elements = [];
  }

  addUnusedSelectors(selectors) {
    if (selectors.length > 0) {
      this.unusedSelectors = selectors;
    }
  }

  addElementSearchResults(matches, cssSelector) {
    if (matches.length > 0) {
      for (let idx = 0; idx < matches.length; idx += 1) {
        const node = matches[idx];
        if (!node.selector && cssSelector) node.selector = cssSelector;
        const elementSearchResult = new ElementSearchResult(node);
        this.elements.push(elementSearchResult);
      }
    }
  }

  get totalMatches() {
    return this.elements.length;
  }
}

module.exports = PageSearchResult;
