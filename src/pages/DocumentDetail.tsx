import { useState } from "react";
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Download,
  Share,
  Bell,
  Globe,
  Eye,
  History,
  Shield,
  Link,
  AlertTriangle,
  MessageSquare,
  BrainCircuit,
  Users,
  Briefcase,
  Check,
  Star,
  Copy,
  FileText,
  Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const mockDocument = {
  id: '1',
  title: 'Tax Return 2024',
  type: 'PDF',
  category: 'Tax Documents',
  uploadDate: 'March 15, 2024',
  size: '2.4 MB',
  pages: 12,
  status: {
    verified: true,
    blockchain: true,
    encrypted: true,
    hasBackup: true
  },
  aiSummary: 'This is your 2024 Individual Income Tax Return (Form 1040). Key highlights: Total income of $85,000, tax liability of $12,500, and expected refund of $2,300. All required schedules are included and properly completed.',
  aiRiskAssessment: {
    level: 'low',
    items: [
      'All required schedules are present',
      'Digital signatures verified',
      'No discrepancies found'
    ]
  },
  extractedData: [
    { label: 'Total Income', value: '$85,000' },
    { label: 'Tax Liability', value: '$12,500' },
    { label: 'Expected Refund', value: '$2,300' },
    { label: 'Filing Status', value: 'Single' },
    { label: 'Tax Year', value: '2024' }
  ],
  tags: ['Important', 'Deadline: Apr 15', 'Refund Expected'],
  versions: [
    { id: 'v3', date: 'March 15, 2024', user: 'You', changes: 'Final review completed' },
    { id: 'v2', date: 'March 10, 2024', user: 'Tax Consultant', changes: 'Professional review and corrections' },
    { id: 'v1', date: 'March 5, 2024', user: 'You', changes: 'Initial draft' }
  ],
  sharing: {
    access: 'Family',
    users: [
      { id: 1, name: 'You', role: 'Owner' },
      { id: 2, name: 'Spouse', role: 'Editor' },
      { id: 3, name: 'Tax Consultant', role: 'Viewer' }
    ]
  },
  relatedDocs: [
    { id: '2', title: 'W-2 Form 2024', type: 'PDF', relation: 'Supporting Document' },
    { id: '3', title: 'Previous Tax Return 2023', type: 'PDF', relation: 'Reference' }
  ],
  aiInsights: [
    'Potential tax deduction opportunity in home office expenses',
    'Consider maximizing 401(k) contributions next year',
    'Schedule quarterly tax payments for 2025'
  ],
  securityDetails: {
    encryption: 'AES-256',
    verification: 'Blockchain',
    lastBackup: '2 hours ago',
    accessLog: [
      { date: 'March 15, 2024', user: 'You', action: 'Viewed' },
      { date: 'March 10, 2024', user: 'Tax Consultant', action: 'Edited' }
    ]
  }
};

