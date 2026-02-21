import { openai } from "@ai-sdk/openai"
import { embed } from "ai"

export interface EmbeddingDiagnosticResult {
  inputText: string
  truncatedInput?: string
  embeddingLength: number
  embeddingSample: number[]
  processingTimeMs: number
  error?: string
}

export async function diagnoseEmbedding(text: string): Promise<EmbeddingDiagnosticResult> {
  try {
    // Check if text is too long (OpenAI has token limits)
    const estimatedTokens = Math.ceil(text.length / 4) // Rough estimate
    let truncatedInput: string | undefined

    if (estimatedTokens > 8000) {
      // Truncate to approximately 8000 tokens
      truncatedInput = text.slice(0, 32000) // ~8000 tokens
    }

    const inputToProcess = truncatedInput || text

    const startTime = Date.now()

    // Try to generate embedding
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: inputToProcess,
    })

    const endTime = Date.now()

    return {
      inputText: text,
      truncatedInput,
      embeddingLength: embedding.length,
      embeddingSample: embedding.slice(0, 5), // Just show first 5 values
      processingTimeMs: endTime - startTime,
    }
  } catch (error) {
    return {
      inputText: text,
      embeddingLength: 0,
      embeddingSample: [],
      processingTimeMs: 0,
      error: `Embedding generation failed: ${(error as Error).message}`,
    }
  }
}

export async function batchDiagnoseEmbeddings(texts: string[]): Promise<EmbeddingDiagnosticResult[]> {
  const results = []

  for (const text of texts) {
    results.push(await diagnoseEmbedding(text))
  }

  return results
}
