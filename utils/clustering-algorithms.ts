import { euclideanDistance, cosineSimilarity } from "./text-analysis"

/**
 * Interface for clustering algorithm results
 */
export interface ClusteringResult {
  clusters: { [key: number]: number[] }
  centroids?: number[][]
  silhouetteScore: number
  algorithm: string
  algorithmDetails: any
}

/**
 * K-means clustering algorithm implementation
 */
export function kMeansClustering(
  vectors: number[][],
  k = 3,
  maxIterations = 100,
  distanceMetric: "euclidean" | "cosine" = "cosine",
): ClusteringResult {
  if (vectors.length === 0) {
    return {
      clusters: {},
      centroids: [],
      silhouetteScore: 0,
      algorithm: "K-means",
      algorithmDetails: { k, iterations: 0 },
    }
  }

  // Handle case where we have fewer vectors than k
  if (vectors.length < k) {
    k = vectors.length
  }

  const dimension = vectors[0].length

  // Initialize centroids using k-means++ initialization
  const centroids: number[][] = []
  const usedIndices = new Set<number>()

  // Choose first centroid randomly
  const firstIndex = Math.floor(Math.random() * vectors.length)
  centroids.push([...vectors[firstIndex]])
  usedIndices.add(firstIndex)

  // Choose remaining centroids with probability proportional to distance squared
  for (let i = 1; i < k; i++) {
    const distances: number[] = []
    let totalDistance = 0

    // Calculate minimum distance from each point to any existing centroid
    for (let j = 0; j < vectors.length; j++) {
      if (usedIndices.has(j)) continue

      let minDist = Number.POSITIVE_INFINITY
      for (const centroid of centroids) {
        const dist =
          distanceMetric === "euclidean"
            ? euclideanDistance(vectors[j], centroid)
            : 1 - cosineSimilarity(vectors[j], centroid)
        minDist = Math.min(minDist, dist)
      }

      // Square the distance to give more weight to distant points
      const distSquared = minDist * minDist
      distances.push(distSquared)
      totalDistance += distSquared
    }

    // Choose next centroid with probability proportional to distance squared
    let cumulativeProb = 0
    const threshold = Math.random() * totalDistance
    let nextCentroidIndex = -1

    for (let j = 0, index = 0; j < vectors.length; j++) {
      if (usedIndices.has(j)) continue

      cumulativeProb += distances[index++]
      if (cumulativeProb >= threshold) {
        nextCentroidIndex = j
        break
      }
    }

    // If we didn't select a centroid, choose the farthest one
    if (nextCentroidIndex === -1) {
      let maxDist = -1
      for (let j = 0; j < vectors.length; j++) {
        if (usedIndices.has(j)) continue

        let minDist = Number.POSITIVE_INFINITY
        for (const centroid of centroids) {
          const dist =
            distanceMetric === "euclidean"
              ? euclideanDistance(vectors[j], centroid)
              : 1 - cosineSimilarity(vectors[j], centroid)
          minDist = Math.min(minDist, dist)
        }

        if (minDist > maxDist) {
          maxDist = minDist
          nextCentroidIndex = j
        }
      }
    }

    if (nextCentroidIndex !== -1) {
      centroids.push([...vectors[nextCentroidIndex]])
      usedIndices.add(nextCentroidIndex)
    }
  }

  // Main K-means algorithm
  let clusters: { [key: number]: number[] } = {}
  let iterations = 0
  let converged = false

  while (!converged && iterations < maxIterations) {
    // Reset clusters
    clusters = {}
    for (let i = 0; i < k; i++) {
      clusters[i] = []
    }

    // Assign points to nearest centroid
    for (let i = 0; i < vectors.length; i++) {
      let minDist = Number.POSITIVE_INFINITY
      let closestCentroid = 0

      for (let j = 0; j < centroids.length; j++) {
        const dist =
          distanceMetric === "euclidean"
            ? euclideanDistance(vectors[i], centroids[j])
            : 1 - cosineSimilarity(vectors[i], centroids[j])

        if (dist < minDist) {
          minDist = dist
          closestCentroid = j
        }
      }

      clusters[closestCentroid].push(i)
    }

    // Update centroids
    let centroidsChanged = false
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue

      const newCentroid = new Array(dimension).fill(0)

      for (const pointIndex of clusters[i]) {
        for (let d = 0; d < dimension; d++) {
          newCentroid[d] += vectors[pointIndex][d]
        }
      }

      for (let d = 0; d < dimension; d++) {
        newCentroid[d] /= clusters[i].length
      }

      // Check if centroid changed significantly
      const centroidDist =
        distanceMetric === "euclidean"
          ? euclideanDistance(centroids[i], newCentroid)
          : 1 - cosineSimilarity(centroids[i], newCentroid)

      if (centroidDist > 0.001) {
        centroidsChanged = true
      }

      centroids[i] = newCentroid
    }

    // Check for empty clusters and reinitialize if needed
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) {
        // Find the cluster with the most points
        let maxSize = 0
        let largestCluster = 0

        for (let j = 0; j < k; j++) {
          if (clusters[j].length > maxSize) {
            maxSize = clusters[j].length
            largestCluster = j
          }
        }

        // Split the largest cluster
        if (clusters[largestCluster].length >= 2) {
          const pointsToMove = Math.ceil(clusters[largestCluster].length / 2)
          const movedPoints = clusters[largestCluster].splice(0, pointsToMove)
          clusters[i] = movedPoints

          // Recalculate centroids for both clusters
          const newCentroidI = new Array(dimension).fill(0)
          const newCentroidLargest = new Array(dimension).fill(0)

          for (const pointIndex of clusters[i]) {
            for (let d = 0; d < dimension; d++) {
              newCentroidI[d] += vectors[pointIndex][d]
            }
          }

          for (const pointIndex of clusters[largestCluster]) {
            for (let d = 0; d < dimension; d++) {
              newCentroidLargest[d] += vectors[pointIndex][d]
            }
          }

          for (let d = 0; d < dimension; d++) {
            newCentroidI[d] /= clusters[i].length
            newCentroidLargest[d] /= clusters[largestCluster].length
          }

          centroids[i] = newCentroidI
          centroids[largestCluster] = newCentroidLargest
          centroidsChanged = true
        }
      }
    }

    converged = !centroidsChanged
    iterations++
  }

  // Calculate silhouette score
  const silhouetteScore = calculateSilhouetteScore(vectors, clusters, distanceMetric)

  // Remove empty clusters
  Object.keys(clusters).forEach((key) => {
    if (clusters[Number(key)].length === 0) {
      delete clusters[Number(key)]
    }
  })

  return {
    clusters,
    centroids,
    silhouetteScore,
    algorithm: "K-means",
    algorithmDetails: {
      k,
      iterations,
      distanceMetric,
      clusterCount: Object.keys(clusters).length,
    },
  }
}

