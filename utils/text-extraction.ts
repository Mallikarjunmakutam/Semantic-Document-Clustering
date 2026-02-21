import fs from "fs"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx"
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv"
import { TextLoader } from "@langchain/community/document_loaders/fs/text"

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

    switch (format) {
      case "pdf":
        const pdfLoader = new PDFLoader(filePath)
        const pdfDocs = await pdfLoader.load()
        content = pdfDocs.map((doc) => doc.pageContent).join("\n")
        metadata.pageCount = pdfDocs.length
        break

      case "docx":
        const docxLoader = new DocxLoader(filePath)
        const docxDocs = await docxLoader.load()
        content = docxDocs.map((doc) => doc.pageContent).join("\n")
        break

      case "csv":
        const csvLoader = new CSVLoader(filePath)
        const csvDocs = await csvLoader.load()
        content = csvDocs.map((doc) => doc.pageContent).join("\n")
        break

      case "txt":
      case "md":
      case "json":
        const textLoader = new TextLoader(filePath)
        const textDocs = await textLoader.load()
        content = textDocs.map((doc) => doc.pageContent).join("\n")
        break

      default:
        // Try to read as plain text
        try {
          content = fs.readFileSync(filePath, "utf8")
        } catch (e) {
          throw new Error(`Unsupported file format: ${format}`)
        }
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
