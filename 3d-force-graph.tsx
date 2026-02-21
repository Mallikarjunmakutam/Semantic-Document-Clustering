// This file provides a wrapper around the 3d-force-graph library
// to ensure it's properly loaded in the browser environment

const ForceGraph3D = () => {
  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    try {
      // Dynamic import for the 3d-force-graph library
      const ForceGraph3DModule = require("3d-force-graph")
      return ForceGraph3DModule.default || ForceGraph3DModule
    } catch (error) {
      console.error("Error loading 3d-force-graph:", error)
      // Return a dummy function that logs the error but doesn't crash
      return () => {
        console.warn("3d-force-graph failed to load. Using fallback.")
        return {
          backgroundColor: () => ({}),
          nodeLabel: () => ({}),
          nodeAutoColorBy: () => ({}),
          nodeVal: () => ({}),
          linkWidth: () => ({}),
          linkOpacity: () => ({}),
          linkDirectionalParticles: () => ({}),
          linkDirectionalParticleWidth: () => ({}),
          linkDirectionalParticleSpeed: () => ({}),
          nodeThreeObject: () => ({}),
          onNodeClick: () => ({}),
          graphData: () => ({}),
          d3Force: () => ({ strength: () => ({}) }),
          cameraPosition: () => ({}),
          _destructor: () => {},
        }
      }
    }
  }

  // Return a dummy function for SSR
  return () => ({})
}

export default ForceGraph3D
