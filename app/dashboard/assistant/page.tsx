import ErrorBoundary from "@/components/error-boundary"
import { ClientAssistant } from "@/components/client-assistant"

export default function AIAssistant() {
  return (
    <ErrorBoundary>
      <ClientAssistant />
    </ErrorBoundary>
  )
}
