import { useState, useRef } from 'react'
import { Upload, X, FileText, Image, File, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useDocumentUpload } from '@/hooks/useDocumentUpload'
import { useToast } from '@/hooks/use-toast'
import { Progress } from '@/components/ui/progress'

interface ChatFileUploadProps {
  onFileUploaded?: (documentId: string, fileName: string) => void
  disabled?: boolean
}

export function ChatFileUpload({ onFileUploaded, disabled }: ChatFileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{id: string, name: string, status: 'uploading' | 'completed' | 'error'}>>([])
  const { uploadDocument, uploading, progress } = useDocumentUpload()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    if (disabled) return

    const fileArray = Array.from(files)
    
    for (const file of fileArray) {
      const tempId = crypto.randomUUID()
      
      // Add file to uploading list
      setUploadedFiles(prev => [...prev, {
        id: tempId,
        name: file.name,
        status: 'uploading'
      }])

      try {
        const result = await uploadDocument(file, {
          category: 'Personal',
          tags: ['chat', 'uploaded'],
          enableAI: true,
          enableOCR: true
        })

        if (result) {
          // Update status to completed
          setUploadedFiles(prev => prev.map(f => 
            f.id === tempId 
              ? { ...f, id: result.documentId, status: 'completed' as const }
              : f
          ))

          toast({
            title: 'File Uploaded',
            description: `${file.name} has been processed and is ready for chat`,
          })

          onFileUploaded?.(result.documentId, file.name)
        }
      } catch (error) {
        console.error('Upload error:', error)
        
        // Update status to error
        setUploadedFiles(prev => prev.map(f => 
          f.id === tempId 
            ? { ...f, status: 'error' as const }
            : f
        ))

        toast({
          title: 'Upload Failed',
          description: `Failed to upload ${file.name}. Please try again.`,
          variant: 'destructive'
        })
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    if (disabled || !e.dataTransfer.files) return
    
    handleFiles(e.dataTransfer.files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && !disabled) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return Image
    } else if (['pdf', 'doc', 'docx'].includes(extension || '')) {
      return FileText
    } else {
      return File
    }
  }

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <Card 
        className={`
          border-2 border-dashed transition-colors cursor-pointer
          ${dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CardContent className="p-4">
          <div className="text-center">
            <Upload className={`w-8 h-8 mx-auto mb-2 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-sm text-muted-foreground">
              {dragOver 
                ? 'Drop files here to upload' 
                : 'Click to upload or drag & drop files'
              }
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOC, DOCX, images supported
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Progress */}
      {uploading && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Processing files...</p>
                <Progress value={progress} className="h-2 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file) => {
            const FileIcon = getFileIcon(file.name)
            
            return (
              <Card key={file.id} className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center
                      ${file.status === 'completed' ? 'bg-success/20' : 
                        file.status === 'error' ? 'bg-destructive/20' : 'bg-primary/20'}
                    `}>
                      {file.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : file.status === 'error' ? (
                        <X className="w-4 h-4 text-destructive" />
                      ) : (
                        <FileIcon className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.status === 'completed' ? 'Ready for chat' :
                         file.status === 'error' ? 'Upload failed' :
                         'Processing...'}
                      </p>
                    </div>

                    {(file.status === 'completed' || file.status === 'error') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}