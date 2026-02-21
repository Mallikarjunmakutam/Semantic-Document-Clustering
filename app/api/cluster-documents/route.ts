import { NextResponse } from "next/server"

// Main API route handler
export async function POST(request: Request) {
  try {
    console.log("Received clustering request")

    // Parse the request body
    let documents
    try {
      const body = await request.json()
      documents = body.documents
      console.log(`Received ${documents?.length || 0} documents`)
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json(
        {
          error: "Invalid request format",
          details: "Could not parse request body",
        },
        { status: 400 },
      )
    }

    // Validate documents
    if (!documents || !Array.isArray(documents)) {
      console.error("Documents must be provided as an array")
      return NextResponse.json(
        {
          error: "Documents must be provided as an array",
        },
        { status: 400 },
      )
    }

    if (documents.length < 2) {
      console.error("At least 2 documents are required for clustering")
      return NextResponse.json(
        {
          error: "At least 2 documents are required for clustering",
        },
        { status: 400 },
      )
    }

    // Filter out non-text content
    console.log("Filtering non-text content")
    const textDocuments = documents.filter((doc, idx) => {
      if (doc == null) {
        console.log(`[v0] Document ${idx}: null or undefined`)
        return false
      }
      if (typeof doc !== "string") {
        console.log(`[v0] Document ${idx}: not a string (type: ${typeof doc})`)
        return false
      }
      
      const isBinary = isLikelyBinaryData(doc)
      const isWhitespace = /^\s*$/.test(doc)
      const isTooShort = doc.length < 10
      
      console.log(`[v0] Document ${idx}: length=${doc.length}, binary=${isBinary}, whitespace=${isWhitespace}, tooShort=${isTooShort}`)
      
      // Accept documents that have at least 10 characters and are not binary/whitespace
      return doc.length >= 10 && !isWhitespace && !isBinary
    })

    console.log(`[v0] After filtering: ${textDocuments.length} text documents (started with ${documents.length})`)

    if (textDocuments.length < 2) {
      console.error("Not enough valid text documents for clustering")
      return NextResponse.json(
        {
          error: "At least 2 valid text documents are required for clustering",
          filteredCount: documents.length - textDocuments.length,
        },
        { status: 400 },
      )
    }

    // Generate semantic embeddings using pure JavaScript
    console.log("Generating semantic embeddings...")
    const embeddings = generateSemanticEmbeddings(textDocuments)
    console.log(`Generated ${embeddings.length} embeddings`)

    // Extract key terms for each document
    console.log("Extracting key terms from documents...")
    const documentKeyTerms = textDocuments.map((doc, index) => extractKeyTerms(textDocuments, index))

    // Run clustering algorithms
    console.log("Running clustering algorithms...")
    const clusteringResult = runOptimalClustering(embeddings, textDocuments.length)
    console.log(`Clustering complete. Algorithm used: ${clusteringResult.algorithm}`)

    const { clusters, clusterCoherence, silhouetteScore, algorithm, algorithmDetails } = clusteringResult

    // Generate cluster summaries and names with advanced labeling
    console.log("Generating cluster summaries...")
    const clusterSummaries: Record<string, any> = {}

    for (const clusterId in clusters) {
      const docIndices = clusters[clusterId]
      
      // Extract all terms from cluster documents
      const allTerms: Record<string, number> = {}
      const clusterTexts = docIndices.map(idx => textDocuments[idx])
      
      for (const docIdx of docIndices) {
        for (const term of documentKeyTerms[docIdx]) {
          allTerms[term] = (allTerms[term] || 0) + 1
        }
      }

      const topTerms = Object.entries(allTerms)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([term]) => term)

      // Generate intelligent cluster label based on document content
      const clusterLabel = generateClusterLabel(clusterTexts, topTerms, allTerms)

      clusterSummaries[clusterId] = {
        name: clusterLabel,
        label: clusterLabel,
        size: docIndices.length,
        coherence: clusterCoherence[clusterId],
        topTerms: topTerms,
        description: `${docIndices.length} document${docIndices.length > 1 ? "s" : ""} related to ${clusterLabel.toLowerCase()}`,
      }
    }

    // Ensure all cluster labels are unique
    const labelCounts: Record<string, number> = {}
    const updatedSummaries = { ...clusterSummaries }

    for (const [clusterId, summary] of Object.entries(clusterSummaries)) {
      const label = summary.label || summary.name
      if (labelCounts[label]) {
        labelCounts[label]++
        updatedSummaries[clusterId] = {
          ...summary,
          label: `${label} (${labelCounts[label]})`,
          name: `${summary.name} (${labelCounts[label]})`,
        }
      } else {
        labelCounts[label] = 1
      }
    }

    console.log("Returning clustering results")
    return NextResponse.json({
      clusters,
      clusterSummaries: updatedSummaries,
      documentKeyTerms,
      silhouetteScore,
      algorithm,
      algorithmDetails,
    })
  } catch (error) {
    console.error("Unhandled error processing documents:", error)
    return NextResponse.json(
      {
        error: "Failed to process documents",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

// Check if content is likely binary data
function isLikelyBinaryData(content: string): boolean {
  try {
    if (
      content.startsWith("data:") ||
      content.startsWith("PK") ||
      content.startsWith("%PDF") ||
      /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/.test(content.substring(0, 100))
    ) {
      return true
    }

    if (
      content.includes("File:") &&
      content.includes("Type:") &&
      content.includes("Size:") &&
      content.split("\n").length < 10
    ) {
      return true
    }

    return false
  } catch (error) {
    console.error("Error in isLikelyBinaryData:", error)
    return true
  }
}

// Pure JavaScript semantic embedding generation
function generateSemanticEmbeddings(documents: string[]): number[][] {
  const embeddings: number[][] = []

  // Topic patterns for semantic analysis
  const topicPatterns: Record<string, RegExp[]> = {
    "Machine Learning": [
      /\b(machine learning|ml|artificial intelligence|ai|neural network|deep learning|supervised|unsupervised|reinforcement learning|algorithm|model training|prediction|classification|regression)\b/gi,
    ],
    "Natural Language Processing": [
      /\b(nlp|natural language processing|text analysis|sentiment analysis|language model|tokenization|parsing|linguistics|text mining|speech recognition)\b/gi,
    ],
    "Web Development": [
      /\b(web development|frontend|backend|html|css|javascript|react|angular|vue|node\.?js|api|rest|graphql|responsive design)\b/gi,
    ],
    "Data Science": [
      /\b(data science|data analysis|statistics|visualization|pandas|numpy|python|r programming|big data|analytics|insights)\b/gi,
    ],
    "Software Engineering": [
      /\b(software engineering|programming|coding|development|software architecture|design patterns|testing|debugging|version control|git)\b/gi,
    ],
    Database: [
      /\b(database|sql|nosql|mongodb|postgresql|mysql|data storage|query|indexing|normalization|crud operations)\b/gi,
    ],
    Business: [
      /\b(business|strategy|management|marketing|sales|revenue|profit|customer|market|competition|growth)\b/gi,
    ],
    Finance: [/\b(finance|financial|investment|banking|trading|portfolio|risk|return|economics|market analysis)\b/gi],
    Healthcare: [
      /\b(healthcare|medical|health|patient|clinical|diagnosis|treatment|therapy|medicine|pharmaceutical)\b/gi,
    ],
    Education: [/\b(education|learning|teaching|academic|curriculum|student|instructor|course|training|knowledge)\b/gi],
  }

  // Semantic word relationships
  const semanticRelationships: Record<string, string[]> = {
    algorithm: ["method", "technique", "approach", "procedure", "process", "strategy"],
    programming: ["coding", "development", "software", "computer", "technology"],
    "machine learning": ["ai", "artificial intelligence", "neural network", "deep learning", "data science"],
    nlp: ["natural language processing", "text analysis", "linguistics", "language model"],
    database: ["data", "storage", "sql", "query", "information"],
    web: ["internet", "website", "online", "browser", "html", "css", "javascript"],
    business: ["company", "enterprise", "organization", "corporate", "commercial"],
    finance: ["money", "financial", "economic", "investment", "banking"],
    research: ["study", "analysis", "investigation", "experiment", "academic"],
    science: ["scientific", "theory", "hypothesis", "methodology", "empirical"],
  }

  for (const doc of documents) {
    const vector = new Array(50).fill(0) // 50-dimensional vector
    const normalizedDoc = doc.toLowerCase()
    const words = normalizedDoc.split(/\s+/).filter((word) => word.length > 2)

    let vectorIndex = 0

    // 1. Basic document features (10 dimensions)
    vector[vectorIndex++] = Math.log(doc.length + 1) / 10
    vector[vectorIndex++] = words.length / 100
    vector[vectorIndex++] = (doc.match(/[.!?]/g) || []).length / 10
    vector[vectorIndex++] = (doc.match(/\n/g) || []).length / 5
    vector[vectorIndex++] = (doc.match(/\d+/g) || []).length / 10
    vector[vectorIndex++] = (doc.match(/[A-Z][a-z]+/g) || []).length / 20
    vector[vectorIndex++] = words.filter((w) => w.length > 8).length / 10
    vector[vectorIndex++] = (doc.match(/[(),;:]/g) || []).length / 20
    vector[vectorIndex++] = new Set(words).size / words.length || 0
    vector[vectorIndex++] = words.filter((w) => /ing$|tion$|ment$/.test(w)).length / 10

    // 2. Topic-based features (20 dimensions)
    for (const [topic, patterns] of Object.entries(topicPatterns)) {
      if (vectorIndex >= 30) break
      let score = 0
      for (const pattern of patterns) {
        const matches = doc.match(pattern) || []
        score += matches.length
      }
      vector[vectorIndex++] = Math.min(1, score / 5)
    }

    // 3. Semantic relationship features (20 dimensions)
    for (const [concept, relatedTerms] of Object.entries(semanticRelationships)) {
      if (vectorIndex >= 50) break
      let score = 0

      // Check if concept appears
      if (normalizedDoc.includes(concept)) score += 2

      // Check related terms
      for (const term of relatedTerms) {
        if (normalizedDoc.includes(term)) score += 1
      }

      vector[vectorIndex++] = Math.min(1, score / 5)
    }

    // Normalize the vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude
      }
    }

    embeddings.push(vector)
  }

  return embeddings
}

// Run optimal clustering algorithm
function runOptimalClustering(embeddings: number[][], documentCount: number) {
  const k = Math.min(Math.max(2, Math.ceil(Math.sqrt(documentCount / 2))), 10)

  // Calculate average distance for DBSCAN
  let avgDistance = 0
  let pairCount = 0

  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      avgDistance += cosineSimilarityDistance(embeddings[i], embeddings[j])
      pairCount++
    }
  }

  avgDistance = pairCount > 0 ? avgDistance / pairCount : 0.5
  const epsilon = avgDistance * 1.5
  const minPts = Math.max(2, Math.min(4, Math.floor(documentCount / 10)))

  // Run both algorithms
  const kmeansResult = runKMeans(embeddings, k)
  const dbscanResult = runDBSCAN(embeddings, epsilon, minPts)

  // Choose the better algorithm
  if (dbscanResult.silhouetteScore > kmeansResult.silhouetteScore) {
    return {
      ...dbscanResult,
      algorithm: "DBSCAN",
      algorithmDetails: {
        epsilon,
        minPts,
        clusterCount: Object.keys(dbscanResult.clusters).length,
      },
    }
  } else {
    return {
      ...kmeansResult,
      algorithm: "K-means",
      algorithmDetails: {
        k,
        iterations: kmeansResult.iterations,
        clusterCount: Object.keys(kmeansResult.clusters).length,
      },
    }
  }
}

