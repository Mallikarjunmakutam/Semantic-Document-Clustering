import {
  createSemanticVectors,
  calculateSemanticSimilarity,
  generateClusterName,
  extractKeyTopics,
} from "./semantic-analysis"

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
 * K-means clustering using semantic vectors
 */
export function semanticKMeans(documents: string[], k = 3, maxIterations = 100): ClusteringResult {
  if (documents.length === 0) {
    return {
      clusters: {},
      centroids: [],
      silhouetteScore: 0,
      algorithm: "Semantic K-means",
      algorithmDetails: { k, iterations: 0 },
    }
  }

  // Handle case where we have fewer documents than k
  if (documents.length < k) {
    k = documents.length
  }

  // Create semantic vectors for all documents
  const vectors = createSemanticVectors(documents)
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
        // Calculate cosine distance (1 - similarity)
        let similarity = 0
        for (let d = 0; d < dimension; d++) {
          similarity += vectors[j][d] * centroid[d]
        }
        const dist = 1 - similarity
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
          // Calculate cosine distance
          let similarity = 0
          for (let d = 0; d < dimension; d++) {
            similarity += vectors[j][d] * centroid[d]
          }
          const dist = 1 - similarity
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
        // Calculate cosine distance
        let similarity = 0
        for (let d = 0; d < dimension; d++) {
          similarity += vectors[i][d] * centroids[j][d]
        }
        const dist = 1 - similarity

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
      let similarity = 0
      for (let d = 0; d < dimension; d++) {
        similarity += centroids[i][d] * newCentroid[d]
      }
      const centroidDist = 1 - similarity

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
  const silhouetteScore = calculateSilhouetteScore(documents, vectors, clusters)

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
    algorithm: "Semantic K-means",
    algorithmDetails: {
      k,
      iterations,
      clusterCount: Object.keys(clusters).length,
    },
  }
}

/**
 * DBSCAN clustering using semantic similarity
 */
export function semanticDBSCAN(
  documents: string[],
  epsilon = 0.3, // Similarity threshold (higher means more similar)
  minPoints = 3,
): ClusteringResult {
  if (documents.length === 0) {
    return {
      clusters: {},
      silhouetteScore: 0,
      algorithm: "Semantic DBSCAN",
      algorithmDetails: { epsilon, minPoints },
    }
  }

  // Create semantic vectors
  const vectors = createSemanticVectors(documents)

  // Initialize variables
  const visited = new Array(documents.length).fill(false)
  const noise: number[] = []
  const clusters: { [key: number]: number[] } = {}
  let clusterIdx = 0

  // Helper function to get neighbors within epsilon similarity
  function getNeighbors(pointIdx: number): number[] {
    const neighbors: number[] = []

    for (let i = 0; i < documents.length; i++) {
      // Calculate semantic similarity directly between documents
      const similarity = calculateSemanticSimilarity(documents[pointIdx], documents[i])

      // Higher similarity (above epsilon) means they are neighbors
      if (similarity >= epsilon) {
        neighbors.push(i)
      }
    }

    return neighbors
  }

  // Main DBSCAN algorithm
  for (let i = 0; i < documents.length; i++) {
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
  const silhouetteScore = calculateSilhouetteScore(documents, vectors, clusters)

  return {
    clusters,
    silhouetteScore,
    algorithm: "Semantic DBSCAN",
    algorithmDetails: {
      epsilon,
      minPoints,
      noisePoints: noise.length,
      clusterCount: Object.keys(clusters).length,
    },
  }
}

/**
 * Calculate silhouette score using semantic similarity
 */
function calculateSilhouetteScore(
  documents: string[],
  vectors: number[][],
  clusters: { [key: number]: number[] },
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
      let intraClusterSim = 0

      for (const otherPointIdx of clusterPoints) {
        if (pointIdx !== otherPointIdx) {
          // Use semantic similarity
          const similarity = calculateSemanticSimilarity(documents[pointIdx], documents[otherPointIdx])
          intraClusterSim += similarity
        }
      }

      const a = clusterPoints.length > 1 ? 1 - intraClusterSim / (clusterPoints.length - 1) : 0

      // Calculate b(i) - minimum average distance to points in different cluster
      let minInterClusterDist = Number.POSITIVE_INFINITY

      for (const otherClusterId in clusters) {
        if (otherClusterId !== clusterId) {
          const otherClusterPoints = clusters[otherClusterId]
          let interClusterSim = 0

          for (const otherPointIdx of otherClusterPoints) {
            // Use semantic similarity
            const similarity = calculateSemanticSimilarity(documents[pointIdx], documents[otherPointIdx])
            interClusterSim += similarity
          }

          const avgSim = otherClusterPoints.length > 0 ? interClusterSim / otherClusterPoints.length : 0
          const dist = 1 - avgSim
          minInterClusterDist = Math.min(minInterClusterDist, dist)
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
 * Find optimal parameters for semantic clustering
 */
export function findOptimalParameters(documents: string[]): { k: number; epsilon: number; minPoints: number } {
  // Default values
  const k = Math.min(Math.max(2, Math.ceil(Math.sqrt(documents.length / 2))), 10)
  let epsilon = 0.3
  const minPoints = Math.max(2, Math.min(4, Math.floor(documents.length / 10)))

  // For small document sets, we can try different parameters
  if (documents.length < 50) {
    // Calculate pairwise similarities
    const similarities: number[] = []

    for (let i = 0; i < documents.length; i++) {
      for (let j = i + 1; j < documents.length; j++) {
        similarities.push(calculateSemanticSimilarity(documents[i], documents[j]))
      }
    }

    // Sort similarities
    similarities.sort((a, b) => a - b)

    // Find a good epsilon value (at around 25th percentile)
    const idx = Math.floor(similarities.length * 0.25)
    if (idx < similarities.length) {
      epsilon = similarities[idx]
    }
  }

  return { k, epsilon, minPoints }
}

/**
 * Generate cluster summaries with semantic information
 */
export function generateClusterSummaries(
  documents: string[],
  clusters: { [key: number]: number[] },
): Record<string, any> {
  const summaries: Record<string, any> = {}

  for (const clusterId in clusters) {
    const clusterDocs = clusters[clusterId]

    // Skip empty clusters
    if (clusterDocs.length === 0) continue

    // Generate a name based on common topics
    const name = generateClusterName(documents, clusterDocs)

    // Extract documents in this cluster
    const clusterDocTexts = clusterDocs.map((idx) => documents[idx])

    // Concatenate all texts in the cluster
    const combinedText = clusterDocTexts.join(" ")

    // Extract key topics
    const topTerms = extractKeyTopics(combinedText, 8)

    // Calculate coherence (average similarity within cluster)
    let coherence = 0
    let pairCount = 0

    for (let i = 0; i < clusterDocs.length; i++) {
      for (let j = i + 1; j < clusterDocs.length; j++) {
        coherence += calculateSemanticSimilarity(documents[clusterDocs[i]], documents[clusterDocs[j]])
        pairCount++
      }
    }

    coherence = pairCount > 0 ? coherence / pairCount : 0.7

    summaries[clusterId] = {
      name,
      size: clusterDocs.length,
      coherence,
      topTerms,
    }
  }

  return summaries
}
