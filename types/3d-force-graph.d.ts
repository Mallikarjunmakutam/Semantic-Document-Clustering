declare module "3d-force-graph" {
  interface ForceGraphInstance {
    backgroundColor: (color: string) => ForceGraphInstance
    nodeLabel: (label: string) => ForceGraphInstance
    nodeAutoColorBy: (accessor: string) => ForceGraphInstance
    nodeVal: (val: string) => ForceGraphInstance
    linkWidth: (width: number) => ForceGraphInstance
    linkOpacity: (opacity: number) => ForceGraphInstance
    linkDirectionalParticles: (particles: number) => ForceGraphInstance
    linkDirectionalParticleWidth: (width: number) => ForceGraphInstance
    linkDirectionalParticleSpeed: (speed: number) => ForceGraphInstance
    nodeThreeObject: (callback: (node: any) => any) => ForceGraphInstance
    onNodeClick: (callback: (node: any) => void) => ForceGraphInstance
    graphData: (data: any) => ForceGraphInstance
    d3Force: (forceName: string) => { strength: (strength: number) => ForceGraphInstance }
    cameraPosition: (position: any, lookAt?: any, transitionDuration?: number) => ForceGraphInstance
    _destructor: () => void
  }

  export default function ForceGraph3D(): ForceGraphInstance
}
