import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In a real implementation, this would check various system components
    // For this example, we'll return mock data

    const mockStatus = {
      fileProcessing: "healthy",
      embeddingGeneration: "warning",
      clustering: "error",
      overall: "error",
      lastChecked: new Date().toISOString(),
      issues: [
        {
          component: "Embedding Generation",
          severity: "warning",
          message: "Slow response times (>2s) for embedding generation",
        },
        {
          component: "Clustering",
          severity: "error",
          message: "K-means algorithm failing to converge with high-dimensional vectors",
        },
      ],
      metrics: {
        averageProcessingTime: 1.2, // seconds
        successRate: 0.85, // 85%
        errorRate: 0.15, // 15%
        totalDocumentsProcessed: 1250,
      },
    }

    return NextResponse.json(mockStatus)
  } catch (error) {
    console.error("Error in system-status:", error)
    return NextResponse.json({ error: `Failed to get system status: ${(error as Error).message}` }, { status: 500 })
  }
}
