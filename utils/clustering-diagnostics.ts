// Utility to diagnose clustering algorithm issues

export interface ClusteringDiagnosticResult {
  algorithm: string
  inputVectors: number[][]
  parameters: Record<string, any>
  clusters: number[][]
  silhouetteScore?: number
  processingTimeMs: number
  error?: string
}

// Simple K-means implementation for diagnostics
function kMeans(vectors: number[][], k: number, maxIterations = 10): { clusters: number[][]; centroids: number[][] } {
  if (vectors.length === 0) {
    return { clusters: [], centroids: [] }
  }

  // Initialize centroids randomly
  const centroids: number[][] = []
  const used = new Set<number>()

  // Handle edge case where k > vectors.length
  const effectiveK = Math.min(k, vectors.length)

  while (centroids.length < effectiveK) {
    const idx = Math.floor(Math.random() * vectors.length)
    if (!used.has(idx)) {
      centroids.push([...vectors[idx]])
      used.add(idx)
    }
  }

  // Run k-means algorithm
  let clusters: number[][] = Array(effectiveK)
    .fill(null)
    .map(() => [])

  for (let iter = 0; iter < maxIterations; iter++) {
    // Reset clusters
    clusters = Array(effectiveK)
      .fill(null)
      .map(() => [])

    // Assign points to nearest centroid
    for (let i = 0; i < vectors.length; i++) {
      let minDist = Number.POSITIVE_INFINITY
      let closestCentroid = 0

      for (let j = 0; j < centroids.length; j++) {
        const dist = euclideanDistance(vectors[i], centroids[j])
        if (dist < minDist) {
          minDist = dist
          closestCentroid = j
        }
      }

      clusters[closestCentroid].push(i)
    }

    // Update centroids
    const oldCentroids = [...centroids]

    for (let i = 0; i < effectiveK; i++) {
      if (clusters[i].length === 0) continue

      const newCentroid = new Array(vectors[0].length).fill(0)

      for (const pointIdx of clusters[i]) {
        for (let d = 0; d < vectors[0].length; d++) {
          newCentroid[d] += vectors[pointIdx][d]
        }
      }

      for (let d = 0; d < newCentroid.length; d++) {
        newCentroid[d] /= clusters[i].length
      }

      centroids[i] = newCentroid
    }

    // Check for convergence
    let converged = true
    for (let i = 0; i < effectiveK; i++) {
      if (euclideanDistance(oldCentroids[i], centroids[i]) > 0.001) {
        converged = false
        break
      }
    }

    if (converged) break
  }

  return { clusters, centroids }
}

// DBSCAN implementation for diagnostics
function dbscan(vectors: number[][], eps: number, minPts: number): { clusters: number[][]; noise: number[] } {
  const n = vectors.length
  const visited = new Array(n).fill(false)
  const noise = []
  const clusters: number[][] = []

  // Helper function to get neighbors
  function getNeighbors(pointIdx: number): number[] {
    const neighbors = []
    for (let i = 0; i < n; i++) {
      if (euclideanDistance(vectors[pointIdx], vectors[i]) <= eps) {
        neighbors.push(i)
      }
    }
    return neighbors
  }

  // Main DBSCAN algorithm
  for (let i = 0; i < n; i++) {
    if (visited[i]) continue

    visited[i] = true
    const neighbors = getNeighbors(i)

    if (neighbors.length < minPts) {
      noise.push(i)
      continue
    }

    const cluster = [i]
    clusters.push(cluster)

    let j = 0
    while (j < neighbors.length) {
      const currentPoint = neighbors[j]

      if (!visited[currentPoint]) {
        visited[currentPoint] = true
        const currentNeighbors = getNeighbors(currentPoint)

        if (currentNeighbors.length >= minPts) {
          neighbors.push(...currentNeighbors.filter((p) => !neighbors.includes(p)))
        }
      }

      // Add to cluster if not already in a cluster
      if (!clusters.some((c) => c.includes(currentPoint)) && !noise.includes(currentPoint)) {
        cluster.push(currentPoint)
      }

      j++
    }
  }

  return { clusters, noise }
}

