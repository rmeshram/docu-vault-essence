import { useState } from "react";
import { Send, Mic, Globe, FileText, Download, Share, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

    // Mock AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I understand your question. Let me analyze your documents and provide you with the information you need.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleVoiceInput = () => {
    setIsVoiceActive(!isVoiceActive);
    // Mock voice input functionality
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-gradient-primary p-6 pt-12 rounded-b-3xl shadow-medium">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold mb-2">AI Chat</h1>
            <p className="text-white/80 text-sm">Ask questions about your documents</p>
          </div>
          
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-24 h-8 bg-white/20 border-white/20 text-white">
              <Globe className="w-4 h-4 mr-1" />
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

      <div className="p-4">
        {/* Document Selector */}
        <Card className="bg-gradient-card border-0 shadow-soft mb-6">
          <CardContent className="p-4">
            <label className="text-sm font-medium mb-2 block">Ask about specific document (optional)</label>
            <Select value={selectedDocument} onValueChange={setSelectedDocument}>
              <SelectTrigger className="h-9 rounded-lg">
                <SelectValue placeholder="All documents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                <SelectItem value="tax-2024">Tax Return 2024</SelectItem>
                <SelectItem value="insurance">Insurance Policies</SelectItem>
                <SelectItem value="medical">Medical Records</SelectItem>
                <SelectItem value="banking">Bank Statements</SelectItem>
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
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className={
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }>
                    {message.type === 'user' ? 'U' : 'AI'}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`space-y-2 ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                  <Card className={`border-0 shadow-soft ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-gradient-card'
                  }`}>
                    <CardContent className="p-3">
                      <p className="text-sm">{message.content}</p>
                    </CardContent>
                  </Card>
                  
                  {message.documents && (
                    <div className="space-y-2 w-full">
                      {message.documents.map((doc) => (
                        <Card key={doc.id} className="bg-background border shadow-soft">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                <div>
                                  <p className="text-sm font-medium">{doc.title}</p>
                                  <p className="text-xs text-muted-foreground">{doc.type}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                  <Download className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                  <Share className="w-3 h-3" />
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
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Ask AI about your documents..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="pr-10 rounded-xl border-2"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleVoiceInput}
              className={`absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 rounded-lg ${
                isVoiceActive ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <Mic className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="h-10 w-10 p-0 rounded-xl bg-accent hover:bg-accent/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}