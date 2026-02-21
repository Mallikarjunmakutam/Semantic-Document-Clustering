// Error types for different components of the system
export enum ErrorSource {
  FileProcessing = "FILE_PROCESSING",
  TextExtraction = "TEXT_EXTRACTION",
  EmbeddingGeneration = "EMBEDDING_GENERATION",
  Clustering = "CLUSTERING",
  Database = "DATABASE",
  General = "GENERAL",
}

export enum ErrorSeverity {
  Info = "INFO",
  Warning = "WARNING",
  Error = "ERROR",
  Critical = "CRITICAL",
}

export interface SystemError {
  source: ErrorSource
  code: string
  message: string
  details?: any
  timestamp: string
  severity: ErrorSeverity
}

// Error codes for specific error types
export const ErrorCodes = {
  // File processing errors
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  UNSUPPORTED_FORMAT: "UNSUPPORTED_FORMAT",
  FILE_CORRUPTED: "FILE_CORRUPTED",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",

  // Text extraction errors
  EXTRACTION_FAILED: "EXTRACTION_FAILED",
  PDF_ENCRYPTED: "PDF_ENCRYPTED",
  EMPTY_CONTENT: "EMPTY_CONTENT",

  // Embedding errors
  EMBEDDING_API_ERROR: "EMBEDDING_API_ERROR",
  TOKEN_LIMIT_EXCEEDED: "TOKEN_LIMIT_EXCEEDED",
  INVALID_EMBEDDING_MODEL: "INVALID_EMBEDDING_MODEL",

  // Clustering errors
  CLUSTERING_FAILED: "CLUSTERING_FAILED",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
  ALGORITHM_CONVERGENCE_FAILURE: "ALGORITHM_CONVERGENCE_FAILURE",

  // Database errors
  DB_CONNECTION_ERROR: "DB_CONNECTION_ERROR",
  QUERY_ERROR: "QUERY_ERROR",

  // General errors
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  TIMEOUT: "TIMEOUT",
  INVALID_INPUT: "INVALID_INPUT",
}

// Create a system error
export function createSystemError(
  source: ErrorSource,
  code: string,
  message: string,
  severity: ErrorSeverity = ErrorSeverity.Error,
  details?: any,
): SystemError {
  return {
    source,
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    severity,
  }
}

// Log error to console and potentially to a monitoring service
export function logError(error: SystemError): void {
  // Format the error for console
  const formattedError = `[${error.severity}] [${error.source}] [${error.code}]: ${error.message}`

  // Log to console with appropriate level
  switch (error.severity) {
    case ErrorSeverity.Info:
      console.info(formattedError, error.details || "")
      break
    case ErrorSeverity.Warning:
      console.warn(formattedError, error.details || "")
      break
    case ErrorSeverity.Error:
    case ErrorSeverity.Critical:
      console.error(formattedError, error.details || "")
      break
  }

  // In a real implementation, you would send to a monitoring service
  // Example: sendToMonitoringService(error);
}

// Helper to handle errors in async functions
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  source: ErrorSource,
  defaultErrorCode: string = ErrorCodes.UNKNOWN_ERROR,
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    // Create and log the error
    const systemError = createSystemError(
      source,
      (error as any).code || defaultErrorCode,
      (error as Error).message || "An unknown error occurred",
      ErrorSeverity.Error,
      error,
    )

    logError(systemError)

    // Rethrow with additional context
    throw systemError
  }
}

// Helper to determine if an error is retryable
export function isRetryableError(error: SystemError): boolean {
  // Define which errors are retryable
  const retryableCodes = [ErrorCodes.TIMEOUT, ErrorCodes.DB_CONNECTION_ERROR, ErrorCodes.EMBEDDING_API_ERROR]

  return retryableCodes.includes(error.code)
}

// Retry a function with exponential backoff
export async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, initialDelayMs = 1000): Promise<T> {
  let retries = 0
  let delay = initialDelayMs

  while (true) {
    try {
      return await fn()
    } catch (error) {
      if (!(error as SystemError).code || !isRetryableError(error as SystemError) || retries >= maxRetries) {
        throw error
      }

      // Log retry attempt
      console.warn(`Retrying after error: ${(error as SystemError).message}. Attempt ${retries + 1} of ${maxRetries}`)

      // Wait with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Increase delay for next retry
      delay *= 2
      retries++
    }
  }
}
