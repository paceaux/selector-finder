import ElementSearchResult from './element-search-result.js';

export default class PageSearchResult {
  constructor(url) {
    this.url = url;
    this.elements = [];
    this.usedSelectors = [];
  }

  addUnusedSelectors(selectors) {
    if (selectors.length > 0) {
      this.unusedSelectors = selectors;
    }
  }

  addSelectorErrors(selectorErrors) {
    if (selectorErrors.length > 0) {
      if (!this.selectorErrors) this.selectorErrors = [];
      this.selectorErrors.push(...selectorErrors);
    }
  }

  addUsedSelector(selector) {
    if (this.usedSelectors.indexOf(selector) === -1) {
      this.usedSelectors.push(selector);
    }
  }

  addElementSearchResults(matches, cssSelector) {
    if (matches.length > 0) {
      for (let idx = 0; idx < matches.length; idx += 1) {
        const node = matches[idx];
        if (!node.selector && cssSelector) node.selector = cssSelector;
        const elementSearchResult = new ElementSearchResult(node);
        this.elements.push(elementSearchResult);
        this.addUsedSelector(elementSearchResult.selector);
      }
    }
  }

  get totalMatches() {
    return this.elements.length;
  }
}
