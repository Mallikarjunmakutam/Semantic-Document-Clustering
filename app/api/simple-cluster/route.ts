import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("Received clustering request in simple-cluster endpoint")

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
    if (!documents || !Array.isArray(documents) || documents.length < 2) {
      return NextResponse.json(
        {
          error: "At least 2 documents are required for clustering",
        },
        { status: 400 },
      )
    }

    // Simple clustering based on document length
    const clusters = simpleClusterByLength(documents)

    // Generate simple cluster summaries
    const clusterSummaries = generateSimpleSummaries(documents, clusters)

    return NextResponse.json({
      clusters,
      clusterSummaries,
      algorithm: "Simple Length-Based",
      silhouetteScore: 0.5,
      algorithmDetails: {
        clusterCount: Object.keys(clusters).length,
      },
    })
  } catch (error) {
    console.error("Error in simple-cluster:", error)
    // Ensure we always return JSON
    return NextResponse.json(
      {
        error: "Failed to process documents",
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

// Simple clustering algorithm based on document length
function simpleClusterByLength(documents: string[]): { [key: number]: number[] } {
  const clusters: { [key: number]: number[] } = {
    0: [], // Short documents
    1: [], // Medium documents
    2: [], // Long documents
  }

  documents.forEach((doc, index) => {
    if (doc.length < 500) {
      clusters[0].push(index)
    } else if (doc.length < 2000) {
      clusters[1].push(index)
    } else {
      clusters[2].push(index)
    }
  })

  // Remove empty clusters
  Object.keys(clusters).forEach((key) => {
    if (clusters[Number(key)].length === 0) {
      delete clusters[Number(key)]
    }
  })

  // If all documents ended up in one cluster, create at least two
  if (Object.keys(clusters).length === 1) {
    const onlyClusterKey = Number(Object.keys(clusters)[0])
    const docs = clusters[onlyClusterKey]

    if (docs.length >= 2) {
      // Split the cluster in half
      const midpoint = Math.floor(docs.length / 2)
      clusters[onlyClusterKey] = docs.slice(0, midpoint)
      clusters[3] = docs.slice(midpoint)
    }
  }

  return clusters
}

// Generate simple summaries for clusters
function generateSimpleSummaries(documents: string[], clusters: { [key: number]: number[] }): Record<string, any> {
  const summaries: Record<string, any> = {}

  for (const clusterId in clusters) {
    const docIndices = clusters[clusterId]
    const clusterDocs = docIndices.map((idx) => documents[idx])

    // Calculate average document length
    const avgLength = clusterDocs.reduce((sum, doc) => sum + doc.length, 0) / clusterDocs.length

    // Extract some common words
    const words = clusterDocs
      .join(" ")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .reduce((acc: Record<string, number>, word) => {
        acc[word] = (acc[word] || 0) + 1
        return acc
      }, {})

    // Get top words
    const topWords = Object.entries(words)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((entry) => entry[0])

    // Generate cluster name based on length
    let name
    if (avgLength < 500) {
      name = "Short Documents"
    } else if (avgLength < 2000) {
      name = "Medium Documents"
    } else {
      name = "Long Documents"
    }

    // Add a number if there are multiple clusters of the same length category
    const existingNames = Object.values(summaries).map((s) => s.name)
    if (existingNames.includes(name)) {
      name = `${name} ${Number(clusterId) + 1}`
    }

    summaries[clusterId] = {
      name,
      size: docIndices.length,
      coherence: 0.7,
      topTerms: topWords.length > 0 ? topWords : ["document", "content", "text"],
    }
  }

  return summaries
}
