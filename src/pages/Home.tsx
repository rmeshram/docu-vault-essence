import React, { useState, useEffect } from "react";
import { 
  Bell, FileText, TrendingUp, Clock, AlertCircle, Search, Filter, 
  Upload, MessageCircle, Users, Shield, Mic, Star, ChevronRight,
  PieChart, Calendar, Globe, Award, Lock, Zap, BookOpen, User,
  BarChart3, Target, Heart, CreditCard, Home as HomeIcon,
  Sparkles, Brain, Languages, Briefcase, Crown, Eye, Play,
  Headphones, Camera, Settings, Moon, Sun, Wifi, WifiOff,
  MapPin, Phone, Mail, Share2, Download, Copy, Trash2,
  Plus, Minus, RotateCcw, RefreshCw, Volume2, VolumeX,
  Maximize2, Minimize2, ExternalLink, Link, Bookmark,
  Tag, Folder, Archive, Database, Cloud, Server, Cpu,
  Monitor, Smartphone, Tablet, Watch, Gamepad2, Keyboard,
  Mouse, Printer, Scanner, Webcam, Microphone, Speaker,
  Battery, BatteryLow, Bluetooth, Usb, HardDrive, SdCard,
  Wifi as WifiIcon, Signal, Antenna, Radio, Tv, Film,
  Image, Video, Music, FileAudio, FileVideo, FileImage,
  FilePlus, FileMinus, FileCheck, FileX, FileSearch,
  FolderPlus, FolderMinus, FolderCheck, FolderX, FolderSearch,
  ArchiveX, Package, Package2, PackageCheck, PackageX, PackageSearch,
  ShoppingCart, ShoppingBag, CreditCard as CreditCardIcon, Banknote,
  Coins, DollarSign, Euro, PoundSterling, Yen, IndianRupee,
  Calculator, Receipt, Wallet, PiggyBank, TrendingDown,
  Activity, BarChart, BarChart2, LineChart, PieChart as PieChartIcon,
  Layers, Grid, List, Table, Columns, Rows, Square, Circle,
  Triangle, Hexagon, Octagon, Diamond, Pentagon, Star as StarIcon,
  Hash, AtSign, Percent, Ampersand, Asterisk, Slash, Backslash,
  Equal, NotEqual, MoreHorizontal, MoreVertical, Menu, X,
  Check, CheckCircle, CheckCircle2, CheckSquare, XCircle, XSquare,
  AlertTriangle, AlertOctagon, Info, HelpCircle, QuestionMarkCircle,
  Lightbulb, Flame, Zap as ZapIcon, Sun as SunIcon, Moon as MoonIcon,
  CloudRain, CloudSnow, CloudLightning, Umbrella, Thermometer,
  Wind, Compass, Navigation, Map, MapPin as MapPinIcon, Route,
  Car, Truck, Bus, Train, Plane, Ship, Bike, Scooter, Motorcycle,
  Fuel, Gauge, Speedometer, Timer, Stopwatch, AlarmClock, Clock as ClockIcon,
  CalendarDays, CalendarCheck, CalendarX, CalendarPlus, CalendarMinus,
  CalendarClock, CalendarHeart, CalendarRange, CalendarSearch, CalendarArrowDown,
  CalendarArrowUp, CalendarFold, CalendarUnfold, CalendarSync, CalendarImport,
  CalendarExport, CalendarCopy, CalendarEdit, CalendarView, CalendarFilter
} from "lucide-react";
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
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const recentDocuments = [
  { id: 1, title: "Aadhaar Card", type: "PDF", thumbnail: "/placeholder.svg", date: "2 hours ago", category: "Identity", size: "0.5 MB", aiSummary: "Identity document with biometric data" },
  { id: 2, title: "PAN Card", type: "PDF", thumbnail: "/placeholder.svg", date: "1 day ago", category: "Identity", size: "0.3 MB", aiSummary: "Permanent Account Number for tax purposes" },
  { id: 3, title: "Tax Return 2024", type: "PDF", thumbnail: "/placeholder.svg", date: "3 days ago", category: "Financial", size: "2.1 MB", aiSummary: "Annual tax filing with ₹45,000 deductions found" },
  { id: 4, title: "Health Insurance Policy", type: "PDF", thumbnail: "/placeholder.svg", date: "1 week ago", category: "Insurance", size: "1.8 MB", aiSummary: "₹5L coverage, expires May 15, 2024" },
];

