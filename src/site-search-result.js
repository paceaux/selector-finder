export default class SiteSearchResult extends Array {
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
