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

module.exports = ElementSearchResult;
