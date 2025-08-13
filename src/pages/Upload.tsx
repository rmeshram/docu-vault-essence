import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Upload as UploadIcon, File, CheckCircle, AlertCircle, RotateCcw, Trash2, Eye, Plus, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUploadStore } from "@/store/uploadStore";

type FileStatus = 'queued' | 'uploading' | 'uploaded' | 'analyzed' | 'failed' | 'analysis-failed';

interface UploadFile {
  id: string;
  name: string;
  size: number;
  status: FileStatus;
  progress: number;
  category?: string;
  extractedText?: string;
  file?: File;
}

const categories = ['Tax Documents', 'Insurance', 'Banking', 'Legal', 'Medical', 'Personal', 'Business'];

export default function Upload() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const addDocument = useUploadStore((state) => state.addDocument);

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

  const processFiles = (selectedFiles: FileList) => {
    const newFiles: UploadFile[] = Array.from(selectedFiles).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: 'queued' as FileStatus,
      progress: 0,
      file,
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate upload process for each file
    newFiles.forEach((file) => {
      simulateUpload(file.id);
    });

    toast({
      title: "Files queued",
      description: `${newFiles.length} file(s) added to upload queue`,
    });
  };

  const simulateUpload = (fileId: string) => {
    // Start upload
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, status: 'uploading' as FileStatus } : file
    ));

    // Simulate progress
    const progressInterval = setInterval(() => {
      setFiles(prev => prev.map(file => {
        if (file.id === fileId && file.status === 'uploading') {
          const newProgress = Math.min(file.progress + Math.random() * 30, 100);
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            // Simulate successful upload
            setTimeout(() => {
              setFiles(prev => prev.map(f => 
                f.id === fileId ? { 
                  ...f, 
                  status: 'uploaded' as FileStatus, 
                  progress: 100 
                } : f
              ));
              
              // Simulate AI analysis after upload
              setTimeout(() => {
                const currentFile = files.find(f => f.id === fileId);
                if (currentFile) {
                  const mockText = `This document contains important information about ${currentFile.name.split('.')[0]}. The AI has successfully analyzed the content and identified key information including dates, amounts, and relevant details. You can now ask questions about this document in the chat.`;
                  
                  setFiles(prev => prev.map(f => 
                    f.id === fileId ? { 
                      ...f, 
                      status: 'analyzed' as FileStatus,
                      extractedText: mockText
                    } : f
                  ));

                  // Add to global store for chat access
                  addDocument({
                    id: fileId,
                    name: currentFile.name,
                    size: currentFile.size,
                    type: currentFile.name.split('.').pop()?.toUpperCase() || 'Unknown',
                    extractedText: mockText,
                    uploadedAt: new Date(),
                  });

                  toast({
                    title: "Document analyzed!",
                    description: `${currentFile.name} is ready for AI chat. You can now ask questions about it.`,
                    action: (
                      <Button size="sm" onClick={() => navigate('/chat')}>
                        Chat Now
                      </Button>
                    ),
                  });
                }
              }, 2000);
            }, 500);
          }
          return { ...file, progress: newProgress };
        }
        return file;
      }));
    }, 200);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const retryUpload = (fileId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, status: 'queued' as FileStatus, progress: 0 } : file
    ));
    simulateUpload(fileId);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-header p-6 pt-8 shadow-large relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-accent opacity-20"></div>
        <div className="max-w-7xl mx-auto relative">
          <h1 className="text-white text-3xl font-bold mb-2 tracking-tight">Upload Documents</h1>
          <p className="text-white/90 text-base font-medium">Add documents for AI analysis and intelligent organization</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Drag & Drop Upload Area */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Upload Documents</h2>
          
          <div
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer ${
              isDragOver 
                ? 'border-primary bg-gradient-primary/10 scale-[1.02] shadow-glow' 
                : 'border-border hover:border-primary/60 hover:bg-gradient-primary/5 hover:shadow-medium'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileSelector}
          >
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-soft">
                <UploadIcon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
                {isDragOver ? 'Drop files here' : 'Drag & drop files'}
              </h3>
              <p className="text-muted-foreground mb-6 text-lg">
                or <span className="text-primary font-semibold bg-gradient-primary bg-clip-text text-transparent">click to browse</span>
              </p>
              <p className="text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full inline-block">
                Supports PDF, JPG, PNG up to 10MB each
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
        </section>

        {/* Alternative Upload Methods */}
        <section>
          <h3 className="text-xl font-bold text-foreground mb-6">Other Upload Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-card border-0 shadow-elegant cursor-pointer hover:shadow-large hover:scale-[1.02] transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-glow transition-all duration-300">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-base mb-2">Camera Scan</h4>
                <p className="text-sm text-muted-foreground">Take photo of documents</p>
              </CardContent>
            </Card>
            
            <Card 
              className="bg-gradient-card border-0 shadow-elegant cursor-pointer hover:shadow-large hover:scale-[1.02] transition-all duration-300 group"
              onClick={openFileSelector}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-glow transition-all duration-300">
                  <File className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-bold text-base mb-2">File Browser</h4>
                <p className="text-sm text-muted-foreground">Choose files from device</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* File Queue */}
        {files.length > 0 && (
          <section>
            <h3 className="text-xl font-bold text-foreground mb-6">Upload Queue ({files.length})</h3>
            <div className="space-y-6">
              {files.map((file) => (
                <Card key={file.id} className="bg-gradient-card border-0 shadow-elegant hover:shadow-large transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {getStatusIcon(file.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-foreground truncate">{file.name}</h4>
                          <div className="flex items-center gap-2">
                            {file.status === 'analyzed' && (
                              <>
                                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  AI Analyzed
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() => navigate('/chat')}
                                  className="h-8 px-3 text-xs bg-gradient-primary hover:shadow-medium transition-all duration-200"
                                >
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  Ask AI
                                </Button>
                              </>
                            )}
                            {file.status === 'failed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => retryUpload(file.id)}
                                className="h-8 px-3 text-xs"
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Retry
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFile(file.id)}
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                          <span>{formatFileSize(file.size)}</span>
                          <span className="font-medium">{getStatusText(file.status)}</span>
                        </div>
                        
                        {(file.status === 'uploading' || file.status === 'queued') && (
                          <Progress value={file.progress} className="h-2 mb-3" />
                        )}
                        
                        {file.extractedText && (
                          <div className="mt-4 p-4 bg-background rounded-xl border border-border/50">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-foreground">OCR Preview</span>
                              <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                                <Eye className="w-3 h-3 mr-1" />
                                View Full
                              </Button>
                            </div>
                            <Textarea
                              value={file.extractedText}
                              readOnly
                              className="text-sm h-24 resize-none"
                            />
                          </div>
                        )}
                        
                        {file.status === 'uploaded' && (
                          <div className="mt-4">
                            <label className="text-sm font-medium text-foreground mb-2 block">
                              AI Category Suggestion
                            </label>
                            <Select value={file.category || selectedCategory} onValueChange={setSelectedCategory}>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                                <SelectItem value="add-new" className="font-medium text-primary">
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add New Category
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
        )}
      </div>
    </div>
  );
}