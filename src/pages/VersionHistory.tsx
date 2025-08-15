import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, FileText, User, Download, Eye, RotateCcw, GitCompare, 
  GitBranch, Calendar, Filter, Search, SortDesc, ChevronRight,
  AlertCircle, CheckCircle, Edit, Trash2, MoreVertical, Copy,
  Share2, Archive, Star, Tag, Folder, History, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { documentService } from '@/services/documentService';
import { supabase } from '@/integrations/supabase/client';

interface DocumentVersion {
  id: string;
  version_number: number;
  document_id: string;
  document_name: string;
  created_at: string;
  created_by: string;
  creator_name?: string;
  creator_avatar?: string;
  file_size: number;
  change_summary: string;
  change_type: 'created' | 'updated' | 'ai_analysis' | 'category_change' | 'tags_updated' | 'shared' | 'permissions_changed';
  previous_version_id?: string;
  metadata: {
    category?: string;
    tags?: string[];
    ai_summary?: string;
    confidence_score?: number;
    processing_time?: number;
    changes?: {
      field: string;
      old_value: string;
      new_value: string;
    }[];
  };
}

const mockVersionHistory: DocumentVersion[] = [
  {
    id: '1',
    version_number: 5,
    document_id: 'doc1',
    document_name: 'Aadhar_Card_Final.pdf',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    created_by: 'user1',
    creator_name: 'You',
    file_size: 2457600, // 2.4 MB
    change_summary: 'AI re-analysis completed with improved OCR accuracy',
    change_type: 'ai_analysis',
    metadata: {
      category: 'Identity',
      ai_summary: 'Updated identity document with enhanced text extraction',
      confidence_score: 98.5,
      processing_time: 1200,
      changes: [
        { field: 'OCR Confidence', old_value: '95.2%', new_value: '98.5%' },
        { field: 'Text Accuracy', old_value: 'Good', new_value: 'Excellent' }
      ]
    }
  },
  {
    id: '2',
    version_number: 4,
    document_id: 'doc1',
    document_name: 'Aadhar_Card_Final.pdf',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    created_by: 'user2',
    creator_name: 'Priya Sharma',
    creator_avatar: '/placeholder.svg',
    file_size: 2457600,
    change_summary: 'Shared with family members with view permissions',
    change_type: 'shared',
    metadata: {
      category: 'Identity',
      changes: [
        { field: 'Sharing', old_value: 'Private', new_value: 'Family Shared' },
        { field: 'Permissions', old_value: 'Owner only', new_value: 'View access granted' }
      ]
    }
  },
  {
    id: '3',
    version_number: 3,
    document_id: 'doc2',
    document_name: 'Tax_Return_2024.pdf',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    created_by: 'user1',
    creator_name: 'You',
    file_size: 5242880, // 5 MB
    change_summary: 'Category updated from Personal to Tax Documents',
    change_type: 'category_change',
    metadata: {
      category: 'Tax Documents',
      tags: ['ITR', '2024', 'Income Tax'],
      changes: [
        { field: 'Category', old_value: 'Personal', new_value: 'Tax Documents' },
        { field: 'Tags', old_value: 'Personal, 2024', new_value: 'ITR, 2024, Income Tax' }
      ]
    }
  },
  {
    id: '4',
    version_number: 2,
    document_id: 'doc3',
    document_name: 'Health_Insurance_Policy.pdf',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    created_by: 'user3',
    creator_name: 'Raj Kumar',
    file_size: 3145728, // 3 MB
    change_summary: 'Original document uploaded and processed',
    change_type: 'created',
    metadata: {
      category: 'Insurance',
      tags: ['Health', 'Policy', 'Family'],
      ai_summary: 'Health insurance policy document with coverage details',
      confidence_score: 96.8,
      processing_time: 1850
    }
  },
  {
    id: '5',
    version_number: 6,
    document_id: 'doc4',
    document_name: 'Bank_Statement_March.pdf',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    created_by: 'user1',
    creator_name: 'You',
    file_size: 1572864, // 1.5 MB
    change_summary: 'Tags updated with AI suggestions',
    change_type: 'tags_updated',
    metadata: {
      category: 'Banking',
      tags: ['Statement', 'March', 'HDFC', 'Salary'],
      changes: [
        { field: 'Tags', old_value: 'Statement, March', new_value: 'Statement, March, HDFC, Salary' }
      ]
    }
  }
];

const changeTypeColors = {
  'created': 'bg-success/10 text-success border-success/20',
  'updated': 'bg-primary/10 text-primary border-primary/20',
  'ai_analysis': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'category_change': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  'tags_updated': 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  'shared': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'permissions_changed': 'bg-red-500/10 text-red-600 border-red-500/20'
};

const changeTypeIcons = {
  'created': FileText,
  'updated': Edit,
  'ai_analysis': TrendingUp,
  'category_change': Folder,
  'tags_updated': Tag,
  'shared': Share2,
  'permissions_changed': AlertCircle
};

