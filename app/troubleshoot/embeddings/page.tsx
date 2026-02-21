"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle } from "lucide-react"

export default function EmbeddingDiagnosticsPage() {
  const [textSamples, setTextSamples] = useState<string[]>([])
  const [currentSample, setCurrentSample] = useState("")
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addSample = () => {
    if (currentSample.trim()) {
      setTextSamples([...textSamples, currentSample.trim()])
      setCurrentSample("")
    }
  }

  const removeSample = (index: number) => {
    setTextSamples(textSamples.filter((_, i) => i !== index))
  }

  const runDiagnostics = async () => {
    if (textSamples.length === 0) {
      setError("Please add at least one text sample")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch("/api/diagnose-embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ texts: textSamples }),
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
      <h1 className="text-3xl font-bold mb-6">Embedding Generation Diagnostics</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Text Samples</CardTitle>
          <CardDescription>Add text samples to test embedding generation</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter a text sample..."
            value={currentSample}
            onChange={(e) => setCurrentSample(e.target.value)}
            rows={4}
            className="mb-4"
          />
          <Button onClick={addSample} disabled={!currentSample.trim()}>
            Add Sample
          </Button>

          {textSamples.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Added Samples ({textSamples.length})</h3>
              <div className="space-y-2">
                {textSamples.map((sample, index) => (
                  <div key={index} className="flex items-start justify-between bg-muted p-3 rounded-md">
                    <p className="text-sm truncate max-w-lg">
                      {sample.length > 100 ? `${sample.substring(0, 100)}...` : sample}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSample(index)}
                      className="h-6 w-6 p-0 rounded-full"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={runDiagnostics} disabled={isProcessing || textSamples.length === 0} className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Test Embedding Generation"
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
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Diagnostic Results</h2>

          {diagnosticResults.diagnostics.map((result: any, index: number) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">Sample {index + 1}</CardTitle>
                  {result.error ? (
                    <Badge variant="destructive">Failed</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-100">
                      Success
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {result.truncatedInput ? "Input was truncated" : "Full input processed"} • Processing time:{" "}
                  {result.processingTimeMs}ms
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result.error ? (
                  <div className="text-destructive text-sm">{result.error}</div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Input Text:</span>
                        <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto max-h-32">
                          {result.inputText.slice(0, 200)}
                          {result.inputText.length > 200 ? "..." : ""}
                        </pre>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Embedding Details:</span>
                        <div className="mt-1 text-xs bg-muted p-2 rounded">
                          <p>Dimensions: {result.embeddingLength}</p>
                          <p className="mt-1">Sample values:</p>
                          <pre className="mt-1 overflow-x-auto">{JSON.stringify(result.embeddingSample, null, 2)}</pre>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
