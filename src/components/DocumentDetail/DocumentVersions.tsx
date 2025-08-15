import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { History, Download, Eye, Upload, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  file_url?: string
  file_size?: number
  created_at: string
  created_by: string
  change_description?: string
}

export function DocumentVersions() {
  const { documentId } = useParams()
  const { toast } = useToast()
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (documentId) {
      fetchVersions()
    }
  }, [documentId])

  const fetchVersions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false })

      if (error) {
        console.error('Error fetching versions:', error)
        return
      }

      setVersions(data || [])
    } catch (error) {
      console.error('Error in fetchVersions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const handleDownload = (fileUrl?: string) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank')
    } else {
      toast({
        title: 'Download Unavailable',
        description: 'This version is not available for download',
        variant: 'destructive'
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Version History ({versions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                  <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-8 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No version history available</p>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload New Version
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {versions.map((version, index) => (
              <div key={version.id}>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">Version {version.version_number}</span>
                      {index === 0 && (
                        <Badge className="bg-success/20 text-success">Current</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{formatDate(version.created_at)}</p>
                      <p>Size: {formatFileSize(version.file_size)}</p>
                      {version.change_description && (
                        <p className="text-xs italic">{version.change_description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(version.file_url)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(version.file_url)}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </Button>
                  </div>
                </div>
                {index < versions.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
            
            <Separator />
            
            <div className="text-center pt-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload New Version
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}