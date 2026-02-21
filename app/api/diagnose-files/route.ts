import { type NextRequest, NextResponse } from "next/server"
import { batchDiagnoseFiles } from "@/utils/file-diagnostics"
import { extractTextFromFile } from "@/utils/simple-text-extraction"
import path from "path"
import os from "os"
import fs from "fs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const tempDir = path.join(os.tmpdir(), "doc-clustering-temp")
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const filePaths: string[] = []

    // Save uploaded files to temp directory
    for (const file of files) {
      const filePath = path.join(tempDir, file.name)
      const buffer = Buffer.from(await file.arrayBuffer())
      fs.writeFileSync(filePath, buffer)
      filePaths.push(filePath)
    }

    // Diagnose files
    const diagnostics = await batchDiagnoseFiles(filePaths)

    // Extract text from compatible files - with fallback for extraction errors
    let extractionResults = []
    try {
      extractionResults = await Promise.all(
        filePaths
          .filter(
            (_, index) =>
              diagnostics[index].isText ||
              ["pdf", "docx", "csv", "txt", "md", "json"].includes(diagnostics[index].format),
          )
          .map((filePath) => extractTextFromFile(filePath)),
      )
    } catch (extractionError) {
      console.error("Error during text extraction:", extractionError)
      extractionResults = filePaths.map((filePath) => ({
        content: "",
        metadata: { source: filePath, format: filePath.split(".").pop()?.toLowerCase() },
        error: `Text extraction failed: ${(extractionError as Error).message}`,
      }))
    }

    // Clean up temp files
    for (const filePath of filePaths) {
      try {
        fs.unlinkSync(filePath)
      } catch (e) {
        console.error(`Failed to delete temp file: ${filePath}`)
      }
    }

    return NextResponse.json({
      diagnostics,
      extractionResults,
    })
  } catch (error) {
    console.error("Error in diagnose-files:", error)
    return NextResponse.json({ error: `Failed to process files: ${(error as Error).message}` }, { status: 500 })
  }
}
