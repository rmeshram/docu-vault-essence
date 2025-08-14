import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  FolderOpen,
  Upload,
  Search,
  MessageSquare,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  Sparkles,
  Bell,
  Settings,
  HelpCircle,
  Zap,
  Shield,
  Users,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const navigationItems = [
  { 
    name: "Dashboard", 
    href: "/", 
    icon: Home,
    description: "Overview & insights"
  },
  { 
    name: "Categories", 
    href: "/categories", 
    icon: FolderOpen,
    description: "Organized documents",
    badge: "247"
  },
  { 
    name: "Smart Upload", 
    href: "/upload", 
    icon: Upload,
    description: "AI-powered scanning",
    badge: "AI"
  },
  { 
    name: "Search", 
    href: "/search", 
    icon: Search,
    description: "Find anything instantly"
  },
  { 
    name: "AI Assistant", 
    href: "/chat", 
    icon: MessageSquare,
    description: "Chat with your documents",
    badge: "New"
  },
  { 
    name: "Analytics", 
    href: "/analytics", 
    icon: BarChart3,
    description: "Document insights",
    badge: "Pro"
  },
];

const mockUser = {
  name: "Priya Sharma",
  email: "priya@example.com",
  avatar: "/placeholder.svg",
  plan: "Family Premium",
  storageUsed: 3.2,
  storageTotal: 15.0,
};

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  
  const storagePercentage = (mockUser.storageUsed / mockUser.storageTotal) * 100;

  return (
    <div className={cn(
      "flex flex-col bg-white/95 backdrop-blur-xl border-r border-border/50 transition-all duration-300 shadow-elegant",
      isCollapsed ? "w-20" : "w-80"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-medium">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">DocuVault AI</h1>
              <p className="text-sm text-muted-foreground font-medium">AI-Powered Document Vault</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-10 w-10 hover:bg-muted/50 rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* User Profile Section */}
      {!isCollapsed && (
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-12 h-12 border-2 border-primary/20">
              <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {mockUser.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{mockUser.name}</p>
              <p className="text-sm text-muted-foreground truncate">{mockUser.email}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Storage</span>
              <Badge variant="outline" className="text-xs">
                {mockUser.plan}
              </Badge>
            </div>
            <Progress value={storagePercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {mockUser.storageUsed}GB of {mockUser.storageTotal}GB used
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {!isCollapsed && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-4">
            Navigation
          </p>
        )}
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-semibold transition-all duration-200 group relative",
                isActive 
                  ? "bg-gradient-primary text-white shadow-medium" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                isCollapsed && "justify-center px-3"
              )}
            >
              <item.icon className="w-6 h-6 flex-shrink-0" />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <Badge 
                        variant={isActive ? "secondary" : "outline"} 
                        className={cn(
                          "text-xs ml-2",
                          isActive ? "bg-white/20 text-white border-white/30" : ""
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className={cn(
                    "text-xs mt-1 truncate",
                    isActive ? "text-white/80" : "text-muted-foreground"
                  )}>
                    {item.description}
                  </p>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-4">
            Quick Actions
          </p>
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 h-12 rounded-2xl hover:bg-accent/10 hover:text-accent"
            >
              <Zap className="w-5 h-5" />
              <span className="font-medium">Upgrade Plan</span>
              <Badge className="ml-auto bg-accent/20 text-accent text-xs">Pro</Badge>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 h-12 rounded-2xl hover:bg-muted/50"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">Help & Support</span>
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        {!isCollapsed ? (
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 rounded-2xl hover:bg-muted/50"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-12 rounded-2xl hover:bg-muted/50"
              onClick={() => setIsCollapsed(false)}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}