const aiInsights = [
  { 
    type: "risk", 
    text: "Health Insurance expires in 15 days - ₹12,500 premium due", 
    color: "text-destructive",
    action: "Renew Now",
    icon: AlertCircle,
    priority: "high",
    savings: "₹2,500 early bird discount available"
  },
  { 
    type: "opportunity", 
    text: "AI found 5 tax deductions worth ₹67,000 in your documents", 
    color: "text-success",
    action: "Review Deductions",
    icon: TrendingUp,
    priority: "medium",
    savings: "Save ₹18,900 in taxes"
  },
  { 
    type: "duplicate", 
    text: "3 duplicate Aadhaar copies detected - merge to save space", 
    color: "text-warning",
    action: "Merge Files",
    icon: FileText,
    priority: "low",
    savings: "Free up 1.2 MB storage"
  },
  { 
    type: "family", 
    text: "Mom's medical reports need your attention - 2 new documents", 
    color: "text-accent",
    action: "View Family Vault",
    icon: Users,
    priority: "medium",
    savings: "Family health tracking active"
  },
];

const upcomingReminders = [
  { title: "Tax Filing Deadline", date: "2024-04-15", urgency: "high", category: "Financial", countdown: "12 days", amount: "₹18,900 refund expected" },
  { title: "Health Insurance Renewal", date: "2024-05-15", urgency: "high", category: "Insurance", countdown: "45 days", amount: "₹12,500 premium" },
  { title: "PAN Card Update", date: "2024-06-01", urgency: "medium", category: "Identity", countdown: "62 days", amount: "₹110 fee" },
  { title: "Car Insurance Renewal", date: "2024-07-20", urgency: "medium", category: "Insurance", countdown: "111 days", amount: "₹8,500 premium" },
  { title: "Property Tax Payment", date: "2024-03-31", urgency: "high", category: "Financial", countdown: "1 day", amount: "₹15,000 due" },
  { title: "Medical Checkup", date: "2024-04-30", urgency: "low", category: "Health", countdown: "27 days", amount: "₹2,500 estimated" },
];

const quickActions = [
  { title: "Upload & Scan", description: "Add documents instantly", icon: Upload, color: "bg-primary", onClick: "upload", badge: "AI OCR" },
  { title: "Voice Chat", description: "Ask AI in Hindi/English", icon: Headphones, color: "bg-accent", onClick: "chat", badge: "15+ Languages" },
  { title: "Family Vault", description: "Share with 5 members", icon: Users, color: "bg-success", onClick: "family", badge: "50GB Shared" },
  { title: "Expert Services", description: "CA, Lawyer consultations", icon: Briefcase, color: "bg-warning", onClick: "marketplace", badge: "₹2,499+" },
];

const familyMembers = [
  { name: "Mom", docs: 34, avatar: "M", status: "active", role: "Admin", storage: "12.5GB" },
  { name: "Dad", docs: 28, avatar: "D", status: "active", role: "Member", storage: "8.2GB" },
  { name: "Sister", docs: 16, avatar: "S", status: "pending", role: "Viewer", storage: "3.1GB" },
  { name: "Brother", docs: 12, avatar: "B", status: "active", role: "Member", storage: "2.8GB" },
  { name: "Grandma", docs: 8, avatar: "G", status: "emergency", role: "Emergency", storage: "1.2GB" },
];

const securityBadges = [
  { label: "AES-256 Encrypted", icon: Lock, verified: true },
  { label: "Biometric Secured", icon: Shield, verified: true },
  { label: "Blockchain Verified", icon: Award, verified: true },
  { label: "DigiLocker Synced", icon: Database, verified: true },
];

