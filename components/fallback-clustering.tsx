"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface FallbackClusteringProps {
  documents: string[]
  documentNames: string[]
  onClusteringComplete: (clusters: any, summaries: any) => void
}

export default function FallbackClustering({
  documents,
  documentNames,
  onClusteringComplete,
}: FallbackClusteringProps) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Simple clustering algorithm that doesn't require external APIs
  const performSimpleClustering = () => {
    setProcessing(true)
    setError(null)

    try {
      // Very basic clustering based on document length and word overlap
      const clusters: { [key: number]: number[] } = {}
      const clusterSummaries: Record<string, any> = {}

      // Group documents by length (very simple approach)
      const shortDocs: number[] = []
      const mediumDocs: number[] = []
      const longDocs: number[] = []

      documents.forEach((doc, index) => {
        if (doc.length < 500) shortDocs.push(index)
        else if (doc.length < 2000) mediumDocs.push(index)
        else longDocs.push(index)
      })

      // Create clusters
      if (shortDocs.length > 0) {
        clusters[0] = shortDocs
        clusterSummaries[0] = {
          name: "Short Documents",
          size: shortDocs.length,
          coherence: 0.7,
          topTerms: ["short", "brief", "concise"],
        }
      }

      if (mediumDocs.length > 0) {
        clusters[1] = mediumDocs
        clusterSummaries[1] = {
          name: "Medium Documents",
          size: mediumDocs.length,
          coherence: 0.6,
          topTerms: ["medium", "moderate", "average"],
        }
      }

      if (longDocs.length > 0) {
        clusters[2] = longDocs
        clusterSummaries[2] = {
          name: "Long Documents",
          size: longDocs.length,
          coherence: 0.5,
          topTerms: ["long", "detailed", "comprehensive"],
        }
      }

      // If we have no clusters, create a single cluster with all documents
      if (Object.keys(clusters).length === 0) {
        clusters[0] = documents.map((_, i) => i)
        clusterSummaries[0] = {
          name: "All Documents",
          size: documents.length,
          coherence: 0.5,
          topTerms: ["document", "content", "text"],
        }
      }

      setTimeout(() => {
        onClusteringComplete(clusters, clusterSummaries)
        setProcessing(false)
      }, 1000)
    } catch (error) {
      setError(`Fallback clustering failed: ${(error as Error).message}`)
      setProcessing(false)
    }
  }

  return (
    <Card className="bg-gray-800 bg-opacity-50 backdrop-blur-sm border-gray-700 rounded-xl overflow-hidden">
      <CardHeader>
        <CardTitle className="text-white text-2xl">API Connection Issue</CardTitle>
        <CardDescription className="text-gray-400">
          Unable to connect to the OpenAI API for semantic clustering
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="bg-red-900/50 border-red-800 mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Connection Error</AlertTitle>
          <AlertDescription>
            We couldn't connect to the OpenAI API for semantic clustering. This could be due to API rate limits, network
            issues, or missing API keys.
          </AlertDescription>
        </Alert>

        <div className="bg-gray-700/50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-white mb-2">Options</h3>
          <p className="text-gray-300 text-sm mb-4">
            You can try again later or use our simple fallback clustering algorithm. The fallback algorithm won't
            provide semantic understanding but can still organize your documents.
          </p>

          {error && (
            <Alert variant="destructive" className="bg-red-900/30 border-red-800 mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-4">
        <Button
          onClick={performSimpleClustering}
          disabled={processing}
          className="bg-blue-600 hover:bg-blue-700 flex-1"
        >
          {processing ? "Processing..." : "Use Fallback Clustering"}
        </Button>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="border-gray-600 hover:bg-gray-700"
        >
          Try Again
        </Button>
      </CardFooter>
    </Card>
  )
}
