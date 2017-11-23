<template>
  <div class="flex">

    <div>
      <h4><a href="https://github.com/ibrahim/untangled">Untangled Game in HTML5/Canvas and Vue.js</a></h4>
      <div>
        <button @click="restart">Restart Game</button>
        <button @click="easyLevel">Easy</button>
        <button @click="fairLevel">Fair</button>
        <button @click="toughLevel">Tough</button>
        <button @click="crazyLevel">Crazy</button>
      </div>
    </div>

    <div class="canvas-container">
      <div class="youwin" v-if="finishedGame">You Win</div>
      <canvas
        ref="canvas"
        :width="canvasWidth"
        :height="canvasHeight"

        @mousedown="mousedown"
        @mouseup="mouseup"
        @mousemove="mousemove"
      ></canvas>
    </div>

  </div>
</template>

<script>

import Point from './Point.js'

// Use Constrained Delaunay Triangulation to build a planar graph
import cdt2d from 'cdt2d'

export default {
  mounted () {
    this.canvas = this.$refs.canvas
    this.context = this.canvas.getContext('2d')
    this.restart()
  },
  data () {
    return {
      canvas: {},
      context: {},
      canvasHeight: 500,
      canvasWidth: 900,
      overPoint: null,
      dragMode: false,
      finishedGame: false,
      connectedWithOverPoint: null,
      pointSize: 10,
      pointsCount: 10,
      intersectedCount: 0,
      strokeStyle: 'darkgrey',
      fillStyle: '#fff',
      lines: [],
      points: [],
      edges: null
    }
  },
  computed: {

  },
  methods: {
    // {{{ restart
    restart () {
      this.lines = []
      this.edges = null
      this.finishedGame = false

      this.clearPoints()
      this.generatePoints()
      this.triangulate()
      this.arrangePoints()
      this.connectPoints()
      this.drawAllNodes()
    },
    // }}}
    // {{{ matchPoints
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
    // }}}
    // {{{ clear
    clear () {
      this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
    },
    // }}}
    // {{{ levels
    easyLevel () {
      this.pointsCount = 8
      this.restart()
    },
    fairLevel () {
      this.pointsCount = 10
      this.restart()
    },
    toughLevel () {
      this.pointsCount = 15
      this.restart()
    },
    crazyLevel () {
      this.pointsCount = 30
      this.restart()
    },
    // }}}
    // {{{ clearPoints
    clearPoints () {
      this.points = []
      this.clear()
    },
    // }}}
    // {{{ getMousePos
    getMousePos (evt) {
      // https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
      var rect = this.context.canvas.getBoundingClientRect()
      return {
        x: parseInt((evt.clientX - rect.left) / (rect.right - rect.left) * this.canvasWidth),
        y: parseInt((evt.clientY - rect.top) / (rect.bottom - rect.top) * this.canvasHeight)
      }
    },
    // }}}
    // {{{ mouseup
    mouseup (event) {
      let mouseUpPoint = this.getMousePos(event)
      if (this.dragMode && this.overPoint) {
        this.dragPoint(this.overPoint, mouseUpPoint)
        this.dragMode = false
        this.points.forEach((point) => { this.drawCircle(point, this.pointSize) })
        if (this.intersectedCount === 0 && !this.finishedGame) { this.playWin() }
      } else {
        this.connectedWithOverPoint = null
        // this.addNode(mouseUpPoint)
      }
    },
    // }}}
    // {{{ dragPoint
    dragPoint (selectedPoint, newPoint) {
      if (this.finishedGame) { return }
      this.points.map((pointToMove) => {
        if (pointToMove.x === selectedPoint.x && pointToMove.y === selectedPoint.y) {
          pointToMove.x = newPoint.x
          pointToMove.y = newPoint.y

          this.clear()
          this.drawAllNodes()
        }
      })
    },
    // }}}
    // {{{ mousemove
    mousemove (event) {
      let point = this.getMousePos(event)
      // this.selectedPoint(point)
      if (this.dragMode && this.overPoint) {
        this.dragPoint(this.overPoint, point)
      }
    },
    // }}}
    // {{{ mousedown
    mousedown (event) {
      let point = this.getMousePos(event)
      if (this.isMouseOnNode(point)) {
        this.findConnectedWithOverPoint()
        // point selected
        this.dragMode = true
      } else {
        this.dragMode = false
      }
    },
    // }}}
    // {{{ isMouseOnNode
    isMouseOnNode (point) {
      return this.selectedPoint(point) !== null
    },
        // }}}
    // {{{ selectedPoint
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
    // }}}}
    // {{{ addNode
    addNode (point) {
      this.context.save()
      this.drawNode(point)
      this.context.restore()
      this.points.push(point)
    },
    // }}}
    // {{{ isIntersect
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

      // check if the intersection point is on both line segments
      if ((this.isInBetween(line1.startPoint.x, x, line1.endPoint.x) || this.isInBetween(line1.startPoint.y, y, line1.endPoint.y)) &&
        (this.isInBetween(line2.startPoint.x, x, line2.endPoint.x) || this.isInBetween(line2.startPoint.y, y, line2.endPoint.y))) {
        return true
      }

      // be default the given lines is not intersected.
      return false
    },
    // }}}
    // {{{ isInBetween
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
    // }}}
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
    // {{{ findConnectedWithOverPoint
    findConnectedWithOverPoint () {
      if (this.connectedWithOverPoint && this.connectedWithOverPoint.overPoint === this.overPoint) { return }
      let connectedWithOverPoint = []
      this.lines.forEach(({startPoint, endPoint, isIntersected}) => {
        if (startPoint === this.overPoint) {
          connectedWithOverPoint.push(endPoint)
        } else if (endPoint === this.overPoint) {
          connectedWithOverPoint.push(startPoint)
        }
      })
      this.connectedWithOverPoint = { overPoint: this.overPoint, connectedPoints: connectedWithOverPoint }
    },
    // }}}
    // {{{ isPointConnectWithOverPoint
    isPointConnectWithOverPoint (point) {
      if (this.overPoint === point) { return true }
      if (!this.connectedWithOverPoint) { return false }
      if (this.connectedWithOverPoint.connectedPoints && this.connectedWithOverPoint.connectedPoints.includes(point)) {
        return true
      }
    },
    // }}}
    // {{{ drawCircle
    drawCircle (point, radius) {
      this.context.fillStyle = this.isPointConnectWithOverPoint(point) && this.dragMode ? '#DA0' : '#d46'
      this.context.beginPath()
      this.context.arc(point.x, point.y, radius, 0, Math.PI * 2, true)
      this.context.closePath()
      this.context.fill()
    },
    // }}}
    // {{{ Line
    Line (startPoint, endPoint, isIntersected) {
      return {
        startPoint: startPoint,
        endPoint: endPoint,
        isIntersected: isIntersected
      }
    },
    // }}}
    // {{{ drawLine
    drawLine (x1, y1, x2, y2, isIntersected) {
      this.context.beginPath()
      this.context.moveTo(x1, y1)
      this.context.lineTo(x2, y2)
      this.context.lineWidth = 2
      this.context.strokeStyle = isIntersected ? 'navy' : '#43e3bc'
      this.context.stroke()
    },
    // }}}
    // {{{ generatePoints
    generatePoints () {
      for (var i = 0; i < this.pointsCount; i++) {
        var x = 30 + Math.floor(Math.random() * (this.canvasWidth - 60))
        var y = 30 + Math.floor(Math.random() * (this.canvasHeight - 60))
        this.points.push(new Point(x, y))
      }
    },
    // }}}
    // {{{ arrangePoints
    arrangePoints () {
      for (let i = 0; i < this.pointsCount - 4; i++) {
        let x = Math.floor((this.canvasWidth / 2) + 150 * Math.cos(2 * Math.PI * i / (this.pointsCount - 4)))
        let y = Math.floor((this.canvasHeight / 2) + 150 * Math.sin(2 * Math.PI * i / (this.pointsCount - 4)))
        this.points[i] = new Point(x, y)
      }
      for (let i = 0; i < 4; i++) {
        let x = Math.floor((this.canvasWidth / 2) + 70 * Math.cos(2 * Math.PI * i / 4))
        let y = Math.floor((this.canvasHeight / 2) + 70 * Math.sin(2 * Math.PI * i / 4))
        this.points[this.pointsCount - i - 1] = new Point(x, y)
      }
    },
    // }}}
    // {{{ connectPoints
    connectPoints () {
      // populate this.lines[] with points based on trianglulated edges
      this.lines = []
      this.edges.forEach(([a, b]) => {
        this.lines.push(this.Line(this.points[a], this.points[b], false))
      })
    },
    // }}}
    // {{{ triangulate
    triangulate () {
      // use cdt2d to draw Delaunay Triangulation to ensure a planar graph
      // var points = [ [-2, -2], [-2, 2], [2, 2], [2, -2], [1, 0], [0, 1], [-1, 0], [0, -1] ]
      this.lines = []
      var coordinates = this.points.map(({x, y}) => { return [x, y] })
      var triangles = cdt2d(coordinates, this.edges || [], {exterior: true})
      var edges = []
      triangles.forEach(([a, b, c]) => {
        edges.push([a, b])
        edges.push([b, c])
        edges.push([c, a])
      })
      if (!this.edges) { this.edges = edges }
    },
    // }}}
    // {{{ playWin
    playWin () {
      this.finishedGame = true
      new Audio('https://ibrahim.github.io/untangled/static/tada.mp3').play()
    },
    // }}}
    // {{{ updateLineIntersection
    // checking lines intersection between all points O(n^2)
    updateLineIntersection () {
      // TODO:
      // Optimize intersection checking using sweepline algorithm O(nLogn)
      // [calvinmetcalf/sweepline](https://github.com/calvinmetcalf/sweepline)

      this.intersectedCount = 0
      for (var i = 0; i < this.lines.length; i++) {
        let line1 = this.lines[i]
        line1.isIntersected = false

        for (var j = 0; j < i; j++) {
          var line2 = this.lines[j]

          // we check if two lines are intersected and bold the line if they are.
          if (this.isIntersect(line1, line2)) {
            this.intersectedCount = this.intersectedCount + 1
            line1.isIntersected = true
            line2.isIntersected = true
            this.lines[i] = line1
            this.lines[j] = line2
          }
        }
      }
    },
    // }}}
    // {{{ drawAllLines
    drawAllLines () {
      this.updateLineIntersection()
      this.lines.forEach(({startPoint, endPoint, isIntersected}) => {
        this.drawLine(startPoint.x, startPoint.y, endPoint.x, endPoint.y, isIntersected)
      })
    },
    // }}}
    // {{{ drawAllNodes
    drawAllNodes () {
      this.context.save()
      this.connectPoints()
      this.drawAllLines()
      for (let point of this.points) {
        this.drawCircle(point, this.pointSize)
      }
      this.context.restore()
    }
    // }}}
  }
}
</script>
<style>
  canvas {
    border:1px solid #bbb;
  }
  .canvas-container {
    position:relative;
  }
  .youwin {
    pointer-events:none;
    position:absolute;
    top:160px;
    width:400px;
    margin-left:-200px;
    left:50%;
    height:160px;
    font-size:80px;
    font-weight:bold;
    font-family:Impact;
    padding:70px 0px 0px 0px;
    text-align:center;
    color:#fff;
    text-shadow:0px 0px 20px rgba(0,0,0,0.3);
    background-color:rgba(0,200,150,0.5);
  }
  .flex{
    display: flex;
    flex-flow: column wrap;
    justify-content:center;
    align-items:center;
  }
  .flex > * {
    border: 1px solid #eee;
    margin: 10px;
    padding: 10px;
  }
  h4 {
    text-align:center;
    color: rgba(0,200,150,1);
  }
</style>
