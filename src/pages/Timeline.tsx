import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery"
import { format } from "date-fns"
import { 
  Clock, 
  Upload, 
  Bot, 
  Tag, 
  FileEdit, 
  Users, 
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react"

const Timeline = () => {
  const { data: events, loading } = useSupabaseQuery(
    'timeline_events',
    (qb) => qb.order('created_at', { ascending: false }),
    { realtime: true }
  )

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timeline</h1>
          <p className="text-muted-foreground">
            Track all activities and changes to your documents
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {events?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Upload some documents or interact with your files to see activity timeline here.
              </p>
            </CardContent>
          </Card>
        ) : (
          events?.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <Badge variant="outline">{event.event_type}</Badge>
                </div>
                <CardDescription>{event.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(event.created_at), 'MMM dd, yyyy • h:mm a')}
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default Timeline