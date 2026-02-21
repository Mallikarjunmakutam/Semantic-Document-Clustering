"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, CheckCircle, FileText, Database, Cpu } from "lucide-react"
import Link from "next/link"

interface SystemStatus {
  fileProcessing: "unknown" | "healthy" | "warning" | "error"
  embeddingGeneration: "unknown" | "healthy" | "warning" | "error"
  clustering: "unknown" | "healthy" | "warning" | "error"
  overall: "unknown" | "healthy" | "warning" | "error"
  lastChecked: string | null
  issues: {
    component: string
    severity: "warning" | "error"
    message: string
  }[]
}

export default function DiagnosticsDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    fileProcessing: "unknown",
    embeddingGeneration: "unknown",
    clustering: "unknown",
    overall: "unknown",
    lastChecked: null,
    issues: [],
  })

  const [isChecking, setIsChecking] = useState(false)

  const checkSystemStatus = async () => {
    setIsChecking(true)

    // Simulate system check
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // This would be a real API call in production
    const mockStatus: SystemStatus = {
      fileProcessing: "healthy",
      embeddingGeneration: "warning",
      clustering: "error",
      overall: "error",
      lastChecked: new Date().toISOString(),
      issues: [
        {
          component: "Embedding Generation",
          severity: "warning",
          message: "Slow response times (>2s) for embedding generation",
        },
        {
          component: "Clustering",
          severity: "error",
          message: "K-means algorithm failing to converge with high-dimensional vectors",
        },
      ],
    }

    setSystemStatus(mockStatus)
    setIsChecking(false)
  }

  useEffect(() => {
    // Initial check on page load
    checkSystemStatus()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500"
      case "warning":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-300"
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">System Diagnostics Dashboard</h1>
        <Button onClick={checkSystemStatus} disabled={isChecking} variant="outline">
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Refresh Status"
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">File Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(systemStatus.fileProcessing)}`}></div>
              <span className="capitalize">{systemStatus.fileProcessing}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/troubleshoot" className="text-xs text-blue-500 hover:underline">
              Run diagnostics
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Embedding Generation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(systemStatus.embeddingGeneration)}`}></div>
              <span className="capitalize">{systemStatus.embeddingGeneration}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/troubleshoot/embeddings" className="text-xs text-blue-500 hover:underline">
              Run diagnostics
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Clustering</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(systemStatus.clustering)}`}></div>
              <span className="capitalize">{systemStatus.clustering}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/troubleshoot/clustering" className="text-xs text-blue-500 hover:underline">
              Run diagnostics
            </Link>
          </CardFooter>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Overall system status and detected issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-6">
            <div className={`w-4 h-4 rounded-full mr-3 ${getStatusColor(systemStatus.overall)}`}></div>
            <span className="text-lg font-medium capitalize">{systemStatus.overall}</span>
            {systemStatus.lastChecked && (
              <span className="text-xs text-muted-foreground ml-auto">
                Last checked: {new Date(systemStatus.lastChecked).toLocaleString()}
              </span>
            )}
          </div>

          {systemStatus.issues.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Detected Issues</h3>
              {systemStatus.issues.map((issue, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md ${issue.severity === "error" ? "bg-red-50 border border-red-200" : "bg-yellow-50 border border-yellow-200"}`}
                >
                  <div className="flex items-start">
                    <AlertCircle
                      className={`h-5 w-5 mr-2 flex-shrink-0 ${issue.severity === "error" ? "text-red-500" : "text-yellow-500"}`}
                    />
                    <div>
                      <p className="text-sm font-medium">{issue.component}</p>
                      <p className="text-xs mt-1">{issue.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center p-6 bg-green-50 rounded-md">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              <span className="text-sm">No issues detected</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Tools</CardTitle>
            <CardDescription>Tools to help troubleshoot system components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/troubleshoot" className="block">
                <div className="flex items-center p-3 bg-muted rounded-md hover:bg-muted/80 transition-colors">
                  <FileText className="h-5 w-5 mr-3 text-blue-500" />
                  <div>
                    <p className="font-medium">File Processing Diagnostics</p>
                    <p className="text-xs text-muted-foreground mt-1">Test file compatibility and text extraction</p>
                  </div>
                </div>
              </Link>

              <Link href="/troubleshoot/embeddings" className="block">
                <div className="flex items-center p-3 bg-muted rounded-md hover:bg-muted/80 transition-colors">
                  <Database className="h-5 w-5 mr-3 text-purple-500" />
                  <div>
                    <p className="font-medium">Embedding Generation Diagnostics</p>
                    <p className="text-xs text-muted-foreground mt-1">Test embedding model performance and quality</p>
                  </div>
                </div>
              </Link>

              <Link href="/troubleshoot/clustering" className="block">
                <div className="flex items-center p-3 bg-muted rounded-md hover:bg-muted/80 transition-colors">
                  <Cpu className="h-5 w-5 mr-3 text-green-500" />
                  <div>
                    <p className="font-medium">Clustering Algorithm Diagnostics</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Test clustering algorithm performance and quality
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Common Issues & Solutions</CardTitle>
            <CardDescription>Quick fixes for common problems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-md">
                <div className="p-3 border-b bg-muted">
                  <h3 className="font-medium">File Processing Errors</h3>
                </div>
                <div className="p-3 text-sm">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Check file format compatibility (PDF, DOCX, TXT supported)</li>
                    <li>Ensure files are not corrupted or password-protected</li>
                    <li>Verify file size is under the 10MB limit</li>
                  </ul>
                </div>
              </div>

              <div className="border rounded-md">
                <div className="p-3 border-b bg-muted">
                  <h3 className="font-medium">Embedding Generation Issues</h3>
                </div>
                <div className="p-3 text-sm">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Check API keys and rate limits for embedding services</li>
                    <li>Ensure text is properly preprocessed (cleaned, tokenized)</li>
                    <li>Verify text length is within model limits (8K tokens)</li>
                  </ul>
                </div>
              </div>

              <div className="border rounded-md">
                <div className="p-3 border-b bg-muted">
                  <h3 className="font-medium">Clustering Algorithm Failures</h3>
                </div>
                <div className="p-3 text-sm">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>For K-means: Try different values of k or initialization methods</li>
                    <li>For DBSCAN: Adjust epsilon and minPts parameters</li>
                    <li>Consider dimensionality reduction for high-dim vectors</li>
                    <li>Verify similarity function is appropriate for your data</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
