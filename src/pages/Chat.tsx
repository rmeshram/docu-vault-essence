import { useState, useEffect } from "react";
import { Send, Mic, Globe, FileText, Download, Share, Eye, Sparkles, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUploadStore } from "@/store/uploadStore";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  documents?: Array<{
    id: string;
    title: string;
    type: string;
    thumbnail?: string;
  }>;
}

const mockMessages: Message[] = [
  {
    id: '1',
    type: 'user',
    content: 'What are my total medical expenses for 2024?',
    timestamp: new Date(),
  },
  {
    id: '2',
    type: 'ai',
    content: 'Based on your uploaded documents, I found your medical expenses for 2024 total $3,247.50. This includes hospital bills ($1,800), prescription medications ($850), and dental work ($597.50).',
    timestamp: new Date(),
    documents: [
      { id: '1', title: 'Hospital Bill - March 2024', type: 'PDF' },
      { id: '2', title: 'Prescription Receipts', type: 'PDF' },
      { id: '3', title: 'Dental Invoice', type: 'PDF' },
    ],
  },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedDocument, setSelectedDocument] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const uploadedDocuments = useUploadStore((state) => state.uploadedDocuments);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Enhanced AI response based on uploaded documents
    setTimeout(() => {
      let aiContent = 'I understand your question. ';
      let relatedDocs: Array<{id: string; title: string; type: string}> = [];

      if (uploadedDocuments.length > 0) {
        // Find relevant documents based on user question
        const relevantDocs = uploadedDocuments.filter(doc => 
          selectedDocument === 'all' || selectedDocument === '' || doc.id === selectedDocument
        );

        if (relevantDocs.length > 0) {
          aiContent = `Based on your uploaded documents, I can help you with that. I've analyzed ${relevantDocs.length} document(s) and found relevant information. Here's what I found: `;
          
          // Add some contextual response based on the document content
          if (inputMessage.toLowerCase().includes('expense') || inputMessage.toLowerCase().includes('cost')) {
            aiContent += 'I can see various expenses and amounts in your documents. ';
          } else if (inputMessage.toLowerCase().includes('date') || inputMessage.toLowerCase().includes('when')) {
            aiContent += 'I found several important dates in your documents. ';
          } else {
            aiContent += 'Let me search through the document content for the information you need. ';
          }

          relatedDocs = relevantDocs.slice(0, 3).map(doc => ({
            id: doc.id,
            title: doc.name,
            type: doc.type
          }));
        } else {
          aiContent += 'However, I don\'t see any uploaded documents that are relevant to your question. Please upload some documents first and I\'ll be able to help you better.';
        }
      } else {
        aiContent += 'I notice you haven\'t uploaded any documents yet. Please upload some documents first so I can analyze them and provide specific answers to your questions.';
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiContent,
        timestamp: new Date(),
        documents: relatedDocs.length > 0 ? relatedDocs : undefined,
      };
      
      setIsTyping(false);
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  const handleVoiceInput = () => {
    setIsVoiceActive(!isVoiceActive);
    // Mock voice input functionality
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-gradient-header p-6 pt-8 shadow-large relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-accent opacity-20"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-3xl font-bold mb-2 tracking-tight flex items-center">
                <Sparkles className="w-8 h-8 mr-3" />
                AI Chat
              </h1>
              <p className="text-white/90 text-base font-medium">Ask intelligent questions about your documents</p>
              {uploadedDocuments.length > 0 && (
                <p className="text-white/70 text-sm mt-1">
                  {uploadedDocuments.length} document(s) available for analysis
                </p>
              )}
            </div>
            
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-32 h-10 bg-white/20 border-white/30 text-white rounded-xl backdrop-blur-sm">
                <Globe className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Document Selector */}
        <Card className="bg-gradient-card border-0 shadow-elegant mb-6">
          <CardContent className="p-6">
            <label className="text-base font-semibold mb-3 block flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary" />
              Ask about specific document (optional)
            </label>
            <Select value={selectedDocument} onValueChange={setSelectedDocument}>
              <SelectTrigger className="h-12 rounded-xl border-2 border-border">
                <SelectValue placeholder="All documents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents ({uploadedDocuments.length})</SelectItem>
                {uploadedDocuments.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.name}
                  </SelectItem>
                ))}
                {uploadedDocuments.length === 0 && (
                  <SelectItem value="none" disabled>
                    No documents uploaded yet
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Messages */}
        <div className="space-y-4 mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-3 max-w-[80%] ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                <Avatar className="w-10 h-10 flex-shrink-0 border-2 border-white/20">
                  <AvatarFallback className={
                    message.type === 'user' 
                      ? 'bg-gradient-primary text-white font-bold' 
                      : 'bg-gradient-accent text-white font-bold'
                  }>
                    {message.type === 'user' ? 'U' : 'AI'}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`space-y-2 ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                  <Card className={`border-0 shadow-elegant ${
                    message.type === 'user' 
                      ? 'bg-gradient-primary text-white' 
                      : 'bg-gradient-card'
                  }`}>
                    <CardContent className="p-4">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </CardContent>
                  </Card>
                  
                  {message.documents && (
                    <div className="space-y-3 w-full">
                      {message.documents.map((doc) => (
                        <Card key={doc.id} className="bg-gradient-card border-0 shadow-elegant hover:shadow-large transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">{doc.title}</p>
                                  <p className="text-xs text-muted-foreground">{doc.type}</p>
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
                    AI
                  </AvatarFallback>
                </Avatar>
                <Card className="bg-gradient-card border-0 shadow-elegant">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder={uploadedDocuments.length > 0 ? "Ask AI about your documents..." : "Upload documents first to start chatting..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={uploadedDocuments.length === 0}
                className="pr-12 h-12 rounded-2xl border-2 border-border focus:border-primary text-base shadow-soft"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleVoiceInput}
                className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-xl transition-all duration-200 ${
                  isVoiceActive ? "bg-gradient-primary text-white shadow-glow" : "hover:bg-primary/10"
                }`}
              >
                <Mic className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || uploadedDocuments.length === 0}
              className="h-12 w-12 p-0 rounded-2xl bg-gradient-primary hover:shadow-glow transition-all duration-300 disabled:bg-muted disabled:text-muted-foreground"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          {uploadedDocuments.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Please upload some documents first to start asking questions
            </p>
          )}
        </div>
      </div>
    </div>
  );
}