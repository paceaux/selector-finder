// eslint-disable-next-line max-classes-per-file
class ElementSearchResult {
  constructor(element) {
    this.tag = element.name || element.localName;
    this.applyAttributes(element);
    this.innerText = element.innerText;
  }

  applyAttributes(element) {
    const attributes = element.attribs || element.attributes;
    if (Object.keys(attributes).length > 0) {
      this.attributes = attributes;
    }
  }
}
// eslint-disable-next-line max-classes-per-file
class PageSearchResult {
  constructor(url) {
    this.url = url;
    this.elements = [];
  }

  addElementSearchResults(matches) {
    if (matches.length > 0) {
      for (let idx = 0; idx < matches.length; idx += 1) {
        const node = matches[idx];
        const elementSearchResult = new ElementSearchResult(node);
        this.elements.push(elementSearchResult);
      }
    }
  }

  get totalMatches() {
    return this.elements.length;
  }
}

class SiteSearchResult extends Array {
  get totalMatches() {
    let total = 0;

    this.forEach((match) => {
      if (match.totalMatches) {
        total += match.totalMatches;
      }
    });

    return total;
  }
}

module.exports = { SiteSearchResult, PageSearchResult, ElementSearchResult };