// K-means clustering implementation
function runKMeans(vectors: number[][], k: number, maxIterations = 20) {
  if (vectors.length < k) {
    k = vectors.length
  }

  // Initialize centroids randomly
  const centroids: number[][] = []
  const used = new Set<number>()

  // Choose first centroid randomly
  const firstIndex = Math.floor(Math.random() * vectors.length)
  centroids.push([...vectors[firstIndex]])
  used.add(firstIndex)

  // Choose remaining centroids using k-means++
  while (centroids.length < k) {
    const distances: number[] = []
    let totalDistance = 0

    for (let i = 0; i < vectors.length; i++) {
      if (used.has(i)) continue

      let minDist = Number.POSITIVE_INFINITY
      for (const centroid of centroids) {
        const dist = cosineSimilarityDistance(vectors[i], centroid)
        minDist = Math.min(minDist, dist)
      }
      distances.push(minDist * minDist)
      totalDistance += distances[distances.length - 1]
    }

    if (totalDistance === 0) break

    const threshold = Math.random() * totalDistance
    let sum = 0
    let nextIndex = -1
    let distanceIndex = 0

    for (let i = 0; i < vectors.length; i++) {
      if (used.has(i)) continue

      sum += distances[distanceIndex]
      if (sum >= threshold) {
        nextIndex = i
        break
      }
      distanceIndex++
    }

    if (nextIndex === -1) {
      const remaining = Array.from({ length: vectors.length }, (_, i) => i).filter((i) => !used.has(i))
      if (remaining.length === 0) break
      nextIndex = remaining[0]
    }

    centroids.push([...vectors[nextIndex]])
    used.add(nextIndex)
  }

  let bestClusters: { [key: number]: number[] } = {}
  let bestSilhouette = -1
  let iterations = 0

  for (let iter = 0; iter < maxIterations; iter++) {
    iterations = iter + 1
    const clusters: { [key: number]: number[] } = {}

    // Initialize clusters
    for (let i = 0; i < k; i++) {
      clusters[i] = []
    }

    // Assign points to nearest centroid
    for (let i = 0; i < vectors.length; i++) {
      let minDist = Number.POSITIVE_INFINITY
      let bestCentroid = 0

      for (let j = 0; j < centroids.length; j++) {
        const dist = cosineSimilarityDistance(vectors[i], centroids[j])
        if (dist < minDist) {
          minDist = dist
          bestCentroid = j
        }
      }

      clusters[bestCentroid].push(i)
    }

    // Update centroids
    for (let i = 0; i < k; i++) {
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

    // Calculate silhouette score
    const silhouetteScore = calculateSilhouetteScore(vectors, clusters)

    if (silhouetteScore > bestSilhouette) {
      bestSilhouette = silhouetteScore
      bestClusters = JSON.parse(JSON.stringify(clusters))
    }
  }

  // Calculate cluster coherence
  const clusterCoherence: Record<number, number> = {}
  for (const clusterId in bestClusters) {
    const clusterPoints = bestClusters[clusterId]
    if (clusterPoints.length <= 1) {
      clusterCoherence[clusterId] = 1.0
      continue
    }

    let totalSimilarity = 0
    let pairCount = 0

    for (let i = 0; i < clusterPoints.length; i++) {
      for (let j = i + 1; j < clusterPoints.length; j++) {
        totalSimilarity += cosineSimilarity(vectors[clusterPoints[i]], vectors[clusterPoints[j]])
        pairCount++
      }
    }

    clusterCoherence[clusterId] = pairCount > 0 ? totalSimilarity / pairCount : 0
  }

  return {
    clusters: bestClusters,
    clusterCoherence,
    silhouetteScore: bestSilhouette,
    iterations,
  }
}

// DBSCAN clustering implementation
function runDBSCAN(vectors: number[][], eps: number, minPts: number) {
  const n = vectors.length
  const visited = new Array(n).fill(false)
  const noise = []
  const clusters: { [key: number]: number[] } = {}
  let clusterIdx = 0

  function getNeighbors(pointIdx: number): number[] {
    const neighbors = []
    for (let i = 0; i < n; i++) {
      if (cosineSimilarityDistance(vectors[pointIdx], vectors[i]) <= eps) {
        neighbors.push(i)
      }
    }
    return neighbors
  }

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue

    visited[i] = true
    const neighbors = getNeighbors(i)

    if (neighbors.length < minPts) {
      noise.push(i)
      continue
    }

    clusters[clusterIdx] = [i]

    let j = 0
    while (j < neighbors.length) {
      const currentPoint = neighbors[j]

      if (!visited[currentPoint]) {
        visited[currentPoint] = true
        const currentNeighbors = getNeighbors(currentPoint)

        if (currentNeighbors.length >= minPts) {
          for (const neighbor of currentNeighbors) {
            if (!neighbors.includes(neighbor)) {
              neighbors.push(neighbor)
            }
          }
        }
      }

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
      for (let i = 0; i < noise.length; i++) {
        clusters[clusterIdx + i] = [noise[i]]
      }
    } else {
      clusters[clusterIdx] = [...noise]
    }
  }

  const silhouetteScore = calculateSilhouetteScore(vectors, clusters)

  // Calculate cluster coherence
  const clusterCoherence: Record<number, number> = {}
  for (const clusterId in clusters) {
    const clusterPoints = clusters[clusterId]
    if (clusterPoints.length <= 1) {
      clusterCoherence[clusterId] = 1.0
      continue
    }

    let totalSimilarity = 0
    let pairCount = 0

    for (let i = 0; i < clusterPoints.length; i++) {
      for (let j = i + 1; j < clusterPoints.length; j++) {
        totalSimilarity += cosineSimilarity(vectors[clusterPoints[i]], vectors[clusterPoints[j]])
        pairCount++
      }
    }

    clusterCoherence[clusterId] = pairCount > 0 ? totalSimilarity / pairCount : 0
  }

  return {
    clusters,
    clusterCoherence,
    silhouetteScore,
  }
}

