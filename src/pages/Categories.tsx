import { useState } from "react";
import { Filter, Search, SortDesc, FileText, Calendar, Tag, Folder, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const categoryData = [
  { 
    id: 1, 
    name: "Tax Documents", 
    icon: FileText, 
    count: 12, 
    color: "bg-success/10 text-success border-success/20",
    gradientColor: "from-success/20 to-success/5",
    documents: {
      total: 12,
      pending: 2,
      duplicates: 1,
      shared: 3
    },
    insights: "₹67,000 in potential tax savings found",
    aiTags: ["High Priority", "Review Required", "Tax Season 2024"],
    relatedTo: ["Banking", "Insurance"],
    lastUpdated: "2 hours ago",
    accessLevel: "Family Shared"
  },
  { 
    id: 2, 
    name: "Insurance", 
    icon: FileText, 
    count: 8, 
    color: "bg-primary/10 text-primary border-primary/20",
    gradientColor: "from-primary/20 to-primary/5",
    documents: {
      total: 8,
      pending: 1,
      duplicates: 0,
      shared: 2
    },
    insights: "Health policy expires in 15 days",
    aiTags: ["Expiring Soon", "Premium Due"],
    relatedTo: ["Medical", "Family"],
    lastUpdated: "1 day ago",
    accessLevel: "Private"
  },
  { 
    id: 3, 
    name: "Banking", 
    icon: FileText, 
    count: 15, 
    color: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    gradientColor: "from-teal-500/20 to-teal-500/5",
    documents: {
      total: 15,
      pending: 0,
      duplicates: 2,
      shared: 5
    },
    insights: "3 statements need reconciliation",
    aiTags: ["Monthly Statement", "Investment"],
    relatedTo: ["Tax Documents"],
    lastUpdated: "5 hours ago",
    accessLevel: "Family Shared"
  },
  { 
    id: 4, 
    name: "Legal", 
    icon: FileText, 
    count: 5, 
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    gradientColor: "from-purple-500/20 to-purple-500/5",
    documents: {
      total: 5,
      pending: 1,
      duplicates: 0,
      shared: 4
    },
    insights: "Property registration due for renewal",
    aiTags: ["Important", "Legal Review"],
    relatedTo: ["Family"],
    lastUpdated: "1 week ago",
    accessLevel: "Family Shared"
  },
  { 
    id: 5, 
    name: "Medical", 
    icon: FileText, 
    count: 7, 
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    gradientColor: "from-red-500/20 to-red-500/5",
    documents: {
      total: 7,
      pending: 0,
      duplicates: 0,
      shared: 7
    },
    insights: "Mom's checkup scheduled for next week",
    aiTags: ["Family Health", "Appointment"],
    relatedTo: ["Insurance"],
    lastUpdated: "3 days ago",
    accessLevel: "Family Shared"
  },
  { 
    id: 6, 
    name: "Personal", 
    icon: FileText, 
    count: 23, 
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    gradientColor: "from-blue-500/20 to-blue-500/5",
    documents: {
      total: 23,
      pending: 3,
      duplicates: 4,
      shared: 8
    },
    insights: "4 receipts need expense categorization",
    aiTags: ["Receipts", "Personal"],
    relatedTo: ["Banking"],
    lastUpdated: "Just now",
    accessLevel: "Private"
  },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "a-z", label: "A to Z" },
  { value: "most-shared", label: "Most Shared" },
  { value: "document-count", label: "Document Count" }
];

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const filteredCategories = categoryData
    .filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.aiTags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      category.insights.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return a.lastUpdated === "Just now" ? -1 : 
                 b.lastUpdated === "Just now" ? 1 :
                 a.lastUpdated.localeCompare(b.lastUpdated);
        case "oldest":
          return b.lastUpdated === "Just now" ? -1 :
                 a.lastUpdated === "Just now" ? 1 :
                 b.lastUpdated.localeCompare(a.lastUpdated);
        case "a-z":
          return a.name.localeCompare(b.name);
        case "most-shared":
          return b.documents.shared - a.documents.shared;
        case "document-count":
          return b.documents.total - a.documents.total;
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header with Stats */}
      <div className="bg-gradient-to-b from-white to-background border-b border-border">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Categories</h1>
              <p className="text-muted-foreground text-lg">Smart organization powered by AI</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="py-2 px-4">
                <FileText className="w-4 h-4 mr-2 text-primary" />
                <span className="font-semibold">{categoryData.reduce((sum, cat) => sum + cat.documents.total, 0)}</span>
                <span className="text-muted-foreground ml-1">Total Documents</span>
              </Badge>
              <Badge variant="outline" className="py-2 px-4">
                <Tag className="w-4 h-4 mr-2 text-success" />
                <span className="font-semibold">
                  {categoryData.reduce((sum, cat) => sum + cat.aiTags.length, 0)}
                </span>
                <span className="text-muted-foreground ml-1">AI Tags</span>
              </Badge>
            </div>
          </div>

          {/* Smart Features Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gradient-to-br from-white via-white/95 to-background/90 backdrop-blur-sm rounded-xl p-4 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
            <Button 
              variant="ghost" 
              className="group flex items-center justify-start gap-2 h-auto py-3 hover:bg-primary/5 transition-all duration-300"
              onClick={() => window.location.href = '/timeline'}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-medium group-hover:text-primary transition-colors">Timeline View</span>
                <span className="text-xs text-muted-foreground">Chronological journey</span>
              </div>
            </Button>
            
            <Button 
              variant="ghost" 
              className="group flex items-center justify-start gap-2 h-auto py-3 hover:bg-success/5 transition-all duration-300"
              onClick={() => window.location.href = '/auto-tag'}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success/15 to-success/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Tag className="w-5 h-5 text-success group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-medium group-hover:text-success transition-colors">Smart Tags</span>
                <span className="text-xs text-muted-foreground">AI-powered organization</span>
              </div>
            </Button>
            
            <Button 
              variant="ghost" 
              className="group flex items-center justify-start gap-2 h-auto py-3 hover:bg-warning/5 transition-all duration-300"
              onClick={() => window.location.href = '/version-history'}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning/15 to-warning/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-5 h-5 text-warning group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className="text-left flex-1">
                <div className="flex items-center justify-between">
                  <span className="block text-sm font-medium group-hover:text-warning transition-colors">Version History</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 bg-warning/10 text-warning border-warning/20">New</Badge>
                </div>
                <span className="text-xs text-muted-foreground">Track all changes</span>
              </div>
            </Button>
            
            <Button 
              variant="ghost" 
              className="group flex items-center justify-start gap-2 h-auto py-3 hover:bg-purple-500/5 transition-all duration-300"
              onClick={() => window.location.href = '/family-vault'}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/15 to-purple-500/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="w-5 h-5 text-purple-500 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <div className="text-left flex-1">
                <div className="flex items-center justify-between">
                  <span className="block text-sm font-medium group-hover:text-purple-500 transition-colors">Family Vault</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 bg-purple-500/10 text-purple-500 border-purple-500/20">Premium</Badge>
                </div>
                <span className="text-xs text-muted-foreground">5 members, 200GB</span>
              </div>
            </Button>
          </div>

          {/* Document Activity Chart */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/50 backdrop-blur-sm border border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold">Category Distribution</h3>
                    <p className="text-xs text-muted-foreground">Document spread across categories</p>
                  </div>
                  <Select defaultValue="30d">
                    <SelectTrigger className="w-[100px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">7 days</SelectItem>
                      <SelectItem value="30d">30 days</SelectItem>
                      <SelectItem value="90d">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-[200px] flex items-center justify-center">
                  {/* Chart placeholder - integrate Chart.js here */}
                  <div className="text-center text-muted-foreground text-sm">Loading chart...</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/50 backdrop-blur-sm border border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold">Upcoming Reminders</h3>
                    <p className="text-xs text-muted-foreground">Document actions and renewals</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                    <Calendar className="w-3 h-3" />
                    Sync Calendar
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-warning/5 border border-warning/20">
                    <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-warning" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Insurance Policy Renewal</p>
                      <p className="text-xs text-muted-foreground">Due in 15 days</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Review
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-success/5 border border-success/20">
                    <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                      <Tag className="w-4 h-4 text-success" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Tax Filing Deadline</p>
                      <p className="text-xs text-muted-foreground">Due in 30 days</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Prepare
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search in categories, tags, or insights..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SortDesc className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="bg-white border shadow-sm">
            <CardContent className="p-4">
              {/* To be implemented: Advanced filter options */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Access Level</label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Access" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="family">Family Shared</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Document Status</label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="duplicates">Has Duplicates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card 
              key={category.id} 
              className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/20"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${category.color}`}>
                    <category.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {category.documents.total} docs
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.insights}
                    </p>
                  </div>
                </div>

                {/* Category Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm py-2 border-t">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Last Activity
                    </div>
                    <span className="font-medium">{category.lastUpdated}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2 border-t">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Tag className="w-4 h-4" />
                      AI Tags
                    </div>
                    <span className="font-medium">{category.aiTags.length} tags</span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-2 border-t">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      Access
                    </div>
                    <span className="font-medium">{category.accessLevel}</span>
                  </div>
                </div>

                {/* AI Tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {category.aiTags.slice(0, 2).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {category.aiTags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{category.aiTags.length - 2} more
                    </Badge>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="mt-6 flex items-center gap-2">
                  <Button className="flex-1" variant="default">
                    Open Category
                  </Button>
                  <Button variant="outline" size="icon">
                    <Users className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredCategories.length === 0 && (
            <div className="col-span-3 text-center py-16">
              <Folder className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-foreground mb-3">No categories found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">Try adjusting your search or filters to find what you're looking for</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