/**
 * DBSCAN clustering algorithm implementation
 */
export function dbscanClustering(
  vectors: number[][],
  epsilon = 0.5,
  minPoints = 3,
  distanceMetric: "euclidean" | "cosine" = "cosine",
): ClusteringResult {
  if (vectors.length === 0) {
    return {
      clusters: {},
      silhouetteScore: 0,
      algorithm: "DBSCAN",
      algorithmDetails: { epsilon, minPoints },
    }
  }

  // Initialize variables
  const visited = new Array(vectors.length).fill(false)
  const noise: number[] = []
  const clusters: { [key: number]: number[] } = {}
  let clusterIdx = 0

  // Helper function to get neighbors within epsilon distance
  function getNeighbors(pointIdx: number): number[] {
    const neighbors: number[] = []

    for (let i = 0; i < vectors.length; i++) {
      const dist =
        distanceMetric === "euclidean"
          ? euclideanDistance(vectors[pointIdx], vectors[i])
          : 1 - cosineSimilarity(vectors[pointIdx], vectors[i])

      if (dist <= epsilon) {
        neighbors.push(i)
      }
    }

    return neighbors
  }

  // Main DBSCAN algorithm
  for (let i = 0; i < vectors.length; i++) {
    if (visited[i]) continue

    visited[i] = true
    const neighbors = getNeighbors(i)

    if (neighbors.length < minPoints) {
      // Mark as noise
      noise.push(i)
      continue
    }

    // Start a new cluster
    clusters[clusterIdx] = [i]

    // Process neighbors
    let j = 0
    while (j < neighbors.length) {
      const currentPoint = neighbors[j]

      if (!visited[currentPoint]) {
        visited[currentPoint] = true

        const currentNeighbors = getNeighbors(currentPoint)

        if (currentNeighbors.length >= minPoints) {
          // Add new neighbors to the list
          for (const neighbor of currentNeighbors) {
            if (!neighbors.includes(neighbor)) {
              neighbors.push(neighbor)
            }
          }
        }
      }

      // Add to cluster if not already in a cluster
      if (!Object.values(clusters).flat().includes(currentPoint)) {
        clusters[clusterIdx].push(currentPoint)
      }

      j++
    }

    clusterIdx++
  }

  // Handle noise points
  if (noise.length > 0) {
    if (noise.length <= 3) {
      // If few noise points, make them individual clusters
      for (let i = 0; i < noise.length; i++) {
        clusters[clusterIdx + i] = [noise[i]]
      }
    } else {
      // Group noise points into a single cluster
      clusters[clusterIdx] = [...noise]
    }
  }

  // Calculate silhouette score
  const silhouetteScore = calculateSilhouetteScore(vectors, clusters, distanceMetric)

  return {
    clusters,
    silhouetteScore,
    algorithm: "DBSCAN",
    algorithmDetails: {
      epsilon,
      minPoints,
      noisePoints: noise.length,
      clusterCount: Object.keys(clusters).length,
    },
  }
}

