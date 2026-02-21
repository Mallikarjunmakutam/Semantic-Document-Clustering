import type React from "react"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TroubleshootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold mb-2">Document Clustering System Troubleshooter</h1>
        <p className="text-muted-foreground">Diagnose and fix issues with your semantic document clustering system</p>
      </div>

      <Tabs defaultValue="dashboard" className="mb-8">
        <TabsList className="grid grid-cols-4 w-full">
          <Link href="/troubleshoot/dashboard" passHref>
            <TabsTrigger value="dashboard" asChild>
              <div>Dashboard</div>
            </TabsTrigger>
          </Link>
          <Link href="/troubleshoot" passHref>
            <TabsTrigger value="files" asChild>
              <div>File Processing</div>
            </TabsTrigger>
          </Link>
          <Link href="/troubleshoot/embeddings" passHref>
            <TabsTrigger value="embeddings" asChild>
              <div>Embeddings</div>
            </TabsTrigger>
          </Link>
          <Link href="/troubleshoot/clustering" passHref>
            <TabsTrigger value="clustering" asChild>
              <div>Clustering</div>
            </TabsTrigger>
          </Link>
        </TabsList>
      </Tabs>

      {children}
    </div>
  )
}
