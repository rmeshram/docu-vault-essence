import { useState } from "react";
import { Search as SearchIcon, Mic, Clock, FileText, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowResults(query.length > 0);
  };

  const handleVoiceSearch = () => {
    setIsVoiceActive(!isVoiceActive);
    // Mock voice search functionality
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary p-6 pt-12 rounded-b-3xl shadow-medium">
        <h1 className="text-white text-2xl font-bold mb-2">Search</h1>
        <p className="text-white/80 text-sm">Find documents with AI-powered search</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <section className="sticky top-0 z-10 bg-background -mx-4 px-4 py-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search documents, ask AI questions..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-12 h-12 rounded-xl border-2"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleVoiceSearch}
              className={`absolute right-2 top-2 h-8 w-8 p-0 rounded-lg ${
                isVoiceActive ? "bg-accent text-accent-foreground" : ""
              }`}
            >
              <Mic className="w-4 h-4" />
            </Button>
          </div>
        </section>

        {!showResults ? (
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