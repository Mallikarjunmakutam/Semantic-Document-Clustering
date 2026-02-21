"use client"

import { useRef, useEffect } from "react"
import ForceGraph3D from "../3d-force-graph" // Import from local file instead of npm package directly
import { useTheme } from "next-themes"
import * as THREE from "three"

interface Node {
  id: string
  name: string
  type: string
  val: number
  docContent?: string
  x?: number
  y?: number
  z?: number
}

interface Link {
  source: string
  target: string
}

interface GraphData {
  nodes: Node[]
  links: Link[]
}

interface ForceGraphProps {
  data: GraphData
}

export default function ForceGraph({ data }: ForceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<any>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize the graph
    const Graph = ForceGraph3D()(containerRef.current)
      .backgroundColor("#111827")
      .nodeLabel("name")
      .nodeAutoColorBy("type")
      .nodeVal("val")
      .linkWidth(0.5)
      .linkOpacity(0.5)
      .linkDirectionalParticles(2)
      .linkDirectionalParticleWidth(0.8)
      .linkDirectionalParticleSpeed(0.01)
      .nodeThreeObject((node) => {
        const sprite = new SpriteText(node.name)
        sprite.color = node.type === "cluster" ? "#ffffff" : "#bbbbbb"
        sprite.textHeight = node.type === "cluster" ? 8 : 4
        sprite.backgroundColor = node.type === "cluster" ? "rgba(66, 153, 225, 0.2)" : "transparent"
        sprite.padding = 2
        sprite.borderRadius = 5
        return sprite
      })
      .onNodeClick((node) => {
        // Focus on node when clicked
        const distance = 100
        const distRatio = 1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0)

        Graph.cameraPosition(
          {
            x: (node.x || 0) * distRatio,
            y: (node.y || 0) * distRatio,
            z: (node.z || 0) * distRatio,
          },
          node,
          1000,
        )

        // Show document content in tooltip
        if (node.docContent) {
          const tooltip = document.createElement("div")
          tooltip.className = "bg-gray-800 text-white p-4 rounded shadow-lg max-w-md"
          tooltip.style.position = "absolute"
          tooltip.style.top = "20px"
          tooltip.style.right = "20px"
          tooltip.style.zIndex = "1000"
          tooltip.innerHTML = `
            <h3 class="text-lg font-bold mb-2">${node.name}</h3>
            <p class="text-sm">${node.docContent}</p>
          `

          // Remove existing tooltips
          const existingTooltip = document.querySelector(".graph-tooltip")
          if (existingTooltip) {
            existingTooltip.remove()
          }

          tooltip.classList.add("graph-tooltip")
          document.body.appendChild(tooltip)

          // Remove tooltip after 5 seconds
          setTimeout(() => {
            tooltip.remove()
          }, 5000)
        }
      })
      .graphData(data)

    // Add some animation
    Graph.d3Force("charge").strength(-120)

    // Add controls info
    const infoElem = document.createElement("div")
    infoElem.innerHTML = `
      <div class="absolute bottom-4 left-4 text-xs text-gray-400 bg-gray-800 bg-opacity-70 p-2 rounded">
        <p>Left-click: Select node</p>
        <p>Right-click + drag: Rotate</p>
        <p>Scroll: Zoom</p>
      </div>
    `
    infoElem.style.position = "absolute"
    infoElem.style.bottom = "10px"
    infoElem.style.left = "10px"
    infoElem.style.color = "white"
    infoElem.style.fontSize = "12px"
    containerRef.current.appendChild(infoElem)

    // Store reference to dispose later
    graphRef.current = Graph

    // Add camera animation
    let angle = 0
    const interval = setInterval(() => {
      if (graphRef.current && containerRef.current.parentElement) {
        angle += Math.PI / 300
        const distance = 300
        graphRef.current.cameraPosition({
          x: distance * Math.sin(angle),
          y: 50,
          z: distance * Math.cos(angle),
        })
      }
    }, 100)

    // Stop animation after 10 seconds
    setTimeout(() => {
      clearInterval(interval)
    }, 10000)

    return () => {
      clearInterval(interval)
      if (graphRef.current) {
        graphRef.current._destructor()
      }
    }
  }, [data])

  return <div ref={containerRef} className="w-full h-full" />
}

// Simple sprite text implementation for labels
class SpriteText extends THREE.Sprite {
  _text: string
  _textHeight: number
  _color: string
  _backgroundColor: string
  _padding: number
  _borderRadius: number
  _canvas: HTMLCanvasElement
  _context: CanvasRenderingContext2D
  _material: THREE.SpriteMaterial

  constructor(text: string) {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")!

    // Set canvas dimensions
    canvas.width = 256
    canvas.height = 128

    // Properties
    this._text = text
    this._textHeight = 10
    this._color = "white"
    this._backgroundColor = "transparent"
    this._padding = 0
    this._borderRadius = 0

    // Create sprite material
    const material = new THREE.SpriteMaterial({ map: new THREE.Texture(canvas) })
    super(material)

    this._canvas = canvas
    this._context = context
    this._material = material

    this._redraw()
  }

  get text() {
    return this._text
  }
  set text(text) {
    this._text = text
    this._redraw()
  }

  get textHeight() {
    return this._textHeight
  }
  set textHeight(height) {
    this._textHeight = height
    this._redraw()
  }

  get color() {
    return this._color
  }
  set color(color) {
    this._color = color
    this._redraw()
  }

  get backgroundColor() {
    return this._backgroundColor
  }
  set backgroundColor(color) {
    this._backgroundColor = color
    this._redraw()
  }

  get padding() {
    return this._padding
  }
  set padding(padding) {
    this._padding = padding
    this._redraw()
  }

  get borderRadius() {
    return this._borderRadius
  }
  set borderRadius(radius) {
    this._borderRadius = radius
    this._redraw()
  }

  _redraw() {
    const canvas = this._canvas
    const context = this._context
    const material = this._material

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height)

    // Set font
    const fontSize = this._textHeight
    context.font = `${fontSize}px Arial, sans-serif`

    // Measure text
    const textWidth = context.measureText(this._text).width
    const actualWidth = textWidth + this._padding * 2
    const actualHeight = fontSize + this._padding * 2

    // Draw background if specified
    if (this._backgroundColor !== "transparent") {
      context.fillStyle = this._backgroundColor
      if (this._borderRadius > 0) {
        roundRect(
          context,
          canvas.width / 2 - actualWidth / 2,
          canvas.height / 2 - actualHeight / 2,
          actualWidth,
          actualHeight,
          this._borderRadius,
        )
        context.fill()
      } else {
        context.fillRect(
          canvas.width / 2 - actualWidth / 2,
          canvas.height / 2 - actualHeight / 2,
          actualWidth,
          actualHeight,
        )
      }
    }

    // Draw text
    context.fillStyle = this._color
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(this._text, canvas.width / 2, canvas.height / 2)

    // Update texture
    material.map.needsUpdate = true

    // Update sprite scale based on text size
    const textAspect = actualWidth / actualHeight
    this.scale.set(textAspect * actualHeight, actualHeight, 1)
  }
}

// Helper function to draw rounded rectangles
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}
