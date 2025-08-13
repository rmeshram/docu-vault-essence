import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Camera, Upload as UploadIcon, File, CheckCircle, AlertCircle, RotateCcw, 
  Trash2, Eye, Plus, MessageCircle, Sparkles, Brain, Languages, 
  Shield, Clock, Star, Zap, Users, Globe, Mic, Video, Image,
  FileText, FilePlus, Folder, Tag, Calendar, MapPin, Phone,
  Mail, Link, Share2, Download, Copy, Settings, Info, HelpCircle,
  ChevronRight, ChevronDown, X, Check, AlertTriangle, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useUploadStore } from "@/store/uploadStore";

type FileStatus = 'queued' | 'uploading' | 'uploaded' | 'analyzing' | 'analyzed' | 'failed' | 'analysis-failed' | 'duplicate-detected' | 'version-created';

interface UploadFile {
  id: string;
  name: string;
  size: number;
  status: FileStatus;
  progress: number;
  category?: string;
  extractedText?: string;
  aiSummary?: string;
  confidence?: number;
  language?: string;
  duplicateOf?: string;
  version?: number;
  tags?: string[];
  file?: File;
  thumbnail?: string;
  metadata?: {
    pages?: number;
    createdDate?: string;
    modifiedDate?: string;
    author?: string;
    title?: string;
  };
}

const categories = [
  { name: 'Tax Documents', icon: FileText, color: 'bg-green-500', description: 'ITR, TDS certificates, receipts' },
  { name: 'Insurance', icon: Shield, color: 'bg-blue-500', description: 'Health, life, vehicle policies' },
  { name: 'Banking', icon: CreditCard, color: 'bg-purple-500', description: 'Statements, loan documents' },
  { name: 'Legal', icon: Scale, color: 'bg-red-500', description: 'Contracts, agreements, court papers' },
  { name: 'Medical', icon: Heart, color: 'bg-pink-500', description: 'Reports, prescriptions, bills' },
  { name: 'Identity', icon: User, color: 'bg-orange-500', description: 'Aadhaar, PAN, passport, license' },
  { name: 'Personal', icon: Folder, color: 'bg-gray-500', description: 'Certificates, photos, misc' },
  { name: 'Business', icon: Briefcase, color: 'bg-indigo-500', description: 'GST, invoices, contracts' }
];

const uploadMethods = [
  {
    id: 'camera',
    title: 'Camera Scan',
    description: 'Take photo with AI enhancement',
    icon: Camera,
    color: 'bg-primary',
    features: ['Auto-crop', 'Enhance quality', 'Multi-page scan'],
    badge: 'AI Enhanced'
  },
  {
    id: 'gallery',
    title: 'Photo Gallery',
    description: 'Select from device photos',
    icon: Image,
    color: 'bg-accent',
    features: ['Batch select', 'Auto-rotate', 'Quality check'],
    badge: 'Batch Upload'
  },
  {
    id: 'files',
    title: 'File Browser',
    description: 'Choose documents from storage',
    icon: File,
    color: 'bg-success',
    features: ['PDF support', 'Office docs', 'Multiple formats'],
    badge: 'All Formats'
  },
  {
    id: 'voice',
    title: 'Voice Notes',
    description: 'Record audio descriptions',
    icon: Mic,
    color: 'bg-warning',
    features: ['15+ languages', 'Auto-transcribe', 'Smart tagging'],
    badge: 'Voice AI'
  }
];

const aiFeatures = [
  {
    title: 'Smart OCR',
    description: 'Extract text with 99.5% accuracy',
    icon: Eye,
    active: true
  },
  {
    title: 'Auto-Categorization',
    description: 'AI suggests best category',
    icon: Brain,
    active: true
  },
  {
    title: 'Duplicate Detection',
    description: 'Find and merge similar files',
    icon: Copy,
    active: true
  },
  {
    title: 'Multi-Language',
    description: 'Support for 15+ Indian languages',
    icon: Languages,
    active: true
  },
  {
    title: 'Version Control',
    description: 'Track document updates',
    icon: Clock,
    active: false
  },
  {
    title: 'Risk Assessment',
    description: 'Identify missing documents',
    icon: AlertTriangle,
    active: false
  }
];

