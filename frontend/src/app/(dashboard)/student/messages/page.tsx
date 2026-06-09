'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare } from 'lucide-react';

export default function StudentMessages() {
  const { user, accessToken } = useAuth();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: () => api.get<any[]>('/messages', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-1">Your messages and conversations</p>
      </div>

      <div>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((chat: any) => {
              const lastMessage = chat.messages?.[0];
              const otherMember = chat.members?.find((m: any) => m.user.id !== user?.id);
              const displayName = chat.isGroup
                ? chat.name
                : `${otherMember?.user?.firstName || ''} ${otherMember?.user?.lastName || ''}`.trim() || otherMember?.user?.email || 'Unknown';

              return (
                <Card key={chat.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium">
                          {displayName?.[0] || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{displayName}</h3>
                          <span className="text-xs text-muted-foreground">
                            {lastMessage ? new Date(lastMessage.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No messages yet</h3>
              <p className="text-sm text-muted-foreground">
                Messages from instructors and support will appear here
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
