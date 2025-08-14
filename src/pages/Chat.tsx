import { useState, useEffect, useRef } from "react";
import { 
  Send, Mic, Globe, FileText, Download, Share, Eye, Sparkles, 
  MessageCircle, Volume2, VolumeX, Languages, Brain, Zap,
  Camera, Image, Paperclip, MoreHorizontal, Copy, Bookmark,
  ThumbsUp, ThumbsDown, RefreshCw, Settings, HelpCircle,
  User, Bot, Clock, CheckCircle, AlertCircle, Info, Star,
  Headphones, Play, Pause, SkipForward, SkipBack, Repeat,
  Shuffle, Heart, Share2, ExternalLink, Link, Tag, Folder, X,
  ArrowRight, Users
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useUploadStore } from "@/store/uploadStore";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  language?: string;
  confidence?: number;
  isVoice?: boolean;
  audioUrl?: string;
  documents?: Array<{
    id: string;
    title: string;
    type: string;
    thumbnail?: string;
    relevance?: number;
    snippet?: string;
  }>;
  suggestions?: string[];
  metadata?: {
    processingTime?: number;
    tokensUsed?: number;
    model?: string;
  };
}

const mockMessages: Message[] = [
  {
    id: '1',
    type: 'user',
    content: 'मेरे टैक्स डॉक्यूमेंट्स में कितनी बचत हो सकती है?',
    timestamp: new Date(Date.now() - 300000),
    language: 'Hindi',
    isVoice: true
  },
  {
    id: '2',
    type: 'ai',
    content: 'आपके टैक्स डॉक्यूमेंट्स का विश्लेषण करने के बाद, मैंने ₹67,000 की संभावित बचत की पहचान की है। यहाँ मुख्य बिंदु हैं:\n\n• HRA छूट: ₹24,000\n• 80C निवेश: ₹18,000\n• मेडिकल बीमा: ₹12,000\n• शिक्षा ऋण ब्याज: ₹13,000\n\nक्या आप इन कटौतियों के बारे में विस्तार से जानना चाहेंगे?',
    timestamp: new Date(Date.now() - 280000),
    language: 'Hindi',
    confidence: 96,
    documents: [
      { id: '1', title: 'Tax Return 2024', type: 'PDF', relevance: 95, snippet: 'ITR-1 form with salary details and deductions' },
      { id: '2', title: 'HRA Receipts', type: 'PDF', relevance: 88, snippet: 'House rent receipts for FY 2023-24' },
      { id: '3', title: 'Investment Proofs', type: 'PDF', relevance: 92, snippet: 'PPF, ELSS, and insurance premium receipts' },
    ],
    suggestions: [
      'HRA छूट के लिए क्या दस्तावेज चाहिए?',
      'मेडिकल बीमा की कटौती कैसे क्लेम करें?',
      'Tax consultant से बात करवाएं'
    ],
    metadata: {
      processingTime: 2.3,
      tokensUsed: 245,
      model: 'GPT-4-Turbo'
    }
  }
];

