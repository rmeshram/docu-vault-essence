import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Tag, Search, Filter, Plus, Edit, Trash2, Brain,
  FileText, Calendar, Clock, TrendingUp, AlertCircle, Star,
  Users, Lock, Globe, Sparkles, Zap, Target
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SmartTag {
  id: string;
  name: string;
  description: string;
  confidence: number;
  documentCount: number;
  category: 'priority' | 'status' | 'type' | 'temporal' | 'custom';
  color: string;
  aiGenerated: boolean;
  createdDate: Date;
  lastUsed: Date;
  relatedTags: string[];
  suggestedActions?: string[];
}

interface TaggedDocument {
  id: string;
  title: string;
  type: string;
  tags: string[];
  uploadDate: Date;
  thumbnail?: string;
}

const mockSmartTags: SmartTag[] = [
  {
    id: '1',
    name: 'Expiring Soon',
    description: 'Documents with upcoming deadlines or expiration dates',
    confidence: 96,
    documentCount: 8,
    category: 'temporal',
    color: 'bg-warning/10 text-warning border-warning/20',
    aiGenerated: true,
    createdDate: new Date('2024-01-15'),
    lastUsed: new Date('2024-03-20'),
    relatedTags: ['Important', 'Review Required'],
    suggestedActions: ['Set reminders', 'Schedule renewals', 'Create calendar events']
  },
  {
    id: '2',
    name: 'High Priority',
    description: 'Critical documents requiring immediate attention',
    confidence: 92,
    documentCount: 15,
    category: 'priority',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    aiGenerated: true,
    createdDate: new Date('2024-01-10'),
    lastUsed: new Date('2024-03-22'),
    relatedTags: ['Important', 'Urgent'],
    suggestedActions: ['Review immediately', 'Add to quick access', 'Notify family members']
  },
  {
    id: '3',
    name: 'Tax Deductible',
    description: 'Documents that can be used for tax deductions',
    confidence: 88,
    documentCount: 23,
    category: 'type',
    color: 'bg-success/10 text-success border-success/20',
    aiGenerated: true,
    createdDate: new Date('2024-02-01'),
    lastUsed: new Date('2024-03-18'),
    relatedTags: ['Financial', 'Tax Related'],
    suggestedActions: ['Organize for filing', 'Calculate savings', 'Consult CA']
  },
  {
    id: '4',
    name: 'Duplicate Detected',
    description: 'Documents that appear to be duplicates of existing files',
    confidence: 94,
    documentCount: 6,
    category: 'status',
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    aiGenerated: true,
    createdDate: new Date('2024-02-15'),
    lastUsed: new Date('2024-03-19'),
    relatedTags: ['Review Required', 'Cleanup'],
    suggestedActions: ['Review duplicates', 'Merge files', 'Delete redundant copies']
  },
  {
    id: '5',
    name: 'Family Shared',
    description: 'Documents shared with family members or requiring family access',
    confidence: 85,
    documentCount: 31,
    category: 'custom',
    color: 'bg-primary/10 text-primary border-primary/20',
    aiGenerated: false,
    createdDate: new Date('2024-01-20'),
    lastUsed: new Date('2024-03-21'),
    relatedTags: ['Shared', 'Important'],
    suggestedActions: ['Update permissions', 'Notify family', 'Sync calendar']
  },
  {
    id: '6',
    name: 'Government Document',
    description: 'Official government-issued documents and certificates',
    confidence: 97,
    documentCount: 12,
    category: 'type',
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    aiGenerated: true,
    createdDate: new Date('2024-01-25'),
    lastUsed: new Date('2024-03-20'),
    relatedTags: ['Official', 'Identity'],
    suggestedActions: ['Verify validity', 'Create backups', 'Set renewal alerts']
  }
];

const mockTaggedDocuments: TaggedDocument[] = [
  {
    id: '1',
    title: 'Health Insurance Policy',
    type: 'PDF',
    tags: ['Expiring Soon', 'High Priority', 'Family Shared'],
    uploadDate: new Date('2024-02-15')
  },
  {
    id: '2',
    title: 'Life Insurance Premium Receipt',
    type: 'PDF',
    tags: ['Tax Deductible', 'Financial'],
    uploadDate: new Date('2024-03-10')
  },
  {
    id: '3',
    title: 'Aadhaar Card',
    type: 'IMAGE',
    tags: ['Government Document', 'Identity', 'Family Shared'],
    uploadDate: new Date('2024-01-20')
  }
];

