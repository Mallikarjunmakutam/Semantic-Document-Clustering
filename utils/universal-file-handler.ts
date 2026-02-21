/**
 * Universal file handler for extracting text from various document types
 */

export interface FileExtractionResult {
  text: string
  metadata: {
    originalName: string
    fileType: string
    fileSize: number
    extractionMethod: string
  }
}

export async function extractTextFromFile(file: File): Promise<FileExtractionResult> {
  const fileType = file.type || "application/octet-stream"
  const fileName = file.name.toLowerCase()
  const fileSize = file.size

  console.log(`[v0] Processing file: ${fileName}, Type: ${fileType}, Size: ${fileSize}`)

  try {
    // PDF files
    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      const text = await extractTextFromPDF(file)
      return {
        text: text || "Unable to extract text from PDF",
        metadata: {
          originalName: file.name,
          fileType: "application/pdf",
          fileSize,
          extractionMethod: "PDF text extraction",
        },
      }
    }

    // Word documents (.docx)
    if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      const text = await extractTextFromDOCX(file)
      return {
        text: text || "Unable to extract text from DOCX",
        metadata: {
          originalName: file.name,
          fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          fileSize,
          extractionMethod: "DOCX XML extraction",
        },
      }
    }

    // Legacy Word documents (.doc)
    if (fileType === "application/msword" || fileName.endsWith(".doc")) {
      const metadata = `Document: ${file.name}, Size: ${fileSize} bytes`
      return {
        text: metadata,
        metadata: {
          originalName: file.name,
          fileType: "application/msword",
          fileSize,
          extractionMethod: "Legacy DOC metadata extraction",
        },
      }
    }
    // Plain text files
    if (fileType === "text/plain" || fileName.endsWith(".txt")) {
      const text = await file.text()
      return {
        text: text || "Empty text file",
        metadata: {
          originalName: fileName,
          fileType: "text/plain",
          fileSize,
          extractionMethod: "direct text read",
        },
      }
    }

    // CSV files
    if (fileType === "text/csv" || fileName.endsWith(".csv")) {
      const text = await file.text()
      return {
        text: text || "Empty CSV file",
        metadata: {
          originalName: fileName,
          fileType: "text/csv",
          fileSize,
          extractionMethod: "CSV content extraction",
        },
      }
    }

    // JSON files
    if (fileType === "application/json" || fileName.endsWith(".json")) {
      const text = await file.text()
      try {
        const parsed = JSON.parse(text)
        const humanReadable = JSON.stringify(parsed, null, 2)
        return {
          text: humanReadable || "Empty JSON file",
          metadata: {
            originalName: fileName,
            fileType: "application/json",
            fileSize,
            extractionMethod: "JSON content extraction",
          },
        }
      } catch {
        return {
          text: text || "Invalid JSON file",
          metadata: {
            originalName: fileName,
            fileType: "application/json",
            fileSize,
            extractionMethod: "Raw JSON text read",
          },
        }
      }
    }

    // XML files
    if (
      fileType === "application/xml" ||
      fileType === "text/xml" ||
      fileName.endsWith(".xml")
    ) {
      const text = await file.text()
      return {
        text: text || "Empty XML file",
        metadata: {
          originalName: fileName,
          fileType: "application/xml",
          fileSize,
          extractionMethod: "XML content extraction",
        },
      }
    }

    // HTML files
    if (fileType === "text/html" || fileName.endsWith(".html") || fileName.endsWith(".htm")) {
      const text = await file.text()
      const plainText = extractTextFromHTML(text)
      return {
        text: plainText || "Empty HTML file",
        metadata: {
          originalName: fileName,
          fileType: "text/html",
          fileSize,
          extractionMethod: "HTML tag removal",
        },
      }
    }

    // Markdown files
    if (fileType === "text/markdown" || fileName.endsWith(".md")) {
      const text = await file.text()
      return {
        text: text || "Empty Markdown file",
        metadata: {
          originalName: fileName,
          fileType: "text/markdown",
          fileSize,
          extractionMethod: "Markdown content extraction",
        },
      }
    }

    // Code files (JavaScript, Python, Java, etc.)
    if (isCodeFile(fileName, fileType)) {
      const text = await file.text()
      return {
        text: text || "Empty code file",
        metadata: {
          originalName: fileName,
          fileType: fileType,
          fileSize,
          extractionMethod: "Source code extraction",
        },
      }
    }

    // PDF files (basic text extraction simulation)
    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      const text = await extractTextFromPDF(file)
      return {
        text: text || "Unable to extract text from PDF",
        metadata: {
          originalName: fileName,
          fileType: "application/pdf",
          fileSize,
          extractionMethod: "PDF text extraction",
        },
      }
    }

    // Microsoft Word documents (DOCX)
    if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      const text = await extractTextFromDOCX(file)
      return {
        text: text || "Unable to extract text from DOCX",
        metadata: {
          originalName: fileName,
          fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          fileSize,
          extractionMethod: "DOCX XML extraction",
        },
      }
    }

    // Excel files (XLSX)
    if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileName.endsWith(".xlsx")
    ) {
      const text = await extractTextFromXLSX(file)
      return {
        text: text || "Unable to extract text from XLSX",
        metadata: {
          originalName: fileName,
          fileType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          fileSize,
          extractionMethod: "XLSX XML extraction",
        },
      }
    }

    // Image files - extract metadata
    if (fileType.startsWith("image/")) {
      const metadata = await extractImageMetadata(file)
      return {
        text: metadata,
        metadata: {
          originalName: fileName,
          fileType: fileType,
          fileSize,
          extractionMethod: "Image metadata extraction",
        },
      }
    }

    // Video files - extract metadata
    if (fileType.startsWith("video/")) {
      const metadata = extractVideoMetadata(fileName)
      return {
        text: metadata,
        metadata: {
          originalName: fileName,
          fileType: fileType,
          fileSize,
          extractionMethod: "Video metadata extraction",
        },
      }
    }

    // Audio files - extract metadata
    if (fileType.startsWith("audio/")) {
      const metadata = extractAudioMetadata(fileName)
      return {
        text: metadata,
        metadata: {
          originalName: fileName,
          fileType: fileType,
          fileSize,
          extractionMethod: "Audio metadata extraction",
        },
      }
    }

    // Fallback for unknown types
    const fallbackText = await extractAsText(file)
    return {
      text: fallbackText || "Unable to extract content from this file type",
      metadata: {
        originalName: fileName,
        fileType: fileType,
        fileSize,
        extractionMethod: "Fallback text extraction",
      },
    }
  } catch (error) {
    console.error(`[v0] Error processing file ${fileName}:`, error)
    return {
      text: `Error processing file: ${fileName}. File type: ${fileType}`,
      metadata: {
        originalName: fileName,
        fileType: fileType,
        fileSize,
        extractionMethod: "Error recovery",
      },
    }
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Convert binary data to string
    let binaryString = ""
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i])
    }

    // Extract text between BT and ET operators (basic PDF text extraction)
    let extractedText = ""
    const btPattern = /BT([\s\S]*?)ET/g
    let match

    while ((match = btPattern.exec(binaryString)) !== null) {
      const content = match[1]
      // Extract strings within parentheses
      const stringPattern = /\((.*?)\)/g
      let stringMatch
      while ((stringMatch = stringPattern.exec(content)) !== null) {
        const text = stringMatch[1]
          .replace(/\\/g, "")
          .replace(/[^\x20-\x7E\n\r\t]/g, " ")
        if (text.trim()) {
          extractedText += text + " "
        }
      }
    }

    // If no text found using BT/ET, try extracting from metadata and content streams
    if (!extractedText.trim()) {
      const textPattern = /[\x20-\x7E\n\r\t]{10,}/g
      const matches = binaryString.match(textPattern) || []
      extractedText = matches.join(" ")
    }

    return extractedText.trim() || `PDF document: ${file.name}`
  } catch (error) {
    console.error("[v0] PDF extraction error:", error)
    return `PDF document: ${file.name}`
  }
}

