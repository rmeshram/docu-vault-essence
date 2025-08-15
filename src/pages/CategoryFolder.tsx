import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Calendar, Grid, List, Activity, Tag, Filter, Search, 
  SortDesc, Download, Share, Eye, Edit, Trash2, FileText, Image, 
  File, MoreHorizontal, Clock, CheckCircle, AlertCircle, Star,
  Users, Lock, Globe, ChevronDown, ChevronRight, X, Plus
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface Document {
  id: string;
  title: string;
  type: 'PDF' | 'IMAGE' | 'DOC' | 'EXCEL';
  size: string;
  uploadDate: Date;
  lastModified: Date;
  tags: string[];
  isShared: boolean;
  accessLevel: 'private' | 'family' | 'public';
  aiSummary: string;
  extractedText: string;
  thumbnail?: string;
  status: 'processed' | 'processing' | 'error';
  metadata?: {
    pages?: number;
    wordCount?: number;
    language?: string;
  };
}


const timelineData = [
  {
    date: '2024-03-20',
    events: [
      { id: '1', title: 'Income Tax Return 2024', type: 'modified', time: '14:30' },
    ]
  },
  {
    date: '2024-03-15',
    events: [
      { id: '1', title: 'Income Tax Return 2024', type: 'uploaded', time: '09:15' },
    ]
  },
  {
    date: '2024-03-10',
    events: [
      { id: '2', title: 'Salary Certificate March 2024', type: 'uploaded', time: '16:45' },
    ]
  },
  {
    date: '2024-02-28',
    events: [
      { id: '3', title: 'PAN Card Copy', type: 'uploaded', time: '11:20' },
    ]
  }
];

