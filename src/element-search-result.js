class ElementSearchResult {
  constructor(element) {
    this.tag = element.name || element.localName;
    this.applyAttributes(element);
    this.innerText = element.innerText;
    this.selector = element.cssSelector || element.selector;
  }

  applyAttributes(element) {
    const attributes = element.attribs || element.attributes;
    if (attributes && Object.keys(attributes).length > 0) {
      this.attributes = attributes;
    }
  }
}

module.exports = ElementSearchResult;