export default function Upload() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('files');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState('auto');
  const [enableAI, setEnableAI] = useState(true);
  const [enableDuplicateCheck, setEnableDuplicateCheck] = useState(true);
  const [enableVersionControl, setEnableVersionControl] = useState(false);
  const [bulkTags, setBulkTags] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const addDocument = useUploadStore((state) => state.addDocument);

  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case 'queued':
        return <File className="w-5 h-5 text-muted-foreground" />;
      case 'uploading':
        return <UploadIcon className="w-5 h-5 text-primary animate-pulse" />;
      case 'uploaded':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'analyzing':
        return <Brain className="w-5 h-5 text-accent animate-pulse" />;
      case 'analyzed':
        return <Sparkles className="w-5 h-5 text-success" />;
      case 'duplicate-detected':
        return <Copy className="w-5 h-5 text-warning" />;
      case 'version-created':
        return <Clock className="w-5 h-5 text-info" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'analysis-failed':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      default:
        return <File className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: FileStatus) => {
    switch (status) {
      case 'queued': return 'Queued';
      case 'uploading': return 'Uploading...';
      case 'uploaded': return 'Uploaded';
      case 'analyzing': return 'AI Analyzing...';
      case 'analyzed': return 'AI Analysis Complete';
      case 'duplicate-detected': return 'Duplicate Detected';
      case 'version-created': return 'New Version Created';
      case 'failed': return 'Upload Failed';
      case 'analysis-failed': return 'AI Analysis Failed';
      default: return 'Unknown';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFiles = (selectedFiles: FileList) => {
    const newFiles: UploadFile[] = Array.from(selectedFiles).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: 'queued' as FileStatus,
      progress: 0,
      file,
      tags: bulkTags ? bulkTags.split(',').map(tag => tag.trim()) : [],
      metadata: {
        createdDate: new Date().toISOString(),
        modifiedDate: file.lastModified ? new Date(file.lastModified).toISOString() : new Date().toISOString()
      }
    }));

    setFiles(prev => [...prev, ...newFiles]);
    setIsProcessing(true);

    // Process each file
    newFiles.forEach((file) => {
      simulateUpload(file.id);
    });

    toast({
      title: "Files queued for processing",
      description: `${newFiles.length} file(s) added with AI enhancement enabled`,
    });
  };

  const simulateUpload = (fileId: string) => {
    // Start upload
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, status: 'uploading' as FileStatus } : file
    ));

    // Simulate progress
    const progressInterval = setInterval(() => {
      setFiles(prev => prev.map(file => {
        if (file.id === fileId && file.status === 'uploading') {
          const newProgress = Math.min(file.progress + Math.random() * 25, 100);
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            
            // Upload complete, start AI analysis
            setTimeout(() => {
              setFiles(prev => prev.map(f => 
                f.id === fileId ? { 
                  ...f, 
                  status: 'uploaded' as FileStatus, 
                  progress: 100 
                } : f
              ));
              
              // Start AI analysis if enabled
              if (enableAI) {
                setTimeout(() => {
                  setFiles(prev => prev.map(f => 
                    f.id === fileId ? { 
                      ...f, 
                      status: 'analyzing' as FileStatus
                    } : f
                  ));
                  
                  // Complete AI analysis
                  setTimeout(() => {
                    const currentFile = files.find(f => f.id === fileId);
                    if (currentFile) {
                      const mockAnalysis = generateMockAnalysis(currentFile.name);
                      
                      // Check for duplicates if enabled
                      const isDuplicate = enableDuplicateCheck && Math.random() > 0.7;
                      
                      setFiles(prev => prev.map(f => 
                        f.id === fileId ? { 
                          ...f, 
                          status: isDuplicate ? 'duplicate-detected' as FileStatus : 'analyzed' as FileStatus,
                          extractedText: mockAnalysis.text,
                          aiSummary: mockAnalysis.summary,
                          confidence: mockAnalysis.confidence,
                          language: mockAnalysis.language,
                          category: mockAnalysis.category,
                          tags: [...(f.tags || []), ...mockAnalysis.tags],
                          duplicateOf: isDuplicate ? 'existing-doc-id' : undefined,
                          metadata: {
                            ...f.metadata,
                            pages: mockAnalysis.pages,
                            title: mockAnalysis.title,
                            author: mockAnalysis.author
                          }
                        } : f
                      ));

                      // Add to global store
                      addDocument({
                        id: fileId,
                        name: currentFile.name,
                        size: currentFile.size,
                        type: currentFile.name.split('.').pop()?.toUpperCase() || 'Unknown',
                        extractedText: mockAnalysis.text,
                        category: mockAnalysis.category,
                        uploadedAt: new Date(),
                      });

                      toast({
                        title: isDuplicate ? "Duplicate detected!" : "AI analysis complete!",
                        description: isDuplicate 
                          ? `Similar document found. Would you like to merge or create a new version?`
                          : `${currentFile.name} analyzed with ${mockAnalysis.confidence}% confidence`,
                        action: (
                          <Button size="sm" onClick={() => navigate('/chat')}>
                            {isDuplicate ? 'Manage Duplicate' : 'Ask AI'}
                          </Button>
                        ),
                      });
                    }
                  }, 3000);
                }, 1000);
              }
            }, 500);
          }
          return { ...file, progress: newProgress };
        }
        return file;
      }));
    }, 200);
  };

  const generateMockAnalysis = (filename: string) => {
    const analyses = {
      'aadhaar': {
        text: 'Aadhaar Card - Unique Identification Authority of India. Name: [REDACTED], DOB: [REDACTED], Address: [REDACTED]',
        summary: 'Aadhaar card with biometric identification details and address proof',
        confidence: 98,
        language: 'English/Hindi',
        category: 'Identity',
        tags: ['identity', 'government', 'biometric', 'address-proof'],
        pages: 1,
        title: 'Aadhaar Card',
        author: 'UIDAI'
      },
      'pan': {
        text: 'Permanent Account Number Card. PAN: [REDACTED], Name: [REDACTED], Father Name: [REDACTED], DOB: [REDACTED]',
        summary: 'PAN card for tax identification and financial transactions',
        confidence: 97,
        language: 'English',
        category: 'Identity',
        tags: ['tax', 'identity', 'financial', 'government'],
        pages: 1,
        title: 'PAN Card',
        author: 'Income Tax Department'
      },
      'default': {
        text: `Document content extracted from ${filename}. Contains important information including dates, amounts, and key details that can be analyzed by AI for insights and organization.`,
        summary: `AI-analyzed document with key information extracted and categorized for easy retrieval and insights.`,
        confidence: 94,
        language: 'Auto-detected',
        category: selectedCategory || 'Personal',
        tags: ['document', 'ai-processed', 'extracted'],
        pages: Math.floor(Math.random() * 5) + 1,
        title: filename.split('.')[0],
        author: 'Unknown'
      }
    };

    const key = filename.toLowerCase().includes('aadhaar') ? 'aadhaar' :
                 filename.toLowerCase().includes('pan') ? 'pan' : 'default';
    
    return analyses[key];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const retryUpload = (fileId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, status: 'queued' as FileStatus, progress: 0 } : file
    ));
    simulateUpload(fileId);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    if (method === 'files') {
      openFileSelector();
    } else if (method === 'camera') {
      // Mock camera functionality
      toast({
        title: "Camera feature",
        description: "Camera scanning will be available in the mobile app",
      });
    }
  };

  const mergeDuplicate = (fileId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, status: 'analyzed' as FileStatus, duplicateOf: undefined } : file
    ));
    toast({
      title: "Files merged",
      description: "Duplicate document has been merged with existing file",
    });
  };

  const createVersion = (fileId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { 
        ...file, 
        status: 'version-created' as FileStatus, 
        version: 2,
        duplicateOf: undefined 
      } : file
    ));
    toast({
      title: "New version created",
      description: "Document saved as version 2",
    });
  };

  useEffect(() => {
    if (files.length > 0 && files.every(f => ['analyzed', 'failed', 'duplicate-detected', 'version-created'].includes(f.status))) {
      setIsProcessing(false);
    }
  }, [files]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Enhanced Header */}
      <div className="bg-gradient-header p-6 pt-8 shadow-large relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-accent opacity-20"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white text-3xl font-bold mb-2 tracking-tight">Smart Upload</h1>
              <p className="text-white/90 text-base font-medium">AI-powered document processing with 99.5% accuracy</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-white/20 text-white border-white/30">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
              <Badge className="bg-success/20 text-white border-success/30">
                <Languages className="w-3 h-3 mr-1" />
                15+ Languages
              </Badge>
            </div>
          </div>
          
          {/* Processing Stats */}
          <div className="grid grid-cols-3 gap-4 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-white text-2xl font-bold">{files.length}</p>
              <p className="text-white/80 text-sm">Files Queued</p>
            </div>
            <div className="text-center">
              <p className="text-white text-2xl font-bold">{files.filter(f => f.status === 'analyzed').length}</p>
              <p className="text-white/80 text-sm">AI Processed</p>
            </div>
            <div className="text-center">
              <p className="text-white text-2xl font-bold">{files.filter(f => f.status === 'duplicate-detected').length}</p>
              <p className="text-white/80 text-sm">Duplicates Found</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Upload Methods */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Choose Upload Method</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {uploadMethods.map((method) => (
              <Card 
                key={method.id}
                className={`bg-gradient-card border-0 shadow-soft cursor-pointer hover:shadow-medium transition-all duration-200 hover:scale-[1.02] group ${
                  selectedMethod === method.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleMethodSelect(method.id)}
              >
                <CardContent className="p-6 text-center">
                  <Badge className="absolute top-2 right-2 text-xs bg-primary/20 text-primary">
                    {method.badge}
                  </Badge>
                  <div className={`w-16 h-16 ${method.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-glow transition-all duration-300`}>
                    <method.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-base mb-2">{method.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{method.description}</p>
                  <div className="space-y-1">
                    {method.features.map((feature, index) => (
                      <div key={index} className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Check className="w-3 h-3 text-success" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* AI Features Configuration */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  AI Processing Features
                </CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-primary"
                >
                  Advanced Settings
                  <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-background rounded-xl border border-border/50">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      feature.active ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <feature.icon className={`w-5 h-5 ${feature.active ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm">{feature.title}</h4>
                        <Switch 
                          checked={feature.active} 
                          disabled={!feature.active && index > 3}
                          className="scale-75"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                      {!feature.active && index > 3 && (
                        <Badge className="bg-warning/20 text-warning text-xs mt-2">Premium Feature</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {showAdvanced && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Language Detection</label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto-detect</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                          <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                          <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                          <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                          <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                          <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Default Category</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Auto-categorize" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Auto-categorize</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.name} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Bulk Tags (comma-separated)</label>
                    <Input
                      placeholder="e.g., important, 2024, tax-related"
                      value={bulkTags}
                      onChange={(e) => setBulkTags(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Drag & Drop Upload Area */}
        <section>
          <div
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer ${
              isDragOver 
                ? 'border-primary bg-gradient-primary/10 scale-[1.02] shadow-glow' 
                : 'border-border hover:border-primary/60 hover:bg-gradient-primary/5 hover:shadow-medium'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileSelector}
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-soft">
                <UploadIcon className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
                {isDragOver ? 'Drop files here' : 'Drag & drop files'}
              </h3>
              <p className="text-muted-foreground mb-6 text-lg">
                or <span className="text-primary font-semibold bg-gradient-primary bg-clip-text text-transparent">click to browse</span>
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <Badge className="bg-muted/50 text-muted-foreground">PDF</Badge>
                <Badge className="bg-muted/50 text-muted-foreground">JPG</Badge>
                <Badge className="bg-muted/50 text-muted-foreground">PNG</Badge>
                <Badge className="bg-muted/50 text-muted-foreground">DOCX</Badge>
                <Badge className="bg-muted/50 text-muted-foreground">+More</Badge>
              </div>
              <p className="text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full inline-block">
                Up to 50MB per file • Batch upload supported
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </section>

        {/* File Queue with Enhanced Details */}
        {files.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Processing Queue ({files.length})</h3>
              <div className="flex items-center gap-2">
                {isProcessing && (
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">AI Processing...</span>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => setFiles([])}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
            
            <div className="space-y-6">
              {files.map((file) => (
                <Card key={file.id} className="bg-gradient-card border-0 shadow-elegant hover:shadow-large transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(file.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-foreground truncate">{file.name}</h4>
                          <div className="flex items-center gap-2">
                            {file.confidence && (
                              <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                                {file.confidence}% confidence
                              </Badge>
                            )}
                            
                            {file.status === 'analyzed' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => navigate('/chat')}
                                  className="h-8 px-3 text-xs bg-gradient-primary hover:shadow-medium transition-all duration-200"
                                >
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  Ask AI
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 text-xs"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Preview
                                </Button>
                              </>
                            )}
                            
                            {file.status === 'duplicate-detected' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => mergeDuplicate(file.id)}
                                  className="h-8 px-3 text-xs bg-warning text-white hover:bg-warning/90"
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Merge
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => createVersion(file.id)}
                                  className="h-8 px-3 text-xs"
                                >
                                  <Clock className="w-3 h-3 mr-1" />
                                  New Version
                                </Button>
                              </div>
                            )}
                            
                            {file.status === 'failed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => retryUpload(file.id)}
                                className="h-8 px-3 text-xs"
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Retry
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFile(file.id)}
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                          <span>Size: {formatFileSize(file.size)}</span>
                          <span>Status: {getStatusText(file.status)}</span>
                          {file.language && <span>Language: {file.language}</span>}
                          {file.metadata?.pages && <span>Pages: {file.metadata.pages}</span>}
                        </div>
                        
                        {(file.status === 'uploading' || file.status === 'analyzing') && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">
                                {file.status === 'uploading' ? 'Uploading...' : 'AI Analyzing...'}
                              </span>
                              <span className="text-sm text-muted-foreground">{file.progress}%</span>
                            </div>
                            <Progress value={file.progress} className="h-2" />
                          </div>
                        )}
                        
                        {file.category && (
                          <div className="mb-4">
                            <Badge className="bg-primary/10 text-primary border-primary/20">
                              <Folder className="w-3 h-3 mr-1" />
                              {file.category}
                            </Badge>
                          </div>
                        )}
                        
                        {file.tags && file.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {file.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {file.aiSummary && (
                          <div className="mt-4 p-4 bg-background rounded-xl border border-border/50">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                AI Summary
                              </span>
                              <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                                <Share2 className="w-3 h-3 mr-1" />
                                Share
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{file.aiSummary}</p>
                            
                            {file.extractedText && (
                              <details className="mt-3">
                                <summary className="cursor-pointer text-xs font-medium text-primary hover:text-primary/80">
                                  View Extracted Text
                                </summary>
                                <Textarea
                                  value={file.extractedText}
                                  readOnly
                                  className="text-sm h-24 resize-none mt-2"
                                />
                              </details>
                            )}
                          </div>
                        )}
                        
                        {file.duplicateOf && (
                          <div className="mt-4 p-4 bg-warning/10 rounded-xl border border-warning/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Copy className="w-4 h-4 text-warning" />
                              <span className="text-sm font-semibold text-warning">Duplicate Detected</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              This document appears to be similar to an existing file. Choose an action:
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => mergeDuplicate(file.id)}
                                className="bg-warning text-white hover:bg-warning/90"
                              >
                                Merge with existing
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => createVersion(file.id)}
                              >
                                Keep as new version
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Upload Tips */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Info className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">Pro Tips for Better Results</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        <span>Use high-resolution scans (300+ DPI)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        <span>Ensure good lighting for photos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        <span>Keep documents flat and straight</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        <span>Upload multiple pages as single PDF</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        <span>Use descriptive filenames</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        <span>Enable AI features for best results</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}