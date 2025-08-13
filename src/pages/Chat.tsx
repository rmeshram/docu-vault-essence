import { useState, useEffect, useRef } from "react";
import { 
  Send, Mic, Globe, FileText, Download, Share, Eye, Sparkles, 
  MessageCircle, Volume2, VolumeX, Languages, Brain, Zap,
  Camera, Image, Paperclip, MoreHorizontal, Copy, Bookmark,
  ThumbsUp, ThumbsDown, RefreshCw, Settings, HelpCircle,
  User, Bot, Clock, CheckCircle, AlertCircle, Info, Star,
  Headphones, Play, Pause, SkipForward, SkipBack, Repeat,
  Shuffle, Heart, Share2, ExternalLink, Link, Tag, Folder
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

    // Enhanced AI response simulation
    setTimeout(() => {
      let aiContent = '';
      let relatedDocs: Array<{id: string; title: string; type: string; relevance: number; snippet: string}> = [];
      let suggestions: string[] = [];

      if (uploadedDocuments.length > 0) {
        // Find relevant documents
        const relevantDocs = uploadedDocuments.filter(doc => 
          selectedDocument === 'all' || selectedDocument === '' || doc.id === selectedDocument
        );

        if (relevantDocs.length > 0) {
          // Generate contextual response based on query type
          if (inputMessage.toLowerCase().includes('tax') || inputMessage.toLowerCase().includes('टैक्स')) {
            aiContent = `Based on your tax documents analysis, I found several opportunities:\n\n• Potential savings: ₹45,000-67,000\n• Missing deductions identified: 5\n• Optimal tax planning suggestions available\n\nWould you like me to connect you with a certified CA for detailed review?`;
            suggestions = [
              'Book CA consultation for ₹2,499',
              'Show detailed tax breakdown',
              'Find more deductions'
            ];
          } else if (inputMessage.toLowerCase().includes('insurance') || inputMessage.toLowerCase().includes('इंश्योरेंस')) {
            aiContent = `Insurance portfolio analysis complete:\n\n• Health insurance: ₹5L coverage, expires May 15, 2024\n• Life insurance: ₹25L coverage, active\n• Vehicle insurance: Expires in 3 months\n• Recommended: Increase health coverage to ₹10L\n\nEarly renewal can save you ₹2,500 on health insurance.`;
            suggestions = [
              'Renew health insurance now',
              'Compare insurance plans',
              'Set renewal reminders'
            ];
          } else if (inputMessage.toLowerCase().includes('document') || inputMessage.toLowerCase().includes('डॉक्यूमेंट')) {
            aiContent = `Document search completed:\n\n• Found ${relevantDocs.length} relevant documents\n• 2 duplicates detected and can be merged\n• 1 document needs renewal\n• All documents are properly categorized\n\nYour document organization score: 85/100`;
            suggestions = [
              'Merge duplicate documents',
              'Set renewal reminders',
              'Improve organization score'
            ];
          } else {
            aiContent = `I've analyzed your query across ${relevantDocs.length} documents. Here's what I found:\n\n• Relevant information extracted from multiple sources\n• Cross-referenced with your document history\n• Personalized recommendations generated\n\nHow can I help you further with this information?`;
            suggestions = [
              'Get more details',
              'Export this analysis',
              'Ask follow-up question'
            ];
          }

          relatedDocs = relevantDocs.slice(0, 3).map(doc => ({
            id: doc.id,
            title: doc.name,
            type: doc.type,
            relevance: Math.floor(Math.random() * 20) + 80,
            snippet: doc.extractedText?.substring(0, 100) + '...' || 'Document content available'
          }));
        } else {
          aiContent = 'I don\'t see any uploaded documents that match your query. Please upload some relevant documents first, and I\'ll be able to provide specific insights and analysis.';
          suggestions = [
            'Upload documents',
            'Browse categories',
            'Try different query'
          ];
        }
      } else {
        aiContent = 'Welcome to DocuVault AI! I notice you haven\'t uploaded any documents yet. Upload your documents first so I can provide personalized insights, analysis, and answers to your questions.';
        suggestions = [
          'Upload first document',
          'Learn about features',
          'See demo examples'
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
    <div className="min-h-screen bg-background pb-32">
      {/* Enhanced Header */}
      <div className="bg-gradient-header p-6 pt-8 shadow-large relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-accent opacity-20"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white text-3xl font-bold mb-2 tracking-tight flex items-center">
                <Sparkles className="w-8 h-8 mr-3" />
                AI Chat
              </h1>
              <p className="text-white/90 text-base font-medium">Intelligent conversations about your documents in 15+ languages</p>
              {uploadedDocuments.length > 0 && (
                <p className="text-white/70 text-sm mt-1">
                  {uploadedDocuments.length} document(s) • Ready for AI analysis
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-40 h-10 bg-white/20 border-white/30 text-white rounded-xl backdrop-blur-sm">
                  <Globe className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* AI Features Toggle */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-white" />
                <span className="text-white text-sm">Voice</span>
              </div>
              <Switch checked={voiceEnabled} onCheckedChange={setVoiceEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-white" />
                <span className="text-white text-sm">Translate</span>
              </div>
              <Switch checked={autoTranslate} onCheckedChange={setAutoTranslate} />
            </div>
            <div className="text-center">
              <p className="text-white text-lg font-bold">{messages.length}</p>
              <p className="text-white/80 text-xs">Messages</p>
            </div>
            <div className="text-center">
              <p className="text-white text-lg font-bold">142</p>
              <p className="text-white/80 text-xs">AI Queries Left</p>
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
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-7xl mx-auto">
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
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={uploadedDocuments.length === 0}
                className="min-h-[60px] max-h-[120px] rounded-2xl border-2 border-border focus:border-primary text-base shadow-soft resize-none pr-16"
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
  );
}