import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, FileText, Upload, MessageCircle, Star, Share2, 
  Filter, Search, Clock, TrendingUp, Users, Brain, Tag,
  ChevronRight, Eye, Download, Edit, MoreVertical, Play,
  Pause, FastForward, Rewind, Shuffle, Volume2, CheckCircle,
  AlertCircle, Plus, Sparkles, User, Home, Shield, Heart
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

interface TimelineEvent {
  id: string;
  type: 'upload' | 'ai_analysis' | 'share' | 'chat' | 'category_change' | 'tag_added' | 'reminder_created' | 'family_invite' | 'insight_generated';
  title: string;
  description: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  document_id?: string;
  document_name?: string;
  category?: string;
  metadata?: {
    confidence_score?: number;
    tags?: string[];
    shared_with?: string[];
    chat_query?: string;
    insight_type?: string;
    family_member?: string;
    changes?: any;
  };
}

const mockTimelineEvents: TimelineEvent[] = [
  {
    id: '1',
    type: 'upload',
    title: 'Document Uploaded',
    description: 'Aadhar_Card_Final.pdf uploaded successfully',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
    user_id: 'user1',
    user_name: 'You',
    document_id: 'doc1',
    document_name: 'Aadhar_Card_Final.pdf',
    category: 'Identity'
  },
  {
    id: '2',
    type: 'ai_analysis',
    title: 'AI Analysis Completed',
    description: 'Document analyzed with 98.5% confidence',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 min ago
    user_id: 'system',
    user_name: 'AI Assistant',
    document_id: 'doc1',
    document_name: 'Aadhar_Card_Final.pdf',
    metadata: {
      confidence_score: 98.5,
      tags: ['Identity', 'Government', 'KYC']
    }
  },
  {
    id: '3',
    type: 'insight_generated',
    title: 'New Insight Generated',
    description: 'Found potential tax savings of ₹67,000',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    user_id: 'system',
    user_name: 'AI Assistant',
    metadata: {
      insight_type: 'tax_savings'
    }
  },
  {
    id: '4',
    type: 'share',
    title: 'Document Shared',
    description: 'Health_Insurance_Policy.pdf shared with family',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    user_id: 'user1',
    user_name: 'You',
    document_id: 'doc2',
    document_name: 'Health_Insurance_Policy.pdf',
    category: 'Insurance',
    metadata: {
      shared_with: ['Priya Sharma', 'Raj Kumar']
    }
  },
  {
    id: '5',
    type: 'chat',
    title: 'AI Chat Query',
    description: 'Asked about tax document requirements',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    user_id: 'user1',
    user_name: 'You',
    metadata: {
      chat_query: 'What documents do I need for tax filing?'
    }
  },
  {
    id: '6',
    type: 'family_invite',
    title: 'Family Member Invited',
    description: 'Invited Priya Sharma to join family vault',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    user_id: 'user1',
    user_name: 'You',
    metadata: {
      family_member: 'Priya Sharma'
    }
  },
  {
    id: '7',
    type: 'category_change',
    title: 'Category Updated',
    description: 'Tax_Return_2024.pdf moved to Tax Documents',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    user_id: 'user1',
    user_name: 'You',
    document_id: 'doc3',
    document_name: 'Tax_Return_2024.pdf',
    category: 'Tax Documents',
    metadata: {
      changes: { from: 'Personal', to: 'Tax Documents' }
    }
  },
  {
    id: '8',
    type: 'reminder_created',
    title: 'Reminder Set',
    description: 'Insurance premium payment reminder created',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    user_id: 'user1',
    user_name: 'You'
  }
];

const eventTypeColors = {
  'upload': 'bg-success/10 text-success border-success/20',
  'ai_analysis': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'share': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'chat': 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  'category_change': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  'tag_added': 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  'reminder_created': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  'family_invite': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  'insight_generated': 'bg-green-500/10 text-green-600 border-green-500/20'
};

const eventTypeIcons = {
  'upload': Upload,
  'ai_analysis': Brain,
  'share': Share2,
  'chat': MessageCircle,
  'category_change': FileText,
  'tag_added': Tag,
  'reminder_created': Clock,
  'family_invite': Users,
  'insight_generated': Sparkles
};

