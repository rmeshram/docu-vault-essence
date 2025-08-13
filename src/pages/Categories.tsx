import { useState } from "react";
import { Filter, Search, SortDesc, FileText, Calendar, Tag, Folder } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const categoryData = [
  { id: 1, name: "Tax Documents", icon: FileText, count: 12, color: "bg-success/10 text-success border-success/20" },
  { id: 2, name: "Insurance", icon: FileText, count: 8, color: "bg-primary/10 text-primary border-primary/20" },
  { id: 3, name: "Banking", icon: FileText, count: 15, color: "bg-secondary/10 text-secondary border-secondary/20" },
  { id: 4, name: "Legal", icon: FileText, count: 5, color: "bg-accent/10 text-accent border-accent/20" },
  { id: 5, name: "Medical", icon: FileText, count: 7, color: "bg-warning/10 text-warning border-warning/20" },
  { id: 6, name: "Personal", icon: FileText, count: 23, color: "bg-muted text-muted-foreground" },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "a-z", label: "A to Z" },
  { value: "most-viewed", label: "Most Viewed" },
];

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const filteredCategories = categoryData.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Categories</h1>
          <p className="text-muted-foreground">Organize and browse your documents</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Search & Filters */}
        <section className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-lg"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SortDesc className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showFilters && (
            <Card className="bg-white border shadow-soft">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Date Range</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" className="h-10" />
                      <Input type="date" className="h-10" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-3 block">AI Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {["Important", "Urgent", "Financial", "Health"].map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-3 block">Source</label>
                    <Select>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="All sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="camera">Camera</SelectItem>
                        <SelectItem value="gallery">Gallery</SelectItem>
                        <SelectItem value="import">Import</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Categories Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="bg-white border shadow-soft cursor-pointer hover:shadow-medium transition-all duration-200 hover:scale-[1.02]">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                    <category.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {category.count} document{category.count !== 1 ? 's' : ''}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    <Folder className="w-3 h-3 mr-1" />
                    {category.count}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-16">
              <Folder className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-foreground mb-3">No categories found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">Try adjusting your search or filters to find the categories you're looking for</p>
            </div>
          )}
        </section>

        {/* Quick Stats */}
        <section>
          <Card className="bg-white border shadow-soft">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-6">Quick Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-foreground">70</p>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-foreground">6</p>
                  <p className="text-sm text-muted-foreground">Categories</p>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-foreground">12</p>
                  <p className="text-sm text-muted-foreground">Added This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}