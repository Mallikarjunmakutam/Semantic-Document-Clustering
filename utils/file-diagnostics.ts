import fs from "fs"
import path from "path"

export interface FileDiagnosticResult {
  filename: string
  size: number
  format: string
  isText: boolean
  encoding: string | null
  sample: string
  error?: string
}

export async function diagnoseFile(filePath: string): Promise<FileDiagnosticResult> {
  try {
    const stats = fs.statSync(filePath)
    const format = path.extname(filePath).toLowerCase()
    const filename = path.basename(filePath)

    // Check if file is too large (>10MB for this example)
    if (stats.size > 10 * 1024 * 1024) {
      return {
        filename,
        size: stats.size,
        format,
        isText: false,
        encoding: null,
        sample: "",
        error: "File exceeds size limit (10MB)",
      }
    }

    // Try to read the file as text
    let content: string
    let isText = true
    let encoding: string | null = "utf8"

    try {
      content = fs.readFileSync(filePath, { encoding: "utf8" })
    } catch (e) {
      isText = false
      encoding = null
      content = ""
    }

    // Get a sample of the content
    const sample = content.slice(0, 500)

    return {
      filename,
      size: stats.size,
      format,
      isText,
      encoding,
      sample,
    }
  } catch (error) {
    return {
      filename: path.basename(filePath),
      size: 0,
      format: "",
      isText: false,
      encoding: null,
      sample: "",
      error: `Error accessing file: ${(error as Error).message}`,
    }
  }
}

export async function batchDiagnoseFiles(filePaths: string[]): Promise<FileDiagnosticResult[]> {
  const results = []

  for (const filePath of filePaths) {
    results.push(await diagnoseFile(filePath))
  }

  return results
}
