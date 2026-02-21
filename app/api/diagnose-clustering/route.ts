import { type NextRequest, NextResponse } from "next/server"
import { diagnoseKMeansClustering, diagnoseDBSCANClustering } from "@/utils/clustering-diagnostics"

export async function POST(request: NextRequest) {
  try {
    const { vectors, algorithm, parameters } = await request.json()

    if (!vectors || !Array.isArray(vectors) || vectors.length === 0) {
      return NextResponse.json({ error: "No vectors provided" }, { status: 400 })
    }

    if (!algorithm) {
      return NextResponse.json({ error: "No algorithm specified" }, { status: 400 })
    }

    let result

    switch (algorithm.toLowerCase()) {
      case "kmeans":
        result = await diagnoseKMeansClustering(vectors, parameters?.k || 3, parameters?.maxIterations || 10)
        break

      case "dbscan":
        result = await diagnoseDBSCANClustering(vectors, parameters?.eps || 0.5, parameters?.minPts || 5)
        break

      default:
        return NextResponse.json({ error: `Unsupported algorithm: ${algorithm}` }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in diagnose-clustering:", error)
    return NextResponse.json({ error: `Failed to diagnose clustering: ${(error as Error).message}` }, { status: 500 })
  }
}
