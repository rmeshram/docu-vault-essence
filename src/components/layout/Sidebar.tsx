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
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Categories", href: "/categories", icon: FolderOpen },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "Search", href: "/search", icon: Search },
  { name: "AI Chat", href: "/chat", icon: MessageSquare },
  { name: "Profile", href: "/profile", icon: User },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className={cn(
      "flex flex-col bg-white border-r border-border transition-all duration-300 shadow-soft",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="w-10 h-10 bg-gradient-header rounded-xl flex items-center justify-center shadow-medium">
            <FileText className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-foreground">DocuVault AI</h1>
              <p className="text-sm text-muted-foreground font-medium">Smart Document Manager</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 hover:bg-secondary/50"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-3">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                isActive 
                  ? "bg-gradient-header text-white shadow-medium" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                isCollapsed && "justify-center px-2"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl py-3",
            isCollapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-semibold">Logout</span>}
        </Button>
      </div>
    </div>
  );
}