export default function DocumentDetail() {
  const navigate = useNavigate();
  const [zoomLevel, setZoomLevel] = useState(100);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));

  const [showVersionHistory, setShowVersionHistory] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-primary to-primary-600 p-6 pt-12 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/20 h-9 w-9 p-0 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-white text-2xl font-bold">{mockDocument.title}</h1>
                {mockDocument.status.verified && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/20 gap-1">
                    <Shield className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-white/90 text-sm font-medium">
                  {mockDocument.type} • {mockDocument.category}
                </p>
                <div className="flex items-center gap-2">
                  {mockDocument.status.blockchain && (
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30 text-[10px] px-1.5">
                      Blockchain Verified
                    </Badge>
                  )}
                  {mockDocument.status.encrypted && (
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border-blue-500/30 text-[10px] px-1.5">
                      AES-256
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {mockDocument.tags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-white/20 text-white border-white/20 hover:bg-white/30 transition-colors cursor-pointer"
                >
                  {tag}
                </Badge>
              ))}
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 h-7 px-2 rounded-lg text-xs">
                + Add Tag
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20 h-8 gap-2 rounded-lg text-xs"
                onClick={() => setShowVersionHistory(true)}
              >
                <History className="w-4 h-4" />
                Version History
              </Button>
              <Button 
                variant="secondary"
                size="sm"
                className="bg-white/20 text-white hover:bg-white/30 h-8 gap-2 rounded-lg text-xs border border-white/10"
              >
                <Users className="w-4 h-4" />
                Family Shared
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Version History Dialog */}
      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              Track changes and updates to this document
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
              {mockDocument.versions.map((version, index) => (
                <div key={version.id} className="flex gap-4 relative">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{version.user}</p>
                      <Badge variant="outline" className="text-xs">
                        {version.id}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{version.changes}</p>
                    <p className="text-xs text-muted-foreground mt-1">{version.date}</p>
                  </div>
                  {index !== mockDocument.versions.length - 1 && (
                    <div className="absolute left-5 top-10 bottom-0 w-[1px] bg-border" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <div className="p-4 space-y-6">
        {/* Enhanced AI Summary */}
        <Card className="bg-gradient-to-br from-white to-primary/5 border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BrainCircuit className="w-5 h-5 text-primary" />
                AI Analysis
              </CardTitle>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Premium
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Section */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                Summary
              </h4>
              <p className="text-sm text-foreground leading-relaxed">
                {mockDocument.aiSummary}
              </p>
            </div>

            {/* Risk Assessment */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                Risk Assessment
              </h4>
              <div className={`p-3 rounded-lg bg-success/5 border border-success/20 text-sm`}>
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className="font-medium text-success">Low Risk</span>
                </div>
                <ul className="space-y-1 pl-6 text-muted-foreground">
                  {mockDocument.aiRiskAssessment.items.map((item, i) => (
                    <li key={i} className="list-disc text-xs">{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Insights */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-muted-foreground" />
                Smart Insights
              </h4>
              <div className="space-y-2">
                {mockDocument.aiInsights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-background">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Star className="w-3 h-3 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button variant="outline" className="w-full gap-2 h-9">
              <MessageSquare className="w-4 h-4" />
              Ask AI About This Document
            </Button>
          </CardFooter>
        </Card>

        {/* Enhanced Document Preview */}
        <Card className="bg-gradient-to-br from-white to-background border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg mb-1">Document Preview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Page 1 of {mockDocument.pages}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                  <Button size="sm" variant="ghost" onClick={handleZoomOut} className="h-8 w-8">
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium w-12 text-center">{zoomLevel}%</span>
                  <Button size="sm" variant="ghost" onClick={handleZoomIn} className="h-8 w-8">
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
                <Select defaultValue="page-1">
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Select page" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: mockDocument.pages}, (_, i) => (
                      <SelectItem key={i} value={`page-${i + 1}`}>
                        Page {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-xl p-8 min-h-[400px] relative group">
              <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 rounded-xl" />
              <div className="relative flex items-center justify-center">
                <div className="bg-white border shadow-xl rounded-lg p-6 w-full max-w-[500px] aspect-[3/4] relative group-hover:shadow-2xl transition-shadow">
                  {/* Placeholder content - replace with actual PDF viewer */}
                  <div className="space-y-4">
                    <div className="h-4 bg-muted/50 rounded w-3/4" />
                    <div className="h-4 bg-muted/50 rounded w-1/2" />
                    <div className="h-4 bg-muted/50 rounded w-2/3" />
                    <div className="space-y-2">
                      <div className="h-3 bg-muted/30 rounded w-full" />
                      <div className="h-3 bg-muted/30 rounded w-full" />
                      <div className="h-3 bg-muted/30 rounded w-4/5" />
                    </div>
                  </div>
                  
                  {/* Security overlay */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                    {mockDocument.status.blockchain && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Shield className="w-3 h-3 text-emerald-500" />
                      </div>
                    )}
                    {mockDocument.status.encrypted && (
                      <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Lock className="w-3 h-3 text-blue-500" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <div className="w-full flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>OCR Enabled</span>
                <span>•</span>
                <span>Last processed: 2 hours ago</span>
              </div>
              <Button variant="ghost" size="sm" className="gap-2 h-8 text-xs">
                <Eye className="w-3 h-3" />
                View Full Screen
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Enhanced Extracted Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-white to-background border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Extracted Data
                </CardTitle>
                <Badge variant="outline" className="gap-1">
                  <Check className="w-3 h-3" />
                  Verified
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockDocument.extractedData.map((data, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted/70 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{data.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{data.value}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button variant="outline" className="w-full gap-2 h-9">
                <Download className="w-4 h-4" />
                Export Data
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-gradient-to-br from-white to-background border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link className="w-5 h-5 text-primary" />
                  Related Documents
                </CardTitle>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Add Document
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockDocument.relatedDocs.map((doc) => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted/70 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">{doc.relation}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {doc.type}
                  </Badge>
                </div>
              ))}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Documents are automatically linked based on content analysis
              </p>
            </CardFooter>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button className="h-12 rounded-xl bg-accent hover:bg-accent/90">
            <Globe className="w-5 h-5 mr-2" />
            Translate
          </Button>
          <Button variant="outline" className="h-12 rounded-xl">
            <Share className="w-5 h-5 mr-2" />
            Share
          </Button>
          <Button variant="outline" className="h-12 rounded-xl">
            <Download className="w-5 h-5 mr-2" />
            Download
          </Button>
          <Button variant="outline" className="h-12 rounded-xl">
            <Bell className="w-5 h-5 mr-2" />
            Set Reminder
          </Button>
        </div>

        {/* Document Info */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Document Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Upload Date</span>
              <span className="text-sm font-medium">{mockDocument.uploadDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">File Size</span>
              <span className="text-sm font-medium">{mockDocument.size}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pages</span>
              <span className="text-sm font-medium">{mockDocument.pages}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Category</span>
              <Badge className="bg-primary/10 text-primary border-primary/20">
                {mockDocument.category}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}