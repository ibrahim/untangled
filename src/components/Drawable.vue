<template>
  <div class="flex">

    <div>
      <h2>Canavas properties</h2>
      <div>
        <h3>Actions:</h3>
        <button @click="drawAllNodes">drawAllNodes</button>
        <button @click="clear">clear canvas (not points)</button>
        <button @click="clearPoints">clear points</button>
      </div>

      <div>
        <h3>Size:</h3>
        <ul>
          <li>
            <label>Width: </label>
            <input type="text" v-model="canvasWidth">
          </li>
          <li>
            <label>Height: </label>
            <input type="text" v-model="canvasHeight">
          </li>
        </ul>
      </div>

      <div>
        <h3>Points properties:</h3>
        <label>Point Size</label>
        <input type="number" v-model.number="pointSize">
      </div>
    </div>

    <div>
      <canvas
        ref="canvas"
        :width="canvasWidth"
        :height="canvasHeight"

        @mousedown="mousedown"
        @mouseup="mouseup"
        @mousemove="mousemove"
      ></canvas>
    </div>

    <div>
      <h3>Points (data)</h3>
      <table  class="ui selectable table">
        <thead>
          <tr><th>N°</th><th>X</th><th>Y</th><th>Remove</th></tr>
        </thead>
        <tbody>
          <tr v-for="(point, index) in points" :key="point">
            <td>{{index + 1}}</td>
            <td>{{point.x}}</td>
            <td>{{point.y}}</td>
            <td><button @click="removePoint(index)">X</button></td>
            </tr>
        </tbody>
      </table>
    </div>

    <div>
      <h3>Test data</h3>
      <label>OverPoint:</label>
      <pre>{{overPoint}}</pre>
    </div>
  </div>
</template>

<script>

import Point from './Point.js'
import Segment from './Segment.js'

