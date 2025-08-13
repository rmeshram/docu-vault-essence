import { useState } from "react";
import { Bell, FileText, TrendingUp, Clock, AlertCircle, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const recentDocuments = [
  { id: 1, title: "Tax Return 2024", type: "PDF", thumbnail: "/placeholder.svg", date: "2 hours ago" },
  { id: 2, title: "Insurance Policy", type: "PDF", thumbnail: "/placeholder.svg", date: "1 day ago" },
  { id: 3, title: "Bank Statement", type: "PDF", thumbnail: "/placeholder.svg", date: "3 days ago" },
];

const aiInsights = [
  { type: "summary", text: "5 new financial documents processed this week", color: "text-success" },
  { type: "reminder", text: "Tax deadline approaching in 2 weeks", color: "text-warning" },
  { type: "analysis", text: "Detected duplicate insurance documents", color: "text-accent" },
];

const upcomingReminders = [
  { title: "Tax Filing Deadline", date: "Apr 15, 2024", urgency: "high" },
  { title: "Insurance Renewal", date: "May 1, 2024", urgency: "medium" },
  { title: "Bank Statement Review", date: "Apr 30, 2024", urgency: "low" },
];

export default function Home() {
  const navigate = useNavigate();
  const [user] = useState({ name: "Alex Johnson", avatar: "/placeholder.svg" });
  const [searchQuery, setSearchQuery] = useState("");

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "bg-destructive";
      case "medium": return "bg-warning";
      case "low": return "bg-success";
      default: return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Modern Header with Integrated Search */}
      <div className="bg-gradient-header p-6 pt-8 shadow-large">
        <div className="max-w-7xl mx-auto">
          {/* Top Row - User Info & Notifications */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12 border-2 border-white/30 shadow-medium">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-white/20 text-white font-semibold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white/90 text-sm font-medium">Good morning,</p>
                <h1 className="text-white text-xl font-bold">{user.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => navigate('/upload')}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm transition-all duration-200"
                size="sm"
              >
                Upload Document
              </Button>
              <button className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all duration-200 shadow-soft">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
              <Input
                placeholder="Search documents, ask AI questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-16 h-12 bg-white/20 border-white/30 text-white placeholder:text-white/70 rounded-2xl backdrop-blur-sm focus:bg-white/30 transition-all duration-200"
                onKeyPress={(e) => e.key === 'Enter' && searchQuery && navigate('/search')}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/20 rounded-lg"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Recent Documents */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Recent Documents</h2>
            <Button 
              onClick={() => navigate('/categories')}
              variant="ghost"
              className="text-primary hover:text-primary/80 font-medium"
            >
              View All →
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentDocuments.map((doc) => (
              <Card key={doc.id} className="bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-200 cursor-pointer group">
                <CardContent className="p-5">
                  <div className="w-full h-28 bg-muted rounded-xl mb-4 flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                    <FileText className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1 truncate">{doc.title}</h3>
                  <p className="text-xs text-muted-foreground">{doc.date}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {doc.type}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* AI Insights */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-background rounded-2xl shadow-soft border border-border/50">
                  <div className={`w-3 h-3 rounded-full mt-1.5 ${insight.color.replace('text-', 'bg-')}`} />
                  <p className="text-sm flex-1 leading-relaxed">{insight.text}</p>
                </div>
              ))}
              <Button 
                onClick={() => navigate('/search')}
                variant="ghost"
                className="w-full text-primary hover:text-primary/80 font-medium mt-4"
              >
                View More Insights →
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Upcoming Reminders */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                Upcoming Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingReminders.map((reminder, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-background rounded-2xl shadow-soft border border-border/50 hover:shadow-medium transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${getUrgencyColor(reminder.urgency)}`} />
                    <div>
                      <p className="font-semibold text-sm text-foreground">{reminder.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{reminder.date}</p>
                    </div>
                  </div>
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>

      <FloatingActionButton onClick={() => navigate('/upload')} />
    </div>
  );
}