export default class Point {
  constructor (x, y) {
    this.x = x
    this.y = y
  }
  compare (p) {
    if (this.y === p.y) {
      return this.x - p.x
    } else {
      return this.y - p.y
    }
  }
}

