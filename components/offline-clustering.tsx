"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, BarChart3 } from "lucide-react"
import {
  semanticKMeans,
  semanticDBSCAN,
  findOptimalParameters,
  generateClusterSummaries,
} from "@/utils/semantic-clustering"
import { extractKeyTopics } from "@/utils/semantic-analysis"

interface OfflineClusteringProps {
  documents: string[]
  documentNames: string[]
  onClusteringComplete: (clusters: any, summaries: any) => void
}

export default function OfflineClustering({ documents, documentNames, onClusteringComplete }: OfflineClusteringProps) {
  const [progress, setProgress] = useState(0)
  const [processing, setProcessing] = useState(true)
  const [currentStep, setCurrentStep] = useState("Initializing")
  const [algorithm, setAlgorithm] = useState<"kmeans" | "dbscan">("kmeans")

  useEffect(() => {
    // Simulate processing with a progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 5
        return newProgress >= 100 ? 100 : newProgress
      })
    }, 200)

    // Perform semantic clustering
    setTimeout(async () => {
      try {
        // Step 1: Analyze documents
        setCurrentStep("Analyzing document semantics")
        setProgress(20)

        // Step 2: Determine optimal parameters
        setCurrentStep("Determining optimal clustering parameters")
        const { k, epsilon, minPoints } = findOptimalParameters(documents)
        setProgress(40)

        // Step 3: Choose algorithm based on document characteristics
        let clusteringResult

        // For larger document sets or when documents have varying lengths,
        // DBSCAN often works better as it can identify outliers
        if (documents.length > 30 || hasVaryingDocumentLengths(documents)) {
          setAlgorithm("dbscan")
          setCurrentStep("Running Semantic DBSCAN clustering")
          clusteringResult = semanticDBSCAN(documents, epsilon, minPoints)
        } else {
          setAlgorithm("kmeans")
          setCurrentStep("Running Semantic K-means clustering")
          clusteringResult = semanticKMeans(documents, k)
        }

        setProgress(70)

        // Step 4: Generate cluster summaries
        setCurrentStep("Generating semantic cluster summaries")
        const summaries = generateClusterSummaries(documents, clusteringResult.clusters)

        // Step 5: Extract key topics for each document
        setCurrentStep("Extracting key topics from documents")
        const documentTopics = documents.map((doc) => extractKeyTopics(doc, 5))
        setProgress(90)

        // Complete the process
        setTimeout(() => {
          onClusteringComplete(clusteringResult.clusters, summaries)
          setProcessing(false)
        }, 500)
      } catch (error) {
        console.error("Error in semantic clustering:", error)

        // Fallback to simpler clustering if advanced algorithms fail
        try {
          const fallbackResult = semanticKMeans(documents, 3)
          const fallbackSummaries = generateClusterSummaries(documents, fallbackResult.clusters)
          onClusteringComplete(fallbackResult.clusters, fallbackSummaries)
        } catch (fallbackError) {
          console.error("Fallback clustering also failed:", fallbackError)
          // Last resort: create a single cluster with all documents
          const lastResortClusters = { 0: documents.map((_, i) => i) }
          const lastResortSummaries = {
            0: {
              name: "All Documents",
              size: documents.length,
              coherence: 0.5,
              topTerms: ["document", "content", "text"],
            },
          }
          onClusteringComplete(lastResortClusters, lastResortSummaries)
        }

        setProcessing(false)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [documents, documentNames, onClusteringComplete])

  // Helper function to check if documents have varying lengths
  function hasVaryingDocumentLengths(docs: string[]): boolean {
    if (docs.length < 3) return false

    // Calculate average and standard deviation of document lengths
    const lengths = docs.map((doc) => doc.length)
    const avg = lengths.reduce((sum, len) => sum + len, 0) / lengths.length

    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length
    const stdDev = Math.sqrt(variance)

    // If standard deviation is more than 50% of the average, consider it varying
    return stdDev > avg * 0.5
  }

  return (
    <Card className="bg-gray-800 bg-opacity-50 backdrop-blur-sm border-gray-700 rounded-xl overflow-hidden">
      <CardHeader>
        <CardTitle className="text-white text-2xl">Semantic Content Clustering</CardTitle>
        <CardDescription className="text-gray-400">
          Analyzing document meaning using {algorithm === "kmeans" ? "Semantic K-means" : "Semantic DBSCAN"} algorithm
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{currentStep}</span>
              <span className="text-blue-400">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="bg-gray-900 p-3 rounded-lg">
            <div className="flex items-center mb-2">
              <BarChart3 className="h-4 w-4 text-blue-400 mr-2" />
              <span className="text-sm text-blue-300">Semantic Analysis</span>
            </div>
            <p className="text-xs text-gray-300">
              {algorithm === "kmeans"
                ? "Semantic K-means analyzes document meaning, not just words, to group similar topics together."
                : "Semantic DBSCAN identifies natural clusters based on meaning and can detect outlier documents."}
            </p>
            <p className="text-xs text-gray-300 mt-2">
              Documents with similar topics like "Machine Learning" or "Web Development" will be grouped together even
              if they use different terminology.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
