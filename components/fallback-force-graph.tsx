"use client"

import { useRef, useEffect } from "react"
import { useTheme } from "next-themes"

interface Node {
  id: string
  name: string
  type: string
  val: number
  docContent?: string
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

export default function FallbackForceGraph({ data }: ForceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!containerRef.current) return

    // Create a simple 2D canvas fallback
    const canvas = document.createElement("canvas")
    canvas.width = containerRef.current.clientWidth
    canvas.height = containerRef.current.clientHeight
    containerRef.current.appendChild(canvas)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw a simple representation of the graph
    const drawGraph = () => {
      if (!ctx) return

      // Clear canvas
      ctx.fillStyle = "#111827"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Calculate node positions (simple circle layout)
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = Math.min(centerX, centerY) * 0.8

      // Draw links
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"
      ctx.lineWidth = 1

      // Map nodes to positions
      const nodePositions: Record<string, { x: number; y: number }> = {}

      // Position cluster nodes in a circle
      const clusterNodes = data.nodes.filter((node) => node.type === "cluster")
      clusterNodes.forEach((node, i) => {
        const angle = (i / clusterNodes.length) * Math.PI * 2
        nodePositions[node.id] = {
          x: centerX + Math.cos(angle) * (radius / 2),
          y: centerY + Math.sin(angle) * (radius / 2),
        }
      })

      // Position document nodes around their clusters
      data.links.forEach((link) => {
        const sourceId = typeof link.source === "string" ? link.source : link.source.id
        const targetId = typeof link.target === "string" ? link.target : link.target.id

        // If source is a cluster and target position is not set yet
        if (sourceId.startsWith("cluster-") && !nodePositions[targetId]) {
          const sourcePos = nodePositions[sourceId]
          if (sourcePos) {
            // Get all links with this source
            const relatedLinks = data.links.filter((l) => {
              const s = typeof l.source === "string" ? l.source : l.source.id
              return s === sourceId
            })

            // Find index of current link in related links
            const linkIndex = relatedLinks.findIndex((l) => {
              const t = typeof l.target === "string" ? l.target : l.target.id
              return t === targetId
            })

            // Position in a circle around the cluster
            const angle = (linkIndex / relatedLinks.length) * Math.PI * 2
            const distance = radius / 3
            nodePositions[targetId] = {
              x: sourcePos.x + Math.cos(angle) * distance,
              y: sourcePos.y + Math.sin(angle) * distance,
            }
          }
        }
      })

      // Draw links
      data.links.forEach((link) => {
        const sourceId = typeof link.source === "string" ? link.source : link.source.id
        const targetId = typeof link.target === "string" ? link.target : link.target.id

        const sourcePos = nodePositions[sourceId]
        const targetPos = nodePositions[targetId]

        if (sourcePos && targetPos) {
          ctx.beginPath()
          ctx.moveTo(sourcePos.x, sourcePos.y)
          ctx.lineTo(targetPos.x, targetPos.y)
          ctx.stroke()
        }
      })

      // Draw nodes
      data.nodes.forEach((node) => {
        const pos = nodePositions[node.id]
        if (!pos) return

        // Node color based on type
        let color = "#6366f1" // Default purple
        if (node.type === "cluster")
          color = "#3b82f6" // Blue for clusters
        else if (node.type === "pdf")
          color = "#ef4444" // Red for PDFs
        else if (node.type === "word")
          color = "#0ea5e9" // Light blue for Word
        else if (node.type === "excel") color = "#22c55e" // Green for Excel

        // Draw node
        ctx.beginPath()
        ctx.fillStyle = color
        const size = node.type === "cluster" ? 15 : 8
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2)
        ctx.fill()

        // Draw label
        ctx.fillStyle = "#ffffff"
        ctx.font = node.type === "cluster" ? "bold 12px Arial" : "10px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(node.name, pos.x, pos.y + size + 10)
      })
    }

    // Initial draw
    drawGraph()

    // Add message about 3D version
    const messageDiv = document.createElement("div")
    messageDiv.className =
      "absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white p-4 text-center"
    messageDiv.innerHTML = `
      <div>
        <p class="text-lg font-bold mb-2">3D Force Graph Visualization</p>
        <p class="mb-4">The 3D visualization requires the 3d-force-graph package.</p>
        <p class="text-sm text-gray-400">This is a simplified 2D fallback visualization.</p>
      </div>
    `
    containerRef.current.appendChild(messageDiv)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [data])

  return <div ref={containerRef} className="w-full h-full relative" />
}