/**
 * Calculate silhouette score to evaluate clustering quality
 */
function calculateSilhouetteScore(
  vectors: number[][],
  clusters: { [key: number]: number[] },
  distanceMetric: "euclidean" | "cosine" = "cosine",
): number {
  const clusterCount = Object.keys(clusters).length

  if (clusterCount <= 1) return 0

  let totalSilhouette = 0
  let totalPoints = 0

  // For each cluster
  for (const clusterId in clusters) {
    const clusterPoints = clusters[clusterId]

    // For each point in the cluster
    for (const pointIdx of clusterPoints) {
      // Calculate a(i) - average distance to points in same cluster
      let intraClusterDist = 0

      for (const otherPointIdx of clusterPoints) {
        if (pointIdx !== otherPointIdx) {
          const dist =
            distanceMetric === "euclidean"
              ? euclideanDistance(vectors[pointIdx], vectors[otherPointIdx])
              : 1 - cosineSimilarity(vectors[pointIdx], vectors[otherPointIdx])

          intraClusterDist += dist
        }
      }

      const a = clusterPoints.length > 1 ? intraClusterDist / (clusterPoints.length - 1) : 0

      // Calculate b(i) - minimum average distance to points in different cluster
      let minInterClusterDist = Number.POSITIVE_INFINITY

      for (const otherClusterId in clusters) {
        if (otherClusterId !== clusterId) {
          const otherClusterPoints = clusters[otherClusterId]
          let interClusterDist = 0

          for (const otherPointIdx of otherClusterPoints) {
            const dist =
              distanceMetric === "euclidean"
                ? euclideanDistance(vectors[pointIdx], vectors[otherPointIdx])
                : 1 - cosineSimilarity(vectors[pointIdx], vectors[otherPointIdx])

            interClusterDist += dist
          }

          const avgDist =
            otherClusterPoints.length > 0 ? interClusterDist / otherClusterPoints.length : Number.POSITIVE_INFINITY
          minInterClusterDist = Math.min(minInterClusterDist, avgDist)
        }
      }

      const b = minInterClusterDist

      // Calculate silhouette
      let silhouette = 0
      if (a === 0 && b === 0) {
        silhouette = 0
      } else if (a < b) {
        silhouette = 1 - a / b
      } else {
        silhouette = b / a - 1
      }

      totalSilhouette += silhouette
      totalPoints++
    }
  }

  return totalPoints > 0 ? totalSilhouette / totalPoints : 0
}

