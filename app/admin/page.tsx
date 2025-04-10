import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatabaseStatus } from "@/components/database-status"
import ErrorBoundary from "@/components/error-boundary"

export default function AdminPage() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your application settings and database</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <DatabaseStatus />

          <Card>
            <CardHeader>
              <CardTitle>Application Status</CardTitle>
              <CardDescription>View the status of your application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>OpenAI API</span>
                  <span className="text-green-500">Connected</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Supabase</span>
                  <span className="text-green-500">Connected</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Service Worker</span>
                  <span className="text-green-500">Registered</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  )
}
