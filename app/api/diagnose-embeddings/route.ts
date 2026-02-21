import { type NextRequest, NextResponse } from "next/server"
import { batchDiagnoseEmbeddings } from "@/utils/embedding-diagnostics"

export async function POST(request: NextRequest) {
  try {
    const { texts } = await request.json()

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: "No text samples provided" }, { status: 400 })
    }

    // Limit to 5 samples to prevent abuse
    const samplesToProcess = texts.slice(0, 5)

    // Diagnose embeddings
    const diagnostics = await batchDiagnoseEmbeddings(samplesToProcess)

    return NextResponse.json({
      diagnostics,
      processedSamples: samplesToProcess.length,
      totalSamples: texts.length,
    })
  } catch (error) {
    console.error("Error in diagnose-embeddings:", error)
    return NextResponse.json({ error: `Failed to diagnose embeddings: ${(error as Error).message}` }, { status: 500 })
  }
}