// Calculate silhouette score for clustering evaluation
function calculateSilhouetteScore(vectors: number[][], clusters: number[][]): number {
  if (clusters.length <= 1) return 0

  let totalSilhouette = 0
  let totalPoints = 0

  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i]

    for (const pointIdx of cluster) {
      // Calculate a(i) - average distance to points in same cluster
      let intraClusterDist = 0
      for (const otherPointIdx of cluster) {
        if (pointIdx !== otherPointIdx) {
          intraClusterDist += euclideanDistance(vectors[pointIdx], vectors[otherPointIdx])
        }
      }
      const a = cluster.length > 1 ? intraClusterDist / (cluster.length - 1) : 0

      // Calculate b(i) - minimum average distance to points in different cluster
      let minInterClusterDist = Number.POSITIVE_INFINITY

      for (let j = 0; j < clusters.length; j++) {
        if (i !== j) {
          const otherCluster = clusters[j]
          let interClusterDist = 0

          for (const otherPointIdx of otherCluster) {
            interClusterDist += euclideanDistance(vectors[pointIdx], vectors[otherPointIdx])
          }

          const avgDist = interClusterDist / otherCluster.length
          minInterClusterDist = Math.min(minInterClusterDist, avgDist)
        }
      }

      const b = minInterClusterDist

      // Calculate silhouette
      const silhouette = b === Number.POSITIVE_INFINITY ? 0 : (b - a) / Math.max(a, b)
      totalSilhouette += silhouette
      totalPoints++
    }
  }

  return totalPoints > 0 ? totalSilhouette / totalPoints : 0
}

// Helper function for Euclidean distance
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2)
  }
  return Math.sqrt(sum)
}

// Helper function for cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += Math.pow(a[i], 2)
    normB += Math.pow(b[i], 2)
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) return 0

  return dotProduct / (normA * normB)
}

export async function diagnoseKMeansClustering(
  vectors: number[][],
  k: number,
  maxIterations = 10,
): Promise<ClusteringDiagnosticResult> {
  try {
    const startTime = Date.now()

    // Validate inputs
    if (!vectors || vectors.length === 0) {
      throw new Error("No vectors provided")
    }

    if (k <= 0) {
      throw new Error("k must be greater than 0")
    }

    // Run K-means
    const { clusters, centroids } = kMeans(vectors, k, maxIterations)

    // Calculate silhouette score
    const silhouetteScore = calculateSilhouetteScore(vectors, clusters)

    const endTime = Date.now()

    return {
      algorithm: "k-means",
      inputVectors: vectors,
      parameters: { k, maxIterations },
      clusters,
      silhouetteScore,
      processingTimeMs: endTime - startTime,
    }
  } catch (error) {
    return {
      algorithm: "k-means",
      inputVectors: vectors,
      parameters: { k, maxIterations },
      clusters: [],
      processingTimeMs: 0,
      error: `K-means clustering failed: ${(error as Error).message}`,
    }
  }
}

export async function diagnoseDBSCANClustering(
  vectors: number[][],
  eps: number,
  minPts: number,
): Promise<ClusteringDiagnosticResult> {
  try {
    const startTime = Date.now()

    // Validate inputs
    if (!vectors || vectors.length === 0) {
      throw new Error("No vectors provided")
    }

    if (eps <= 0) {
      throw new Error("eps must be greater than 0")
    }

    if (minPts <= 0) {
      throw new Error("minPts must be greater than 0")
    }

    // Run DBSCAN
    const { clusters, noise } = dbscan(vectors, eps, minPts)

    // Add noise points as a separate "cluster" for visualization
    if (noise.length > 0) {
      clusters.push(noise)
    }

    // Calculate silhouette score
    const silhouetteScore = calculateSilhouetteScore(vectors, clusters)

    const endTime = Date.now()

    return {
      algorithm: "dbscan",
      inputVectors: vectors,
      parameters: { eps, minPts },
      clusters,
      silhouetteScore,
      processingTimeMs: endTime - startTime,
    }
  } catch (error) {
    return {
      algorithm: "dbscan",
      inputVectors: vectors,
      parameters: { eps, minPts },
      clusters: [],
      processingTimeMs: 0,
      error: `DBSCAN clustering failed: ${(error as Error).message}`,
    }
  }
}
