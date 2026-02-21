"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

export default function ClusteringDiagnosticsPage() {
  const [algorithm, setAlgorithm] = useState<string>("kmeans")
  const [kValue, setKValue] = useState<number>(3)
  const [epsValue, setEpsValue] = useState<number>(0.5)
  const [minPtsValue, setMinPtsValue] = useState<number>(5)
  const [maxIterations, setMaxIterations] = useState<number>(10)
  const [vectors, setVectors] = useState<number[][]>([])
  const [vectorInput, setVectorInput] = useState<string>("")
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addVector = () => {
    try {
      const parsedVector = JSON.parse(vectorInput)
      if (Array.isArray(parsedVector) && parsedVector.every((v) => typeof v === "number")) {
        setVectors([...vectors, parsedVector])
        setVectorInput("")
      } else {
        setError("Invalid vector format. Must be an array of numbers.")
      }
    } catch (err) {
      setError(`Error parsing vector: ${(err as Error).message}`)
    }
  }

  const generateRandomVectors = () => {
    const dimensions = 2 // Using 2D for easy visualization
    const numVectors = 30
    const randomVectors = []

    // Generate 3 clusters
    for (let cluster = 0; cluster < 3; cluster++) {
      const centerX = Math.random() * 10 - 5
      const centerY = Math.random() * 10 - 5

      for (let i = 0; i < numVectors / 3; i++) {
        const x = centerX + (Math.random() - 0.5) * 2
        const y = centerY + (Math.random() - 0.5) * 2
        randomVectors.push([x, y])
      }
    }

    setVectors(randomVectors)
  }

  const removeVector = (index: number) => {
    setVectors(vectors.filter((_, i) => i !== index))
  }

  const runDiagnostics = async () => {
    if (vectors.length === 0) {
      setError("Please add at least one vector")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const parameters = algorithm === "kmeans" ? { k: kValue, maxIterations } : { eps: epsValue, minPts: minPtsValue }

      const response = await fetch("/api/diagnose-clustering", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vectors,
          algorithm,
          parameters,
        }),
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
      <h1 className="text-3xl font-bold mb-6">Clustering Algorithm Diagnostics</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Algorithm Configuration</CardTitle>
          <CardDescription>Configure clustering algorithm parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="algorithm">Clustering Algorithm</Label>
              <Select value={algorithm} onValueChange={setAlgorithm}>
                <SelectTrigger id="algorithm">
                  <SelectValue placeholder="Select algorithm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kmeans">K-Means</SelectItem>
                  <SelectItem value="dbscan">DBSCAN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {algorithm === "kmeans" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="k-value">Number of Clusters (k)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="k-value"
                      min={2}
                      max={10}
                      step={1}
                      value={[kValue]}
                      onValueChange={(value) => setKValue(value[0])}
                      className="flex-1"
                    />
                    <span className="w-8 text-center">{kValue}</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="max-iterations">Max Iterations</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="max-iterations"
                      min={5}
                      max={50}
                      step={5}
                      value={[maxIterations]}
                      onValueChange={(value) => setMaxIterations(value[0])}
                      className="flex-1"
                    />
                    <span className="w-8 text-center">{maxIterations}</span>
                  </div>
                </div>
              </div>
            )}

            {algorithm === "dbscan" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="eps-value">Epsilon (ε)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="eps-value"
                      min={0.1}
                      max={2}
                      step={0.1}
                      value={[epsValue]}
                      onValueChange={(value) => setEpsValue(value[0])}
                      className="flex-1"
                    />
                    <span className="w-12 text-center">{epsValue.toFixed(1)}</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="min-pts-value">Min Points</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="min-pts-value"
                      min={2}
                      max={10}
                      step={1}
                      value={[minPtsValue]}
                      onValueChange={(value) => setMinPtsValue(value[0])}
                      className="flex-1"
                    />
                    <span className="w-8 text-center">{minPtsValue}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Vector Data</CardTitle>
          <CardDescription>Add vectors to test clustering algorithms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button onClick={generateRandomVectors} variant="outline">
              Generate Random Test Data
            </Button>
            <Button onClick={() => setVectors([])} variant="outline" className="text-destructive">
              Clear All
            </Button>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="vector-input">Add Vector (JSON format)</Label>
              <Input
                id="vector-input"
                placeholder="[0.1, 0.2, 0.3]"
                value={vectorInput}
                onChange={(e) => setVectorInput(e.target.value)}
              />
            </div>
            <Button onClick={addVector} className="mt-auto">
              Add
            </Button>
          </div>

          {vectors.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Vectors ({vectors.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {vectors.slice(0, 9).map((vector, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                    <span className="text-xs truncate max-w-[150px]">
                      [{vector.map((v) => v.toFixed(2)).join(", ")}]
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVector(index)}
                      className="h-6 w-6 p-0 rounded-full"
                    >
                      ×
                    </Button>
                  </div>
                ))}
                {vectors.length > 9 && (
                  <div className="flex items-center justify-center bg-muted p-2 rounded-md">
                    <span className="text-xs text-muted-foreground">+{vectors.length - 9} more</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={runDiagnostics} disabled={isProcessing || vectors.length === 0} className="w-full">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Run Clustering Diagnostics"
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
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>Clustering Results</CardTitle>
              {diagnosticResults.error ? (
                <Badge variant="destructive">Failed</Badge>
              ) : (
                <Badge variant="outline" className="bg-green-100">
                  Success
                </Badge>
              )}
            </div>
            <CardDescription>
              Algorithm: {diagnosticResults.algorithm} • Processing time: {diagnosticResults.processingTimeMs}ms
            </CardDescription>
          </CardHeader>
          <CardContent>
            {diagnosticResults.error ? (
              <div className="text-destructive text-sm">{diagnosticResults.error}</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Clustering Quality</h3>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs">Silhouette Score</span>
                      <span className="text-xs font-medium">
                        {diagnosticResults.silhouetteScore?.toFixed(3) || "N/A"}
                      </span>
                    </div>
                    <Progress value={(diagnosticResults.silhouetteScore || 0) * 100} className="h-2" />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Poor</span>
                      <span className="text-xs text-muted-foreground">Excellent</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Cluster Distribution</h3>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="space-y-2">
                      {diagnosticResults.clusters.map((cluster: number[], index: number) => (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs">Cluster {index + 1}</span>
                            <span className="text-xs font-medium">{cluster.length} points</span>
                          </div>
                          <Progress value={(cluster.length / vectors.length) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {vectors[0]?.length === 2 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">2D Visualization</h3>
                    <div className="bg-muted p-3 rounded-md h-64 relative">
                      {/* Simple 2D scatter plot for 2D vectors */}
                      <div className="absolute inset-0">
                        {diagnosticResults.clusters.map((cluster: number[], clusterIndex: number) => (
                          <React.Fragment key={clusterIndex}>
                            {cluster.map((pointIndex: number) => {
                              const point = vectors[pointIndex]
                              // Normalize to [0,1] range assuming vectors are in [-10,10] range
                              const x = ((point[0] + 10) / 20) * 100
                              const y = ((point[1] + 10) / 20) * 100

                              return (
                                <div
                                  key={pointIndex}
                                  className="absolute w-2 h-2 rounded-full transform -translate-x-1 -translate-y-1"
                                  style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    backgroundColor: [
                                      "rgb(239, 68, 68)",
                                      "rgb(59, 130, 246)",
                                      "rgb(16, 185, 129)",
                                      "rgb(249, 115, 22)",
                                      "rgb(139, 92, 246)",
                                    ][clusterIndex % 5],
                                  }}
                                />
                              )
                            })}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
