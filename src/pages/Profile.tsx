import { useState } from "react";
import { Edit3, HardDrive, Globe, Shield, LogOut, Camera, User, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";

const mockUser = {
  name: "Alex Johnson",
  email: "alex.johnson@email.com",
  avatar: "/placeholder.svg",
  joinDate: "March 2024",
  documentsCount: 70,
  storageUsed: 2.4, // GB
  storageTotal: 5.0, // GB
};

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

export default function Profile() {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const storagePercentage = (mockUser.storageUsed / mockUser.storageTotal) * 100;

  const handleLogout = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary p-6 pt-12 rounded-b-3xl shadow-medium">
        <h1 className="text-white text-2xl font-bold mb-2">Profile</h1>
        <p className="text-white/80 text-sm">Manage your account and preferences</p>
      </div>

      <div className="p-4 space-y-6">
        {/* User Profile */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <Avatar className="w-20 h-20 border-4 border-white shadow-medium">
                  <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {mockUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 w-8 h-8 p-0 rounded-full bg-accent hover:bg-accent/90"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-foreground">{mockUser.name}</h2>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <Edit3 className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{mockUser.email}</p>
                <p className="text-xs text-muted-foreground">Member since {mockUser.joinDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-background rounded-xl">
                <p className="text-2xl font-bold text-primary">{mockUser.documentsCount}</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
              <div className="p-3 bg-background rounded-xl">
                <p className="text-2xl font-bold text-secondary">{mockUser.storageUsed}GB</p>
                <p className="text-xs text-muted-foreground">Storage Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardDrive className="w-5 h-5 text-primary" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Used</span>
                <span className="text-sm font-medium">
                  {mockUser.storageUsed}GB of {mockUser.storageTotal}GB
                </span>
              </div>
              <Progress value={storagePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {(mockUser.storageTotal - mockUser.storageUsed).toFixed(1)}GB remaining
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5 text-primary" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Language</p>
                  <p className="text-xs text-muted-foreground">App display language</p>
                </div>
              </div>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-32 h-9">
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

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Notifications</p>
                  <p className="text-xs text-muted-foreground">Push notifications and alerts</p>
                </div>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Biometric Login</p>
                  <p className="text-xs text-muted-foreground">Use fingerprint or face ID</p>
                </div>
              </div>
              <Switch
                checked={biometricEnabled}
                onCheckedChange={setBiometricEnabled}
              />
            </div>

            <Button variant="outline" className="w-full justify-start h-12 rounded-xl">
              <Shield className="w-5 h-5 mr-3 text-muted-foreground" />
              Change Password
            </Button>

            <Button variant="outline" className="w-full justify-start h-12 rounded-xl">
              <Settings className="w-5 h-5 mr-3 text-muted-foreground" />
              Two-Factor Authentication
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-12 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}