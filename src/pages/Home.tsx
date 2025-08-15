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
  Lightbulb, Calculator, Bot, Globe, Clock3, Users2, ShieldCheck
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
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          {/* Navigation Bar */}
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">DocuVault AI</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={toggleDarkMode}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              
              <Button
                onClick={handleLoadMockData}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Database className="w-4 h-4 mr-2" />
                Load Demo Data
              </Button>
              
              <NotificationCenter />
              
              <Avatar className="w-8 h-8">
                <AvatarImage src={userStats.avatar} />
                <AvatarFallback>{userStats.name[0]}</AvatarFallback>
              </Avatar>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-6xl font-bold leading-tight">
                  Your Documents,{" "}
                  <span className="text-primary">Understood Instantly</span>
                </h1>
                
                <p className="text-xl text-white/80 leading-relaxed">
                  Stop losing important documents across emails, WhatsApp, and paper files. 
                  DocuVault AI securely organizes, translates, and reminds you of everything that matters.
                </p>
              </div>

              {/* Pain Points */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-white/90">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  <span className="text-sm">Missed renewals & deadlines</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <Globe className="w-5 h-5 text-warning" />
                  <span className="text-sm">Language barriers</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <Archive className="w-5 h-5 text-warning" />
                  <span className="text-sm">Scattered documents</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <Clock3 className="w-5 h-5 text-warning" />
                  <span className="text-sm">Time-consuming searches</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  onClick={() => navigate('/upload')}
                >
                  Start Free Trial
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold"
                >
                  Watch Demo
                  <Play className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="relative z-10 bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white/20 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">Insurance Policy</span>
                      </div>
                      <p className="text-xs text-white/70">Renewal due: March 15, 2024</p>
                    </div>
                    
                    <div className="bg-white/20 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Bot className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">AI Summary</span>
                      </div>
                      <p className="text-xs text-white/70">Key terms extracted, reminder set</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-3xl transform rotate-6 scale-105"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              AI-Powered Document Intelligence
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the future of document management with our advanced AI that understands, 
              organizes, and protects your most important information.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Summarization */}
            <Card className="group hover:shadow-large transition-all duration-300 hover:-translate-y-2 border-0 shadow-medium">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Summarization</h3>
                <p className="text-muted-foreground mb-4">
                  Extract key information like medical diagnoses, legal deadlines, and insurance details automatically.
                </p>
                <div className="text-sm text-primary font-medium">
                  Medical reports • Legal contracts • Insurance policies
                </div>
              </CardContent>
            </Card>

            {/* Multi-language Translation */}
            <Card className="group hover:shadow-large transition-all duration-300 hover:-translate-y-2 border-0 shadow-medium">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Languages className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">15+ Language Support</h3>
                <p className="text-muted-foreground mb-4">
                  Understand documents in Hindi, Tamil, Bengali, and more with instant translation.
                </p>
                <div className="text-sm text-primary font-medium">
                  Hindi • Tamil • Bengali • Gujarati • Marathi
                </div>
              </CardContent>
            </Card>

            {/* Conversational AI */}
            <Card className="group hover:shadow-large transition-all duration-300 hover:-translate-y-2 border-0 shadow-medium">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI Chat Assistant</h3>
                <p className="text-muted-foreground mb-4">
                  Ask natural language questions about your documents and get instant answers.
                </p>
                <div className="text-sm text-primary font-medium">
                  Voice queries • Rich responses • Context-aware
                </div>
              </CardContent>
            </Card>

            {/* Smart Reminders */}
            <Card className="group hover:shadow-large transition-all duration-300 hover:-translate-y-2 border-0 shadow-medium">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Intelligent Reminders</h3>
                <p className="text-muted-foreground mb-4">
                  Never miss important dates with AI-powered deadline extraction and calendar sync.
                </p>
                <div className="text-sm text-primary font-medium">
                  Auto-detection • Calendar sync • Custom alerts
                </div>
              </CardContent>
            </Card>

            {/* Family Vault */}
            <Card className="group hover:shadow-large transition-all duration-300 hover:-translate-y-2 border-0 shadow-medium">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Family Document Vault</h3>
                <p className="text-muted-foreground mb-4">
                  Securely share and manage family documents with role-based access control.
                </p>
                <div className="text-sm text-primary font-medium">
                  Role-based access • Secure sharing • Family profiles
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="group hover:shadow-large transition-all duration-300 hover:-translate-y-2 border-0 shadow-medium">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Enterprise Security</h3>
                <p className="text-muted-foreground mb-4">
                  Bank-grade encryption with compliance standards to protect your sensitive documents.
                </p>
                <div className="text-sm text-primary font-medium">
                  End-to-end encryption • GDPR compliant • SOC 2 certified
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Documents & Quick Actions */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <h3 className="text-2xl font-bold mb-6">Quick Actions</h3>
              <div className="space-y-4">
                <Card className="cursor-pointer hover:shadow-medium transition-all duration-300 hover:scale-105" onClick={() => navigate('/upload')}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Upload Documents</h4>
                      <p className="text-sm text-muted-foreground">Add new files</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-medium transition-all duration-300 hover:scale-105" onClick={() => navigate('/chat')}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">AI Assistant</h4>
                      <p className="text-sm text-muted-foreground">Ask questions</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-medium transition-all duration-300 hover:scale-105" onClick={() => navigate('/family-vault')}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Family Vault</h4>
                      <p className="text-sm text-muted-foreground">Share securely</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Documents */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Recent Documents</h3>
                <Button variant="ghost" onClick={() => navigate('/categories')}>
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              
              {recentDocs.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
                    <h4 className="text-xl font-semibold mb-3">No documents yet</h4>
                    <p className="text-muted-foreground mb-6">Upload your first document to get started</p>
                    <Button onClick={() => navigate('/upload')} size="lg">
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Document
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {recentDocs.slice(0, 6).map((doc) => (
                    <Card key={doc.id} className="cursor-pointer hover:shadow-medium transition-all duration-300 hover:scale-105" onClick={() => navigate(`/document/${doc.id}`)}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{doc.name}</h4>
                            <p className="text-sm text-muted-foreground">{doc.category || 'Uncategorized'}</p>
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
            </div>
          </div>
        </div>
      </section>

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-6">
            <h3 className="text-2xl font-bold mb-6">AI Insights & Recommendations</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {aiInsights.slice(0, 4).map((insight) => (
                <Card key={insight.id} className="hover:shadow-medium transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center mt-1">
                        <AlertCircle className="w-5 h-5 text-warning" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                        {insight.savings_potential && (
                          <Badge className="bg-success/10 text-success hover:bg-success/20">
                            Save ₹{insight.savings_potential}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Trusted by Thousands of Families
            </h2>
            <p className="text-xl text-muted-foreground">
              See how DocuVault AI is transforming document management across India
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-8">
                <Avatar className="w-16 h-16 mx-auto mb-4">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>PS</AvatarFallback>
                </Avatar>
                <blockquote className="text-lg mb-4">
                  "DocuVault AI saved me hours during tax season. All my documents were automatically categorized and the AI found deductions I missed!"
                </blockquote>
                <div className="text-sm font-medium">Priya Sharma</div>
                <div className="text-sm text-muted-foreground">Chartered Accountant, Mumbai</div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <Avatar className="w-16 h-16 mx-auto mb-4">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>RK</AvatarFallback>
                </Avatar>
                <blockquote className="text-lg mb-4">
                  "Finally, a solution that understands Hindi documents! The family vault feature keeps our entire family organized."
                </blockquote>
                <div className="text-sm font-medium">Rajesh Kumar</div>
                <div className="text-sm text-muted-foreground">Business Owner, Delhi</div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <Avatar className="w-16 h-16 mx-auto mb-4">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>AN</AvatarFallback>
                </Avatar>
                <blockquote className="text-lg mb-4">
                  "Never missed an insurance renewal again. The AI reminds me weeks in advance and explains complex policy terms."
                </blockquote>
                <div className="text-sm font-medium">Anita Nair</div>
                <div className="text-sm text-muted-foreground">Healthcare Professional, Bangalore</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-hero text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Document Management?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of families and professionals who trust DocuVault AI with their most important documents.
          </p>
          
          <div className="flex items-center justify-center gap-6">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={() => navigate('/upload')}
            >
              Start Your Free Trial
            </Button>
            
            <div className="text-left">
              <div className="text-sm text-white/80">✓ No credit card required</div>
              <div className="text-sm text-white/80">✓ 30-day free trial</div>
              <div className="text-sm text-white/80">✓ Enterprise-grade security</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Placeholder */}
      <footer className="py-12 bg-background border-t">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">DocuVault AI</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>Features</span>
              <span>Pricing</span>
              <span>About</span>
              <span>Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
