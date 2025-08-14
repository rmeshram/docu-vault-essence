import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { documentService } from '@/services/documentService';
import { chatService } from '@/services/chatService';
import { reminderService } from '@/services/reminderService';
import { insightService } from '@/services/insightService';
import { useAuth } from '@/hooks/useAuth';

export const ApiExamples = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleExample = async (name: string, operation: () => Promise<any>) => {
    setLoading(name);
    try {
      const result = await operation();
      toast({
        title: "Success!",
        description: `${name} completed successfully. Check console for details.`,
      });
      console.log(`${name} result:`, result);
    } catch (error) {
      console.error(`${name} error:`, error);
      toast({
        title: "Error",
        description: `${name} failed. Check console for details.`,
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* Document Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Document API Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => handleExample('Get Documents', documentService.getDocuments)}
            disabled={loading === 'Get Documents'}
            className="w-full"
          >
            {loading === 'Get Documents' ? 'Loading...' : 'Get All Documents'}
          </Button>
          
          <Button
            onClick={() => handleExample('Create Document', () => 
              documentService.createDocument({
                name: 'Sample Document.pdf',
                size: 1024000,
                file_type: 'application/pdf',
                category: 'Personal',
                extracted_text: 'This is a sample document for testing purposes.',
                ai_summary: 'Sample PDF document used for API testing.',
                ai_confidence: 95.5,
                language_detected: 'English',
                pages: 1,
                upload_method: 'api_example'
              })
            )}
            disabled={loading === 'Create Document'}
            variant="outline"
            className="w-full"
          >
            {loading === 'Create Document' ? 'Creating...' : 'Create Sample Document'}
          </Button>

          <Button
            onClick={() => handleExample('Search Documents', () => 
              documentService.searchDocuments('sample')
            )}
            disabled={loading === 'Search Documents'}
            variant="outline"
            className="w-full"
          >
            {loading === 'Search Documents' ? 'Searching...' : 'Search "sample"'}
          </Button>

          <Button
            onClick={() => handleExample('Get Recent Documents', () => 
              documentService.getRecentDocuments(5)
            )}
            disabled={loading === 'Get Recent Documents'}
            variant="outline"
            className="w-full"
          >
            {loading === 'Get Recent Documents' ? 'Loading...' : 'Get Recent (5)'}
          </Button>
        </CardContent>
      </Card>

      {/* Chat Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Chat API Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => handleExample('Get Conversations', chatService.getConversations)}
            disabled={loading === 'Get Conversations'}
            className="w-full"
          >
            {loading === 'Get Conversations' ? 'Loading...' : 'Get All Conversations'}
          </Button>

          <Button
            onClick={() => handleExample('Create Conversation', () => 
              chatService.createConversation('API Test Conversation')
            )}
            disabled={loading === 'Create Conversation'}
            variant="outline"
            className="w-full"
          >
            {loading === 'Create Conversation' ? 'Creating...' : 'Create Conversation'}
          </Button>

          <Button
            onClick={() => handleExample('Send Message', async () => {
              // First get or create a conversation
              const conversations = await chatService.getConversations();
              let conversationId;
              
              if (conversations.length > 0) {
                conversationId = conversations[0].id;
              } else {
                const newConv = await chatService.createConversation('Test Chat');
                conversationId = newConv.id;
              }
              
              return chatService.sendMessage(
                conversationId,
                'Hello, this is a test message from the API example!',
                true
              );
            })}
            disabled={loading === 'Send Message'}
            variant="outline"
            className="w-full"
          >
            {loading === 'Send Message' ? 'Sending...' : 'Send Test Message'}
          </Button>
        </CardContent>
      </Card>

      {/* Reminder Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Reminder API Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => handleExample('Get Reminders', reminderService.getReminders)}
            disabled={loading === 'Get Reminders'}
            className="w-full"
          >
            {loading === 'Get Reminders' ? 'Loading...' : 'Get All Reminders'}
          </Button>

          <Button
            onClick={() => handleExample('Create Reminder', () => {
              const futureDate = new Date();
              futureDate.setDate(futureDate.getDate() + 7);
              
              return reminderService.createReminder({
                title: 'Sample Reminder',
                description: 'This is a test reminder created via API',
                reminder_date: futureDate.toISOString(),
                category: 'Personal',
                urgency: 'medium',
                amount: '₹1,000',
                is_auto_generated: false
              });
            })}
            disabled={loading === 'Create Reminder'}
            variant="outline"
            className="w-full"
          >
            {loading === 'Create Reminder' ? 'Creating...' : 'Create Sample Reminder'}
          </Button>

          <Button
            onClick={() => handleExample('Get Upcoming Reminders', () => 
              reminderService.getUpcomingReminders(30)
            )}
            disabled={loading === 'Get Upcoming Reminders'}
            variant="outline"
            className="w-full"
          >
            {loading === 'Get Upcoming Reminders' ? 'Loading...' : 'Get Upcoming (30 days)'}
          </Button>
        </CardContent>
      </Card>

      {/* AI Insights Examples */}
      <Card>
        <CardHeader>
          <CardTitle>AI Insights API Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => handleExample('Get Insights', insightService.getInsights)}
            disabled={loading === 'Get Insights'}
            className="w-full"
          >
            {loading === 'Get Insights' ? 'Loading...' : 'Get All Insights'}
          </Button>

          <Button
            onClick={() => handleExample('Generate Mock Insights', insightService.generateMockInsights)}
            disabled={loading === 'Generate Mock Insights'}
            variant="outline"
            className="w-full"
          >
            {loading === 'Generate Mock Insights' ? 'Generating...' : 'Generate Demo Insights'}
          </Button>

          <Button
            onClick={() => handleExample('Get High Priority Insights', () => 
              insightService.getInsightsByPriority('high')
            )}
            disabled={loading === 'Get High Priority Insights'}
            variant="outline"
            className="w-full"
          >
            {loading === 'Get High Priority Insights' ? 'Loading...' : 'Get High Priority'}
          </Button>

          <Button
            onClick={() => handleExample('Get Risk Insights', () => 
              insightService.getInsightsByType('risk')
            )}
            disabled={loading === 'Get Risk Insights'}
            variant="outline"
            className="w-full"
          >
            {loading === 'Get Risk Insights' ? 'Loading...' : 'Get Risk Insights'}
          </Button>
        </CardContent>
      </Card>

      {/* Real-time Examples */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Real-time Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground mb-4">
            Real-time updates are automatically enabled for:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>New documents uploaded</li>
              <li>Chat messages sent/received</li>
              <li>AI insights generated</li>
              <li>Reminders created/updated</li>
              <li>Document shares and family updates</li>
            </ul>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <strong>User Info:</strong><br/>
            Email: {user?.email}<br/>
            ID: {user?.id}<br/>
            Created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};