export default function SmartTags() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<SmartTag | null>(null);
  const [showTagDetails, setShowTagDetails] = useState(false);

  const filteredTags = mockSmartTags.filter(tag => {
    const matchesSearch = tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tag.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tag.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const taggedDocuments = mockTaggedDocuments.filter(doc =>
    selectedTag ? doc.tags.includes(selectedTag.name) : false
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'priority': return AlertCircle;
      case 'status': return Target;
      case 'type': return FileText;
      case 'temporal': return Clock;
      case 'custom': return Star;
      default: return Tag;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'priority': return 'text-destructive';
      case 'status': return 'text-warning';
      case 'type': return 'text-success';
      case 'temporal': return 'text-primary';
      case 'custom': return 'text-purple-600';
      default: return 'text-muted-foreground';
    }
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
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-xl blur animate-pulse"></div>
                    <Sparkles className="w-8 h-8 relative z-10" />
                  </div>
                  <h1 className="text-3xl font-bold">Smart Tags</h1>
                  <Badge className="bg-white/20 text-white border-white/30">
                    <Brain className="w-3 h-3 mr-1" />
                    AI Powered
                  </Badge>
                </div>
                <p className="text-white/90 text-lg">
                  Intelligent document organization with AI-generated tags
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <Zap className="w-4 h-4 mr-2" />
                Generate New Tags
              </Button>
              <Button className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Tag
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{mockSmartTags.length}</p>
                  <p className="text-white/80 text-sm">Total Tags</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {mockSmartTags.filter(tag => tag.aiGenerated).length}
                  </p>
                  <p className="text-white/80 text-sm">AI Generated</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {mockSmartTags.reduce((sum, tag) => sum + tag.documentCount, 0)}
                  </p>
                  <p className="text-white/80 text-sm">Tagged Documents</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {Math.round(mockSmartTags.reduce((sum, tag) => sum + tag.confidence, 0) / mockSmartTags.length)}%
                  </p>
                  <p className="text-white/80 text-sm">Avg Confidence</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tags by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="type">Document Type</SelectItem>
                <SelectItem value="temporal">Time-based</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tags Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTags.map((tag) => {
            const CategoryIcon = getCategoryIcon(tag.category);
            
            return (
              <Card 
                key={tag.id}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => {
                  setSelectedTag(tag);
                  setShowTagDetails(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${tag.color}`}>
                        <Tag className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {tag.name}
                          </h3>
                          {tag.aiGenerated && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                              <Brain className="w-3 h-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <CategoryIcon className={`w-4 h-4 ${getCategoryColor(tag.category)}`} />
                          <span className="text-sm text-muted-foreground capitalize">
                            {tag.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{tag.documentCount}</p>
                      <p className="text-xs text-muted-foreground">documents</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {tag.description}
                  </p>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">AI Confidence</span>
                        <span className="text-xs text-muted-foreground">{tag.confidence}%</span>
                      </div>
                      <Progress value={tag.confidence} className="h-2" />
                    </div>

                    {tag.relatedTags.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-2">Related Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {tag.relatedTags.slice(0, 3).map((relatedTag) => (
                            <Badge key={relatedTag} variant="secondary" className="text-xs">
                              {relatedTag}
                            </Badge>
                          ))}
                          {tag.relatedTags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{tag.relatedTags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        Last used: {tag.lastUsed.toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* AI Suggestions */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500/15 to-purple-500/5 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">AI Tag Suggestions</h3>
                <p className="text-sm text-muted-foreground">
                  New smart tags we recommend based on your documents
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-dashed border-border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-success" />
                  </div>
                  <h4 className="font-medium">Quarterly Review</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Documents that need quarterly review
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  <Plus className="w-3 h-3 mr-1" />
                  Create Tag
                </Button>
              </div>
              
              <div className="p-4 border border-dashed border-border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-warning" />
                  </div>
                  <h4 className="font-medium">Action Required</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Documents requiring immediate action
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  <Plus className="w-3 h-3 mr-1" />
                  Create Tag
                </Button>
              </div>
              
              <div className="p-4 border border-dashed border-border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <h4 className="font-medium">Family Important</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Critical documents for family members
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  <Plus className="w-3 h-3 mr-1" />
                  Create Tag
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tag Details Modal */}
      {selectedTag && (
        <Dialog open={showTagDetails} onOpenChange={setShowTagDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedTag.color}`}>
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{selectedTag.name}</h2>
                    {selectedTag.aiGenerated && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        <Brain className="w-3 h-3 mr-1" />
                        AI Generated
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-normal">
                    {selectedTag.description}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Tagged Documents */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">
                      Tagged Documents ({taggedDocuments.length})
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {taggedDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{doc.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{doc.type}</span>
                              <span className="text-xs text-muted-foreground">
                                {doc.uploadDate.toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {doc.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Suggested Actions */}
                {selectedTag.suggestedActions && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">Suggested Actions</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedTag.suggestedActions.map((action, index) => (
                          <Button key={index} variant="outline" className="justify-start">
                            <Zap className="w-4 h-4 mr-2" />
                            {action}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                {/* Tag Statistics */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Tag Statistics</h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">AI Confidence</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={selectedTag.confidence} className="flex-1" />
                        <span className="text-sm font-medium">{selectedTag.confidence}%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Document Count</label>
                      <p className="text-2xl font-bold text-primary">{selectedTag.documentCount}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Category</label>
                      <div className="flex items-center gap-2 mt-1">
                        {(() => {
                          const CategoryIcon = getCategoryIcon(selectedTag.category);
                          return <CategoryIcon className={`w-4 h-4 ${getCategoryColor(selectedTag.category)}`} />;
                        })()}
                        <span className="text-sm capitalize">{selectedTag.category}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <p className="text-sm">{selectedTag.createdDate.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Used</label>
                      <p className="text-sm">{selectedTag.lastUsed.toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Related Tags */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Related Tags</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedTag.relatedTags.map((relatedTag) => (
                        <Badge key={relatedTag} variant="secondary">
                          {relatedTag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Actions</h3>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Tag
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Apply to Documents
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Star className="w-4 h-4 mr-2" />
                      Add to Favorites
                    </Button>
                    <Button className="w-full" variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Tag
                    </Button>
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