async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()

    // DOCX files are ZIP archives, we need to extract the document.xml
    // Since we can't use JSZip, we'll parse the binary data
    const view = new Uint8Array(arrayBuffer)

    // Convert to string to search for XML content
    let binaryString = ""
    for (let i = 0; i < view.length; i++) {
      const byte = view[i]
      if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
        binaryString += String.fromCharCode(byte)
      }
    }

    // Extract text from document.xml content
    let extractedText = ""

    // Look for text elements in XML format
    const textPattern = /<w:t[^>]*>([^<]*)<\/w:t>/g
    let match

    while ((match = textPattern.exec(binaryString)) !== null) {
      const text = match[1].trim()
      if (text) {
        extractedText += text + " "
      }
    }

    // Fallback: extract readable strings from the entire content
    if (!extractedText.trim()) {
      const readablePattern = /[A-Za-z0-9\s.,!?;:\-()[\]{}'"]{20,}/g
      const matches = binaryString.match(readablePattern) || []
      extractedText = matches.join(" ")
    }

    return extractedText.trim() || `Word document: ${file.name}`
  } catch (error) {
    console.error("[v0] DOCX extraction error:", error)
    return `Word document: ${file.name}`
  }
}

function extractTextFromHTML(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<script[^>]*>.*?<\/script>/gi, "")
  text = text.replace(/<style[^>]*>.*?<\/style>/gi, "")

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ")

  // Decode HTML entities
  text = decodeHTMLEntities(text)

  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim()

  return text || "Empty HTML document"
}

