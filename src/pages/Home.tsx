import React, { useState, useEffect } from "react";
import { 
  Bell, FileText, TrendingUp, Clock, AlertCircle, Search, Filter, 
  Upload, MessageCircle, Users, Shield, Mic, Star, ChevronRight,
  PieChart, Calendar, Globe, Award, Lock, Zap, BookOpen, User,
  BarChart3, Target, Heart, CreditCard, Home as HomeIcon,
  Sparkles, Brain, Languages, Briefcase, Crown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

const recentDocuments = [
  { id: 1, title: "Tax Return 2024", type: "PDF", thumbnail: "/placeholder.svg", date: "2 hours ago", category: "Financial", size: "2.1 MB" },
  { id: 2, title: "Insurance Policy", type: "PDF", thumbnail: "/placeholder.svg", date: "1 day ago", category: "Insurance", size: "1.8 MB" },
  { id: 3, title: "Aadhaar Card", type: "PDF", thumbnail: "/placeholder.svg", date: "3 days ago", category: "Identity", size: "0.5 MB" },
  { id: 4, title: "Medical Report", type: "PDF", thumbnail: "/placeholder.svg", date: "1 week ago", category: "Health", size: "3.2 MB" },
];

const aiInsights = [
  { 
    type: "risk", 
    text: "Insurance premium due in 5 days - ₹12,500", 
    color: "text-destructive",
    action: "Set Reminder",
    icon: AlertCircle,
    priority: "high"
  },
  { 
    type: "opportunity", 
    text: "Found 3 tax deductions worth ₹45,000", 
    color: "text-success",
    action: "Review Now",
    icon: TrendingUp,
    priority: "medium"
  },
  { 
    type: "duplicate", 
    text: "2 similar insurance documents detected", 
    color: "text-warning",
    action: "Merge Files",
    icon: FileText,
    priority: "low"
  },
  { 
    type: "analysis", 
    text: "Monthly expense trend: ₹2.3L (+8% vs last month)", 
    color: "text-accent",
    action: "View Details",
    icon: BarChart3,
    priority: "medium"
  },
];

const upcomingReminders = [
  { title: "Tax Filing Deadline", date: "Apr 15, 2024", urgency: "high", category: "Financial", countdown: "2 weeks" },
  { title: "Insurance Renewal", date: "May 1, 2024", urgency: "medium", category: "Insurance", countdown: "3 weeks" },
  { title: "Medical Checkup", date: "Apr 30, 2024", urgency: "low", category: "Health", countdown: "2 weeks" },
  { title: "PAN Card Renewal", date: "Jun 15, 2024", urgency: "medium", category: "Identity", countdown: "7 weeks" },
];

const quickActions = [
  { title: "Upload & Scan", description: "Add new documents", icon: Upload, color: "bg-primary", onClick: "upload" },
  { title: "AI Chat", description: "Ask questions about your docs", icon: MessageCircle, color: "bg-accent", onClick: "chat" },
  { title: "Add Family", description: "Share documents securely", icon: Users, color: "bg-success", onClick: "family" },
  { title: "Expert Help", description: "Connect with professionals", icon: Briefcase, color: "bg-warning", onClick: "marketplace" },
];

const familyMembers = [
  { name: "Mom", docs: 24, avatar: "M", status: "active" },
  { name: "Dad", docs: 18, avatar: "D", status: "active" },
  { name: "Sister", docs: 12, avatar: "S", status: "pending" },
];

const securityBadges = [
  { label: "AES-256 Encrypted", icon: Lock },
  { label: "Biometric Secured", icon: Shield },
  { label: "GDPR Compliant", icon: Award },
  { label: "Blockchain Verified", icon: Star },
];

export default function Home() {
  const navigate = useNavigate();
  const [user] = useState({ 
    name: "Priya Sharma", 
    avatar: "/placeholder.svg", 
    tier: "Premium",
    storageUsed: 75,
    totalDocs: 156,
    aiQueriesLeft: 85
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentInsight, setCurrentInsight] = useState(0);
  const [language, setLanguage] = useState("English");

  // Rotate insights every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % aiInsights.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "bg-destructive";
      case "medium": return "bg-warning";
      case "low": return "bg-success";
      default: return "bg-muted";
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "upload": navigate("/upload"); break;
      case "chat": navigate("/chat"); break;
      case "family": navigate("/profile"); break;
      case "marketplace": navigate("/marketplace"); break;
      default: break;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Enhanced Header with User Status */}
      <div className="bg-gradient-header p-6 pt-8 shadow-large relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full transform translate-x-32 -translate-y-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full transform -translate-x-24 translate-y-24" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Top Row - Enhanced User Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-14 h-14 border-3 border-white/40 shadow-large">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-white/20 text-white font-bold text-lg">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full border-2 border-white flex items-center justify-center">
                  <Crown className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white/90 text-sm font-medium">Good morning,</p>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">{user.tier}</Badge>
                </div>
                <h1 className="text-white text-xl font-bold mb-1">{user.name}</h1>
                <div className="flex items-center gap-4 text-white/80 text-xs">
                  <span>{user.totalDocs} documents</span>
                  <span>•</span>
                  <span>{user.aiQueriesLeft} AI queries left</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Language Toggle */}
              <Button 
                variant="ghost" 
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm gap-2"
                onClick={() => setLanguage(language === "English" ? "हिंदी" : "English")}
              >
                <Languages className="w-4 h-4" />
                {language}
              </Button>
              <Button 
                onClick={() => navigate('/upload')}
                className="bg-white hover:bg-white/90 text-primary font-semibold shadow-medium transition-all duration-200 hover:scale-105"
                size="sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
              <button className="p-3 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all duration-200 shadow-soft hover:scale-105 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
              </button>
            </div>
          </div>
          
          {/* Enhanced Search with Voice */}
          <div className="relative mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
              <Input
                placeholder="Ask: 'What's my insurance expiry?' or search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-20 h-14 bg-white/20 border-white/30 text-white placeholder:text-white/70 rounded-2xl backdrop-blur-sm focus:bg-white/30 transition-all duration-200 text-base"
                onKeyPress={(e) => e.key === 'Enter' && searchQuery && navigate('/chat')}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/20 rounded-lg"
                >
                  <Mic className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/20 rounded-lg"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {/* Quick Search Suggestions */}
            <div className="flex gap-2 mt-3">
              {["Tax documents", "Medical reports", "Insurance policies"].map((suggestion) => (
                <Badge 
                  key={suggestion}
                  className="bg-white/20 text-white/90 border-white/30 hover:bg-white/30 cursor-pointer transition-all"
                  onClick={() => setSearchQuery(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>

          {/* Storage Usage */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/90 text-sm font-medium">Storage Used</span>
                <span className="text-white text-sm font-bold">{user.storageUsed}% of 100GB</span>
              </div>
              <Progress value={user.storageUsed} className="h-2" />
              <div className="flex justify-between text-white/70 text-xs mt-2">
                <span>Free tier: 5GB</span>
                <Button variant="link" className="text-white/90 text-xs p-0 h-auto">
                  Upgrade to Pro →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Banner with AI Demo */}
        <section className="mb-8">
          <Card className="bg-gradient-primary border-0 shadow-elegant text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-30">
              <div className="w-full h-full bg-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
            </div>
            <CardContent className="p-8 relative z-10">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-4">
                    Your Documents, <br />
                    <span className="text-yellow-200">Understood Instantly</span> <br />
                    in any language
                  </h2>
                  <p className="text-white/90 mb-6 text-lg">
                    Transform your document storage into AI intelligence. Chat, analyze, and get insights in 15+ Indian languages.
                  </p>
                  <div className="flex gap-3">
                    <Button className="bg-white text-primary hover:bg-white/90 font-semibold">
                      <Brain className="w-4 h-4 mr-2" />
                      Try AI Chat
                    </Button>
                    <Button variant="outline" className="border-white text-white hover:bg-white/10">
                      <Languages className="w-4 h-4 mr-2" />
                      15+ Languages
                    </Button>
                  </div>
                </div>
                <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">AI Assistant</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 mb-3">
                    <p className="text-sm">"What's my insurance expiry?"</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-primary">
                    <p className="text-sm font-medium">🏥 Health Insurance expires on May 15, 2024</p>
                    <p className="text-xs mt-2 text-primary/70">Premium: ₹12,500 | Renew by: May 10</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card 
                key={index}
                className="bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-200 cursor-pointer group"
                onClick={() => handleQuickAction(action.onClick)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 ${action.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">{action.title}</h3>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Personalized Dashboard */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Your Dashboard</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Document Categories */}
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Document Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Financial", count: 45, color: "bg-primary", icon: CreditCard },
                  { name: "Health", count: 32, color: "bg-success", icon: Heart },
                  { name: "Identity", count: 28, color: "bg-accent", icon: User },
                  { name: "Insurance", count: 24, color: "bg-warning", icon: Shield }
                ].map((category) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center`}>
                        <category.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <Badge variant="secondary">{category.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* AI Insights with Predictions */}
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  AI Predictions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/10 p-4 rounded-xl">
                  <p className="text-sm font-medium text-primary mb-2">Next Month Budget</p>
                  <p className="text-2xl font-bold">₹2.8L</p>
                  <p className="text-xs text-muted-foreground">+12% vs this month</p>
                </div>
                <div className="bg-warning/10 p-4 rounded-xl">
                  <p className="text-sm font-medium text-warning mb-2">Upcoming Expenses</p>
                  <p className="text-2xl font-bold">₹45K</p>
                  <p className="text-xs text-muted-foreground">Insurance + Tax</p>
                </div>
              </CardContent>
            </Card>

            {/* Family Vault Teaser */}
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Family Vault
                  <Badge className="bg-success/20 text-success border-success/30 ml-auto">New</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {familyMembers.map((member) => (
                    <div key={member.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{member.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{member.docs}</Badge>
                        <div className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-success' : 'bg-warning'}`} />
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full text-primary">
                  <Users className="w-4 h-4 mr-2" />
                  Invite Family Member
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Documents - Enhanced */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Recent Documents</h2>
            <Button 
              onClick={() => navigate('/categories')}
              variant="ghost"
              className="text-primary hover:text-primary/80 font-medium"
            >
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentDocuments.map((doc) => (
              <Card key={doc.id} className="bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-200 cursor-pointer group">
                <CardContent className="p-5">
                  <div className="w-full h-28 bg-muted rounded-xl mb-4 flex items-center justify-center group-hover:bg-muted/80 transition-colors relative">
                    <FileText className="w-10 h-10 text-primary" />
                    <Badge className="absolute top-2 right-2 text-xs bg-primary/20 text-primary">
                      {doc.category}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1 truncate">{doc.title}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{doc.date}</span>
                    <span>{doc.size}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {doc.type}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* AI Insights Carousel */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  AI Insights
                </CardTitle>
                <Badge className="bg-success/20 text-success border-success/30">
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Featured Insight */}
              <div className="bg-gradient-primary p-6 rounded-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full transform translate-x-8 -translate-y-8" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        {React.createElement(aiInsights[currentInsight].icon, { className: "w-5 h-5" })}
                      </div>
                      <div>
                        <p className="text-white/90 text-sm font-medium capitalize">{aiInsights[currentInsight].type}</p>
                        <Badge className={`bg-white/20 text-white border-white/30 text-xs ${
                          aiInsights[currentInsight].priority === 'high' ? 'bg-destructive/20' : 
                          aiInsights[currentInsight].priority === 'medium' ? 'bg-warning/20' : 'bg-success/20'
                        }`}>
                          {aiInsights[currentInsight].priority} priority
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" className="bg-white text-primary hover:bg-white/90">
                      {aiInsights[currentInsight].action}
                    </Button>
                  </div>
                  <p className="text-lg font-medium mb-2">{aiInsights[currentInsight].text}</p>
                  <div className="flex gap-2">
                    {aiInsights.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentInsight ? 'bg-white' : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Other Insights */}
              <div className="grid md:grid-cols-2 gap-4">
                {aiInsights.filter((_, index) => index !== currentInsight).slice(0, 2).map((insight, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-background rounded-2xl shadow-soft border border-border/50 hover:shadow-medium transition-all">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      insight.priority === 'high' ? 'bg-destructive/10' : 
                      insight.priority === 'medium' ? 'bg-warning/10' : 'bg-success/10'
                    }`}>
                      {React.createElement(insight.icon, { className: `w-5 h-5 ${insight.color}` })}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-relaxed mb-2">{insight.text}</p>
                      <Button variant="ghost" size="sm" className="text-primary p-0 h-auto text-xs">
                        {insight.action} →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => navigate('/chat')}
                variant="outline"
                className="w-full text-primary border-primary/20 hover:bg-primary/5"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Ask AI anything about your documents
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Enhanced Reminders Timeline */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  Upcoming Reminders
                </CardTitle>
                <Button variant="outline" size="sm" className="text-primary">
                  <Calendar className="w-4 h-4 mr-2" />
                  Sync Calendar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {upcomingReminders.map((reminder, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-background rounded-2xl shadow-soft border border-border/50 hover:shadow-medium transition-all duration-200 group">
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getUrgencyColor(reminder.urgency)}`}>
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {reminder.countdown}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm text-foreground">{reminder.title}</p>
                        <Badge className={`text-xs ${
                          reminder.urgency === 'high' ? 'bg-destructive/20 text-destructive' :
                          reminder.urgency === 'medium' ? 'bg-warning/20 text-warning' :
                          'bg-success/20 text-success'
                        }`}>
                          {reminder.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{reminder.date}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs h-7">
                          Set Alert
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs h-7 text-primary">
                          View Document
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <Button variant="ghost" className="text-muted-foreground">
                  <Clock className="w-4 h-4 mr-2" />
                  View Calendar
                </Button>
                <Button variant="outline" className="text-primary">
                  <Bell className="w-4 h-4 mr-2" />
                  Smart Reminders
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Marketplace & Professional Services */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                Professional Services
                <Badge className="bg-warning/20 text-warning border-warning/30 ml-auto">Recommended</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Tax Consultation</h3>
                      <p className="text-xs text-muted-foreground">Based on your financial docs</p>
                    </div>
                  </div>
                  <p className="text-sm mb-4">Get your tax documents reviewed by certified CAs. Save up to ₹50,000 in taxes.</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">₹2,499</span>
                    <Button size="sm" className="bg-primary text-white">
                      Book Now
                    </Button>
                  </div>
                </div>
                
                <div className="bg-success/5 p-6 rounded-2xl border border-success/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-success/20 rounded-2xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-success">Insurance Review</h3>
                      <p className="text-xs text-muted-foreground">Optimize your coverage</p>
                    </div>
                  </div>
                  <p className="text-sm mb-4">Expert analysis of your insurance portfolio. Find gaps and save money.</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-success">₹1,999</span>
                    <Button size="sm" className="bg-success text-white">
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Upgrade Banner */}
        <section>
          <Card className="bg-gradient-accent border-0 shadow-elegant text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-white/5 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.1),transparent)]" />
            </div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Unlock Premium Features</h3>
                  <p className="text-white/90 mb-4">Unlimited AI queries, voice chat, family sharing & 100GB storage</p>
                  <div className="flex items-center gap-4 text-sm text-white/80">
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Unlimited AI
                    </span>
                    <span className="flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Voice Chat
                    </span>
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Family Sharing
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold mb-1">₹149</p>
                  <p className="text-white/80 text-sm mb-4">/month</p>
                  <Button className="bg-white text-primary hover:bg-white/90 font-semibold">
                    <Star className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Security Footer */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-foreground mb-2">Enterprise-Grade Security</h3>
                <p className="text-sm text-muted-foreground">Your documents are protected with bank-level security</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {securityBadges.map((badge, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 p-4 bg-background rounded-xl shadow-soft">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <badge.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-center">{badge.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-6">
                <Button variant="outline" className="text-primary">
                  <Shield className="w-4 h-4 mr-2" />
                  Learn More About Security
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <FloatingActionButton onClick={() => navigate('/upload')} />
    </div>
  );
}