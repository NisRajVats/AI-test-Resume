import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface LoadingFallbackProps {
  title?: string
  description?: string
}

export function LoadingFallback({
  title = "Loading...",
  description = "Please wait while we load your content",
}: LoadingFallbackProps) {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800"></div>
      </CardContent>
    </Card>
  )
}
