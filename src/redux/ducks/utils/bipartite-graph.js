import { toIssueKey, getCard } from './card'

class BipartiteGraph {
  constructor() {
    this.edgesA = {}
    // NEW FEATURE: Show **all** related Issues/PR's (the graph is no longer bipartite)
    // TODO: Refactor to simplify this datastructure
    this.edgesB = this.edgesA // = {};
  }
  addCards(cards) {
    cards.forEach(card => {
      if (card.issue) {
        const cardPath = toIssueKey(card)

        const relatedIssues = card.getRelatedIssuesFromBody()
        // Show **all** related Issues/PR's (the graph is no longer bipartite)
        relatedIssues.forEach(({ repoOwner, repoName, number, fixes }) => {
          const otherCardPath = toIssueKey({
            repoOwner,
            repoName,
            number,
          })
          getCard({ repoOwner, repoName, number }).then(otherCard => {
            if (otherCard) {
              this._addEdge(otherCardPath, cardPath, otherCard, card, fixes)
            }
          })
        })
      }
    })
    return this
  }
  _addEdge(a, b, aObj, bObj, edgeValue) {
    if (!this.edgesA[a]) {
      this.edgesA[a] = {}
    }
    if (!this.edgesB[b]) {
      this.edgesB[b] = {}
    }

    this.edgesA[a][b] = { vertex: bObj, edgeValue }
    this.edgesB[b][a] = { vertex: aObj, edgeValue }
  }
  // removeEdge(a, b) {
  //   delete this.edgesA[a][b];
  //   delete this.edgesB[b][a];
  // }
  // removeA(a) {
  //   // Find all the B's so we can remove each edge
  //   Object.keys(this.edgesA[a]).forEach((b) => {
  //     this.removeEdge(a, b);
  //   });
  //   delete this.edgesA[a];
  // }
  // removeB(b) {
  //   Object.keys(this.edgesB[b]).forEach((a) => {
  //     this.removeEdge(a, b);
  //   });
  //   delete this.edgesB[b];
  // }
  getA(a) {
    const edge = this.edgesA[a] || {}
    return Object.keys(edge).map(k => edge[k])
  }
  getB(b) {
    const edge = this.edgesB[b] || {}
    return Object.keys(edge).map(k => edge[k])
  }
}

export default BipartiteGraph
