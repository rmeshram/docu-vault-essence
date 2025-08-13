import { useState } from "react";
import { Bell, FileText, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
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
      {/* Header */}
      <div className="bg-gradient-primary p-6 pt-12 rounded-b-3xl shadow-medium">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-white/20">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-white/20 text-white">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white/80 text-sm">Good morning,</p>
              <h1 className="text-white text-xl font-bold">{user.name}</h1>
            </div>
          </div>
          <button className="p-2 rounded-full bg-white/20 text-white">
            <Bell className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Recent Documents */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Recent Documents</h2>
            <button 
              onClick={() => navigate('/categories')}
              className="text-primary text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentDocuments.map((doc) => (
              <Card key={doc.id} className="min-w-[200px] bg-gradient-card border-0 shadow-soft">
                <CardContent className="p-4">
                  <div className="w-full h-24 bg-muted rounded-lg mb-3 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-sm truncate">{doc.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{doc.date}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* AI Insights */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-background rounded-xl">
                  <div className={`w-2 h-2 rounded-full mt-2 ${insight.color.replace('text-', 'bg-')}`} />
                  <p className="text-sm flex-1">{insight.text}</p>
                </div>
              ))}
              <button 
                onClick={() => navigate('/search')}
                className="w-full text-center text-primary text-sm font-medium mt-3"
              >
                View More Insights
              </button>
            </CardContent>
          </Card>
        </section>

        {/* Upcoming Reminders */}
        <section>
          <Card className="bg-gradient-card border-0 shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-primary" />
                Upcoming Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingReminders.map((reminder, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-background rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getUrgencyColor(reminder.urgency)}`} />
                    <div>
                      <p className="font-medium text-sm">{reminder.title}</p>
                      <p className="text-xs text-muted-foreground">{reminder.date}</p>
                    </div>
                  </div>
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
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