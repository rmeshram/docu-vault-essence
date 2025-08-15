import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery"
import { format } from "date-fns"
import { 
  History, 
  Download, 
  Eye, 
  FileText, 
  Clock,
  ArrowLeft,
  ExternalLink
} from "lucide-react"
import { useParams, useNavigate } from "react-router-dom"

const VersionHistory = () => {
  const { documentId } = useParams()
  const navigate = useNavigate()
  
  const { data: versions, loading } = useSupabaseQuery(
    'document_versions',
    (qb) => qb.eq('document_id', documentId).order('version_number', { ascending: false }),
    { enabled: !!documentId, realtime: true }
  )

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Version History</h1>
          </div>
          <p className="text-muted-foreground">
            Document version history and changes
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {!versions || versions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Version History</h3>
              <p className="text-muted-foreground text-center max-w-md">
                This document doesn't have any previous versions yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          versions.map((version, index) => (
            <Card key={version.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant={index === 0 ? "default" : "secondary"}>
                      Version {version.version_number}
                    </Badge>
                    {index === 0 && (
                      <Badge variant="outline" className="text-green-600">
                        Latest
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(version.created_at), 'MMM dd, yyyy • h:mm a')}
                  </span>
                </div>
                {version.changes_description && (
                  <CardDescription>{version.changes_description}</CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{(version.file_size / 1024 / 1024).toFixed(1)} MB</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(version.created_at), 'h:mm a')}</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {version.file_url && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(version.file_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default VersionHistory