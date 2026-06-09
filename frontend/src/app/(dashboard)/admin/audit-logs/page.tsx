'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Search, Clock, User } from 'lucide-react';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function AdminAuditLogs() {
  const { accessToken } = useAuth();

  const { data: logsResponse, isLoading, error } = useQuery<PaginatedResponse<any>>({
    queryKey: ['admin-audit-logs'],
    queryFn: () => api.get('/admin/audit-logs?page=1&limit=50', { token: accessToken || undefined }),
    enabled: !!accessToken,
    retry: 1,
  });

  const logs = logsResponse?.data || [];

  const getActionColor = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    const actions: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      CREATE: 'default',
      UPDATE: 'secondary',
      DELETE: 'destructive',
      LOGIN: 'outline',
      LOGOUT: 'outline',
    };
    return actions[action] || 'secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Track system activity</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search logs..." className="max-w-xs" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : Array.isArray(logs) && logs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity ({logsResponse?.meta?.total || logs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getActionColor(log.action)}>{log.action}</Badge>
                      <span className="text-sm text-muted-foreground">{log.entity}</span>
                    </div>
                    <p className="text-sm">{log.metadata?.description || 'No description'}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.user?.username || 'System'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No audit logs yet</h3>
            <p className="text-muted-foreground">
              System activity will be logged here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
