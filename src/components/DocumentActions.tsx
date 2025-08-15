import { useState } from 'react';
import { Download, Share2, Edit, Trash2, Star, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DocumentActionsProps {
  documentId: string;
  fileName: string;
  filePath?: string;
  onDelete?: () => void;
}

export function DocumentActions({ documentId, fileName, filePath, onDelete }: DocumentActionsProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      setLoading(true);
      
      if (filePath) {
        // Get signed URL for download
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(filePath, 60); // 1 minute expiry

        if (error) throw error;

        // Trigger download
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Download started",
          description: `Downloading ${fileName}`,
        });
      } else {
        toast({
          title: "Download unavailable",
          description: "File path not found",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Unable to download file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      setLoading(true);
      
      // Create shareable link
      const { data, error } = await supabase
        .from('document_shares')
        .insert({
          document_id: documentId,
          shared_by: (await supabase.auth.getUser()).data.user?.id,
          is_public: true,
          share_token: crypto.randomUUID(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/shared/${data.share_token}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Share link created",
        description: "Link copied to clipboard (expires in 7 days)",
      });
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: "Share failed",
        description: "Unable to create share link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Document deleted",
        description: `${fileName} has been deleted`,
      });

      onDelete?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Unable to delete document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTags = () => {
    // This would open a modal for editing tags
    toast({
      title: "Coming soon",
      description: "Tag editing feature is in development",
    });
  };

  const handleFavorite = () => {
    // This would toggle favorite status
    toast({
      title: "Coming soon", 
      description: "Favorites feature is in development",
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleDownload}
        disabled={loading}
      >
        <Download className="w-4 h-4 mr-1" />
        Download
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleShare}
        disabled={loading}
      >
        <Share2 className="w-4 h-4 mr-1" />
        Share
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleEditTags}
        disabled={loading}
      >
        <Edit className="w-4 h-4 mr-1" />
        Tags
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleFavorite}
        disabled={loading}
      >
        <Star className="w-4 h-4 mr-1" />
        Favorite
      </Button>
      
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={handleDelete}
        disabled={loading}
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Delete
      </Button>
    </div>
  );
}