export default {
  mounted () {
    this.canvas = this.$refs.canvas
    this.context = this.canvas.getContext('2d')
    this.generateRandomPoints()
    this.segments.push(new Segment(this.points[0], this.points[1]))
    this.drawAllNodes()
    // this.createRandomCircles()
  },
  data () {
    return {
      canvas: {},
      context: {},
      canvasHeight: 350,
      canvasWidth: 450,

      overPoint: null,
      dragMode: false,

      pointSize: 18,
      pointsCount: 10,
      thinLineThickness: 1,
      boldLineThickness: 3,
      strokeStyle: 'darkgrey',
      fillStyle: '#fff',
      lines: [],
      points: [],
      segments: []
    }
  },
  computed: {

  },
  methods: {
    generateRandomPoints () {
      for (var i = 0; i < this.pointsCount; i++) {
        var x = Math.floor(Math.random() * this.canvasWidth)
        var y = Math.floor(Math.random() * this.canvasHeight)
        this.points.push(new Point(x, y))
      }
    },
    removePoint (index) {
      this.points.splice(index, 1)
      this.clear()
      this.drawAllNodes()
    },
    matchPoints (checkPoint, mousePoint) {
      if (mousePoint.x > checkPoint.x + this.pointSize) {
        return false
      }

      if (mousePoint.x < checkPoint.x - this.pointSize) {
        return false
      }

      if (mousePoint.y > checkPoint.y + this.pointSize) {
        return false
      }

      if (mousePoint.y < checkPoint.y - this.pointSize) {
        return false
      }
      return true
    },
    clear () {
      this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
    },
    clearPoints () {
      this.points = []
      this.clear()
    },
    getMousePos (evt) {
      // https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
      var rect = this.context.canvas.getBoundingClientRect()
      return {
        x: parseInt((evt.clientX - rect.left) / (rect.right - rect.left) * this.canvasWidth),
        y: parseInt((evt.clientY - rect.top) / (rect.bottom - rect.top) * this.canvasHeight)
      }
    },
    mouseup (event) {
      let mouseUpPoint = this.getMousePos(event)
      if (this.dragMode && this.overPoint) {
        this.dragPoint(this.overPoint, mouseUpPoint)
        this.dragMode = false
      } else {
        this.addNode(mouseUpPoint)
      }
    },
    dragPoint (selectedPoint, newPoint) {
      this.points.map((pointToMove) => {
        if (pointToMove.x === selectedPoint.x && pointToMove.y === selectedPoint.y) {
          pointToMove.x = newPoint.x
          pointToMove.y = newPoint.y

          this.clear()
          this.drawAllNodes()
        }
      })
    },
    mousemove (event) {
      let point = this.getMousePos(event)
      // this.selectedPoint(point)
      if (this.dragMode && this.overPoint) {
        this.dragPoint(this.overPoint, point)
      }
    },
    mousedown (event) {
      let point = this.getMousePos(event)
      if (this.isMouseOnNode(point)) {
        // point selected
        this.dragMode = true
      } else {
        this.dragMode = false
      }
    },
    isMouseOnNode (point) {
      return this.selectedPoint(point) !== null
    },
    selectedPoint (point) {
      for (var iteratedPoint of this.points) {
        if (this.matchPoints(iteratedPoint, point)) {
          this.overPoint = iteratedPoint
          return iteratedPoint
        }
      }
      this.overPoint = null
      return null
    },
    addNode (point) {
      this.context.save()
      this.drawNode(point)
      this.context.restore()
      this.points.push(point)
    },
    Turn (p1, p2, p3) {
      let a = p1.y
      let b = p1.x
      let c = p2.y
      let d = p2.x
      let e = p3.y
      let f = p3.x
      let A = (f - b) * (c - a)
      let B = (d - b) * (e - a)
      return (A > B + Number.EPSILON) ? 1 : (A + Number.EPSILON < B) ? -1 : 0
    },
    // isIntersect (p1, p2, p3, p4) {
    //   return (this.Turn(p1, p3, p4) !== this.Turn(p2, p3, p4)) && (this.Turn(p1, p2, p3) !== this.Turn(p1, p2, p4))
    // },
    isIntersect (line1, line2) {
      // convert line1 to general form of line: Ax+By = C
      var a1 = line1.endPoint.y - line1.startPoint.y
      var b1 = line1.startPoint.x - line1.endPoint.x
      var c1 = a1 * line1.startPoint.x + b1 * line1.startPoint.y

      // convert line2 to general form of line: Ax+By = C
      var a2 = line2.endPoint.y - line2.startPoint.y
      var b2 = line2.startPoint.x - line2.endPoint.x
      var c2 = a2 * line2.startPoint.x + b2 * line2.startPoint.y

      // calculate the intersection point
      var d = a1 * b2 - a2 * b1

      // parallel when d is 0
      if (d === 0) {
        return false
      }

      // solve the interception point at (x, y)
      var x = (b2 * c1 - b1 * c2) / d
      var y = (a1 * c2 - a2 * c1) / d

      // check if the interception point is on both line segments
      if ((this.isInBetween(line1.startPoint.x, x, line1.endPoint.x) || this.isInBetween(line1.startPoint.y, y, line1.endPoint.y)) &&
        (this.isInBetween(line2.startPoint.x, x, line2.endPoint.x) || this.isInBetween(line2.startPoint.y, y, line2.endPoint.y))) {
        return true
      }

      // be default the given lines is not intersected.
      return false
    },
    // return true if b is between a and c,
    // we exclude the result when a==b or b==c
    isInBetween (a, b, c) {
      // return false if b is almost equal to a or c.
      // this is to eliminate some floating point when
      // two value is equal to each other but different with 0.00000...0001
      if (Math.abs(a - b) < 0.000001 || Math.abs(b - c) < 0.000001) {
        return false
      }

      // true when b is in between a and c
      return (a < b && b < c) || (c < b && b < a)
    },
    // {{{ drawNode
    drawNode (point) {
      this.context.beginPath()
      this.context.moveTo(point.x - this.pointSize, point.y - this.pointSize)
      this.context.lineTo(point.x - this.pointSize, point.y + this.pointSize)
      this.context.lineTo(point.x + this.pointSize, point.y + this.pointSize)
      this.context.lineTo(point.x + this.pointSize, point.y - this.pointSize)
      this.context.lineTo(point.x - this.pointSize, point.y - this.pointSize)
      this.context.fillStyle = this.fillStyle
      this.context.fill()
      this.context.strokeStyle = this.strokeStyle
      this.context.stroke()
    },
    // }}}
    // {{{ drawCircle
    drawCircle (point, radius) {
      this.context.fillStyle = 'GOLD'
      this.context.beginPath()
      this.context.arc(point.x, point.y, radius, 0, Math.PI * 2, true)
      this.context.closePath()
      this.context.fill()
    },
    // }}}
    // {{{ createRandomCircles
    createRandomCircles (width, height) {
      // randomly draw 5 circles
      var circlesCount = 5
      var circleRadius = 10
      for (var i = 0; i < circlesCount; i++) {
        var x = Math.random() * width
        var y = Math.random() * height
        this.drawCircle(x, y, circleRadius)
      }
    },
    // }}}
    Line (startPoint, endPoint, thickness) {
      return {
        startPoint: startPoint,
        endPoint: endPoint,
        thickness: thickness
      }
    },
    drawLine (x1, y1, x2, y2, thickness) {
      this.context.beginPath()
      this.context.moveTo(x1, y1)
      this.context.lineTo(x2, y2)
      this.context.lineWidth = thickness
      this.context.strokeStyle = '#cfc'
      this.context.stroke()
    },
    connectCircles () {
      // populate the lines[] with all possible points connections
      this.lines = []
      for (var i = 0; i < this.points.length; i++) {
        var startPoint = this.points[i]
        for (var j = 0; j < i; j++) {
          var endPoint = this.points[j]
          // this.drawLine(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 1)
          this.lines.push(this.Line(startPoint, endPoint, this.thinLineThickness))
        }
      }
    },
    updateLineIntersection () {
      // checking lines intersection and bold those lines.
      for (var i = 0; i < this.lines.length; i++) {
        let line1 = this.lines[i]
        line1.thickness = this.thinLineThickness

        for (var j = 0; j < i; j++) {
          var line2 = this.lines[j]

          // we check if two lines are intersected and bold the line if they are.
          if (this.isIntersect(line1, line2)) {
            line1.thickness = this.boldLineThickness
            line2.thickness = this.boldLineThickness
            this.lines[i] = line1
            this.lines[j] = line2
          }
        }
      }
    },
    drawAllLines () {
      this.updateLineIntersection()
      this.lines.forEach(({startPoint, endPoint, thickness}) => {
        this.drawLine(startPoint.x, startPoint.y, endPoint.x, endPoint.y, thickness)
      })
    },
    drawAllNodes () {
      this.context.save()
      for (let point of this.points) {
        // this.drawNode(point)
        this.connectCircles()
        this.drawCircle(point, this.pointSize)
        this.drawAllLines()
      }
      this.context.restore()
    }
  }
}
</script>
<style>
  canvas {
    border:1px solid #bbb;
  }
  .flex{
    display: flex;
    flex-flow: row wrap;
  }
  .flex > * {
    border: 1px solid #eee;
    margin: 10px;
    padding: 10px;
  }
</style>