const professionalServices = [
  {
    title: "Tax Consultation",
    description: "Get your documents reviewed by certified CAs",
    price: "₹2,499",
    originalPrice: "₹4,999",
    rating: 4.8,
    reviews: 1247,
    category: "Financial",
    icon: Calculator,
    savings: "Save ₹50,000+ in taxes",
    duration: "60 min video call"
  },
  {
    title: "Legal Document Review",
    description: "Property, contracts, and legal papers verified",
    price: "₹3,999",
    originalPrice: "₹7,999",
    rating: 4.9,
    reviews: 892,
    category: "Legal",
    icon: Calculator,
    savings: "Avoid costly mistakes",
    duration: "90 min consultation"
  },
  {
    title: "Insurance Optimization",
    description: "Compare and optimize your insurance portfolio",
    price: "₹1,999",
    originalPrice: "₹3,999",
    rating: 4.7,
    reviews: 2156,
    category: "Insurance",
    icon: Shield,
    savings: "Save ₹25,000+ annually",
    duration: "45 min analysis"
  }
];

const integrationPreviews = [
  { name: "Google Calendar", icon: Calendar, status: "connected", description: "Auto-sync reminders" },
  { name: "WhatsApp Import", icon: MessageCircle, status: "available", description: "Import shared docs" },
  { name: "DigiLocker Sync", icon: Database, status: "connected", description: "2-way sync active" },
  { name: "Gmail Import", icon: Mail, status: "available", description: "Extract attachments" },
];

