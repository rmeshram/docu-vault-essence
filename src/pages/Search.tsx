import { useState, useEffect, useRef } from "react";
import {
  Search as SearchIcon,
  Mic,
  Clock,
  FileText,
  Sparkles,
  Languages,
  BrainCircuit,
  Newspaper,
  Shield,
  History,
  ArrowUpRight,
  Filter,
  SlidersHorizontal,
  Send,
  Loader2,
  Bot,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

const aiSuggestions = [
  "Show me tax documents from 2024",
  "Find all insurance policies",
  "What's my bank account balance?",
  "Receipts from last month",
  "Medical records summary",
  "Important deadlines this month",
];

const recentSearches = [
  { query: "tax return 2024", timestamp: "2 hours ago" },
  { query: "insurance policy", timestamp: "1 day ago" },
  { query: "bank statements", timestamp: "3 days ago" },
  { query: "medical bills", timestamp: "1 week ago" },
];

const searchResults = [
  {
    id: 1,
    title: "Tax Return 2024",
    type: "PDF",
    category: "Tax Documents",
    snippet: "Form 1040 - Individual Income Tax Return for the year 2024. Total income: $85,000...",
    date: "Mar 15, 2024",
    relevance: 95,
  },
  {
    id: 2,
    title: "Insurance Policy - Auto",
    type: "PDF",
    category: "Insurance",
    snippet: "Policy Number: AUTO-123456. Coverage details for vehicle registration XYZ-789...",
    date: "Jan 10, 2024",
    relevance: 87,
  },
];

const mockChatHistory = [
  {
    id: 1,
    role: "user",
    content: "What's my total income in the tax return?",
    timestamp: "2 min ago",
  },
  {
    id: 2,
    role: "assistant",
    content: "According to your 2024 Tax Return (Form 1040), your total income is $85,000. Would you like me to break down the sources of this income?",
    timestamp: "1 min ago",
    attachedDoc: {
      id: 1,
      title: "Tax Return 2024",
      type: "PDF",
    }
  },
];

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isChatMode, setIsChatMode] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const [messages, setMessages] = useState(mockChatHistory);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowResults(query.length > 0);
  };

  const handleVoiceSearch = () => {
    setIsVoiceActive(!isVoiceActive);
    // Mock voice search functionality
  };

  const toggleChatMode = () => {
    setIsChatMode(!isChatMode);
    setShowResults(false);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      role: "user",
      content: chatInput,
      timestamp: "Just now",
    };

    setMessages([...messages, newMessage]);
    setChatInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        role: "assistant",
        content: "I'm analyzing your documents to provide the most accurate response. Here's what I found...",
        timestamp: "Just now",
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary-600 to-primary-700 p-6 pt-12 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="absolute inset-0">
          <div className="w-64 h-64 bg-white/5 rounded-full blur-3xl absolute -top-32 -right-32 transform rotate-45" />
          <div className="w-48 h-48 bg-white/5 rounded-full blur-2xl absolute -bottom-24 -left-24" />
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/20 gap-1">
              <BrainCircuit className="w-3 h-3" />
              AI-Powered
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/20 gap-1">
              <Languages className="w-3 h-3" />
              15+ Languages
            </Badge>
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">Intelligent Search</h1>
          <p className="text-white/90 text-base max-w-md">Find and understand your documents instantly, in any language</p>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        {/* Search Bar */}
        <section className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl -mx-4 px-4 py-3 border-b border-border/50">
          <div className="relative max-w-3xl mx-auto">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            {!isChatMode ? (
              <div className="relative group">
                <Input
                  placeholder="Search documents, ask AI questions..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-32 h-14 rounded-2xl border-2 transition-shadow duration-200 shadow-sm group-hover:shadow-md bg-background/50"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleChatMode}
                    className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={isVoiceActive ? "default" : "ghost"}
                    onClick={handleVoiceSearch}
                    className={`h-10 w-10 p-0 rounded-xl transition-all duration-300 ${
                      isVoiceActive ? "bg-primary text-white shadow-glow animate-pulse" : "hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-10 w-10 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Search Filters</SheetTitle>
                      </SheetHeader>
                      <div className="space-y-6 py-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Document Type</h4>
                          <Select defaultValue="all">
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="image">Images</SelectItem>
                              <SelectItem value="doc">Documents</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Date Range</h4>
                          <Select defaultValue="all">
                            <SelectTrigger>
                              <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Time</SelectItem>
                              <SelectItem value="today">Today</SelectItem>
                              <SelectItem value="week">This Week</SelectItem>
                              <SelectItem value="month">This Month</SelectItem>
                              <SelectItem value="year">This Year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Include AI Analysis</h4>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            ) : (
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <div className="relative flex-1 group">
                  <Input
                    placeholder="Chat with AI about your documents..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="pl-10 pr-24 h-14 rounded-2xl border-2 transition-shadow duration-200 shadow-sm group-hover:shadow-md bg-background/50 w-full"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Button
                      type="submit"
                      size="sm"
                      className="h-10 px-4 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </section>

        {isChatMode ? (
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">AI Chat</h2>
            </div>
            
            <ScrollArea className="h-[calc(100vh-280px)] pr-4 -mr-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      } rounded-xl p-4 space-y-2`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {message.attachedDoc && (
                        <Card className="bg-background/50 border-0">
                          <CardContent className="p-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs font-medium">{message.attachedDoc.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {message.attachedDoc.type}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      <p className="text-xs text-muted-foreground">{message.timestamp}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-xl p-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
          </section>
        ) : !showResults ? (
          <>
            {/* AI Suggestions */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">AI Suggestions</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 hover:border-primary/20 transition-colors"
                    onClick={() => handleSearch(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </section>

            {/* Recent Searches */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Recent Searches</h2>
              </div>
              <div className="space-y-3">
                {recentSearches.map((search, index) => (
                  <Card key={index} className="bg-gradient-card border-0 shadow-soft cursor-pointer hover:shadow-medium transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <SearchIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{search.query}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{search.timestamp}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </>
        ) : (
          /* Search Results */
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">
                Results for "{searchQuery}"
              </h2>
              <span className="text-sm text-muted-foreground">
                {searchResults.length} results
              </span>
            </div>
            
            <div className="space-y-4">
              {searchResults.map((result) => (
                <Card key={result.id} className="bg-gradient-card border-0 shadow-soft cursor-pointer hover:shadow-medium transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm truncate">{result.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {result.relevance}% match
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-xs">
                            {result.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{result.type}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{result.date}</span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.snippet}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* No Results */}
            {searchResults.length === 0 && (
              <div className="text-center py-12">
                <SearchIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or browse by category
                </p>
                <Button variant="outline" onClick={() => setShowResults(false)}>
                  Browse Categories
                </Button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}