"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { uploadFileWithProgress, getInterruptedUploads } from "@/utils/file-handler"

export function ResumeUpload({ onUploadComplete }: { onUploadComplete: (url: string) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [interruptedUploads, setInterruptedUploads] = useState<any[]>([])
  const { toast } = useToast()
  const { user } = useAuth()

  // Check for interrupted uploads on component mount
  useEffect(() => {
    if (user) {
      const interrupted = getInterruptedUploads(user.id)
      setInterruptedUploads(interrupted)
    }
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Check file type
      if (
        !["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(
          selectedFile.type,
        )
      ) {
        setError("Please upload a PDF or DOCX file")
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or DOCX file",
          variant: "destructive",
        })
        return
      }

      // Check file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("Please upload a file smaller than 5MB")
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file || !user) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Upload file with progress tracking
      const { url } = await uploadFileWithProgress(
        file,
        user.id,
        "resumes",
        (progress) => {
          setUploadProgress(progress)
        },
        (error) => {
          setError(error.message)
          toast({
            title: "Upload error",
            description: error.message,
            variant: "destructive",
          })
        },
      )

      toast({
        title: "Resume uploaded",
        description: "Your resume has been uploaded successfully",
      })

      // Call the callback with the URL
      onUploadComplete(url)
    } catch (error) {
      console.error("Error uploading resume:", error)
      setError(error.message || "There was an error uploading your resume")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Resume</CardTitle>
        <CardDescription>Upload your resume in PDF or DOCX format</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        {error && (
          <Alert variant="destructive" className="w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {interruptedUploads.length > 0 && (
          <Alert className="w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Interrupted Uploads</AlertTitle>
            <AlertDescription>
              You have {interruptedUploads.length} interrupted uploads. Would you like to resume?
              <Button
                variant="link"
                className="p-0 h-auto ml-2"
                onClick={() => {
                  // Implementation for resuming uploads would go here
                  toast({
                    title: "Resuming upload",
                    description: "Your upload is being resumed",
                  })
                }}
              >
                Resume
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-md cursor-pointer hover:border-primary"
          onClick={() => document.getElementById("resume-upload")?.click()}
        >
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
          <p className="text-xs text-muted-foreground">PDF or DOCX (max 5MB)</p>
          <input id="resume-upload" type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileChange} />
        </div>

        {file && (
          <div className="flex items-center space-x-2 text-sm w-full">
            <FileText className="h-4 w-4" />
            <span className="flex-1 truncate">{file.name}</span>
            {isUploading && <span>{uploadProgress}%</span>}
            {!isUploading && uploadProgress === 100 && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
        )}

        {isUploading && <Progress value={uploadProgress} className="w-full h-2" />}
      </CardContent>
      <CardFooter>
        <Button onClick={handleUpload} disabled={!file || isUploading} className="w-full">
          {isUploading ? `Uploading... ${uploadProgress}%` : "Upload and Analyze"}
        </Button>
      </CardFooter>
    </Card>
  )
}
