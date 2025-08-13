import { useState } from "react";
import { ArrowLeft, ZoomIn, ZoomOut, Download, Share, Bell, Globe, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const mockDocument = {
  id: '1',
  title: 'Tax Return 2024',
  type: 'PDF',
  category: 'Tax Documents',
  uploadDate: 'March 15, 2024',
  size: '2.4 MB',
  pages: 12,
  aiSummary: 'This is your 2024 Individual Income Tax Return (Form 1040). Key highlights: Total income of $85,000, tax liability of $12,500, and expected refund of $2,300. All required schedules are included and properly completed.',
  extractedData: [
    { label: 'Total Income', value: '$85,000' },
    { label: 'Tax Liability', value: '$12,500' },
    { label: 'Expected Refund', value: '$2,300' },
    { label: 'Filing Status', value: 'Single' },
    { label: 'Tax Year', value: '2024' },
  ],
  tags: ['Important', 'Deadline: Apr 15', 'Refund Expected'],
};

export default function DocumentDetail() {
  const navigate = useNavigate();
  const [zoomLevel, setZoomLevel] = useState(100);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary p-6 pt-12 rounded-b-3xl shadow-medium">
        <div className="flex items-center gap-4 mb-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-white text-xl font-bold">{mockDocument.title}</h1>
            <p className="text-white/80 text-sm">{mockDocument.type} • {mockDocument.category}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {mockDocument.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="bg-white/20 text-white border-white/20">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* AI Summary */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="w-5 h-5 text-primary" />
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">
              {mockDocument.aiSummary}
            </p>
          </CardContent>
        </Card>

        {/* Document Preview */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Document Preview</CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium">{zoomLevel}%</span>
                <Button size="sm" variant="outline" onClick={handleZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-xl p-8 text-center min-h-[400px] flex items-center justify-center">
              <div>
                <div className="w-24 h-32 bg-white border shadow-medium rounded-lg mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  PDF Preview ({mockDocument.pages} pages)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Zoom: {zoomLevel}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extracted Data */}
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Extracted Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockDocument.extractedData.map((data, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-background rounded-xl">
                <span className="text-sm font-medium text-muted-foreground">{data.label}</span>
                <span className="text-sm font-bold text-foreground">{data.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

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