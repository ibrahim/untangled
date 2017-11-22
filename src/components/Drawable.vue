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

export default {
  mounted () {
    this.canvas = this.$refs.canvas
    this.context = this.canvas.getContext('2d')
    this.generateRandomPoints()
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
      pointsCount: 5,
      thinLineThickness: 1,
      strokeStyle: 'darkgrey',
      fillStyle: '#fff',
      lines: [],
      points: []
    }
  },
  computed: {

  },
  methods: {
    generateRandomPoints () {
      for (var i = 0; i < this.pointsCount; i++) {
        var x = Math.random() * this.canvasWidth
        var y = Math.random() * this.canvasHeight
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
      // connect the circles to each other with lines
      this.lines = []
      for (var i = 0; i < this.points.length; i++) {
        var startPoint = this.points[i]
        for (var j = 0; j < i; j++) {
          var endPoint = this.points[j]
          this.drawLine(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 1)
          this.lines.push(this.Line(startPoint, endPoint, this.thinLineThickness))
        }
      }
    },
    drawAllNodes () {
      this.context.save()
      for (let point of this.points) {
        // this.drawNode(point)
        this.connectCircles()
        this.drawCircle(point, this.pointSize)
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
