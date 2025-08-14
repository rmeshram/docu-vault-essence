import { useState, useEffect } from "react";
import { 
  FileText, Upload, Search, MessageSquare, Bell, Settings, 
  PieChart, TrendingUp, Calendar, Users, Shield, Zap,
  ChevronRight, Plus, Eye, Share2, Trash2, Star, Clock,
  Brain, Sparkles, AlertTriangle, CheckCircle, BarChart3,
  Camera, Mic, Globe, Heart, Scale, User, Briefcase,
  ArrowUpRight, Filter, MoreHorizontal, Download, Copy,
  Folder, Tag, Link, Mail, Phone, MapPin, CreditCard
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { DocumentCategoryChart } from "@/components/charts/DocumentCategoryChart";
import { TrendsChart } from "@/components/charts/TrendsChart";
import { RemindersTimelineChart } from "@/components/charts/RemindersTimelineChart";

// Mock data for the dashboard
const mockUser = {
  name: "Priya Sharma",
  avatar: "/placeholder.svg",
  plan: "Family Premium",
  documentsCount: 247,
  storageUsed: 3.2,
  storageTotal: 15.0,
  aiQueriesUsed: 142,
  aiQueriesTotal: 500,
};

const mockStats = {
  totalDocuments: 247,
  categoriesActive: 8,
  aiInsights: 23,
  familyMembers: 4,
  documentsThisMonth: 18,
  duplicatesFound: 3,
  expiringDocs: 2,
  sharedDocs: 45,
};

const mockRecentDocuments = [
  {
    id: 1,
    title: "Tax Return 2024",
    category: "Tax Documents",
    type: "PDF",
    date: "2 hours ago",
    thumbnail: "/placeholder.svg",
    aiSummary: "ITR-1 form with ₹85,000 total income and ₹2,300 expected refund",
    status: "analyzed",
    tags: ["Important", "Deadline: Apr 15"],
    confidence: 98,
  },
  {
    id: 2,
    title: "Health Insurance Policy",
    category: "Insurance",
    type: "PDF",
    date: "1 day ago",
    thumbnail: "/placeholder.svg",
    aiSummary: "₹5L coverage, expires May 15, 2024. Renewal recommended.",
    status: "expiring",
    tags: ["Renewal Due", "Family"],
    confidence: 95,
  },
  {
    id: 3,
    title: "Bank Statement - March",
    category: "Banking",
    type: "PDF",
    date: "3 days ago",
    thumbnail: "/placeholder.svg",
    aiSummary: "Monthly statement with ₹45,000 transactions analyzed",
    status: "processed",
    tags: ["Monthly", "Reconciled"],
    confidence: 92,
  },
];

const mockAiInsights = [
  {
    id: 1,
    type: "savings",
    title: "Tax Savings Opportunity",
    description: "You can save ₹12,000 more by maximizing 80C deductions",
    action: "Review Tax Docs",
    priority: "high",
    icon: TrendingUp,
    color: "text-success",
  },
  {
    id: 2,
    type: "renewal",
    title: "Insurance Renewal Due",
    description: "Health insurance expires in 15 days. Renew now to avoid gaps.",
    action: "Renew Policy",
    priority: "urgent",
    icon: Shield,
    color: "text-warning",
  },
  {
    id: 3,
    type: "organization",
    title: "Duplicate Documents Found",
    description: "3 duplicate files detected. Merge to save storage space.",
    action: "Merge Files",
    priority: "medium",
    icon: Copy,
    color: "text-primary",
  },
];

const quickActions = [
  {
    id: "upload",
    title: "Smart Upload",
    description: "AI-powered document scanning",
    icon: Upload,
    color: "bg-primary",
    href: "/upload",
    badge: "AI Enhanced",
  },
  {
    id: "camera",
    title: "Camera Scan",
    description: "Instant document capture",
    icon: Camera,
    color: "bg-accent",
    href: "/upload",
    badge: "Quick Scan",
  },
  {
    id: "voice",
    title: "Voice Chat",
    description: "Ask AI about your documents",
    icon: Mic,
    color: "bg-secondary",
    href: "/chat",
    badge: "15+ Languages",
  },
  {
    id: "search",
    title: "Smart Search",
    description: "Find anything instantly",
    icon: Search,
    color: "bg-success",
    href: "/search",
    badge: "Natural Language",
  },
];

const familyMembers = [
  { name: "Priya", role: "Owner", avatar: "/placeholder.svg", status: "online" },
  { name: "Raj", role: "Editor", avatar: "/placeholder.svg", status: "offline" },
  { name: "Mom", role: "Viewer", avatar: "/placeholder.svg", status: "online" },
  { name: "Dad", role: "Viewer", avatar: "/placeholder.svg", status: "offline" },
];

export default function Home() {
  const navigate = useNavigate();
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const storagePercentage = (mockUser.storageUsed / mockUser.storageTotal) * 100;
  const aiUsagePercentage = (mockUser.aiQueriesUsed / mockUser.aiQueriesTotal) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Loading Header Skeleton */}
        <div className="bg-gradient-header h-64 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
        
        {/* Loading Content Skeletons */}
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-64 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Premium Header with Gradient */}
      <div className="bg-gradient-header relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-12 relative">
          {/* Header Content */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-4 border-white/20 shadow-elegant">
                <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
                <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                  {mockUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-white text-3xl font-bold mb-1">
                  Welcome back, {mockUser.name.split(' ')[0]}! 👋
                </h1>
                <p className="text-white/80 text-lg font-medium">
                  Your documents are secure and organized
                </p>
                <Badge className="bg-white/20 text-white border-white/30 mt-2">
                  <Star className="w-3 h-3 mr-1" />
                  {mockUser.plan}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-12 w-12 rounded-xl"
                onClick={() => navigate('/profile')}
              >
                <Bell className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-12 w-12 rounded-xl"
                onClick={() => navigate('/profile')}
              >
                <Settings className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white text-2xl font-bold">{mockStats.totalDocuments}</p>
                  <p className="text-white/80 text-sm">Total Documents</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white text-2xl font-bold">{mockStats.aiInsights}</p>
                  <p className="text-white/80 text-sm">AI Insights</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white text-2xl font-bold">{mockStats.familyMembers}</p>
                  <p className="text-white/80 text-sm">Family Members</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white text-2xl font-bold">+{mockStats.documentsThisMonth}</p>
                  <p className="text-white/80 text-sm">This Month</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Quick Actions */}
        <section className="fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Quick Actions</h2>
            <Button variant="ghost" className="text-primary">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Card 
                key={action.id}
                className="card-hover cursor-pointer border-0 shadow-soft bg-gradient-card"
                onClick={() => navigate(action.href)}
              >
                <CardContent className="p-6 text-center relative">
                  <Badge className="absolute top-3 right-3 text-xs bg-primary/20 text-primary border-primary/30">
                    {action.badge}
                  </Badge>
                  <div className={`w-16 h-16 ${action.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-medium`}>
                    <action.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{action.title}</h3>
                  <p className="text-muted-foreground text-sm">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* AI Insights */}
        <section className="fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Insights
            </h2>
            <Button variant="outline" size="sm">
              <Brain className="w-4 h-4 mr-2" />
              Ask AI
            </Button>
          </div>
          
          <div className="space-y-4">
            {mockAiInsights.map((insight) => (
              <Card key={insight.id} className="card-hover border-0 shadow-soft bg-gradient-card">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center`}>
                      <insight.icon className={`w-6 h-6 ${insight.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{insight.title}</h3>
                        <Badge 
                          variant={insight.priority === 'urgent' ? 'destructive' : 
                                 insight.priority === 'high' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{insight.description}</p>
                      <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        {insight.action}
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Dashboard Widgets */}
        <section className="fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Document Categories Chart */}
            <Card className="lg:col-span-2 border-0 shadow-elegant bg-gradient-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    Document Categories
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DocumentCategoryChart />
              </CardContent>
            </Card>

            {/* Storage & Usage */}
            <Card className="border-0 shadow-elegant bg-gradient-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Storage & Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Storage Used</span>
                    <span className="text-sm text-muted-foreground">
                      {mockUser.storageUsed}GB / {mockUser.storageTotal}GB
                    </span>
                  </div>
                  <Progress value={storagePercentage} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">AI Queries</span>
                    <span className="text-sm text-muted-foreground">
                      {mockUser.aiQueriesUsed} / {mockUser.aiQueriesTotal}
                    </span>
                  </div>
                  <Progress value={aiUsagePercentage} className="h-2" />
                </div>

                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Documents & Family Vault */}
        <section className="fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Documents */}
            <Card className="border-0 shadow-elegant bg-gradient-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Recent Documents
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/categories')}>
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRecentDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium truncate">{doc.title}</h4>
                        <Badge 
                          variant={doc.status === 'expiring' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {doc.confidence}%
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{doc.aiSummary}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                        <span className="text-xs text-muted-foreground">{doc.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Family Vault */}
            <Card className="border-0 shadow-elegant bg-gradient-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Family Vault
                  </CardTitle>
                  <Button variant="ghost" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Invite
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-2xl font-bold text-primary">{mockStats.sharedDocs}</p>
                    <p className="text-xs text-muted-foreground">Shared Documents</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-2xl font-bold text-success">{mockStats.familyMembers}</p>
                    <p className="text-xs text-muted-foreground">Active Members</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {familyMembers.map((member, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {member.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          member.status === 'online' ? 'bg-success' : 'bg-muted'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {member.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Analytics Charts */}
        <section className="fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-elegant bg-gradient-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Monthly Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TrendsChart />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-elegant bg-gradient-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RemindersTimelineChart />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}