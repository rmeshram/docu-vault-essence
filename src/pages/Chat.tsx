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
import { useAuth } from "@/hooks/useAuth";
import { useAIChat } from "@/hooks/useAIChat";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  conversation_id: string;
  message: string;
  is_user_message: boolean;
  created_at: string;
  ai_model?: string;
  confidence_score?: number;
  related_document_ids?: string[];
  processing_time_ms?: number;
  tokens_used?: number;
}

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
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const { messages, loading, sending, sendMessage } = useAIChat(conversationId || undefined);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize conversation
  useEffect(() => {
    const initializeConversation = async () => {
      if (!user) return;

      try {
        // Create a new conversation
        const { data: conversation, error: convError } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: user.id,
            title: 'New Chat Session',
          })
          .select()
          .single();

        if (convError) throw convError;
        
        setConversationId(conversation.id);
      } catch (error) {
        console.error('Failed to create conversation:', error);
        setError('Failed to initialize chat session');
      }
    };

    initializeConversation();
  }, [user]);

  // Fetch user documents
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('documents')
          .select('id, name, category, ai_summary')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setDocuments(data || []);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      }
    };

    fetchDocuments();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sending || !conversationId) return;

    try {
      setError(null);
      await sendMessage(inputMessage, [], {
        language: selectedLanguage,
        includeContext: true
      });
      setInputMessage('');
      setShowQuickPrompts(false);
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (sending || !conversationId) return;
    
    try {
      setError(null);
      await sendMessage(prompt, [], {
        language: selectedLanguage,
        includeContext: true
      });
      setShowQuickPrompts(false);
    } catch (error) {
      console.error('Failed to send quick prompt:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <Card className="w-96 p-6">
          <CardContent className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please sign in to access AI chat features.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  // Main chat UI return
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-6xl mx-auto p-4 h-screen flex flex-col">
        {/* Header */}
        <div className="bg-gradient-header rounded-2xl p-6 mb-4 shadow-large">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">AI Chat Assistant</h1>
                <p className="text-muted-foreground">Intelligent document analysis and insights</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="bg-success/20 text-success">
                {documents.length} Documents
              </Badge>
            </div>
          </div>
        </div>
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Start a Conversation</h3>
              <p className="text-muted-foreground mb-6">Ask me anything about your documents or use a quick prompt below.</p>
              {/* Quick Prompts */}
              {showQuickPrompts && (
                <div className="grid gap-4 max-w-2xl mx-auto">
                  {quickPrompts.map((category, idx) => (
                    <div key={idx} className="text-left">
                      <h4 className="font-medium text-foreground mb-2">{category.category}</h4>
                      <div className="grid gap-2">
                        {category.prompts.map((prompt, promptIdx) => (
                          <Button
                            key={promptIdx}
                            variant="outline"
                            size="sm"
                            className="justify-start text-left h-auto p-3"
                            onClick={() => handleQuickPrompt(prompt)}
                            disabled={sending}
                          >
                            <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
                            {prompt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.is_user_message ? 'justify-end' : 'justify-start'}`}
                >
                  {!message.is_user_message && (
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="w-5 h-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-2xl ${message.is_user_message ? 'order-1' : ''}`}>
                    <Card className={message.is_user_message ? 'bg-primary text-primary-foreground ml-auto' : 'bg-gradient-card border-0'}>
                      <CardContent className="p-4">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.message}
                        </div>
                        {!message.is_user_message && message.confidence_score && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                Confidence: {message.confidence_score.toFixed(0)}%
                              </Badge>
                              {message.ai_model && (
                                <Badge variant="outline" className="text-xs">
                                  {message.ai_model}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <div className={`text-xs text-muted-foreground mt-1 ${message.is_user_message ? 'text-right' : 'text-left'}`}>
                      {new Date(message.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                  {message.is_user_message && (
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-secondary">
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {sending && (
                <div className="flex gap-4 justify-start">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="w-5 h-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <Card className="bg-gradient-card border-0 max-w-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Error Message */}
        {error && (
          <div className="mb-4">
            <Card className="border-destructive/50 bg-destructive/10">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Input Area */}
        <Card className="bg-gradient-card border-0 shadow-large">
          <CardContent className="p-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your documents..."
                  className="min-h-[50px] max-h-32 resize-none border-0 bg-muted/50 focus:ring-1 focus:ring-primary"
                  disabled={sending}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setIsVoiceActive(!isVoiceActive)}
                  className={isVoiceActive ? 'bg-primary text-primary-foreground' : ''}
                >
                  <Mic className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sending}
                  className="bg-primary text-primary-foreground"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground flex items-center gap-4">
                <span>Press Enter to send, Shift+Enter for new line</span>
                <span>•</span>
                <span>{documents.length} documents available for context</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Language: {languages.find(l => l.value === selectedLanguage)?.label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}