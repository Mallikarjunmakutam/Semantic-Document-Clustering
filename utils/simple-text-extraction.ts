import fs from "fs"

export interface ExtractedDocument {
  content: string
  metadata: {
    source: string
    format: string
    pageCount?: number
  }
  error?: string
}

export async function extractTextFromFile(filePath: string): Promise<ExtractedDocument> {
  try {
    const format = filePath.split(".").pop()?.toLowerCase()
    let content = ""
    const metadata: any = { source: filePath, format }

    // For simplicity, we'll just read the files as text
    // In a production environment, you'd want to use proper parsers for each format
    try {
      content = fs.readFileSync(filePath, "utf8")

      // Basic format-specific processing
      if (format === "json") {
        try {
          const jsonData = JSON.parse(content)
          // Extract text from JSON (simplified approach)
          content = JSON.stringify(jsonData, null, 2)
        } catch (e) {
          // If JSON parsing fails, keep the original content
        }
      }

      // For binary formats like PDF and DOCX, we'd normally use specialized libraries
      // Here we'll just indicate that proper extraction would be needed
      if (["pdf", "docx"].includes(format || "")) {
        content = `[This is a ${format?.toUpperCase()} file. In a production environment, a specialized parser would extract the text content.]`
      }
    } catch (e) {
      throw new Error(`Failed to read file: ${(e as Error).message}`)
    }

    return { content, metadata }
  } catch (error) {
    return {
      content: "",
      metadata: { source: filePath, format: filePath.split(".").pop()?.toLowerCase() },
      error: `Failed to extract text: ${(error as Error).message}`,
    }
  }
}
