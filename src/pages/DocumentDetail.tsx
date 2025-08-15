import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Download, Share, Edit, Trash2, FileText, Image, 
  File, Star, Users, Lock, Globe, Calendar, Tag, Eye, MoreHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  name: string;
  mime_type?: string;
  file_type?: string;
  size: number;
  created_at: string;
  updated_at: string;
  ai_summary?: string;
  extracted_text?: string;
  status: string;
  pages?: number;
  language_detected?: string;
  shared_with_family: boolean;
  ai_tags?: string[];
  path?: string;
  category?: string;
}

export default function DocumentDetail() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          document_tags (
            tag,
            is_ai_generated
          )
        `)
        .eq('id', documentId)
        .single();

      if (error) {
        console.error('Error fetching document:', error);
        toast({
          title: "Error",
          description: "Failed to load document",
          variant: "destructive",
        });
        return;
      }

      setDocument(data);
    } catch (error) {
      console.error('Error in fetchDocument:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return File;
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('image')) return Image;
    return File;
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl font-semibold mb-2">Document Not Found</p>
          <p className="text-muted-foreground mb-4">The document you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => navigate('/categories')}>
            Back to Categories
          </Button>
        </div>
      </div>
    );
  }

  const FileIcon = getFileIcon(document.mime_type || document.file_type);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-header text-white">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{document.name}</h1>
                  <p className="text-white/80">
                    {formatFileSize(document.size)} • {formatDate(document.created_at)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-white hover:bg-white/20">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/20">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/20">
                <Star className="w-4 h-4 mr-2" />
                Favorite
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Preview */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Document Preview</h3>
              </CardHeader>
              <CardContent>
                <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Preview not available</p>
                    <p className="text-sm text-muted-foreground mb-4">Click download to view the full document</p>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download to View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Summary */}
            {document.ai_summary && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">AI Summary</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{document.ai_summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Comments & Collaboration</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center text-muted-foreground">
                    <p>Comment functionality coming soon...</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Extracted Text */}
            {document.extracted_text && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Extracted Text</h3>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto bg-muted/50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap font-mono">
                      {document.extracted_text}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Quick Actions</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button className="w-full" variant="outline">
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button className="w-full" variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Tags
                </Button>
                <Button className="w-full" variant="outline">
                  <Star className="w-4 h-4 mr-2" />
                  Add to Favorites
                </Button>
                <Separator />
                <Button className="w-full" variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </CardContent>
            </Card>

            {/* Document Info */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Document Information</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">File Name</label>
                  <p className="text-sm mt-1">{document.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="text-sm mt-1">{document.category || 'Uncategorized'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Upload Date</label>
                  <p className="text-sm mt-1">{formatDate(document.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Modified</label>
                  <p className="text-sm mt-1">{formatDate(document.updated_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">File Size</label>
                  <p className="text-sm mt-1">{formatFileSize(document.size)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={document.status === 'processed' ? 'default' : 'secondary'}>
                      {document.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sharing</label>
                  <div className="flex items-center gap-2 mt-1">
                    {document.shared_with_family ? (
                      <>
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-sm">Family Shared</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Private</span>
                      </>
                    )}
                  </div>
                </div>
                {document.pages && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Pages</label>
                    <p className="text-sm mt-1">{document.pages}</p>
                  </div>
                )}
                {document.language_detected && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Language</label>
                    <p className="text-sm mt-1">{document.language_detected}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Tags</h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {document.ai_tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  )) || (
                    <p className="text-sm text-muted-foreground">No tags available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}