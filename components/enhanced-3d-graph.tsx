"use client"

import { useRef, useState, useMemo } from "react"
import { motion } from "framer-motion"
import * as THREE from "three"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Html, Environment } from "@react-three/drei"

interface Node {
  id: string
  name: string
  type: string
  fileType?: string
  val: number
  docContent?: string
  keyTerms?: string[]
  topTerms?: string[]
  coherence?: number
}

interface Link {
  source: string
  target: string
  value?: number
  isDocLink?: boolean
}

interface GraphData {
  nodes: Node[]
  links: Link[]
}

interface Enhanced3DGraphProps {
  data: GraphData
}

// Main component
export default function Enhanced3DGraph({ data }: Enhanced3DGraphProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null)

  return (
    <div className="relative w-full h-full">
      <Canvas shadows camera={{ position: [0, 0, 40], fov: 50 }}>
        <color attach="background" args={["#111827"]} />
        <fog attach="fog" args={["#111827", 30, 100]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
        <Environment preset="night" />

        <GraphScene
          data={data}
          onNodeClick={setSelectedNode}
          onNodeHover={setHoveredNode}
          selectedNode={selectedNode}
        />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={100}
          dampingFactor={0.1}
        />
      </Canvas>

      {/* Node details panel */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute top-4 right-4 bg-gray-800 bg-opacity-90 p-4 rounded-lg shadow-lg max-w-xs backdrop-blur-sm border border-gray-700 z-10"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-white">{selectedNode.name}</h3>
            <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-white">
              ×
            </button>
          </div>

          {selectedNode.type === "cluster" ? (
            <div className="mt-2">
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm text-blue-300">Cluster</span>
              </div>

              {selectedNode.topTerms && selectedNode.topTerms.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-300 mb-1">Key Topics:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.topTerms.map((term, i) => (
                      <span key={i} className="text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-300 mt-2">Coherence: {(selectedNode.coherence || 0).toFixed(2)}</p>
            </div>
          ) : (
            <div className="mt-2">
              <div className="flex items-center mb-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                <span className="text-sm text-purple-300">Document</span>
                {selectedNode.fileType && (
                  <span className="ml-2 text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">
                    {selectedNode.fileType}
                  </span>
                )}
              </div>

              {selectedNode.docContent && <p className="text-xs text-gray-300 mt-2 mb-2">{selectedNode.docContent}</p>}

              {selectedNode.keyTerms && selectedNode.keyTerms.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-300 mb-1">Key Terms:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.keyTerms.map((term, i) => (
                      <span key={i} className="text-xs bg-purple-900 text-purple-200 px-2 py-0.5 rounded">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Hover tooltip */}
      {hoveredNode && !selectedNode && (
        <div
          className="absolute bg-gray-900 bg-opacity-90 text-white text-sm px-2 py-1 rounded pointer-events-none z-10"
          style={{
            left: `${window.innerWidth / 2}px`,
            top: `${window.innerHeight / 2 - 50}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {hoveredNode.name}
        </div>
      )}

      {/* Controls info */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-400 bg-gray-800 bg-opacity-70 p-2 rounded">
        <p>Left-click: Select node</p>
        <p>Right-click + drag: Rotate</p>
        <p>Scroll: Zoom</p>
      </div>
    </div>
  )
}

// 3D Graph Scene
function GraphScene({
  data,
  onNodeClick,
  onNodeHover,
  selectedNode,
}: {
  data: GraphData
  onNodeClick: (node: Node | null) => void
  onNodeHover: (node: Node | null) => void
  selectedNode: Node | null
}) {
  const { nodes, links } = data
  const graphRef = useRef<THREE.Group>(null)

  // Calculate node positions using a force-directed layout algorithm
  const nodePositions = useMemo(() => {
    const positions = new Map<string, [number, number, number]>()

    // Initialize node positions in a sphere
    nodes.forEach((node) => {
      const phi = Math.acos(-1 + 2 * Math.random())
      const theta = 2 * Math.PI * Math.random()
      const radius = node.type === "cluster" ? 10 : 20

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      positions.set(node.id, [x, y, z])
    })

    return positions
  }, [nodes])

  // Animation loop for gentle rotation
  useFrame((_, delta) => {
    if (graphRef.current) {
      graphRef.current.rotation.y += delta * 0.05
    }
  })

  return (
    <group ref={graphRef}>
      {/* Links */}
      {links.map((link, i) => {
        const sourceId = typeof link.source === "string" ? link.source : link.source.id
        const targetId = typeof link.target === "string" ? link.target : link.target.id

        const sourcePos = nodePositions.get(sourceId)
        const targetPos = nodePositions.get(targetId)

        if (!sourcePos || !targetPos) return null

        const isDocLink = link.isDocLink || false
        const linkStrength = link.value || 1

        return (
          <LinkLine
            key={i}
            sourcePosition={sourcePos}
            targetPosition={targetPos}
            isDocLink={isDocLink}
            strength={linkStrength}
          />
        )
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const position = nodePositions.get(node.id)
        if (!position) return null

        const isCluster = node.type === "cluster"
        const isSelected = selectedNode?.id === node.id

        return (
          <NodeSphere
            key={node.id}
            node={node}
            position={position}
            isCluster={isCluster}
            isSelected={isSelected}
            onClick={() => onNodeClick(node)}
            onHover={() => onNodeHover(node)}
            onBlur={() => onNodeHover(null)}
          />
        )
      })}
    </group>
  )
}

// Node component
function NodeSphere({
  node,
  position,
  isCluster,
  isSelected,
  onClick,
  onHover,
  onBlur,
}: {
  node: Node
  position: [number, number, number]
  isCluster: boolean
  isSelected: boolean
  onClick: () => void
  onHover: () => void
  onBlur: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const size = isCluster ? 1.5 : 0.8

  // Pulse animation for selected node
  useFrame(() => {
    if (meshRef.current && isSelected) {
      const scale = 1 + Math.sin(Date.now() * 0.005) * 0.2
      meshRef.current.scale.set(scale, scale, scale)
    }
  })

  // Get color based on node type
  const getColor = () => {
    if (isCluster) return "#3b82f6" // Blue for clusters

    // For documents, use color based on file type
    switch (node.fileType) {
      case "pdf":
        return "#ef4444" // Red
      case "word":
        return "#0ea5e9" // Light blue
      case "excel":
        return "#22c55e" // Green
      case "powerpoint":
        return "#f97316" // Orange
      case "text":
        return "#a855f7" // Purple
      case "markdown":
        return "#8b5cf6" // Indigo
      case "json":
        return "#eab308" // Yellow
      case "csv":
        return "#14b8a6" // Teal
      default:
        return "#a855f7" // Purple default
    }
  }

  const color = getColor()

  return (
    <group position={position}>
      {/* Node sphere */}
      <mesh ref={meshRef} onClick={onClick} onPointerOver={onHover} onPointerOut={onBlur} scale={[size, size, size]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Glow effect */}
      <mesh scale={[size * 1.2, size * 1.2, size * 1.2]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={color} transparent={true} opacity={0.15} />
      </mesh>

      {/* Label */}
      <Html position={[0, size * 1.5, 0]} center distanceFactor={10}>
        <div
          className={`px-1.5 py-0.5 rounded text-xs whitespace-nowrap ${
            isCluster ? "bg-blue-900 bg-opacity-80 text-blue-100" : "bg-gray-900 bg-opacity-80 text-gray-100"
          }`}
        >
          {node.name}
        </div>
      </Html>
    </group>
  )
}

// Link component
function LinkLine({
  sourcePosition,
  targetPosition,
  isDocLink,
  strength,
}: {
  sourcePosition: [number, number, number]
  targetPosition: [number, number, number]
  isDocLink: boolean
  strength: number
}) {
  // Determine line color and width based on link type and semantic strength
  // Higher strength means stronger semantic relationship
  const color = isDocLink
    ? `rgb(${Math.round(168 - strength * 30)}, ${Math.round(85 + strength * 40)}, ${Math.round(247)})` // Purple with variation
    : `rgb(${Math.round(59 - strength * 20)}, ${Math.round(130 + strength * 30)}, ${Math.round(246)})` // Blue with variation

  const opacity = isDocLink ? 0.3 + strength * 0.3 : 0.5 + strength * 0.2
  const lineWidth = isDocLink ? 1 + strength : 2 + strength * 0.5

  // Create points for the line
  const points = useMemo(() => {
    const points = []
    points.push(new THREE.Vector3(...sourcePosition))
    points.push(new THREE.Vector3(...targetPosition))
    return points
  }, [sourcePosition, targetPosition])

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={opacity} linewidth={lineWidth} />
    </line>
  )
}
