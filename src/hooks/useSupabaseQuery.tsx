import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface QueryOptions {
  enabled?: boolean;
  realtime?: boolean;
}

export const useSupabaseQuery = <T extends Record<string, any>>(
  table: string,
  query?: (qb: any) => any,
  options: QueryOptions = {}
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const { enabled = true, realtime = false } = options;

  useEffect(() => {
    if (!enabled || !user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        let queryBuilder = (supabase as any).from(table).select();
        
        if (query) {
          queryBuilder = query(queryBuilder);
        }

        const { data: result, error: queryError } = await queryBuilder;

        if (queryError) {
          throw queryError;
        }

        setData(result || []);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription if enabled
    let subscription: any;
    
    if (realtime) {
      subscription = supabase
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Real-time update:', payload);
            
            if (payload.eventType === 'INSERT') {
              setData(prev => [...prev, payload.new as T]);
            } else if (payload.eventType === 'UPDATE') {
              setData(prev => prev.map(item => 
                item.id === payload.new.id ? payload.new as T : item
              ));
            } else if (payload.eventType === 'DELETE') {
              setData(prev => prev.filter(item => item.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [table, enabled, user, realtime]);

  return { data, loading, error, refetch: () => setLoading(true) };
};

export const useSupabaseMutation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (operation: () => Promise<any>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      if (result.error) {
        throw result.error;
      }
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
};