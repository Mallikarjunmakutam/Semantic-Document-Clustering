"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Unhandled error:", error)
  }, [error])

  return (
    <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-screen">
      <div className="max-w-md w-full p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-red-800 mb-2">Something went wrong</h3>
            <div className="text-sm text-red-700 mb-4">
              <p>An error occurred in the application:</p>
              <pre className="mt-2 p-2 bg-red-100 rounded overflow-x-auto">{error.message || "Unknown error"}</pre>
              {error.digest && <p className="mt-2 text-xs">Error ID: {error.digest}</p>}
            </div>
            <Button onClick={reset} variant="outline" className="flex items-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
