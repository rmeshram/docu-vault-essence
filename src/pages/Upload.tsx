import { useState } from "react";
import { Camera, Upload as UploadIcon, File, CheckCircle, AlertCircle, RotateCcw, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type FileStatus = 'queued' | 'uploading' | 'uploaded' | 'analyzed' | 'failed' | 'analysis-failed';

interface UploadFile {
  id: string;
  name: string;
  size: number;
  status: FileStatus;
  progress: number;
  category?: string;
  extractedText?: string;
}

const mockFiles: UploadFile[] = [
  { id: '1', name: 'tax-return-2024.pdf', size: 2450000, status: 'analyzed', progress: 100, category: 'Tax Documents', extractedText: 'Form 1040 - Individual Income Tax Return for year 2024...' },
  { id: '2', name: 'insurance-policy.pdf', size: 1850000, status: 'uploaded', progress: 100 },
  { id: '3', name: 'bank-statement.pdf', size: 3200000, status: 'uploading', progress: 65 },
  { id: '4', name: 'receipt-scan.jpg', size: 850000, status: 'failed', progress: 0 },
];

const categories = ['Tax Documents', 'Insurance', 'Banking', 'Legal', 'Medical', 'Personal', 'Business'];

export default function Upload() {
  const [files, setFiles] = useState<UploadFile[]>(mockFiles);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case 'queued':
        return <File className="w-5 h-5 text-muted-foreground" />;
      case 'uploading':
        return <UploadIcon className="w-5 h-5 text-primary animate-pulse" />;
      case 'uploaded':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'analyzed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'analysis-failed':
        return <AlertCircle className="w-5 h-5 text-warning" />;
      default:
        return <File className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: FileStatus) => {
    switch (status) {
      case 'queued': return 'Queued';
      case 'uploading': return 'Uploading...';
      case 'uploaded': return 'Uploaded';
      case 'analyzed': return 'AI Analyzed';
      case 'failed': return 'Upload Failed';
      case 'analysis-failed': return 'AI Read Failed';
      default: return 'Unknown';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const retryUpload = (fileId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, status: 'queued' as FileStatus, progress: 0 } : file
    ));
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-primary p-6 pt-12 rounded-b-3xl shadow-medium">
        <h1 className="text-white text-2xl font-bold mb-2">Upload Documents</h1>
        <p className="text-white/80 text-sm">Add documents for AI analysis and organization</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Upload Methods */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">Choose Upload Method</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-card border-0 shadow-soft cursor-pointer hover:shadow-medium transition-shadow">
              <CardContent className="p-6 text-center">
                <Camera className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="font-medium text-sm">Camera</h3>
                <p className="text-xs text-muted-foreground mt-1">Scan documents</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-0 shadow-soft cursor-pointer hover:shadow-medium transition-shadow">
              <CardContent className="p-6 text-center">
                <UploadIcon className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="font-medium text-sm">Gallery</h3>
                <p className="text-xs text-muted-foreground mt-1">Choose from photos</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* File Queue */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">Upload Queue</h2>
          <div className="space-y-3">
            {files.map((file) => (
              <Card key={file.id} className="bg-gradient-card border-0 shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(file.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-sm truncate">{file.name}</h3>
                        <div className="flex items-center gap-2">
                          {file.status === 'analyzed' && (
                            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                              AI
                            </Badge>
                          )}
                          {file.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryUpload(file.id)}
                              className="h-6 px-2 text-xs"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Retry
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFile(file.id)}
                            className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{getStatusText(file.status)}</span>
                      </div>
                      
                      {(file.status === 'uploading' || file.status === 'queued') && (
                        <Progress value={file.progress} className="h-2 mb-2" />
                      )}
                      
                      {file.extractedText && (
                        <div className="mt-3 p-3 bg-background rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-foreground">OCR Preview</span>
                            <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              View Full
                            </Button>
                          </div>
                          <Textarea
                            value={file.extractedText}
                            readOnly
                            className="text-xs h-20 resize-none"
                          />
                        </div>
                      )}
                      
                      {file.status === 'uploaded' && (
                        <div className="mt-3">
                          <Select value={file.category || selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category} className="text-xs">
                                  {category}
                                </SelectItem>
                              ))}
                              <SelectItem value="add-new" className="text-xs font-medium text-primary">
                                + Add Category
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}