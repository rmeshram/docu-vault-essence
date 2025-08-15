import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Plus, Settings, Shield, FileText, Clock, Search, Filter,
  UserPlus, Crown, Lock, Share2, Download, Edit, Trash2, Mail,
  ChevronRight, AlertCircle, CheckCircle, Calendar, Star,
  MoreVertical, Eye, Copy, Link, Globe, Heart, Home, Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { familyService, type FamilyMember } from '@/services/familyService';
import { documentService, type Document } from '@/services/documentService';
import { supabase } from '@/integrations/supabase/client';

interface EmergencyContact {
  id: string;
  name: string;
  email: string;
  relationship: string;
  phone?: string;
  hasAccess: boolean;
  accessExpiry?: string;
}

const roleOptions = [
  { value: 'owner', label: 'Owner', description: 'Full access and admin rights', icon: Crown },
  { value: 'admin', label: 'Admin', description: 'Can manage members and documents', icon: Shield },
  { value: 'member', label: 'Member', description: 'Can view and upload documents', icon: Users },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access to documents', icon: Eye },
  { value: 'emergency', label: 'Emergency', description: 'Temporary access during emergencies', icon: AlertCircle }
];

export default function FamilyVault() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<Document[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [vaultStats, setVaultStats] = useState({
    totalMembers: 0,
    totalStorage: 0,
    usedStorage: 0,
    sharedDocuments: 0,
    activeMembers: 0,
    pendingInvites: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  // Load family vault data
  useEffect(() => {
    const loadFamilyData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        const [members, stats, documents] = await Promise.all([
          familyService.getFamilyMembers(),
          familyService.getFamilyStats(),
          documentService.getDocuments() // Get shared documents
        ]);

        setFamilyMembers(members || []);
        setVaultStats({ ...stats, sharedDocuments: documents?.length || 0 });
        setSharedDocuments(documents?.filter(doc => doc.shared_with_family) || []);

        // Mock emergency contacts for now
        setEmergencyContacts([
          {
            id: '1',
            name: 'Dr. Sharma',
            email: 'dr.sharma@email.com',
            relationship: 'Family Doctor',
            phone: '+91 98765 43210',
            hasAccess: false
          },
          {
            id: '2', 
            name: 'Advocate Kumar',
            email: 'kumar@lawfirm.com',
            relationship: 'Family Lawyer',
            hasAccess: false
          }
        ]);

      } catch (error) {
        console.error('Failed to load family data:', error);
        toast({
          title: 'Error loading family vault',
          description: 'Please try again later',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadFamilyData();
  }, [user]);

  // Real-time updates for family vault
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('family-vault')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'family_members' },
        () => {
          // Reload family members when changes occur
          familyService.getFamilyMembers().then(setFamilyMembers);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const handleInviteMember = async () => {
    if (!inviteEmail) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address',
        variant: 'destructive'
      });
      return;
    }

    try {
      await familyService.inviteFamilyMember(inviteEmail, inviteRole as any);
      
      toast({
        title: 'Invitation sent',
        description: `Invitation sent to ${inviteEmail}`
      });
      
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('member');
      
      // Refresh family members
      const members = await familyService.getFamilyMembers();
      setFamilyMembers(members || []);
      
    } catch (error) {
      toast({
        title: 'Failed to send invitation',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await familyService.removeFamilyMember(memberId);
      
      toast({
        title: 'Member removed',
        description: 'Family member has been removed from the vault'
      });
      
      // Refresh family members
      const members = await familyService.getFamilyMembers();
      setFamilyMembers(members || []);
      
    } catch (error) {
      toast({
        title: 'Failed to remove member',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await familyService.updateMemberRole(memberId, newRole as any);
      
      toast({
        title: 'Role updated',
        description: 'Family member role has been updated'
      });
      
      // Refresh family members
      const members = await familyService.getFamilyMembers();
      setFamilyMembers(members || []);
      
    } catch (error) {
      toast({
        title: 'Failed to update role',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const grantEmergencyAccess = (contactId: string) => {
    setEmergencyContacts(prev => prev.map(contact => 
      contact.id === contactId 
        ? { 
            ...contact, 
            hasAccess: true, 
            accessExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          }
        : contact
    ));
    
    toast({
      title: 'Emergency access granted',
      description: '24-hour temporary access has been granted',
    });
  };

  const revokeEmergencyAccess = (contactId: string) => {
    setEmergencyContacts(prev => prev.map(contact => 
      contact.id === contactId 
        ? { ...contact, hasAccess: false, accessExpiry: undefined }
        : contact
    ));
    
    toast({
      title: 'Emergency access revoked',
      description: 'Access has been revoked',
    });
  };

  const filteredMembers = familyMembers.filter(member => {
    const matchesSearch = member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-success';
      case 'pending': return 'text-warning';
      case 'suspended': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getRoleIcon = (role: string) => {
    const roleOption = roleOptions.find(r => r.value === role);
    return roleOption?.icon || Users;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Loading family vault...</h3>
          <p className="text-muted-foreground">Gathering family data and permissions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-variant p-6 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Family Vault</h1>
              <p className="text-white/90">Secure document sharing for your family</p>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Emergency Access
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Emergency Access</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {emergencyContacts.map(contact => (
                      <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                          {contact.hasAccess && contact.accessExpiry && (
                            <p className="text-xs text-warning">
                              Expires: {new Date(contact.accessExpiry).toLocaleString()}
                            </p>
                          )}
                        </div>
                        {contact.hasAccess ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => revokeEmergencyAccess(contact.id)}
                          >
                            Revoke
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            onClick={() => grantEmergencyAccess(contact.id)}
                          >
                            Grant Access
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Family Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Email Address</label>
                      <Input
                        type="email"
                        placeholder="family@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.filter(role => role.value !== 'owner').map(role => (
                            <SelectItem key={role.value} value={role.value}>
                              <div className="flex items-center gap-2">
                                <role.icon className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">{role.label}</div>
                                  <div className="text-xs text-muted-foreground">{role.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleInviteMember} className="w-full">
                      Send Invitation
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Members</span>
              </div>
              <div className="text-2xl font-bold">{vaultStats.totalMembers}</div>
              <div className="text-xs text-white/70">{vaultStats.pendingInvites} pending</div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">Documents</span>
              </div>
              <div className="text-2xl font-bold">{vaultStats.sharedDocuments}</div>
              <div className="text-xs text-white/70">Family shared</div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Storage</span>
              </div>
              <div className="text-2xl font-bold">{vaultStats.storagePercentage}%</div>
              <div className="text-xs text-white/70">
                {(vaultStats.usedStorage / 1024).toFixed(1)}GB / {(vaultStats.totalStorage / 1024).toFixed(0)}GB
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Active</span>
              </div>
              <div className="text-2xl font-bold">{vaultStats.activeMembers}</div>
              <div className="text-xs text-white/70">Online now</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search family members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roleOptions.map(role => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Family Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Family Members ({filteredMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMembers.map(member => {
                const RoleIcon = getRoleIcon(member.role);
                return (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>{member.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{member.name || 'Unknown'}</h3>
                          <Badge variant="outline" className="text-xs">
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {member.role}
                          </Badge>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(member.status)}`} />
                        </div>
                        <p className="text-sm text-muted-foreground">{member.user_profiles?.email || 'No email'}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{member.document_count || 0} documents</span>
                          <span>{(member.storage_used_mb || 0).toFixed(1)} MB used</span>
                          <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(newRole) => handleUpdateRole(member.id, newRole)}
                        disabled={member.role === 'owner'}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.filter(role => role.value !== 'owner').map(role => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Shared Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Shared Documents ({sharedDocuments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sharedDocuments.length > 0 ? (
              <div className="space-y-3">
                {sharedDocuments.slice(0, 10).map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                       onClick={() => navigate(`/document/${doc.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{doc.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{doc.category}</span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No shared documents yet</p>
                <Button 
                  variant="outline" 
                  className="mt-3"
                  onClick={() => navigate('/upload')}
                >
                  Upload Documents
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Used: {(vaultStats.usedStorage / 1024).toFixed(1)} GB</span>
                <span>Available: {((vaultStats.totalStorage - vaultStats.usedStorage) / 1024).toFixed(1)} GB</span>
              </div>
              <Progress value={Math.round((vaultStats.usedStorage / vaultStats.totalStorage) * 100)} className="h-2" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <FileText className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                  <div className="font-medium">Documents</div>
                  <div className="text-muted-foreground">85%</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Heart className="w-6 h-6 mx-auto mb-1 text-red-500" />
                  <div className="font-medium">Medical</div>
                  <div className="text-muted-foreground">8%</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Home className="w-6 h-6 mx-auto mb-1 text-green-500" />
                  <div className="font-medium">Personal</div>
                  <div className="text-muted-foreground">5%</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Briefcase className="w-6 h-6 mx-auto mb-1 text-purple-500" />
                  <div className="font-medium">Business</div>
                  <div className="text-muted-foreground">2%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}