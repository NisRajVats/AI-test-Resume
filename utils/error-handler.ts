// Error types
export enum ErrorType {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  API = "api",
  NETWORK = "network",
  STORAGE = "storage",
  UNKNOWN = "unknown",
}

// Error severity
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Error interface
export interface AppError {
  type: ErrorType
  message: string
  severity: ErrorSeverity
  timestamp: string
  context?: Record<string, any>
  originalError?: any
}

// Error storage
const ERROR_STORAGE_KEY = "app_errors"
const MAX_STORED_ERRORS = 50

// Log error to console and storage
export function logError(
  type: ErrorType,
  message: string,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context?: Record<string, any>,
  originalError?: any,
): AppError {
  const error: AppError = {
    type,
    message,
    severity,
    timestamp: new Date().toISOString(),
    context,
    originalError,
  }

  // Log to console
  console.error(`[${error.type.toUpperCase()}] ${error.message}`, {
    severity: error.severity,
    context: error.context,
    originalError: error.originalError,
  })

  // Store in localStorage
  try {
    const storedErrors = JSON.parse(localStorage.getItem(ERROR_STORAGE_KEY) || "[]")
    storedErrors.unshift(error)

    // Keep only the most recent errors
    if (storedErrors.length > MAX_STORED_ERRORS) {
      const slicedErrors = storedErrors.slice(0, MAX_STORED_ERRORS)
      localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(slicedErrors))
    } else {
      localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(storedErrors))
    }

    // If critical error, send to server immediately
    if (severity === ErrorSeverity.CRITICAL) {
      sendErrorToServer(error)
    }

    return error
  } catch (e) {
    console.error("Failed to store error in localStorage", e)
    return error
  }
}

// Get stored errors
export function getStoredErrors(): AppError[] {
  try {
    return JSON.parse(localStorage.getItem(ERROR_STORAGE_KEY) || "[]")
  } catch (e) {
    console.error("Failed to retrieve errors from localStorage", e)
    return []
  }
}

// Clear stored errors
export function clearStoredErrors(): void {
  localStorage.removeItem(ERROR_STORAGE_KEY)
}

// Send error to server for logging
async function sendErrorToServer(error: AppError): Promise<void> {
  try {
    // In a real implementation, this would send the error to your server
    // For now, we'll just log it
    console.log("Sending critical error to server:", error)

    // Example implementation:
    // await fetch('/api/log-error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(error)
    // });
  } catch (e) {
    console.error("Failed to send error to server", e)
  }
}

// Create a user-friendly error message
export function getUserFriendlyErrorMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.AUTHENTICATION:
      return "Authentication error. Please sign in again."
    case ErrorType.AUTHORIZATION:
      return "You do not have permission to perform this action."
    case ErrorType.VALIDATION:
      return "Please check your input and try again."
    case ErrorType.API:
      return "We encountered an issue connecting to our services."
    case ErrorType.NETWORK:
      return "Network error. Please check your internet connection."
    case ErrorType.STORAGE:
      return "Storage error. We couldn't save your data."
    default:
      return "An unexpected error occurred. Please try again later."
  }
}
