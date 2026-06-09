'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, User, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TeacherMessages() {
  const { user, accessToken } = useAuth();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['instructor-conversations'],
    queryFn: () =>
      api.get('/chat/instructor/conversations', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-1">Communicate with your students</p>
      </div>

      {Array.isArray(conversations) && conversations.length > 0 ? (
        <div className="space-y-4">
          {conversations.map((chat: any) => {
            const lastMessage = chat.messages?.[0];
            const otherMember = chat.members?.find((m: any) => m.user.id !== user?.id);
            const displayName = chat.isGroup
              ? chat.name
              : `${otherMember?.user?.firstName || ''} ${otherMember?.user?.lastName || ''}`.trim() || otherMember?.user?.email || 'Unknown';

            return (
              <Link key={chat.id} href={`/teacher/messages/${chat.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{displayName}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {lastMessage?.content || 'No message'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {lastMessage?.createdAt ? new Date(lastMessage.createdAt).toLocaleDateString() : ''}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
            <p className="text-muted-foreground">
              Start a conversation with your students
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