export default function Home() {
  const navigate = useNavigate();
  const [user] = useState({ 
    name: "Priya Sharma", 
    avatar: "/placeholder.svg", 
    tier: "Premium",
    storageUsed: 78,
    totalDocs: 186,
    aiQueriesLeft: 142,
    familyMembers: 5,
    monthlyUploads: 23,
    aiInsightsFound: 12
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentInsight, setCurrentInsight] = useState(0);
  const [language, setLanguage] = useState("English");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Rotate insights every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % aiInsights.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Chart data for document categories
  const categoryChartData = {
    labels: ['Financial', 'Identity', 'Insurance', 'Medical', 'Legal', 'Personal'],
    datasets: [{
      data: [45, 32, 28, 24, 18, 39],
      backgroundColor: [
        '#10B981', // Financial - Green
        '#3B82F6', // Identity - Blue  
        '#F59E0B', // Insurance - Amber
        '#EF4444', // Medical - Red
        '#8B5CF6', // Legal - Purple
        '#6B7280'  // Personal - Gray
      ],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  const categoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed} documents`;
          }
        }
      }
    }
  };

  // Chart data for reminders timeline
  const remindersChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Upcoming Reminders',
      data: [3, 7, 12, 8, 5, 9],
      borderColor: '#7C3AED',
      backgroundColor: 'rgba(124, 58, 237, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#7C3AED',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8
    }]
  };

  const remindersChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y} reminders in ${context.label}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

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

  const handleVoiceSearch = () => {
    setIsVoiceActive(!isVoiceActive);
    // Mock voice search functionality
    if (!isVoiceActive) {
      setTimeout(() => {
        setSearchQuery("मेरे टैक्स डॉक्यूमेंट्स दिखाओ");
        setIsVoiceActive(false);
      }, 2000);
    }
  };

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-background'}`}>
      {/* Enhanced Header with Cultural Elements */}
      <div className="bg-gradient-header p-6 pt-8 shadow-large relative overflow-hidden">
        {/* Background Pattern with Indian Motifs */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full transform translate-x-32 -translate-y-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full transform -translate-x-24 translate-y-24" />
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/20 rounded-full transform -translate-x-16 -translate-y-16" />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Top Row - Enhanced User Info with Stats */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-16 h-16 border-3 border-white/40 shadow-large">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-white/20 text-white font-bold text-xl">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-success rounded-full border-3 border-white flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white/90 text-sm font-medium">नमस्ते (Good morning),</p>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs font-bold">{user.tier}</Badge>
                  <Badge className="bg-success/20 text-white border-success/30 text-xs">DigiLocker Synced</Badge>
                </div>
                <h1 className="text-white text-2xl font-bold mb-1">{user.name}</h1>
                <div className="flex items-center gap-4 text-white/80 text-xs">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {user.totalDocs} docs
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    {user.aiQueriesLeft} AI queries
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {user.familyMembers} family
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <div className="flex items-center gap-2 bg-white/20 rounded-xl p-2">
                <SunIcon className="w-4 h-4 text-white" />
                <Switch 
                  checked={isDarkMode} 
                  onCheckedChange={setIsDarkMode}
                  className="data-[state=checked]:bg-white/30"
                />
                <MoonIcon className="w-4 h-4 text-white" />
              </div>
              
              {/* Language Toggle with Indian Flag Colors */}
              <Button 
                variant="ghost" 
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm gap-2"
                onClick={() => setLanguage(language === "English" ? "हिंदी" : "English")}
              >
                <Languages className="w-4 h-4" />
                {language}
                <Badge className="bg-orange-500/20 text-white text-xs">15+</Badge>
              </Button>
              
              <Button 
                onClick={() => navigate('/upload')}
                className="bg-white hover:bg-white/90 text-primary font-semibold shadow-medium transition-all duration-200 hover:scale-105"
                size="sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              
              <button className="p-3 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all duration-200 shadow-soft hover:scale-105 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-xs font-bold flex items-center justify-center">3</span>
              </button>
            </div>
          </div>
          
          {/* Enhanced Search with Voice and AI Suggestions */}
          <div className="relative mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
              <Input
                placeholder={language === "हिंदी" ? "पूछें: 'मेरी इंश्योरेंस कब खत्म होगी?' या डॉक्यूमेंट खोजें..." : "Ask: 'When does my insurance expire?' or search documents..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-24 h-16 bg-white/20 border-white/30 text-white placeholder:text-white/70 rounded-2xl backdrop-blur-sm focus:bg-white/30 transition-all duration-200 text-base"
                onKeyPress={(e) => e.key === 'Enter' && searchQuery && navigate('/chat')}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleVoiceSearch}
                  className={`h-10 w-10 p-0 rounded-xl transition-all duration-200 ${
                    isVoiceActive 
                      ? "bg-destructive text-white shadow-glow animate-pulse" 
                      : "text-white/70 hover:text-white hover:bg-white/20"
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 w-10 p-0 text-white/70 hover:text-white hover:bg-white/20 rounded-xl"
                >
                  <Filter className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {/* AI-Powered Search Suggestions */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {[
                language === "हिंदी" ? "टैक्स डॉक्यूमेंट्स" : "Tax documents", 
                language === "हिंदी" ? "मेडिकल रिपोर्ट्स" : "Medical reports", 
                language === "हिंदी" ? "इंश्योरेंस पॉलिसी" : "Insurance policies",
                "Aadhaar Card",
                "PAN Card"
              ].map((suggestion) => (
                <Badge 
                  key={suggestion}
                  className="bg-white/20 text-white/90 border-white/30 hover:bg-white/30 cursor-pointer transition-all hover:scale-105"
                  onClick={() => setSearchQuery(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>

          {/* Enhanced Storage Usage with Family Stats */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-sm mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/90 text-sm font-medium">Personal Storage</span>
                    <span className="text-white text-sm font-bold">{user.storageUsed}% of 50GB</span>
                  </div>
                  <Progress value={user.storageUsed} className="h-2 mb-2" />
                  <div className="flex justify-between text-white/70 text-xs">
                    <span>Free: 5GB → Premium: 50GB</span>
                    <Button variant="link" className="text-white/90 text-xs p-0 h-auto hover:text-white">
                      Upgrade to 200GB →
                    </Button>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-white/90 text-sm font-medium mb-1">Family Vault</p>
                  <p className="text-white text-2xl font-bold">27.8GB</p>
                  <p className="text-white/70 text-xs">Used by 5 members</p>
                </div>
                
                <div className="text-center">
                  <p className="text-white/90 text-sm font-medium mb-1">This Month</p>
                  <p className="text-white text-2xl font-bold">+{user.monthlyUploads}</p>
                  <p className="text-white/70 text-xs">Documents added</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Join DigiLocker Users Banner */}
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Join 434M+ DigiLocker users with AI</p>
                  <p className="text-white/80 text-sm">Growing at 825% CAGR • Trusted by millions</p>
                </div>
              </div>
              <Badge className="bg-success/20 text-white border-success/30 px-3 py-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                825% CAGR
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Section with Tagline and Demo */}
        <section className="mb-8">
          <Card className="bg-gradient-primary border-0 shadow-elegant text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-30">
              <div className="w-full h-full bg-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
            </div>
            <CardContent className="p-8 relative z-10">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-4xl font-bold mb-4 leading-tight">
                    Your Documents, <br />
                    <span className="text-yellow-200 bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                      Understood Instantly
                    </span> <br />
                    <span className="text-2xl">in any language</span>
                  </h2>
                  <p className="text-white/90 mb-6 text-lg leading-relaxed">
                    Transform your document storage into AI intelligence. Chat, analyze, and get insights in 15+ Indian languages including Hindi, Tamil, Telugu, and more.
                  </p>
                  <div className="flex gap-3 mb-4">
                    <Button className="bg-white text-primary hover:bg-white/90 font-semibold shadow-medium">
                      <Brain className="w-4 h-4 mr-2" />
                      Try AI Chat
                    </Button>
                    <Button variant="outline" className="border-white text-white hover:bg-white/10">
                      <Languages className="w-4 h-4 mr-2" />
                      15+ Languages
                    </Button>
                    <Button variant="outline" className="border-white text-white hover:bg-white/10">
                      <Play className="w-4 h-4 mr-2" />
                      Watch Demo
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-success" />
                      90% upload success
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="w-4 h-4 text-success" />
                      Bank-level security
                    </span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-medium">AI Assistant</span>
                      <Badge className="ml-2 bg-success/20 text-white text-xs">Live</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-sm font-medium mb-1">You:</p>
                      <p className="text-sm">"मेरी हेल्थ इंश्योरेंस कब खत्म होगी?"</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-primary">
                      <p className="text-sm font-medium mb-2">🏥 AI Response:</p>
                      <p className="text-sm font-bold">Health Insurance expires on May 15, 2024</p>
                      <p className="text-xs mt-2 text-primary/70">Premium: ₹12,500 | Early renewal saves ₹2,500</p>
                      <div className="flex gap-2 mt-3">
                        <Badge className="bg-primary/20 text-primary text-xs">Auto-translated</Badge>
                        <Badge className="bg-success/20 text-success text-xs">Savings found</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Enhanced Quick Actions with Badges */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Quick Actions</h2>
            <Button variant="ghost" className="text-primary">
              <Settings className="w-4 h-4 mr-2" />
              Customize
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card 
                key={index}
                className="bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-200 cursor-pointer group hover:scale-105"
                onClick={() => handleQuickAction(action.onClick)}
              >
                <CardContent className="p-6 text-center relative">
                  <Badge className="absolute top-2 right-2 text-xs bg-primary/20 text-primary">
                    {action.badge}
                  </Badge>
                  <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-medium`}>
                    <action.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-base text-foreground mb-1">{action.title}</h3>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Enhanced Dashboard with Charts */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Your Dashboard</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Document Categories with Chart */}
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Document Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 mb-4">
                  <Pie data={categoryChartData} options={categoryChartOptions} />
                </div>
                <div className="space-y-2">
                  {[
                    { name: "Financial", count: 45, color: "bg-green-500", icon: CreditCard, trend: "+5" },
                    { name: "Identity", count: 32, color: "bg-blue-500", icon: User, trend: "+2" },
                    { name: "Insurance", count: 28, color: "bg-amber-500", icon: Shield, trend: "+1" },
                    { name: "Medical", count: 24, color: "bg-red-500", icon: Heart, trend: "+3" }
                  ].map((category) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center`}>
                          <category.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{category.count}</Badge>
                        <Badge className="bg-success/20 text-success text-xs">{category.trend}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights with Predictions */}
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  AI Predictions
                  <Badge className="bg-success/20 text-success border-success/30 ml-auto">Live</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-primary">Tax Savings Found</p>
                    <Badge className="bg-success/20 text-success text-xs">New</Badge>
                  </div>
                  <p className="text-2xl font-bold text-primary">₹67,000</p>
                  <p className="text-xs text-muted-foreground">5 deductions identified by AI</p>
                </div>
                <div className="bg-warning/10 p-4 rounded-xl border border-warning/20">
                  <p className="text-sm font-medium text-warning mb-2">Risk Assessment</p>
                  <p className="text-2xl font-bold text-warning">2 High</p>
                  <p className="text-xs text-muted-foreground">Insurance expiring soon</p>
                </div>
                <div className="bg-success/10 p-4 rounded-xl border border-success/20">
                  <p className="text-sm font-medium text-success mb-2">Family Health Score</p>
                  <p className="text-2xl font-bold text-success">85%</p>
                  <p className="text-xs text-muted-foreground">All members covered</p>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Family Vault */}
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Family Vault
                  <Badge className="bg-success/20 text-success border-success/30 ml-auto">5 Members</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary">Shared Storage</span>
                    <Badge className="bg-primary/20 text-primary text-xs">50GB / 200GB</Badge>
                  </div>
                  <Progress value={25} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">27.8GB used by family</p>
                </div>
                
                <div className="space-y-3">
                  {familyMembers.slice(0, 3).map((member) => (
                    <div key={member.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-medium">{member.name}</span>
                          <p className="text-xs text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{member.docs}</Badge>
                        <div className={`w-2 h-2 rounded-full ${
                          member.status === 'active' ? 'bg-success' : 
                          member.status === 'pending' ? 'bg-warning' : 'bg-destructive'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 text-primary text-xs h-8">
                    <Plus className="w-3 h-3 mr-1" />
                    Invite Member
                  </Button>
                  <Button variant="outline" className="flex-1 text-primary text-xs h-8">
                    <Shield className="w-3 h-3 mr-1" />
                    Emergency Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Documents - Enhanced with AI Summaries */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Recent Documents</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-primary">
                <Eye className="w-4 h-4 mr-2" />
                Timeline View
              </Button>
              <Button 
                onClick={() => navigate('/categories')}
                variant="ghost"
                className="text-primary hover:text-primary/80 font-medium"
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentDocuments.map((doc) => (
              <Card key={doc.id} className="bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-200 cursor-pointer group hover:scale-[1.02]">
                <CardContent className="p-5">
                  <div className="w-full h-32 bg-muted rounded-xl mb-4 flex items-center justify-center group-hover:bg-muted/80 transition-colors relative overflow-hidden">
                    <FileText className="w-12 h-12 text-primary" />
                    <Badge className="absolute top-2 right-2 text-xs bg-primary/20 text-primary">
                      {doc.category}
                    </Badge>
                    {doc.category === "Identity" && (
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        <Badge className="bg-orange-500/20 text-orange-600 text-xs">Aadhaar</Badge>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-2 truncate">{doc.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{doc.aiSummary}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{doc.date}</span>
                    <span>{doc.size}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {doc.type}
                    </Badge>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-primary">
                      <MessageCircle className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Enhanced AI Insights Carousel with Savings */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  AI Insights & Savings
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-success/20 text-success border-success/30">
                    ₹89,400 Saved
                  </Badge>
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    Live
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Featured Insight with Enhanced Details */}
              <div className="bg-gradient-primary p-6 rounded-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full transform translate-x-8 -translate-y-8" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full transform -translate-x-4 translate-y-4" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        {React.createElement(aiInsights[currentInsight].icon, { className: "w-6 h-6" })}
                      </div>
                      <div>
                        <p className="text-white/90 text-sm font-medium capitalize">{aiInsights[currentInsight].type} Alert</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`bg-white/20 text-white border-white/30 text-xs ${
                            aiInsights[currentInsight].priority === 'high' ? 'bg-destructive/20' : 
                            aiInsights[currentInsight].priority === 'medium' ? 'bg-warning/20' : 'bg-success/20'
                          }`}>
                            {aiInsights[currentInsight].priority} priority
                          </Badge>
                          <Badge className="bg-success/20 text-white border-success/30 text-xs">
                            {aiInsights[currentInsight].savings}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" className="bg-white text-primary hover:bg-white/90 font-semibold">
                      {aiInsights[currentInsight].action}
                    </Button>
                  </div>
                  <p className="text-lg font-medium mb-4">{aiInsights[currentInsight].text}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {aiInsights.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                            index === currentInsight ? 'bg-white w-6' : 'bg-white/30'
                          }`}
                          onClick={() => setCurrentInsight(index)}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Updated 2 min ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Insights Grid */}
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
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm font-medium leading-relaxed">{insight.text}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Button variant="ghost" size="sm" className="text-primary p-0 h-auto text-xs">
                          {insight.action} →
                        </Button>
                        <Badge className="bg-success/20 text-success text-xs">
                          {insight.savings}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => navigate('/chat')}
                  className="flex-1 bg-primary text-white hover:bg-primary/90"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Ask AI Anything
                </Button>
                <Button variant="outline" className="text-primary border-primary/20 hover:bg-primary/5">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View All Insights
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Enhanced Reminders with Timeline Chart */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  Smart Reminders
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-primary">
                    <Calendar className="w-4 h-4 mr-2" />
                    Sync Calendar
                  </Button>
                  <Button variant="outline" size="sm" className="text-primary">
                    <Bell className="w-4 h-4 mr-2" />
                    Set Alert
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timeline Chart */}
              <div className="bg-background rounded-2xl p-4 border border-border/50">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Reminders Timeline (Next 6 Months)
                </h4>
                <div className="h-48">
                  <Line data={remindersChartData} options={remindersChartOptions} />
                </div>
              </div>

              {/* Urgent Reminders */}
              <div className="grid md:grid-cols-2 gap-4">
                {upcomingReminders.filter(r => r.urgency === 'high').map((reminder, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-background rounded-2xl shadow-soft border border-destructive/20 hover:shadow-medium transition-all duration-200 group">
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getUrgencyColor(reminder.urgency)}`}>
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive">
                        {reminder.countdown}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm text-foreground">{reminder.title}</p>
                        <Badge className="bg-destructive/20 text-destructive text-xs">
                          URGENT
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{reminder.date}</p>
                      <p className="text-sm font-medium text-primary mb-3">{reminder.amount}</p>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-destructive text-white text-xs h-7 hover:bg-destructive/90">
                          Pay Now
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7">
                          Set Reminder
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Other Reminders */}
              <div className="grid md:grid-cols-3 gap-4">
                {upcomingReminders.filter(r => r.urgency !== 'high').slice(0, 3).map((reminder, index) => (
                  <div key={index} className="p-4 bg-background rounded-xl border border-border/50 hover:shadow-medium transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getUrgencyColor(reminder.urgency)}`}>
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <Badge className={`text-xs ${
                        reminder.urgency === 'medium' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                      }`}>
                        {reminder.countdown}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{reminder.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{reminder.amount}</p>
                    <Button size="sm" variant="outline" className="w-full text-xs h-7">
                      Schedule
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Enhanced Professional Services Marketplace */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                  Professional Services
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-warning/20 text-warning border-warning/30">Recommended</Badge>
                  <Button variant="outline" size="sm" className="text-primary">
                    View Marketplace
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {professionalServices.map((service, index) => (
                  <div key={index} className="bg-white p-6 rounded-2xl border border-border/50 hover:shadow-medium transition-all duration-200 group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                        <service.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-primary">{service.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < Math.floor(service.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">({service.reviews})</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">{service.price}</span>
                        <span className="text-sm text-muted-foreground line-through">{service.originalPrice}</span>
                      </div>
                      <Badge className="bg-success/20 text-success text-xs">{service.savings}</Badge>
                      <p className="text-xs text-muted-foreground">{service.duration}</p>
                    </div>
                    <Button className="w-full bg-primary text-white hover:bg-primary/90">
                      Book Consultation
                    </Button>
                  </div>
                ))}
              </div>
              
              <Separator className="my-6" />
              
              <div className="text-center">
                <h4 className="font-semibold text-lg mb-2">Need Custom Help?</h4>
                <p className="text-muted-foreground mb-4">Connect with 500+ verified professionals</p>
                <Button variant="outline" className="text-primary">
                  <Users className="w-4 h-4 mr-2" />
                  Browse All Experts
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Integration Previews */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Link className="w-6 h-6 text-primary" />
                </div>
                Smart Integrations
                <Badge className="bg-success/20 text-success border-success/30 ml-auto">4 Connected</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {integrationPreviews.map((integration, index) => (
                  <div key={index} className="p-4 bg-background rounded-xl border border-border/50 text-center hover:shadow-medium transition-all">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <integration.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{integration.name}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{integration.description}</p>
                    <Badge className={`text-xs ${
                      integration.status === 'connected' 
                        ? 'bg-success/20 text-success' 
                        : 'bg-primary/20 text-primary'
                    }`}>
                      {integration.status === 'connected' ? 'Connected' : 'Connect'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Premium Upgrade Banner with ROI */}
        <section>
          <Card className="bg-gradient-accent border-0 shadow-elegant text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-white/5 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.1),transparent)]" />
            </div>
            <CardContent className="p-8 relative z-10">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-6 h-6 text-yellow-300" />
                    <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-300/30">
                      Limited Time: 50% OFF
                    </Badge>
                  </div>
                  <h3 className="text-3xl font-bold mb-3">Unlock Premium Features</h3>
                  <p className="text-white/90 mb-4 text-lg">Join 6M+ users saving ₹89,400 annually with AI-powered insights</p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-white/80 mb-6">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-300" />
                      <span>Unlimited AI Queries</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-yellow-300" />
                      <span>Voice Chat (15+ Languages)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-yellow-300" />
                      <span>Family Sharing (200GB)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-yellow-300" />
                      <span>Priority Support</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <Badge className="bg-success/20 text-white border-success/30">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      825% CAGR
                    </Badge>
                    <Badge className="bg-primary/20 text-white border-primary/30">
                      <Users className="w-3 h-3 mr-1" />
                      6M+ Users
                    </Badge>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-2xl line-through text-white/60">₹299</span>
                      <span className="text-4xl font-bold">₹149</span>
                    </div>
                    <p className="text-white/80 text-sm mb-4">/month • Save ₹1,800/year</p>
                    <div className="space-y-2 text-xs text-white/70">
                      <p>✓ ROI: Save ₹89,400 annually</p>
                      <p>✓ 30-day money-back guarantee</p>
                      <p>✓ Cancel anytime</p>
                    </div>
                  </div>
                  <Button className="bg-white text-primary hover:bg-white/90 font-bold text-lg px-8 py-3 shadow-large">
                    <Star className="w-5 h-5 mr-2" />
                    Upgrade Now - 50% OFF
                  </Button>
                  <p className="text-white/70 text-xs mt-2">Offer expires in 2 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Daily Tip Widget */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-lg">Daily AI Tip</h3>
                    <Badge className="bg-primary/20 text-primary text-xs">New</Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {language === "हिंदी" 
                      ? "अपने टैक्स डॉक्यूमेंट्स को AI से स्कैन करवाएं और ₹50,000 तक की बचत खोजें। हमारे AI ने पिछले महीने 12,000+ यूजर्स के लिए छुपी हुई कटौतियां ढूंढी हैं।"
                      : "Use AI to scan your tax documents and discover up to ₹50,000 in hidden deductions. Our AI found missed deductions for 12,000+ users last month."
                    }
                  </p>
                  <div className="flex gap-3">
                    <Button size="sm" className="bg-primary text-white">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Try AI Tax Scan
                    </Button>
                    <Button size="sm" variant="outline" className="text-primary">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Enhanced Security Footer */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">Enterprise-Grade Security</h3>
                <p className="text-muted-foreground">Your documents are protected with bank-level security trusted by 434M+ DigiLocker users</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {securityBadges.map((badge, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 p-4 bg-background rounded-xl shadow-soft hover:shadow-medium transition-all">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <badge.icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-center">{badge.label}</span>
                    {badge.verified && (
                      <Badge className="bg-success/20 text-success text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4">
                <Button variant="outline" className="text-primary">
                  <Shield className="w-4 h-4 mr-2" />
                  Security Details
                </Button>
                <Button variant="outline" className="text-primary">
                  <Award className="w-4 h-4 mr-2" />
                  Compliance Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Enterprise Edition Teaser */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft border-2 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-1">Enterprise Edition</h3>
                    <p className="text-muted-foreground">Advanced features for HR teams and businesses</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>• Bulk document processing</span>
                      <span>• API access</span>
                      <span>• Compliance reporting</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <Button className="bg-primary text-white hover:bg-primary/90 font-semibold">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Sales
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">Custom pricing available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Enhanced Floating Action Button */}
      <FloatingActionButton 
        onClick={() => navigate('/upload')}
        icon={
          <div className="relative">
            <Upload className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" />
          </div>
        }
        className="bg-gradient-primary hover:shadow-glow"
      />

      {/* Onboarding Overlay */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="bg-white max-w-md w-full">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Welcome to DocuVault AI!</h3>
              <p className="text-muted-foreground mb-6">
                Upload your first document to get instant AI insights and join 90% of users who succeed in their first 24 hours.
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => {
                    setShowOnboarding(false);
                    navigate('/upload');
                  }}
                  className="flex-1 bg-primary text-white"
                >
                  Upload First Document
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowOnboarding(false)}
                  className="flex-1"
                >
                  Skip Tour
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}