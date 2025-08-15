import { useState, useEffect } from 'react'
import { Bell, X, Check, AlertCircle, Info, TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  metadata?: any
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user) return

    fetchNotifications()

    // Set up real-time subscription
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev])
            
            // Show toast for new notification
            const notification = payload.new as Notification
            toast({
              title: notification.title,
              description: notification.message,
              duration: 5000
            })
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => prev.map(n => 
              n.id === payload.new.id ? payload.new as Notification : n
            ))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(showAll ? 50 : 5)

      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }

      setNotifications(data || [])
    } catch (error) {
      console.error('Error in fetchNotifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return
      }

      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ))
    } catch (error) {
      console.error('Error in markAsRead:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
      
      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds)

      if (error) {
        console.error('Error marking all as read:', error)
        return
      }

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      
      toast({
        title: 'Success',
        description: 'All notifications marked as read'
      })
    } catch (error) {
      console.error('Error in markAllAsRead:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'insight': return TrendingUp
      case 'reminder': return Calendar
      case 'alert': return AlertCircle
      default: return Info
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'insight': return 'text-success'
      case 'reminder': return 'text-warning' 
      case 'alert': return 'text-destructive'
      default: return 'text-info'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} days ago`
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <Check className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No notifications yet</p>
            <p className="text-sm">We'll notify you when something important happens</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type)
                const colorClass = getNotificationColor(notification.type)
                
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                      notification.is_read ? 'bg-muted/50' : 'bg-muted border-l-2 border-primary'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      notification.is_read ? 'bg-muted' : 'bg-primary/10'
                    }`}>
                      <Icon className={`w-4 h-4 ${notification.is_read ? 'text-muted-foreground' : colorClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            notification.is_read ? 'text-muted-foreground' : 'text-foreground'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                            {notification.metadata?.amount && (
                              <Badge variant="secondary" className="text-xs">
                                {notification.metadata.amount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {notifications.length >= 5 && !showAll && (
              <>
                <Separator />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setShowAll(true)
                    fetchNotifications()
                  }}
                >
                  View All Notifications
                </Button>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}