export default function VersionHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [versions, setVersions] = useState<DocumentVersion[]>(mockVersionHistory);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedDocument, setSelectedDocument] = useState('all');

  // Get unique document names for filtering
  const uniqueDocuments = Array.from(new Set(versions.map(v => v.document_name)))
    .map(name => ({ value: name, label: name }));

  const filteredVersions = versions
    .filter(version => {
      const matchesSearch = version.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           version.change_summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           version.creator_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = selectedFilter === 'all' || version.change_type === selectedFilter;
      const matchesDocument = selectedDocument === 'all' || version.document_name === selectedDocument;
      return matchesSearch && matchesFilter && matchesDocument;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'document':
          return a.document_name.localeCompare(b.document_name);
        case 'version':
          return b.version_number - a.version_number;
        default:
          return 0;
      }
    });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const getChangeTypeLabel = (type: string) => {
    const labels = {
      'created': 'Created',
      'updated': 'Updated',
      'ai_analysis': 'AI Analysis',
      'category_change': 'Category Changed',
      'tags_updated': 'Tags Updated',
      'shared': 'Shared',
      'permissions_changed': 'Permissions Changed'
    };
    return labels[type] || type;
  };

  const restoreVersion = (versionId: string) => {
    toast({
      title: 'Version restored',
      description: 'Document has been restored to the selected version',
    });
  };

  const compareVersions = (versionId: string) => {
    toast({
      title: 'Version comparison',
      description: 'Opening version comparison tool...',
    });
  };

  const downloadVersion = (versionId: string) => {
    toast({
      title: 'Download started',
      description: 'Document version is being downloaded',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-variant p-6 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Version History</h1>
              <p className="text-white/90">Track all document changes and revisions</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-primary">
                <History className="w-4 h-4 mr-1" />
                {versions.length} Versions
              </Badge>
              <Button variant="secondary" className="gap-2">
                <GitBranch className="w-4 h-4" />
                Branch History
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">Documents</span>
              </div>
              <div className="text-2xl font-bold">{uniqueDocuments.length}</div>
              <div className="text-xs text-white/70">Tracked files</div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Versions</span>
              </div>
              <div className="text-2xl font-bold">{versions.length}</div>
              <div className="text-xs text-white/70">Total revisions</div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">AI Updates</span>
              </div>
              <div className="text-2xl font-bold">
                {versions.filter(v => v.change_type === 'ai_analysis').length}
              </div>
              <div className="text-xs text-white/70">Automated improvements</div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Contributors</span>
              </div>
              <div className="text-2xl font-bold">
                {Array.from(new Set(versions.map(v => v.created_by))).length}
              </div>
              <div className="text-xs text-white/70">Active users</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search versions, documents, or changes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={selectedDocument} onValueChange={setSelectedDocument}>
              <SelectTrigger className="w-[200px]">
                <FileText className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Documents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                {uniqueDocuments.map(doc => (
                  <SelectItem key={doc.value} value={doc.value}>
                    {doc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Changes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Changes</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="ai_analysis">AI Analysis</SelectItem>
                <SelectItem value="category_change">Category Changed</SelectItem>
                <SelectItem value="tags_updated">Tags Updated</SelectItem>
                <SelectItem value="shared">Shared</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SortDesc className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="document">Document Name</SelectItem>
                <SelectItem value="version">Version Number</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Version Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Version Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredVersions.map((version, index) => {
                const ChangeIcon = changeTypeIcons[version.change_type] || FileText;
                const isLatest = index === 0;
                
                return (
                  <div key={version.id} className="relative">
                    {/* Timeline line */}
                    {index !== filteredVersions.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-16 bg-border" />
                    )}
                    
                    <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${changeTypeColors[version.change_type]}`}>
                        <ChangeIcon className="w-6 h-6" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-sm">{version.document_name}</h3>
                              <Badge variant="outline" className="text-xs">
                                v{version.version_number}
                              </Badge>
                              {isLatest && (
                                <Badge className="text-xs bg-success/10 text-success border-success/20">
                                  Latest
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{version.change_summary}</p>
                            
                            {/* Change details */}
                            {version.metadata.changes && version.metadata.changes.length > 0 && (
                              <div className="space-y-1">
                                {version.metadata.changes.map((change, idx) => (
                                  <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                                    <span className="font-medium">{change.field}:</span>
                                    <span className="line-through opacity-60">{change.old_value}</span>
                                    <ChevronRight className="w-3 h-3" />
                                    <span className="text-foreground">{change.new_value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <Badge className={`text-xs ${changeTypeColors[version.change_type]}`}>
                            {getChangeTypeLabel(version.change_type)}
                          </Badge>
                        </div>
                        
                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={version.creator_avatar} />
                              <AvatarFallback className="text-xs">
                                {version.creator_name?.[0] || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{version.creator_name}</span>
                          </div>
                          <span>{formatTimeAgo(version.created_at)}</span>
                          <span>{formatFileSize(version.file_size)}</span>
                          {version.metadata.confidence_score && (
                            <span>Confidence: {version.metadata.confidence_score}%</span>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/document/${version.document_id}`)}>
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => downloadVersion(version.id)}>
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                          {!isLatest && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => restoreVersion(version.id)}>
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Restore
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => compareVersions(version.id)}>
                                <GitCompare className="w-3 h-3 mr-1" />
                                Compare
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredVersions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No version history found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}