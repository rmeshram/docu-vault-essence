import { useState } from 'react';
import { Send, UserPlus, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { familyService } from '@/services/familyService';

export function FamilyVaultInvite() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'viewer'>('member');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleInvite = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const invitation = await familyService.inviteFamilyMember(email, role);
      
      // Generate invite link
      const inviteUrl = `${window.location.origin}/invite/${invitation.id}`;
      setInviteLink(inviteUrl);
      
      toast({
        title: "Invitation sent",
        description: `Family vault invitation sent to ${email}`,
      });
      
      setEmail('');
    } catch (error) {
      console.error('Invite error:', error);
      toast({
        title: "Invitation failed",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Link copied",
        description: "Invite link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Invite Family Member
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Email Address</label>
          <Input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Role</label>
          <Select value={role} onValueChange={(value: 'member' | 'viewer') => setRole(value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">
                <div>
                  <div className="font-medium">Member</div>
                  <div className="text-xs text-muted-foreground">Can view, upload, and share</div>
                </div>
              </SelectItem>
              <SelectItem value="viewer">
                <div>
                  <div className="font-medium">Viewer</div>
                  <div className="text-xs text-muted-foreground">Can only view documents</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleInvite}
            disabled={loading || !email}
            className="flex-1"
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>

        {inviteLink && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Invite Link</label>
            <div className="flex gap-2">
              <Input 
                value={inviteLink} 
                readOnly 
                className="text-xs"
              />
              <Button 
                size="sm" 
                variant="outline"
                onClick={copyInviteLink}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Expires in 7 days
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {role} access
              </Badge>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Family members can access shared documents, contribute to the vault, and collaborate securely.
        </div>
      </CardContent>
    </Card>
  );
}