export default function Timeline() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<TimelineEvent[]>(mockTimelineEvents);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const filteredEvents = events
    .filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.document_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = selectedFilter === 'all' || event.type === selectedFilter;
      
      // Filter by time period
      const eventDate = new Date(event.timestamp);
      const now = new Date();
      const periodMs = {
        '1d': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        'all': Infinity
      }[selectedPeriod];
      
      const matchesPeriod = selectedPeriod === 'all' || (now.getTime() - eventDate.getTime()) <= periodMs;
      
      return matchesSearch && matchesFilter && matchesPeriod;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1d ago';
    return `${diffDays}d ago`;
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventTypeLabel = (type: string) => {
    const labels = {
      'upload': 'Upload',
      'ai_analysis': 'AI Analysis',
      'share': 'Shared',
      'chat': 'Chat',
      'category_change': 'Category',
      'tag_added': 'Tag Added',
      'reminder_created': 'Reminder',
      'family_invite': 'Family Invite',
      'insight_generated': 'Insight'
    };
    return labels[type] || type;
  };

  const getEventStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEvents = events.filter(e => new Date(e.timestamp) >= today);
    const uploads = events.filter(e => e.type === 'upload');
    const aiAnalyses = events.filter(e => e.type === 'ai_analysis');
    const insights = events.filter(e => e.type === 'insight_generated');
    
    return {
      today: todayEvents.length,
      uploads: uploads.length,
      aiAnalyses: aiAnalyses.length,
      insights: insights.length
    };
  };

  const stats = getEventStats();

  // Group events by date for better visualization
  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = new Date(event.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, TimelineEvent[]>);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-variant p-6 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Timeline</h1>
              <p className="text-white/90">Chronological journey of your document activity</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Playback Controls */}
              <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-white hover:bg-white/20"
                  onClick={() => setIsAutoPlay(!isAutoPlay)}
                >
                  {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Select value={playbackSpeed.toString()} onValueChange={(v) => setPlaybackSpeed(parseFloat(v))}>
                  <SelectTrigger className="w-16 h-8 text-white border-white/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Badge variant="secondary" className="text-primary">
                <Calendar className="w-4 h-4 mr-1" />
                {filteredEvents.length} Events
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Today</span>
              </div>
              <div className="text-2xl font-bold">{stats.today}</div>
              <div className="text-xs text-white/70">Activities</div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5" />
                <span className="text-sm font-medium">Uploads</span>
              </div>
              <div className="text-2xl font-bold">{stats.uploads}</div>
              <div className="text-xs text-white/70">Documents</div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5" />
                <span className="text-sm font-medium">AI Analysis</span>
              </div>
              <div className="text-2xl font-bold">{stats.aiAnalyses}</div>
              <div className="text-xs text-white/70">Processed</div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium">Insights</span>
              </div>
              <div className="text-2xl font-bold">{stats.insights}</div>
              <div className="text-xs text-white/70">Generated</div>
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
              placeholder="Search timeline events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[120px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Today</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="upload">Uploads</SelectItem>
                <SelectItem value="ai_analysis">AI Analysis</SelectItem>
                <SelectItem value="share">Shared</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="insight_generated">Insights</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <div key={date} className="space-y-4">
              {/* Date Header */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {new Date(date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <p className="text-sm text-muted-foreground">{dayEvents.length} activities</p>
                </div>
              </div>

              {/* Events for this date */}
              <div className="ml-6 space-y-3 relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 w-0.5 h-full bg-border" />
                
                {dayEvents.map((event, index) => {
                  const EventIcon = eventTypeIcons[event.type] || FileText;
                  
                  return (
                    <div key={event.id} className="relative flex items-start gap-4 p-4 bg-card border rounded-lg hover:bg-muted/50 transition-colors">
                      {/* Icon */}
                      <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center ${eventTypeColors[event.type]}`}>
                        <EventIcon className="w-6 h-6" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{event.title}</h4>
                              <Badge className={`text-xs ${eventTypeColors[event.type]}`}>
                                {getEventTypeLabel(event.type)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                            {formatTimeAgo(event.timestamp)}
                          </span>
                        </div>
                        
                        {/* Metadata */}
                        {event.metadata && (
                          <div className="space-y-2 mb-3">
                            {event.metadata.confidence_score && (
                              <div className="flex items-center gap-2 text-xs">
                                <CheckCircle className="w-3 h-3 text-success" />
                                <span>Confidence: {event.metadata.confidence_score}%</span>
                              </div>
                            )}
                            
                            {event.metadata.tags && event.metadata.tags.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {event.metadata.tags.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            {event.metadata.shared_with && (
                              <div className="text-xs text-muted-foreground">
                                Shared with: {event.metadata.shared_with.join(', ')}
                              </div>
                            )}
                            
                            {event.metadata.chat_query && (
                              <div className="text-xs bg-muted/50 p-2 rounded italic">
                                "{event.metadata.chat_query}"
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* User info */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={event.user_avatar} />
                            <AvatarFallback className="text-xs">
                              {event.user_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{event.user_name}</span>
                          <span>•</span>
                          <span>{formatFullDate(event.timestamp)}</span>
                        </div>
                        
                        {/* Actions */}
                        {event.document_id && (
                          <div className="flex items-center gap-2 mt-3">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => navigate(`/document/${event.document_id}`)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Document
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {filteredEvents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No timeline events found</h3>
              <p className="text-sm">Try adjusting your search or time period filters</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/upload')}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Document
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}