const languages = [
  { value: 'auto', label: 'Auto-detect', flag: '🌐' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { value: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { value: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { value: 'bn', label: 'বাংলা', flag: '🇮🇳' },
  { value: 'mr', label: 'मराठी', flag: '🇮🇳' },
  { value: 'gu', label: 'ગુજરાતી', flag: '🇮🇳' },
  { value: 'kn', label: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { value: 'ml', label: 'മലയാളം', flag: '🇮🇳' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { value: 'or', label: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { value: 'as', label: 'অসমীয়া', flag: '🇮🇳' },
];

const quickPrompts = [
  {
    category: 'Tax & Finance',
    prompts: [
      'मेरी टैक्स बचत कितनी हो सकती है?',
      'What are my investment options?',
      'Show me my bank statements summary',
      'Calculate my EMI eligibility'
    ]
  },
  {
    category: 'Insurance',
    prompts: [
      'When does my health insurance expire?',
      'Compare my insurance policies',
      'मेरे इंश्योरेंस क्लेम्स दिखाएं',
      'What coverage am I missing?'
    ]
  },
  {
    category: 'Documents',
    prompts: [
      'Find my Aadhaar card',
      'Show duplicate documents',
      'मेरे मेडिकल रिपोर्ट्स कहाँ हैं?',
      'List expired documents'
    ]
  }
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedDocument, setSelectedDocument] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const uploadedDocuments = useUploadStore((state) => state.uploadedDocuments);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      language: selectedLanguage === 'auto' ? 'Auto-detected' : languages.find(l => l.value === selectedLanguage)?.label,
      isVoice: isVoiceActive
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsTyping(true);
    setShowQuickPrompts(false);

          // Enhanced AI response simulation with better document analysis
          setTimeout(() => {
            let aiContent = '';
            let relatedDocs: Array<{id: string; title: string; type: string; relevance: number; snippet: string}> = [];
            let suggestions: string[] = [];

            if (uploadedDocuments.length > 0) {
              // Find relevant documents based on query and document content
              const relevantDocs = uploadedDocuments.filter(doc => {
                const searchTerms = inputMessage.toLowerCase().split(' ');
                const docText = (doc.name + ' ' + (doc.extractedText || '')).toLowerCase();
                
                return searchTerms.some(term => 
                  docText.includes(term) || 
                  (selectedDocument === 'all' || selectedDocument === '' || doc.id === selectedDocument)
                );
              });

              if (relevantDocs.length > 0) {
                // Generate contextual response based on query type
                if (inputMessage.toLowerCase().includes('tax') || inputMessage.toLowerCase().includes('टैक्स')) {
                  aiContent = `Based on analysis of ${relevantDocs.length} tax-related documents:\n\n• Potential tax savings identified: ₹45,000-67,000\n• Missing deduction opportunities: 5 found\n• Optimal filing strategy recommendations available\n• Document completeness score: 92%\n\nI can help you maximize your tax benefits. Would you like a detailed breakdown?`;
                  suggestions = [
                    'Show detailed tax breakdown',
                    'Find missing deductions',
                    'Book CA consultation',
                    'Export tax summary'
                  ];
                } else if (inputMessage.toLowerCase().includes('insurance') || inputMessage.toLowerCase().includes('इंश्योरेंस')) {
                  aiContent = `Insurance portfolio analysis from ${relevantDocs.length} documents:\n\n• Health insurance: ₹5L coverage, expires May 15, 2024\n• Life insurance: ₹25L coverage, active\n• Vehicle insurance: Expires in 3 months\n• Coverage gap analysis: Need ₹5L additional health coverage\n\nEarly renewal discount available: Save ₹2,500 on health insurance.`;
                  suggestions = [
                    'Renew health insurance now',
                    'Compare insurance plans',
                    'Set renewal reminders',
                    'Calculate coverage needs'
                  ];
                } else if (inputMessage.toLowerCase().includes('document') || inputMessage.toLowerCase().includes('डॉक्यूमेंट') || inputMessage.toLowerCase().includes('find') || inputMessage.toLowerCase().includes('show')) {
                  aiContent = `Document search completed across your vault:\n\n• Found ${relevantDocs.length} matching documents\n• 2 potential duplicates detected\n• 1 document requires renewal attention\n• Organization score: 85/100\n• Last backup: ${new Date().toLocaleDateString()}\n\nAll documents are properly categorized and searchable.`;
                  suggestions = [
                    'View found documents',
                    'Merge duplicate documents',
                    'Set renewal reminders',
                    'Improve organization'
                  ];
                } else if (inputMessage.toLowerCase().includes('summary') || inputMessage.toLowerCase().includes('summarize')) {
                  aiContent = `Document summary generated:\n\n• Total documents analyzed: ${relevantDocs.length}\n• Key insights extracted from each document\n• Important dates and deadlines identified\n• Cross-references between related documents found\n\nI've created a comprehensive overview of your selected documents. Need specific details from any document?`;
                  suggestions = [
                    'Show detailed breakdown',
                    'Extract key dates',
                    'Find relationships',
                    'Export summary'
                  ];
                } else {
                  // General query - provide intelligent response based on document content
                  const documentTypes = [...new Set(relevantDocs.map(doc => doc.type))];
                  aiContent = `I've analyzed your query across ${relevantDocs.length} documents (${documentTypes.join(', ')}):\n\n• Extracted relevant information from multiple sources\n• Cross-referenced with your document history\n• Generated personalized insights\n• Identified related documents and connections\n\nWhat specific aspect would you like me to elaborate on?`;
                  suggestions = [
                    'Get more details',
                    'Show related documents',
                    'Export analysis',
                    'Ask follow-up question'
                  ];
                }

                // Create relevant document references
                relatedDocs = relevantDocs.slice(0, 3).map(doc => ({
                  id: doc.id,
                  title: doc.name,
                  type: doc.type,
                  relevance: Math.floor(Math.random() * 20) + 80,
                  snippet: doc.extractedText?.substring(0, 100) + '...' || 'Document content available for analysis'
                }));
              } else {
                aiContent = 'I searched through your uploaded documents but couldn\'t find content matching your specific query. Try rephrasing your question or upload more relevant documents for better analysis.';
                suggestions = [
                  'Rephrase question',
                  'Upload more documents',
                  'Browse all documents',
                  'Try voice search'
                ];
              }
            } else {
              aiContent = 'Welcome to DocuVault AI! 🚀\n\nI\'m ready to help you manage and analyze your documents intelligently. To get started:\n\n• Upload your first document\n• I\'ll automatically extract and analyze content\n• Ask me questions about your documents\n• Get insights, summaries, and smart recommendations\n\nLet\'s make your document management effortless!';
              suggestions = [
                'Upload first document',
                'Take a demo tour',
                'Learn about AI features',
                'See example queries'
              ];
            }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiContent,
        timestamp: new Date(),
        language: autoTranslate ? (selectedLanguage === 'auto' ? 'English' : languages.find(l => l.value === selectedLanguage)?.label) : 'English',
        confidence: Math.floor(Math.random() * 10) + 90,
        documents: relatedDocs.length > 0 ? relatedDocs : undefined,
        suggestions: suggestions,
        metadata: {
          processingTime: Math.random() * 3 + 1,
          tokensUsed: Math.floor(Math.random() * 200) + 150,
          model: 'GPT-4-Turbo'
        }
      };
      
      setIsTyping(false);
      setMessages(prev => [...prev, aiResponse]);
    }, 2000);
  };

  const handleVoiceInput = () => {
    setIsVoiceActive(!isVoiceActive);
    setIsListening(!isListening);
    
    if (!isListening) {
      // Mock voice recognition
      setTimeout(() => {
        setInputMessage("मेरे इंश्योरेंस डॉक्यूमेंट्स दिखाएं");
        setIsListening(false);
        setIsVoiceActive(false);
      }, 3000);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
    setShowQuickPrompts(false);
  };

  const playAudio = (messageId: string) => {
    if (currentAudio === messageId && isPlaying) {
      setIsPlaying(false);
      setCurrentAudio(null);
    } else {
      setCurrentAudio(messageId);
      setIsPlaying(true);
      // Mock audio playback
      setTimeout(() => {
        setIsPlaying(false);
        setCurrentAudio(null);
      }, 5000);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const shareMessage = (message: Message) => {
    if (navigator.share) {
      navigator.share({
        title: 'DocuVault AI Response',
        text: message.content,
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background pb-32">
      {/* Enhanced Premium Header with Cultural Elements */}
      <div className="bg-gradient-header p-6 pt-8 shadow-large relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-500/20 to-pink-500/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute inset-0 bg-gradient-accent opacity-10 backdrop-blur-sm"></div>
          {/* Indian Pattern Overlay */}
          <div className="absolute inset-0 opacity-5 bg-[url('/patterns/indian-pattern.svg')] bg-repeat"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
              <h1 className="text-white text-3xl font-bold mb-2 tracking-tight flex items-center">
                <div className="relative mr-4">
                  <div className="absolute inset-0 bg-white/20 rounded-xl blur animate-pulse"></div>
                  <Sparkles className="w-8 h-8 relative z-10" />
                </div>
                AI Assistant
                <Badge className="ml-3 bg-white/20 text-white border-white/30 text-xs">
                  <Brain className="w-3 h-3 mr-1" />
                  GPT-4 Turbo
                </Badge>
              </h1>
              <p className="text-white/90 text-base font-medium flex items-center gap-2">
                Intelligent conversations in 15+ languages
                <Badge className="bg-orange-500/20 text-white border-orange-500/30">
                  <Globe className="w-3 h-3 mr-1" />
                  DigiLocker Integrated
                </Badge>
              </p>
              {uploadedDocuments.length > 0 && (
                <div className="flex items-center gap-3 mt-2">
                  <Badge className="bg-success/20 text-white border-success/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {uploadedDocuments.length} Documents Ready
                  </Badge>
                  <Badge className="bg-primary/20 text-white border-primary/30">
                    <Brain className="w-3 h-3 mr-1" />
                    AI Analysis Active
                  </Badge>
                  <Badge className="bg-warning/20 text-white border-warning/30">
                    <Clock className="w-3 h-3 mr-1" />
                    Real-time Processing
                  </Badge>
                </div>
              )}
            
            <div className="flex items-center gap-3">
              {/* Enhanced Language Selector with Cultural Context */}
              <div className="relative group">
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-48 h-10 bg-white/20 border-white/30 text-white rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>Language</span>
                      <Badge className="bg-orange-500/20 text-white text-xs ml-auto">15+</Badge>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <div className="p-2 mb-2 border-b">
                      <p className="text-xs text-muted-foreground">Regional Languages</p>
                    </div>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{lang.flag}</span>
                          <div>
                            <span className="font-medium">{lang.label}</span>
                            {lang.value === selectedLanguage && (
                              <Badge className="ml-2 bg-success/20 text-success text-xs">Active</Badge>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Enhanced Controls */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 px-4 bg-white/20 text-white hover:bg-white/30 rounded-xl backdrop-blur-sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Family Mode
                  <Badge className="ml-2 bg-success/20 text-white text-xs">5</Badge>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 bg-white/20 text-white hover:bg-white/30 rounded-xl backdrop-blur-sm"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Enhanced AI Features Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Voice & Translation Controls */}
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <Volume2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-white text-sm font-medium">Voice AI</span>
                    <p className="text-white/70 text-xs">Multi-lingual input</p>
                  </div>
                </div>
                <Switch 
                  checked={voiceEnabled} 
                  onCheckedChange={setVoiceEnabled}
                  className="data-[state=checked]:bg-success"
                />
              </div>
              <Progress value={75} className="h-1 bg-white/10" />
              <p className="text-white/60 text-xs mt-2">75% accuracy in Hindi</p>
            </div>

            {/* Translation Features */}
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <Languages className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-white text-sm font-medium">Auto-Translate</span>
                    <p className="text-white/70 text-xs">Real-time translation</p>
                  </div>
                </div>
                <Switch 
                  checked={autoTranslate} 
                  onCheckedChange={setAutoTranslate}
                  className="data-[state=checked]:bg-success"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                {["🇮🇳", "🇺🇸", "🇬🇧"].map((flag, i) => (
                  <Badge key={i} className="bg-white/20 border-0">{flag}</Badge>
                ))}
                <Badge className="bg-primary/20 text-white text-xs">+12 more</Badge>
              </div>
            </div>

            {/* Chat Analytics */}
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-lg font-bold">{messages.length}</p>
                  <p className="text-white/70 text-xs">Total Messages</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Response time: 2.3s</span>
                <span>Accuracy: 96%</span>
              </div>
            </div>

            {/* Premium Features */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-4 backdrop-blur-sm border border-white/20 hover:shadow-glow transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-lg font-bold">142</p>
                  <p className="text-white/70 text-xs">AI Queries Left</p>
                </div>
              </div>
              <Button variant="ghost" className="w-full justify-between text-xs text-white hover:bg-white/20 group-hover:bg-white/20">
                Upgrade to Premium
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Document Selector */}
        <Card className="bg-gradient-card border-0 shadow-elegant mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-base font-semibold flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary" />
                Context Documents
              </label>
              <Badge className="bg-primary/20 text-primary">
                {uploadedDocuments.length} Available
              </Badge>
            </div>
            <Select value={selectedDocument} onValueChange={setSelectedDocument}>
              <SelectTrigger className="h-12 rounded-xl border-2 border-border">
                <SelectValue placeholder="All documents (recommended)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>All Documents ({uploadedDocuments.length}) - AI will find relevant ones</span>
                  </div>
                </SelectItem>
                {uploadedDocuments.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>{doc.name}</span>
                    </div>
                  </SelectItem>
                ))}
                {uploadedDocuments.length === 0 && (
                  <SelectItem value="none" disabled>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      <span>No documents uploaded yet</span>
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Quick Prompts */}
        {showQuickPrompts && (
          <Card className="bg-gradient-card border-0 shadow-elegant mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Quick Prompts
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowQuickPrompts(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                {quickPrompts.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">{category.category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {category.prompts.map((prompt, promptIndex) => (
                        <Button
                          key={promptIndex}
                          variant="outline"
                          className="justify-start h-auto p-3 text-left hover:bg-primary/5"
                          onClick={() => handleQuickPrompt(prompt)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2 text-primary" />
                          <span className="text-sm">{prompt}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        <div className="space-y-6 mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-3 max-w-[85%] ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-white/20">
                  <AvatarFallback className={
                    message.type === 'user' 
                      ? 'bg-gradient-primary text-white font-bold' 
                      : 'bg-gradient-accent text-white font-bold'
                  }>
                    {message.type === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`space-y-3 ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                  <Card className={`border-0 shadow-elegant ${
                    message.type === 'user' 
                      ? 'bg-gradient-primary text-white' 
                      : 'bg-gradient-card'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {message.isVoice && (
                            <Badge className="bg-white/20 text-white text-xs">
                              <Mic className="w-3 h-3 mr-1" />
                              Voice
                            </Badge>
                          )}
                          {message.language && (
                            <Badge className="bg-white/20 text-white text-xs">
                              <Languages className="w-3 h-3 mr-1" />
                              {message.language}
                            </Badge>
                          )}
                          {message.confidence && (
                            <Badge className="bg-success/20 text-success text-xs">
                              {message.confidence}% confidence
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {voiceEnabled && message.type === 'ai' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 hover:bg-white/20"
                              onClick={() => playAudio(message.id)}
                            >
                              {currentAudio === message.id && isPlaying ? 
                                <Pause className="w-3 h-3" /> : 
                                <Play className="w-3 h-3" />
                              }
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-white/20"
                            onClick={() => copyMessage(message.content)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 hover:bg-white/20"
                            onClick={() => shareMessage(message)}
                          >
                            <Share2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
                      
                      {message.metadata && (
                        <div className="flex items-center gap-4 mt-3 text-xs opacity-70">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {message.metadata.processingTime?.toFixed(1)}s
                          </span>
                          <span className="flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            {message.metadata.tokensUsed} tokens
                          </span>
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {message.metadata.model}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Related Documents */}
                  {message.documents && (
                    <div className="space-y-3 w-full">
                      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Related Documents ({message.documents.length})
                      </h4>
                      {message.documents.map((doc) => (
                        <Card key={doc.id} className="bg-gradient-card border-0 shadow-elegant hover:shadow-large transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-semibold">{doc.title}</p>
                                    <Badge className="bg-primary/20 text-primary text-xs">
                                      {doc.relevance}% match
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{doc.type}</p>
                                  {doc.snippet && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.snippet}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10">
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10">
                                  <Share className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  {/* AI Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="space-y-2 w-full">
                      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Suggested Follow-ups
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 hover:bg-primary/5"
                            onClick={() => handleQuickPrompt(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3 max-w-[80%]">
                <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-white/20">
                  <AvatarFallback className="bg-gradient-accent text-white font-bold">
                    <Bot className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <Card className="bg-gradient-card border-0 shadow-elegant">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-muted-foreground">AI is thinking...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Input Area */}
      <div className="fixed bottom-[72px] left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-50">
        <div className="max-w-7xl w-full mx-auto px-4">
          {/* Voice Recognition Indicator */}
          {isListening && (
            <div className="mb-4 p-3 bg-primary/10 rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-pulse">
                  <Mic className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">Listening...</p>
                  <p className="text-xs text-muted-foreground">Speak in any of 15+ supported languages</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setIsListening(false)}>
                  Stop
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-muted-foreground hover:text-primary"
                >
                  <Paperclip className="w-4 h-4 mr-1" />
                  Attach
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-muted-foreground hover:text-primary"
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Photo
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-muted-foreground hover:text-primary"
                  onClick={() => setShowQuickPrompts(true)}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Prompts
                </Button>
              </div>
              
              <Textarea
                placeholder={
                  uploadedDocuments.length > 0 
                    ? selectedLanguage === 'hi' 
                      ? "AI से पूछें: 'मेरे डॉक्यूमेंट्स के बारे में बताएं'..."
                      : "Ask AI: 'Tell me about my documents' or type in any language..."
                    : "Upload documents first to start chatting with AI..."
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={uploadedDocuments.length === 0}
                autoFocus
                className="w-full min-h-[60px] max-h-[120px] rounded-2xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-base shadow-soft resize-none pr-16"
              />
              
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                {voiceEnabled && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleVoiceInput}
                    disabled={uploadedDocuments.length === 0}
                    className={`h-8 w-8 p-0 rounded-xl transition-all duration-200 ${
                      isListening
                        ? "bg-destructive text-white shadow-glow animate-pulse" 
                        : isVoiceActive
                        ? "bg-primary text-white shadow-medium"
                        : "hover:bg-primary/10"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-xl hover:bg-primary/10"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || uploadedDocuments.length === 0}
              className="h-14 w-14 p-0 rounded-2xl bg-gradient-primary hover:shadow-glow transition-all duration-300 disabled:bg-muted disabled:text-muted-foreground"
            >
              <Send className="w-6 h-6" />
            </Button>
          </div>
          
          {uploadedDocuments.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Please upload some documents first to start asking questions
            </p>
          )}
          
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>AI can make mistakes. Verify important information.</span>
            <span>•</span>
            <span>142 queries remaining</span>
            <span>•</span>
            <Button variant="link" className="text-xs p-0 h-auto text-primary">
              Upgrade for unlimited
            </Button>
          </div>
        </div>
      </div>
                </div>
      </div>
  );
}

