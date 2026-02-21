"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Users, TrendingUp } from "lucide-react"
import { useState } from "react"

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

interface SimpleVisualizationProps {
  data: ClusteringResult
  documents: string[]
}

export function SimpleVisualization({ data, documents }: SimpleVisualizationProps) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null)

  const clusterColors = [
    "bg-blue-100 border-blue-300 text-blue-800",
    "bg-green-100 border-green-300 text-green-800",
    "bg-purple-100 border-purple-300 text-purple-800",
    "bg-orange-100 border-orange-300 text-orange-800",
    "bg-pink-100 border-pink-300 text-pink-800",
    "bg-indigo-100 border-indigo-300 text-indigo-800",
    "bg-yellow-100 border-yellow-300 text-yellow-800",
    "bg-red-100 border-red-300 text-red-800",
  ]

  return (
    <div className="space-y-6">
      {/* Algorithm Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Algorithm Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{data.algorithm}</p>
              <p className="text-sm text-muted-foreground">Algorithm</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{Object.keys(data.clusters).length}</p>
              <p className="text-sm text-muted-foreground">Clusters</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{documents.length}</p>
              <p className="text-sm text-muted-foreground">Documents</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{(data.silhouetteScore * 100).toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Quality Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cluster Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(data.clusters).map(([clusterId, documentIndices], index) => {
          const summary = data.clusterSummaries[clusterId]
          const colorClass = clusterColors[index % clusterColors.length]

          return (
            <Card
              key={clusterId}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedCluster === clusterId ? "ring-2 ring-primary shadow-lg" : ""
              } border-2`}
              onClick={() => setSelectedCluster(selectedCluster === clusterId ? null : clusterId)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={`${colorClass} text-xs font-semibold`}>{summary?.label || `Cluster ${Number.parseInt(clusterId) + 1}`}</Badge>
                  <Badge variant="outline" className="text-xs">{documentIndices.length} docs</Badge>
                </div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {summary?.name || `Cluster ${Number.parseInt(clusterId) + 1}`}
                </CardTitle>
                {summary?.description && (
                  <p className="text-sm text-muted-foreground mt-2 italic">{summary.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {documentIndices.length} docs
                  </span>
                  <span>Coherence: {((summary?.coherence || 0) * 100).toFixed(0)}%</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Selected Cluster Details */}
      {selectedCluster && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cluster Details:{" "}
              {data.clusterSummaries[selectedCluster]?.name || `Cluster ${Number.parseInt(selectedCluster) + 1}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* All Topics */}
              {data.clusterSummaries[selectedCluster]?.topTerms && (
                <div>
                  <h4 className="font-medium mb-2">All Key Topics:</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.clusterSummaries[selectedCluster].topTerms.map((term, i) => (
                      <Badge key={i} variant="outline">
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents in Cluster */}
              <div>
                <h4 className="font-medium mb-2">Documents in this cluster:</h4>
                <div className="space-y-2">
                  {data.clusters[selectedCluster].map((docIndex, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <p className="font-medium">Document {docIndex + 1}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {documents[docIndex]?.substring(0, 200)}
                        {documents[docIndex]?.length > 200 ? "..." : ""}
                      </p>
                      {data.documentKeyTerms[docIndex] && data.documentKeyTerms[docIndex].length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {data.documentKeyTerms[docIndex].slice(0, 5).map((term, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">
                              {term}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
