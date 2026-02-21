"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, AlertCircle } from "lucide-react"

export default function TroubleshootPage() {
  const [files, setFiles] = useState<File[]>([])
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const runDiagnostics = async () => {
    if (files.length === 0) {
      setError("Please select files to diagnose")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append("files", file)
      })

      const response = await fetch("/api/diagnose-files", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setDiagnosticResults(data)
    } catch (err) {
      setError(`Error running diagnostics: ${(err as Error).message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Document Clustering System Troubleshooter</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>File Diagnostics</CardTitle>
          <CardDescription>Upload your documents to diagnose potential issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
            <input type="file" id="file-upload" multiple onChange={handleFileChange} className="hidden" />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
              <FileText className="h-10 w-10 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-600">Click to select files</span>
              <span className="text-xs text-gray-500 mt-1">Supports PDF, DOCX, TXT, CSV, and more</span>
            </label>
          </div>

          {files.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Selected Files ({files.length})</h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="text-sm truncate max-w-xs">{file.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={runDiagnostics} disabled={isProcessing || files.length === 0} className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Run Diagnostics"
            )}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <div className="bg-destructive/15 border border-destructive text-destructive p-4 rounded-md mb-6 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {diagnosticResults && (
        <Tabs defaultValue="file-diagnostics">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file-diagnostics">File Diagnostics</TabsTrigger>
            <TabsTrigger value="text-extraction">Text Extraction</TabsTrigger>
          </TabsList>

          <TabsContent value="file-diagnostics" className="space-y-4 mt-4">
            {diagnosticResults.diagnostics.map((result: any, index: number) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{result.filename}</CardTitle>
                    {result.error ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : (
                      <Badge variant="outline" className={result.isText ? "bg-green-100" : "bg-yellow-100"}>
                        {result.isText ? "Compatible" : "May Need Conversion"}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {result.format || "Unknown format"} • {(result.size / 1024).toFixed(1)} KB
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {result.error ? (
                    <div className="text-destructive text-sm">{result.error}</div>
                  ) : (
                    <>
                      <div className="text-sm mb-2">
                        <span className="font-medium">Encoding:</span> {result.encoding || "Binary/Unknown"}
                      </div>
                      {result.sample && (
                        <div className="mt-2">
                          <span className="text-xs font-medium text-muted-foreground">Content Sample:</span>
                          <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">{result.sample}</pre>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="text-extraction" className="space-y-4 mt-4">
            {diagnosticResults.extractionResults.map((result: any, index: number) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{result.metadata.source.split("/").pop()}</CardTitle>
                    {result.error ? (
                      <Badge variant="destructive">Failed</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-100">
                        Success
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {result.metadata.format} {result.metadata.pageCount ? `• ${result.metadata.pageCount} pages` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {result.error ? (
                    <div className="text-destructive text-sm">{result.error}</div>
                  ) : (
                    <>
                      <div className="text-sm mb-2">
                        <span className="font-medium">Extracted Content:</span>
                      </div>
                      <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
                        {result.content.slice(0, 500)}
                        {result.content.length > 500 ? "..." : ""}
                      </pre>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
