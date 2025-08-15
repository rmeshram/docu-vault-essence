import { useState } from 'react';
import { Mail, Database, Calendar, Chrome, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'connected' | 'available' | 'setup';
  features: string[];
}

const integrations: Integration[] = [
  {
    id: 'gmail',
    name: 'Gmail Integration',
    description: 'Auto-import PDF attachments and receipts from Gmail',
    icon: Mail,
    status: 'available',
    features: ['Auto PDF extraction', 'Receipt categorization', 'Smart filtering']
  },
  {
    id: 'digilocker',
    name: 'DigiLocker Sync',
    description: 'Pull Aadhaar, PAN, and government documents via OAuth',
    icon: Database,
    status: 'available',
    features: ['Government docs', 'Auto categorization', 'Secure OAuth']
  },
  {
    id: 'calendar',
    name: 'Calendar Sync',
    description: 'Google/Apple calendar integration for reminders',
    icon: Calendar,
    status: 'setup',
    features: ['Reminder sync', 'Expiry alerts', 'Meeting docs']
  }
];

export function ExternalIntegrations() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleConnect = async (integrationId: string) => {
    setLoading(integrationId);

    try {
      switch (integrationId) {
        case 'gmail':
          // Redirect to Google OAuth
          const gmailAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${encodeURIComponent('your-gmail-client-id')}&` +
            `redirect_uri=${encodeURIComponent(`${window.location.origin}/auth/gmail/callback`)}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly')}&` +
            `access_type=offline`;
          
          window.location.href = gmailAuthUrl;
          break;

        case 'digilocker':
          // Redirect to DigiLocker OAuth
          const digilockerAuthUrl = `https://api.digitallocker.gov.in/public/oauth2/1/authorize?` +
            `client_id=${encodeURIComponent('your-digilocker-client-id')}&` +
            `redirect_uri=${encodeURIComponent(`${window.location.origin}/auth/digilocker/callback`)}&` +
            `response_type=code&` +
            `state=${encodeURIComponent(crypto.randomUUID())}`;
          
          window.location.href = digilockerAuthUrl;
          break;

        case 'calendar':
          // Google Calendar OAuth
          const calendarAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${encodeURIComponent('your-calendar-client-id')}&` +
            `redirect_uri=${encodeURIComponent(`${window.location.origin}/auth/calendar/callback`)}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar')}&` +
            `access_type=offline`;
          
          window.location.href = calendarAuthUrl;
          break;

        default:
          throw new Error('Unknown integration');
      }
    } catch (error) {
      console.error('Integration error:', error);
      toast({
        title: "Connection failed",
        description: "Unable to connect to the service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleSync = async (integrationId: string) => {
    setLoading(integrationId);

    try {
      const { data, error } = await supabase.functions.invoke(`${integrationId}-integration`, {
        body: { action: 'sync' }
      });

      if (error) throw error;

      toast({
        title: "Sync started",
        description: `${integrationId} sync is running in the background`,
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync failed",
        description: "Unable to sync data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    setLoading(integrationId);

    try {
      const { data, error } = await supabase.functions.invoke(`${integrationId}-integration`, {
        body: { action: 'disconnect' }
      });

      if (error) throw error;

      toast({
        title: "Disconnected",
        description: `${integrationId} has been disconnected`,
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: "Disconnect failed",
        description: "Unable to disconnect. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-success text-white">Connected</Badge>;
      case 'available':
        return <Badge variant="outline">Available</Badge>;
      case 'setup':
        return <Badge variant="secondary">Setup Required</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">External Integrations</h2>
          <p className="text-muted-foreground">Connect external services to automate document management</p>
        </div>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Manage All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <Card key={integration.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      {getStatusBadge(integration.status)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{integration.description}</p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Features:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {integration.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-primary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  {integration.status === 'connected' ? (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleSync(integration.id)}
                        disabled={loading === integration.id}
                      >
                        Sync Now
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDisconnect(integration.id)}
                        disabled={loading === integration.id}
                      >
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => handleConnect(integration.id)}
                      disabled={loading === integration.id}
                    >
                      {loading === integration.id ? 'Connecting...' : `Connect ${integration.name}`}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Integration Setup Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Setup Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. Gmail Setup</h4>
              <p className="text-muted-foreground">
                Click "Connect Gmail" → Authorize DocuVault → Auto-import starts immediately
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. DigiLocker Setup</h4>
              <p className="text-muted-foreground">
                Requires DigiLocker account → OAuth authorization → Government docs sync
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. Calendar Setup</h4>
              <p className="text-muted-foreground">
                Google/Apple calendar → Reminder sync → Smart notifications
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}