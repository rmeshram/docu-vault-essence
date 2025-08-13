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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary p-6 pt-12 rounded-b-3xl shadow-medium">
        <h1 className="text-white text-2xl font-bold mb-2">Categories</h1>
        <p className="text-white/80 text-sm">Organize and browse your documents</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Search & Filters */}
        <section className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl border-2"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-xl"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 h-9 rounded-xl">
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
            <Card className="bg-gradient-card border-0 shadow-soft">
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" className="h-9 rounded-lg" />
                    <Input type="date" className="h-9 rounded-lg" />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">AI Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {["Important", "Urgent", "Financial", "Health"].map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Source</label>
                  <Select>
                    <SelectTrigger className="h-9 rounded-lg">
                      <SelectValue placeholder="All sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="camera">Camera</SelectItem>
                      <SelectItem value="gallery">Gallery</SelectItem>
                      <SelectItem value="import">Import</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Categories Grid */}
        <section>
          <div className="grid grid-cols-2 gap-4">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="bg-gradient-card border-0 shadow-soft cursor-pointer hover:shadow-medium transition-all duration-200 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <category.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-sm mb-1">{category.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {category.count} document{category.count !== 1 ? 's' : ''}
                  </p>
                  <Badge className={`mt-2 ${category.color}`}>
                    <Folder className="w-3 h-3 mr-1" />
                    {category.count}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No categories found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </section>

        {/* Quick Stats */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Quick Stats</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">70</p>
                  <p className="text-xs text-muted-foreground">Total Docs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary">6</p>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">12</p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}