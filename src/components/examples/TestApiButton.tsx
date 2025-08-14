import { Button } from '@/components/ui/button';
import { ApiExamples } from './ApiExamples';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const TestApiButton = () => {
  const [showExamples, setShowExamples] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {showExamples && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
          <div className="bg-background rounded-lg max-w-6xl max-h-[80vh] overflow-auto">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>API Examples & Testing</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowExamples(false)}
                >
                  Close
                </Button>
              </CardHeader>
              <CardContent>
                <ApiExamples />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      <Button
        onClick={() => setShowExamples(true)}
        className="shadow-lg"
        size="lg"
      >
        🧪 Test APIs
      </Button>
    </div>
  );
};