function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
  }

  return text.replace(/&[^;]+;/g, (match) => entities[match] || match)
}

function isCodeFile(fileName: string, fileType: string): boolean {
  const codeExtensions = [
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".cs",
    ".rb",
    ".go",
    ".rs",
    ".php",
    ".swift",
    ".kt",
    ".scala",
    ".r",
    ".m",
    ".sql",
    ".sh",
    ".bash",
    ".pl",
  ]

  return codeExtensions.some((ext) => fileName.toLowerCase().endsWith(ext))
}

async function extractTextFromXLSX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const text = new TextDecoder("utf-8").decode(arrayBuffer)

    // Extract text from Excel XML
    const cellMatches = text.match(/<v>([^<]*)<\/v>/g) || []
    const extractedText = cellMatches
      .map((match) => match.replace(/<v>/, "").replace(/<\/v>/, ""))
      .join(" | ")

    return extractedText || "Unable to extract XLSX content"
  } catch (error) {
    console.error("[v0] XLSX extraction error:", error)
    return "Unable to extract XLSX content"
  }
}

async function extractImageMetadata(file: File): Promise<string> {
  const metadata = [
    `Image File: ${file.name}`,
    `File Size: ${(file.size / 1024).toFixed(2)} KB`,
    `Type: ${file.type}`,
    "Image content detected - Using filename and metadata for clustering",
  ].join("\n")

  return metadata
}

function extractVideoMetadata(fileName: string): string {
  const metadata = [
    `Video File: ${fileName}`,
    "Video content detected",
    `File Name: ${fileName}`,
    "Using filename and content type for semantic analysis",
  ].join("\n")

  return metadata
}

function extractAudioMetadata(fileName: string): string {
  const metadata = [
    `Audio File: ${fileName}`,
    "Audio content detected",
    `File Name: ${fileName}`,
    "Using filename and content type for semantic analysis",
  ].join("\n")

  return metadata
}

async function extractAsText(file: File): Promise<string> {
  try {
    // Try to read as text
    const text = await file.text()
    return text || "Empty file"
  } catch (error) {
    // If text reading fails, use file metadata
    return `File: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`
  }
}
