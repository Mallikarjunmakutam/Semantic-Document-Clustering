"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Loader2, Download, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SimpleVisualization } from "@/components/simple-visualization"
import { extractTextFromFile } from "@/utils/universal-file-handler"
import { Textarea as TextareaComponent } from "@/components/ui/textarea"

interface Document {
  id: string
  name: string
  content: string
  type: string
}

interface ClusteringResult {
  clusters: Record<string, number[]>
  clusterSummaries: Record<
    string,
    {
      name: string
      label: string
      description: string
      size: number
      coherence: number
      topTerms: string[]
    }
  >
  documentKeyTerms: string[][]
  silhouetteScore: number
  algorithm: string
  algorithmDetails: any
}

export default function SemanticClustering() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [manualText, setManualText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [clusteringResult, setClusteringResult] = useState<ClusteringResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (event: any) => {
    const files = event.target.files
    if (!files) return

    setIsProcessing(true)
    setError(null)

    try {
      const newDocuments: Document[] = []

      for (const file of Array.from(files)) {
        const content = await readFileContent(file)
        newDocuments.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          content,
          type: file.type || "text/plain",
        })
      }

      setDocuments((prev) => [...prev, ...newDocuments])
    } catch (err) {
      setError("Failed to read files. Please try again.")
      console.error("File upload error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const readFileContent = async (file: File): Promise<string> => {
    try {
      const result = await extractTextFromFile(file)
      return result.text
    } catch (error) {
      console.error("[v0] File extraction error:", error)
      throw new Error(`Unable to extract content from ${file.name}`)
    }
  }

  const addManualText = () => {
    if (!manualText.trim()) {
      console.log("[v0] Manual text is empty")
      return
    }

    console.log(`[v0] Adding manual text: length=${manualText.trim().length}, preview=${manualText.substring(0, 50)}...`)

    const newDocument: Document = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Manual Text ${documents.length + 1}`,
      content: manualText.trim(),
      type: "text/plain",
    }

    setDocuments((prev) => {
      const updated = [...prev, newDocument]
      console.log(`[v0] Documents updated. Total: ${updated.length}`)
      return updated
    })
    setManualText("")
  }

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
    setClusteringResult(null)
  }

  const runClustering = async () => {
    if (documents.length < 2) {
      setError("Please add at least 2 documents for clustering.")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const payload = {
        documents: documents.map((doc) => doc.content),
      }
      
      console.log(`[v0] Sending ${documents.length} documents to clustering API`)
      documents.forEach((doc, idx) => {
        console.log(`[v0] Doc ${idx}: name="${doc.name}", length=${doc.content.length}, preview="${doc.content.substring(0, 60)}..."`)
      })

      const response = await fetch("/api/cluster-documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Clustering failed")
      }

      const result = await response.json()
      setClusteringResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during clustering")
      console.error("Clustering error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const exportResults = () => {
    if (!clusteringResult) return

    const exportData = {
      ...clusteringResult,
      documents: documents.map((doc) => ({
        name: doc.name,
        content: doc.content,
      })),
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `clustering-results-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-0.5 rounded-full">
              <div className="bg-slate-900 px-4 py-2 rounded-full">
                <span className="text-sm font-semibold text-blue-400">Smart Document Clustering</span>
              </div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 tracking-tight">
            Semantic Document Clustering
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Intelligently group documents by meaning and context. Upload any document type - PDF, Word, Text, CSV, and more.
          </p>
        </div>

        {/* Document Input Section */}
        <div className="grid gap-6 md:grid-cols-2">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept=".txt,.md,.csv,.json,.pdf,.docx,.doc,.xml,.html"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      disabled={isProcessing}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-blue-400" />
                      <span className="text-sm font-medium text-white">Click to upload files</span>
                      <span className="text-xs text-gray-400">PDF, Word, Text, CSV, JSON, XML, HTML and more</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manual Text Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Add Text Manually
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <TextareaComponent
                    placeholder="Paste or type your text content here..."
                    value={manualText}
                    onChange={(e: any) => setManualText(e.target.value)}
                    className="min-h-[120px]"
                    disabled={isProcessing}
                  />
                  <Button onClick={addManualText} disabled={!manualText.trim() || isProcessing} className="w-full">
                    Add Text
                  </Button>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Documents List */}
        {documents.length > 0 && (
          <Card className="border-blue-800/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
            <CardHeader className="border-b border-blue-800/30">
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                Uploaded Documents ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-all border border-slate-600/30 group">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-medium text-white truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400 truncate mt-1">{doc.content.substring(0, 80)}...</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      disabled={isProcessing}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/30 flex-shrink-0"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clustering Controls */}
        {documents.length > 0 && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={runClustering}
              disabled={isProcessing || documents.length < 2}
              size="lg"
              className="px-12 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Processing Documents...
                </>
              ) : (
                "Run Semantic Clustering"
              )}
            </Button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {clusteringResult && (
          <div className="space-y-6 mt-12">
            <div className="flex justify-between items-center border-b border-blue-800/30 pb-6">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">Clustering Results</h2>
                <p className="text-gray-400">
                  {Object.keys(clusteringResult.clusters).length} clusters found • 
                  <span className="text-blue-400 ml-2 font-semibold">{clusteringResult.algorithm} Algorithm</span>
                </p>
              </div>
              <Button onClick={exportResults} className="bg-blue-600 hover:bg-blue-700">
                <Download className="mr-2 h-4 w-4" />
                Export Results
              </Button>
            </div>

            <SimpleVisualization data={clusteringResult} documents={documents.map((doc) => doc.content)} />
          </div>
        )}
      </div>
    </div>
  )
}