// Calculate silhouette score
function calculateSilhouetteScore(vectors: number[][], clusters: { [key: number]: number[] }): number {
  const clusterCount = Object.keys(clusters).length
  if (clusterCount <= 1) return 0

  let totalSilhouette = 0
  let totalPoints = 0

  for (const clusterId in clusters) {
    const clusterPoints = clusters[clusterId]

    for (const pointIdx of clusterPoints) {
      let intraClusterDist = 0

      for (const otherPointIdx of clusterPoints) {
        if (pointIdx !== otherPointIdx) {
          intraClusterDist += cosineSimilarityDistance(vectors[pointIdx], vectors[otherPointIdx])
        }
      }

      const a = clusterPoints.length > 1 ? intraClusterDist / (clusterPoints.length - 1) : 0

      let minInterClusterDist = Number.POSITIVE_INFINITY

      for (const otherClusterId in clusters) {
        if (otherClusterId !== clusterId) {
          const otherClusterPoints = clusters[otherClusterId]
          let interClusterDist = 0

          for (const otherPointIdx of otherClusterPoints) {
            interClusterDist += cosineSimilarityDistance(vectors[pointIdx], vectors[otherPointIdx])
          }

          const avgDist =
            otherClusterPoints.length > 0 ? interClusterDist / otherClusterPoints.length : Number.POSITIVE_INFINITY
          minInterClusterDist = Math.min(minInterClusterDist, avgDist)
        }
      }

      const b = minInterClusterDist

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

// Cosine similarity functions
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) return 0
  return dotProduct / (normA * normB)
}

function cosineSimilarityDistance(a: number[], b: number[]): number {
  return 1 - cosineSimilarity(a, b)
}

// Extract key terms using TF-IDF
function extractKeyTerms(documents: string[], docIndex: number, count = 8): string[] {
  try {
    const normalizedDocs = documents.map((doc) =>
      doc
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )

    const currentDoc = normalizedDocs[docIndex]

    const stopWords = new Set([
      "a",
      "about",
      "above",
      "after",
      "again",
      "against",
      "all",
      "am",
      "an",
      "and",
      "any",
      "are",
      "aren't",
      "as",
      "at",
      "be",
      "because",
      "been",
      "before",
      "being",
      "below",
      "between",
      "both",
      "but",
      "by",
      "can't",
      "cannot",
      "could",
      "couldn't",
      "did",
      "didn't",
      "do",
      "does",
      "doesn't",
      "doing",
      "don't",
      "down",
      "during",
      "each",
      "few",
      "for",
      "from",
      "further",
      "had",
      "hadn't",
      "has",
      "hasn't",
      "have",
      "haven't",
      "having",
      "he",
      "he'd",
      "he'll",
      "he's",
      "her",
      "here",
      "here's",
      "hers",
      "herself",
      "him",
      "himself",
      "his",
      "how",
      "how's",
      "i",
      "i'd",
      "i'll",
      "i'm",
      "i've",
      "if",
      "in",
      "into",
      "is",
      "isn't",
      "it",
      "it's",
      "its",
      "itself",
      "let's",
      "me",
      "more",
      "most",
      "mustn't",
      "my",
      "myself",
      "no",
      "nor",
      "not",
      "of",
      "off",
      "on",
      "once",
      "only",
      "or",
      "other",
      "ought",
      "our",
      "ours",
      "ourselves",
      "out",
      "over",
      "own",
      "same",
      "shan't",
      "she",
      "she'd",
      "she'll",
      "she's",
      "should",
      "shouldn't",
      "so",
      "some",
      "such",
      "than",
      "that",
      "that's",
      "the",
      "their",
      "theirs",
      "them",
      "themselves",
      "then",
      "there",
      "there's",
      "these",
      "they",
      "they'd",
      "they'll",
      "they're",
      "they've",
      "this",
      "those",
      "through",
      "to",
      "too",
      "under",
      "until",
      "up",
      "very",
      "was",
      "wasn't",
      "we",
      "we'd",
      "we'll",
      "we're",
      "we've",
      "were",
      "weren't",
      "what",
      "what's",
      "when",
      "when's",
      "where",
      "where's",
      "which",
      "while",
      "who",
      "who's",
      "whom",
      "why",
      "why's",
      "with",
      "won't",
      "would",
      "wouldn't",
      "you",
      "you'd",
      "you'll",
      "you're",
      "you've",
      "your",
      "yours",
      "yourself",
      "yourselves",
    ])

    const allWords = normalizedDocs.map((doc) =>
      doc.split(/\s+/).filter((word) => !stopWords.has(word) && word.length > 2),
    )

    const currentWords = allWords[docIndex]
    if (!currentWords || currentWords.length === 0) {
      return []
    }

    const tf: Record<string, number> = {}
    for (const word of currentWords) {
      tf[word] = (tf[word] || 0) + 1
    }

    const idf: Record<string, number> = {}
    const docCount = documents.length
    const uniqueWords = new Set(currentWords)

    for (const word of uniqueWords) {
      let docsWithWord = 0
      for (const docWords of allWords) {
        if (docWords.includes(word)) {
          docsWithWord++
        }
      }
      idf[word] = Math.log(docCount / (docsWithWord || 1))
    }

    const tfidf: Record<string, number> = {}
    for (const word of uniqueWords) {
      tfidf[word] = (tf[word] || 0) * (idf[word] || 0)
    }

    return Object.entries(tfidf)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map((entry) => entry[0])
  } catch (error) {
    console.error("Error extracting key terms:", error)
    return []
  }
}

// Generate cluster names
function generateClusterName(documents: string[], clusterDocs: number[]): string {
  if (clusterDocs.length === 0) return "Empty Cluster"

  try {
    const allText = clusterDocs.map((idx) => documents[idx]).join(" ")
    const normalizedText = allText
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    const stopWords = new Set([
      "a",
      "about",
      "above",
      "after",
      "again",
      "against",
      "all",
      "am",
      "an",
      "and",
      "any",
      "are",
      "aren't",
      "as",
      "at",
      "be",
      "because",
      "been",
      "before",
      "being",
      "below",
      "between",
      "both",
      "but",
      "by",
      "can't",
      "cannot",
      "could",
      "couldn't",
      "did",
      "didn't",
      "do",
      "does",
      "doesn't",
      "doing",
      "don't",
      "down",
      "during",
      "each",
      "few",
      "for",
      "from",
      "further",
      "had",
      "hadn't",
      "has",
      "hasn't",
      "have",
      "haven't",
      "having",
      "he",
      "he'd",
      "he'll",
      "he's",
      "her",
      "here",
      "here's",
      "hers",
      "herself",
      "him",
      "himself",
      "his",
      "how",
      "how's",
      "i",
      "i'd",
      "i'll",
      "i'm",
      "i've",
      "if",
      "in",
      "into",
      "is",
      "isn't",
      "it",
      "it's",
      "its",
      "itself",
      "let's",
      "me",
      "more",
      "most",
      "mustn't",
      "my",
      "myself",
      "no",
      "nor",
      "not",
      "of",
      "off",
      "on",
      "once",
      "only",
      "or",
      "other",
      "ought",
      "our",
      "ours",
      "ourselves",
      "out",
      "over",
      "own",
      "same",
      "shan't",
      "she",
      "she'd",
      "she'll",
      "she's",
      "should",
      "shouldn't",
      "so",
      "some",
      "such",
      "than",
      "that",
      "that's",
      "the",
      "their",
      "theirs",
      "them",
      "themselves",
      "then",
      "there",
      "there's",
      "these",
      "they",
      "they'd",
      "they'll",
      "they're",
      "they've",
      "this",
      "those",
      "through",
      "to",
      "too",
      "under",
      "until",
      "up",
      "very",
      "was",
      "wasn't",
      "we",
      "we'd",
      "we'll",
      "we're",
      "we've",
      "were",
      "weren't",
      "what",
      "what's",
      "when",
      "when's",
      "where",
      "where's",
      "which",
      "while",
      "who",
      "who's",
      "whom",
      "why",
      "why's",
      "with",
      "won't",
      "would",
      "wouldn't",
      "you",
      "you'd",
      "you'll",
      "you're",
      "you've",
      "your",
      "yours",
      "yourself",
      "yourselves",
    ])

    const words = normalizedText.split(/\s+/).filter((word) => !stopWords.has(word) && word.length > 2)

    const wordFreq: Record<string, number> = {}
    for (const word of words) {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    }

    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((entry) => entry[0])

    if (topWords.length === 0) return "Miscellaneous"

    const formattedWords = topWords.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    return formattedWords.join(" & ")
  } catch (error) {
    console.error("Error generating cluster name:", error)
    return "Cluster"
  }
}

// Generate intelligent cluster label based on document content
function generateClusterLabel(clusterTexts: string[], topTerms: string[], allTerms: Record<string, number>): string {
  // Define semantic categories with expanded keywords for better coverage
  const categories: Record<string, { keywords: string[]; label: string }> = {
    Sports: {
      keywords: [
        "sports",
        "game",
        "team",
        "player",
        "match",
        "win",
        "coach",
        "league",
        "championship",
        "score",
        "football",
        "basketball",
        "baseball",
        "soccer",
        "tennis",
        "golf",
        "hockey",
        "athletic",
        "tournament",
      ],
      label: "Sports",
    },
    "Machine Learning": {
      keywords: [
        "machine learning",
        "algorithm",
        "model",
        "training",
        "neural",
        "network",
        "deep learning",
        "classification",
        "regression",
        "prediction",
        "ai",
        "artificial intelligence",
        "learning",
      ],
      label: "Machine Learning & AI",
    },
    "Natural Language Processing": {
      keywords: [
        "nlp",
        "natural language",
        "text",
        "language",
        "embedding",
        "sentiment",
        "tokenization",
        "parsing",
        "word",
        "corpus",
      ],
      label: "Natural Language Processing",
    },
    "Web Development": {
      keywords: [
        "web",
        "html",
        "css",
        "javascript",
        "react",
        "frontend",
        "backend",
        "api",
        "server",
        "client",
        "browser",
        "http",
        "node",
      ],
      label: "Web Development",
    },
    "Data Science": {
      keywords: [
        "data",
        "analysis",
        "statistics",
        "visualization",
        "dataset",
        "processing",
        "pandas",
        "numpy",
        "matplotlib",
        "analytics",
      ],
      label: "Data Science & Analytics",
    },
    "Computer Vision": {
      keywords: [
        "image",
        "vision",
        "computer vision",
        "detection",
        "recognition",
        "cnn",
        "visual",
        "pixel",
        "convolutional",
      ],
      label: "Computer Vision",
    },
    "Cloud & DevOps": {
      keywords: [
        "cloud",
        "docker",
        "kubernetes",
        "deployment",
        "aws",
        "azure",
        "infrastructure",
        "devops",
        "container",
      ],
      label: "Cloud & DevOps",
    },
    Database: {
      keywords: [
        "database",
        "sql",
        "nosql",
        "mongodb",
        "postgresql",
        "query",
        "table",
        "index",
        "schema",
      ],
      label: "Database & Storage",
    },
    Security: {
      keywords: [
        "security",
        "encryption",
        "authentication",
        "authorization",
        "vulnerability",
        "cryptography",
        "password",
        "firewall",
      ],
      label: "Security & Encryption",
    },
    Finance: {
      keywords: [
        "finance",
        "money",
        "bank",
        "investment",
        "stock",
        "trading",
        "market",
        "price",
        "financial",
      ],
      label: "Finance & Trading",
    },
    Healthcare: {
      keywords: [
        "health",
        "medical",
        "disease",
        "treatment",
        "hospital",
        "doctor",
        "patient",
        "medicine",
        "therapy",
        "clinical",
      ],
      label: "Healthcare & Medicine",
    },
    Education: {
      keywords: [
        "education",
        "learning",
        "student",
        "teacher",
        "school",
        "university",
        "course",
        "lesson",
        "academic",
      ],
      label: "Education & Learning",
    },
  }

  // Score each category based on term matches
  const categoryScores: Record<string, number> = {}
  const combinedText = clusterTexts.join(" ").toLowerCase()

  for (const [category, { keywords }] of Object.entries(categories)) {
    let score = 0

    for (const keyword of keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        // Weight by frequency
        const frequency = allTerms[keyword] || 0
        score += frequency > 0 ? frequency * 3 : 2
      }
    }

    // Bonus for top terms matching
    for (const term of topTerms) {
      const termLower = term.toLowerCase()
      if (keywords.some((k) => k.includes(termLower) || termLower.includes(k))) {
        score += 5
      }
    }

    if (score > 0) {
      categoryScores[category] = score
    }
  }

  // Find the best matching category with highest score
  const bestCategory = Object.entries(categoryScores).sort((a, b) => b[1] - a[1])[0]

  if (bestCategory && bestCategory[1] > 0) {
    return categories[bestCategory[0]].label
  }

  // Fallback: generate label from top terms
  if (topTerms.length > 0) {
    const mainTerms = topTerms
      .slice(0, 3)
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
      .filter((t) => t.length > 2)
    if (mainTerms.length > 0) {
      return `${mainTerms.join(", ")} Documents`
    }
  }

  return "Documents"
}