/**
 * Determine optimal number of clusters using the elbow method
 */
export function findOptimalK(vectors: number[], maxK = 10): number {
  if (vectors.length <= 2) return vectors.length

  const sse: number[] = []
  const maxClusters = Math.min(maxK, vectors.length - 1)

  // Calculate SSE for different values of k
  for (let k = 1; k <= maxClusters; k++) {
    const result = kMeansClustering(vectors, k)
    let sumSquaredError = 0

    // Calculate SSE for this clustering
    for (const clusterId in result.clusters) {
      const clusterPoints = result.clusters[clusterId]
      const centroid = result.centroids![Number(clusterId)]

      for (const pointIdx of clusterPoints) {
        const dist = euclideanDistance(vectors[pointIdx], centroid)
        sumSquaredError += dist * dist
      }
    }

    sse.push(sumSquaredError)
  }

  // Find the elbow point
  let maxCurvature = 0
  let optimalK = 2 // Default to 2 if no clear elbow is found

  for (let k = 1; k < maxClusters - 1; k++) {
    // Calculate the angle between consecutive line segments
    const x1 = k - 1
    const y1 = sse[k - 1]
    const x2 = k
    const y2 = sse[k]
    const x3 = k + 1
    const y3 = sse[k + 1]

    // Calculate vectors
    const v1x = x2 - x1
    const v1y = y2 - y1
    const v2x = x3 - x2
    const v2y = y3 - y2

    // Normalize vectors
    const v1Mag = Math.sqrt(v1x * v1x + v1y * v1y)
    const v2Mag = Math.sqrt(v2x * v2x + v2y * v2y)

    const v1xNorm = v1x / v1Mag
    const v1yNorm = v1y / v1Mag
    const v2xNorm = v2x / v2Mag
    const v2yNorm = v2y / v2Mag

    // Calculate dot product and angle
    const dotProduct = v1xNorm * v2xNorm + v1yNorm * v2yNorm
    const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)))

    if (angle > maxCurvature) {
      maxCurvature = angle
      optimalK = k + 1
    }
  }

  return optimalK
}

/**
 * Determine optimal epsilon for DBSCAN using k-distance graph
 */
export function findOptimalEpsilon(vectors: number[], k = 4): number {
  if (vectors.length <= 1) return 0.5

  // Calculate k-distance for each point
  const kDistances: number[] = []

  for (let i = 0; i < vectors.length; i++) {
    const distances: number[] = []

    for (let j = 0; j < vectors.length; j++) {
      if (i !== j) {
        distances.push(euclideanDistance(vectors[i], vectors[j]))
      }
    }

    // Sort distances and get the k-th distance
    distances.sort((a, b) => a - b)
    kDistances.push(distances[Math.min(k, distances.length - 1)])
  }

  // Sort k-distances
  kDistances.sort((a, b) => a - b)

  // Find the "elbow" in the k-distance graph
  let maxCurvature = 0
  let optimalEpsilonIndex = 0

  for (let i = 1; i < kDistances.length - 1; i++) {
    const x1 = i - 1
    const y1 = kDistances[i - 1]
    const x2 = i
    const y2 = kDistances[i]
    const x3 = i + 1
    const y3 = kDistances[i + 1]

    // Calculate vectors
    const v1x = x2 - x1
    const v1y = y2 - y1
    const v2x = x3 - x2
    const v2y = y3 - y2

    // Normalize vectors
    const v1Mag = Math.sqrt(v1x * v1x + v1y * v1y)
    const v2Mag = Math.sqrt(v2x * v2x + v2y * v2y)

    const v1xNorm = v1x / v1Mag
    const v1yNorm = v1y / v1Mag
    const v2xNorm = v2x / v2Mag
    const v2yNorm = v2y / v2Mag

    // Calculate dot product and angle
    const dotProduct = v1xNorm * v2xNorm + v1yNorm * v2yNorm
    const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)))

    if (angle > maxCurvature) {
      maxCurvature = angle
      optimalEpsilonIndex = i
    }
  }

  return kDistances[optimalEpsilonIndex]
}
