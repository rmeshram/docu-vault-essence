import { useState, useRef } from 'react'
import { Upload, Camera, Mail, MessageCircle, FileText, Image, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useDocumentUpload } from '@/hooks/useDocumentUpload'
import { useToast } from '@/hooks/use-toast'
import { Progress } from '@/components/ui/progress'

interface UploadButtonProps {
  categoryName?: string
  onUploadComplete?: () => void
}

export function UploadButton({ categoryName, onUploadComplete }: UploadButtonProps) {
  const [showOptions, setShowOptions] = useState(false)
  const { uploadDocument, uploading, progress } = useDocumentUpload()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File, source: string) => {
    try {
      const result = await uploadDocument(file, {
        category: categoryName,
        tags: [source, 'uploaded'],
        enableAI: true,
        enableOCR: true
      })

      if (result) {
        toast({
          title: 'Upload Successful',
          description: `${file.name} has been uploaded and is being processed`,
        })
        onUploadComplete?.()
        setShowOptions(false)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading your file. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, source: string) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file, source)
    }
  }

  const uploadOptions = [
    {
      id: 'gallery',
      label: 'Gallery',
      icon: Image,
      accept: 'image/*,application/pdf,.doc,.docx',
      description: 'Choose from device storage'
    },
    {
      id: 'camera',
      label: 'Camera',
      icon: Camera,
      accept: 'image/*',
      description: 'Take a photo',
      capture: 'environment' as const
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt',
      description: 'Upload documents'
    }
  ]

  if (uploading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Uploading...</h3>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">{progress}% complete</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
        onChange={(e) => handleFileSelect(e, 'gallery')}
      />
      <input
        ref={cameraInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e, 'camera')}
      />

      {!showOptions ? (
        <Button
          onClick={() => setShowOptions(true)}
          className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Upload Document
        </Button>
      ) : (
        <Card className="absolute top-0 right-0 z-50 min-w-[300px] shadow-lg">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Upload Options</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOptions(false)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              
              {uploadOptions.map((option) => (
                <Button
                  key={option.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => {
                    if (option.id === 'camera') {
                      cameraInputRef.current?.click()
                    } else {
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <option.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </Button>
              ))}

              <div className="pt-3 border-t">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      toast({
                        title: 'Coming Soon',
                        description: 'Email import feature will be available soon',
                      })
                    }}
                  >
                    <Mail className="w-4 h-4 mr-3" />
                    Import from Email
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      toast({
                        title: 'Coming Soon',
                        description: 'WhatsApp import feature will be available soon',
                      })
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-3" />
                    Import from WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}