const smartTags = [
  { name: 'Important', count: 15, color: 'bg-destructive/10 text-destructive border-destructive/20' },
  { name: 'Tax Related', count: 8, color: 'bg-success/10 text-success border-success/20' },
  { name: 'Expiring Soon', count: 3, color: 'bg-warning/10 text-warning border-warning/20' },
  { name: 'Family Shared', count: 12, color: 'bg-primary/10 text-primary border-primary/20' },
  { name: 'Government', count: 6, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { name: 'Financial', count: 11, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
];

export default function CategoryFolder() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showSmartTags, setShowSmartTags] = useState(false);
  const [expandedTimelineItems, setExpandedTimelineItems] = useState<string[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categoryName, setCategoryName] = useState('Documents');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) {
      fetchCategoryAndDocuments();
    }
  }, [categoryId]);

  const fetchCategoryAndDocuments = async () => {
    try {
      setLoading(true);
      
      // Fetch category details
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (categoryError) {
        console.error('Error fetching category:', categoryError);
        return;
      }

      setCategoryName(category?.name || 'Documents');

      // Fetch documents in this category
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select(`
          *,
          document_tags (
            tag,
            is_ai_generated
          )
        `)
        .eq('category', category?.name)
        .order('created_at', { ascending: false });

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
        return;
      }

      // Transform data to match Document interface
      const transformedDocuments: Document[] = documentsData.map(doc => ({
        id: doc.id,
        title: doc.name,
        type: getFileType(doc.mime_type || doc.file_type),
        size: formatFileSize(doc.size),
        uploadDate: new Date(doc.created_at),
        lastModified: new Date(doc.updated_at),
        tags: doc.document_tags?.map((tag: any) => tag.tag) || doc.ai_tags || [],
        isShared: doc.shared_with_family || false,
        accessLevel: doc.shared_with_family ? 'family' : 'private',
        aiSummary: doc.ai_summary || 'No AI summary available',
        extractedText: doc.extracted_text || '',
        status: doc.status || 'processed',
        metadata: {
          pages: doc.pages,
          language: doc.language_detected
        }
      }));

      setDocuments(transformedDocuments);
    } catch (error) {
      console.error('Error in fetchCategoryAndDocuments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (mimeType?: string): 'PDF' | 'IMAGE' | 'DOC' | 'EXCEL' => {
    if (!mimeType) return 'DOC';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('image')) return 'IMAGE';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'EXCEL';
    return 'DOC';
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '0 KB';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredDocuments = documents
    .filter(doc => 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter(doc => 
      selectedTags.length === 0 || 
      selectedTags.some(tag => doc.tags.includes(tag))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.uploadDate.getTime() - a.uploadDate.getTime();
        case 'oldest':
          return a.uploadDate.getTime() - b.uploadDate.getTime();
        case 'a-z':
          return a.title.localeCompare(b.title);
        case 'size':
          return parseFloat(b.size) - parseFloat(a.size);
        default:
          return 0;
      }
    });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF': return FileText;
      case 'IMAGE': return Image;
      default: return File;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed': return CheckCircle;
      case 'processing': return Clock;
      case 'error': return AlertCircle;
      default: return Clock;
    }
  };

  const toggleTimelineExpansion = (date: string) => {
    setExpandedTimelineItems(prev => 
      prev.includes(date) 
        ? prev.filter(item => item !== date)
        : [...prev, date]
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

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
                onClick={() => navigate('/categories')}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{categoryName}</h1>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {filteredDocuments.length} documents
                  </Badge>
                </div>
                <p className="text-white/80">
                  Last updated: {formatDate(new Date())}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowSmartTags(!showSmartTags)}
                className="text-white hover:bg-white/20"
              >
                <Tag className="w-4 h-4 mr-2" />
                Smart Tags
              </Button>
              <Button className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Plus className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/20 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-white text-primary' : 'text-white hover:bg-white/20'}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-white text-primary' : 'text-white hover:bg-white/20'}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('timeline')}
                  className={viewMode === 'timeline' ? 'bg-white text-primary' : 'text-white hover:bg-white/20'}
                >
                  <Activity className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-white/20 border-white/30 text-white">
                  <SortDesc className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="a-z">A to Z</SelectItem>
                  <SelectItem value="size">File Size</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Smart Tags Panel */}
        {showSmartTags && (
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Smart Tags</h3>
                  <p className="text-sm text-muted-foreground">AI-generated tags to organize your documents</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSmartTags(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {smartTags.map((tag) => (
                  <Button
                    key={tag.name}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag.name)
                          ? prev.filter(t => t !== tag.name)
                          : [...prev, tag.name]
                      );
                    }}
                    className={`${tag.color} ${
                      selectedTags.includes(tag.name) ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag.name}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {tag.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Based on View Mode */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => {
              const FileIcon = getFileIcon(doc.type);
              const StatusIcon = getStatusIcon(doc.status);
              
              return (
                <Card 
                  key={doc.id} 
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/document/${doc.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                          <FileIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {doc.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">{doc.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <StatusIcon className={`w-4 h-4 ${
                          doc.status === 'processed' ? 'text-success' :
                          doc.status === 'processing' ? 'text-warning' : 'text-destructive'
                        }`} />
                        {doc.isShared && (
                          <Users className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {doc.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{doc.tags.length - 3} more
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {doc.aiSummary}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(doc.uploadDate)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Share className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => {
              const FileIcon = getFileIcon(doc.type);
              const StatusIcon = getStatusIcon(doc.status);
              
              return (
                <Card 
                  key={doc.id} 
                  className="hover:shadow-md transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/document/${doc.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileIcon className="w-5 h-5 text-primary" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold hover:text-primary transition-colors">
                            {doc.title}
                          </h3>
                          <StatusIcon className={`w-4 h-4 ${
                            doc.status === 'processed' ? 'text-success' :
                            doc.status === 'processing' ? 'text-warning' : 'text-destructive'
                          }`} />
                          {doc.isShared && <Users className="w-4 h-4 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {doc.aiSummary}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {doc.tags.slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{doc.size}</span>
                        <span>{formatDate(doc.uploadDate)}</span>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Share className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {viewMode === 'timeline' && (
          <div className="space-y-6">
            {timelineData.map((timelineItem) => (
              <div key={timelineItem.date} className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant="ghost"
                    onClick={() => toggleTimelineExpansion(timelineItem.date)}
                    className="flex items-center gap-2 h-auto p-2"
                  >
                    {expandedTimelineItems.includes(timelineItem.date) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="font-semibold">
                      {new Date(timelineItem.date).toLocaleDateString('en-IN', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <Badge variant="secondary">
                      {timelineItem.events.length} events
                    </Badge>
                  </Button>
                </div>

                {expandedTimelineItems.includes(timelineItem.date) && (
                  <div className="ml-12 space-y-3">
                    {timelineItem.events.map((event) => {
                      const doc = documents.find(d => d.id === event.id);
                      if (!doc) return null;
                      
                      const FileIcon = getFileIcon(doc.type);
                      
                      return (
                        <Card 
                          key={event.id} 
                          className="hover:shadow-md transition-all duration-300 cursor-pointer"
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <FileIcon className="w-5 h-5 text-primary" />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold hover:text-primary transition-colors">
                                    {event.title}
                                  </h3>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      event.type === 'uploaded' ? 'border-success/20 text-success' :
                                      event.type === 'modified' ? 'border-warning/20 text-warning' :
                                      'border-primary/20 text-primary'
                                    }`}
                                  >
                                    {event.type}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>{event.time}</span>
                                  <span>{doc.size}</span>
                                  <div className="flex gap-1">
                                    {doc.tags.slice(0, 2).map((tag) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Details Modal */}
      {selectedDocument && (
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  {(() => {
                    const FileIcon = getFileIcon(selectedDocument.type);
                    return <FileIcon className="w-5 h-5 text-primary" />;
                  })()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedDocument.title}</h2>
                  <p className="text-sm text-muted-foreground font-normal">
                    {selectedDocument.type} • {selectedDocument.size}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        <p className="text-muted-foreground">Document preview not available</p>
                        <Button variant="outline" className="mt-2">
                          <Download className="w-4 h-4 mr-2" />
                          Download to View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Summary */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">AI Summary</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedDocument.aiSummary}</p>
                  </CardContent>
                </Card>

                {/* Extracted Text */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Extracted Text</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-48 overflow-y-auto">
                      <p className="text-sm whitespace-pre-wrap">{selectedDocument.extractedText}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                    <h3 className="text-lg font-semibold">Document Info</h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Upload Date</label>
                      <p className="text-sm">{formatDate(selectedDocument.uploadDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Modified</label>
                      <p className="text-sm">{formatDate(selectedDocument.lastModified)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">File Size</label>
                      <p className="text-sm">{selectedDocument.size}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Access Level</label>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedDocument.accessLevel === 'private' && <Lock className="w-4 h-4 text-muted-foreground" />}
                        {selectedDocument.accessLevel === 'family' && <Users className="w-4 h-4 text-primary" />}
                        {selectedDocument.accessLevel === 'public' && <Globe className="w-4 h-4 text-success" />}
                        <span className="text-sm capitalize">{selectedDocument.accessLevel}</span>
                      </div>
                    </div>
                    {selectedDocument.metadata && (
                      <>
                        {selectedDocument.metadata.pages && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Pages</label>
                            <p className="text-sm">{selectedDocument.metadata.pages}</p>
                          </div>
                        )}
                        {selectedDocument.metadata.language && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Language</label>
                            <p className="text-sm">{selectedDocument.metadata.language}</p>
                          </div>
                        )}
                      </>
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
                      {selectedDocument.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}