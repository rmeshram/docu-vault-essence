import React, { useState, useEffect } from "react";
import { 
Bell, FileText, TrendingUp, Clock, AlertCircle, Search, Filter, 
Upload, MessageCircle, Users, Shield, Star, ChevronRight,
PieChart, Calendar, Award, Lock, Zap, BookOpen, User,
BarChart3, Heart, Sparkles, Brain, Languages, Briefcase, Crown, Eye, Play,
Headphones, Settings, Moon, Sun,
Mail, Share2, Download, Copy, Trash2,
Plus, RotateCcw,
Link, Tag, Folder, Archive, Database,
Image,
Check, CheckCircle, Info, HelpCircle,
Lightbulb, Calculator
} from "lucide-react";
import { TestApiButton } from "@/components/examples/TestApiButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { documentService, type Document } from '@/services/documentService';
import { insightService, type AIInsight } from '@/services/insightService';
import { reminderService, type Reminder } from '@/services/reminderService';
import { familyService, type FamilyMember } from '@/services/familyService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { createMockData } from '@/services/mockDataService';
import { createEnhancedMockData } from '@/services/enhancedMockDataService';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useToast } from '@/hooks/use-toast';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler);

// Define chart data
const pieChartData = {
  labels: ['Finance', 'Legal', 'Medical', 'Personal'],
  datasets: [
    {
      label: 'Document Categories',
      data: [30, 25, 15, 30],
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

const lineChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'New Documents Uploaded',
      data: [65, 59, 80, 81, 56, 55],
      fill: false,
      backgroundColor: 'rgba(75,192,192,0.2)',
      borderColor: 'rgba(75,192,192,1)',
      tension: 0.4,
    },
  ],
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  
  // Backend-driven state
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<{ category: string; count: number }[]>([]);
  const [userStats, setUserStats] = useState({
    name: user?.user_metadata?.name || user?.email?.split('@')[0] || "User",
    avatar: user?.user_metadata?.avatar_url || "/placeholder.svg",
    tier: "Premium",
    storageUsed: 0,
    totalDocs: 0,
    aiQueriesLeft: 142,
    familyMembers: 0,
    monthlyUploads: 0,
    aiInsightsFound: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentInsight, setCurrentInsight] = useState(0);
  const [language, setLanguage] = useState("English");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Fetch all home data from backend
  useEffect(() => {
    let mounted = true;

    const loadHomeData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [
          docsData,
          categoriesData,
          insightsData,
          remindersData,
          familyData,
          userProfile
        ] = await Promise.all([
          documentService.getRecentDocuments(8),
          documentService.getCategoriesWithCounts(),
          insightService.getInsights(),
          reminderService.getUpcomingReminders(90),
          familyService.getFamilyMembers(),
          // Get user profile/subscription data
          supabase.from('profiles').select('*').eq('user_id', user.id).single()
        ]);

        if (!mounted) return;

        // Update state with fetched data
        setRecentDocs(docsData || []);
        setCategoryCounts(categoriesData || []);
        setAiInsights(insightsData || []);
        setUpcomingReminders(remindersData || []);
        setFamilyMembers(familyData || []);

        // Calculate user stats from fetched data
        const totalDocuments = docsData?.length || 0;
        const totalInsights = insightsData?.filter(insight => !insight.is_acknowledged)?.length || 0;
        
        // Get storage usage from profile or calculate estimate
        const storageUsed = userProfile.data?.total_storage_used 
          ? Math.round((userProfile.data.total_storage_used / (50 * 1024 * 1024 * 1024)) * 100) // Convert to percentage of 50GB
          : Math.min(totalDocuments * 2, 78); // Rough estimate: 2% per document

        setUserStats(prev => ({
          ...prev,
          totalDocs: totalDocuments,
          aiInsightsFound: totalInsights,
          storageUsed,
          familyMembers: familyData?.length || 0,
          monthlyUploads: docsData?.filter(doc => {
            const docDate = new Date(doc.created_at);
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return docDate > monthAgo;
          })?.length || 0,
          tier: userProfile.data?.tier || "Free"
        }));

      } catch (error) {
        console.error('Failed to load home data:', error);
        // Show fallback data or error handling
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadHomeData();

    return () => { 
      mounted = false; 
    };
  }, [user]);

  // Set up real-time subscriptions for live data updates
  useEffect(() => {
    if (!user) return;

    const subscriptions: Array<{ unsubscribe: () => void }> = [];

    // Subscribe to document changes
    const documentsSubscription = supabase
      .channel('documents')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRecentDocs(prev => [payload.new as Document, ...prev.slice(0, 7)]);
          } else if (payload.eventType === 'UPDATE') {
            setRecentDocs(prev => prev.map(doc => 
              doc.id === payload.new.id ? payload.new as Document : doc
            ));
          } else if (payload.eventType === 'DELETE') {
            setRecentDocs(prev => prev.filter(doc => doc.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscribe to AI insights changes  
    const insightsSubscription = supabase
      .channel('insights')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ai_insights', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAiInsights(prev => [payload.new as AIInsight, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setAiInsights(prev => prev.map(insight => 
              insight.id === payload.new.id ? payload.new as AIInsight : insight
            ));
          }
        }
      )
      .subscribe();

    // Subscribe to reminders changes
    const remindersSubscription = supabase
      .channel('reminders')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'reminders', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setUpcomingReminders(prev => [...prev, payload.new as Reminder]);
          } else if (payload.eventType === 'UPDATE') {
            setUpcomingReminders(prev => prev.map(reminder => 
              reminder.id === payload.new.id ? payload.new as Reminder : reminder
            ));
          }
        }
      )
      .subscribe();

    subscriptions.push(documentsSubscription, insightsSubscription, remindersSubscription);

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [user]);

  // Add mock data functionality
  const handleLoadMockData = async () => {
    if (!user) return;
    
    try {
      await createEnhancedMockData();
      toast({
        title: "Success",
        description: "Mock data loaded successfully! Refresh to see changes.",
      });
      
      // Reload the page data
      window.location.reload();
    } catch (error) {
      console.error('Failed to load mock data:', error);
      toast({
        title: "Error",
        description: "Failed to load mock data",
        variant: "destructive",
      });
    }
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark', !isDarkMode);
  };

  // Handle voice activation
  const handleVoiceActivation = () => {
    setIsVoiceActive(!isVoiceActive);
    toast({
      title: "Voice Assistant",
      description: isVoiceActive ? "Voice assistant disabled" : "Voice assistant enabled",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <h2 className="text-xl font-semibold text-foreground">Loading your digital vault...</h2>
              <p className="text-muted-foreground">Fetching your documents and insights</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header with enhanced features */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Top row with user info and actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={userStats.avatar} />
                <AvatarFallback>{userStats.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">Welcome back, {userStats.name}</h1>
                <p className="text-white/80 text-sm">{userStats.totalDocs} documents • {userStats.tier} plan</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Load Mock Data Button */}
              <Button
                onClick={handleLoadMockData}
                variant="ghost"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                <Database className="w-4 h-4 mr-2" />
                Load Mock Data
              </Button>
              
              <Button onClick={() => navigate('/upload')} className="bg-white text-primary hover:bg-white/90">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              
              <NotificationCenter />
            </div>
          </div>

          {/* Enhanced search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
            <Input
              placeholder="Search documents or ask AI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white/20 border-white/30 text-white placeholder:text-white/70"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/upload')}>
              <CardContent className="p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Upload</h3>
                <p className="text-sm text-muted-foreground">Add documents</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/chat')}>
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">AI Chat</h3>
                <p className="text-sm text-muted-foreground">Ask questions</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/family-vault')}>
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Family Vault</h3>
                <p className="text-sm text-muted-foreground">Share securely</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/categories')}>
              <CardContent className="p-6 text-center">
                <Folder className="w-8 h-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold">Browse</h3>
                <p className="text-sm text-muted-foreground">View all docs</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Documents */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Documents</h2>
            <Button variant="ghost" onClick={() => navigate('/categories')}>
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {recentDocs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
                <p className="text-muted-foreground mb-4">Upload your first document to get started</p>
                <Button onClick={() => navigate('/upload')}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentDocs.slice(0, 8).map((doc) => (
                <Card key={doc.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/document/${doc.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-6 h-6 text-primary" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{doc.name}</h3>
                        <p className="text-xs text-muted-foreground">{doc.category || 'Uncategorized'}</p>
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs">
                      Processed
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-6">AI Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiInsights.slice(0, 4).map((insight) => (
                <Card key={insight.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-warning mt-1" />
                      <div>
                        <h3 className="font-semibold">{insight.title}</h3>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                        {insight.savings_potential && (
                          <Badge className="mt-2">
                            Save ₹{insight.savings_potential}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* External Integrations */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Connect & Sync</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Gmail Integration</h3>
                    <p className="text-sm text-muted-foreground">Auto-import attachments</p>
                  </div>
                </div>
                <Button className="w-full">Connect Gmail</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">DigiLocker</h3>
                    <p className="text-sm text-muted-foreground">Sync government docs</p>
                  </div>
                </div>
                <Button className="w-full">Connect DigiLocker</Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Calendar Sync</h3>
                    <p className="text-sm text-muted-foreground">Reminder integration</p>
                  </div>
                </div>
                <Button className="w-full">Connect Calendar</Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
