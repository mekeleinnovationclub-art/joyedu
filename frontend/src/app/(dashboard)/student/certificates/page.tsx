'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Download } from 'lucide-react';
import Link from 'next/link';

export default function StudentCertificates() {
  const { accessToken } = useAuth();

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => api.get<any[]>('/certificates', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Certificates</h1>
        <p className="text-muted-foreground mt-1">Your earned certificates</p>
      </div>

      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : certificates && certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((certificate: any) => (
              <Card key={certificate.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                      <Trophy className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{certificate.course?.title || 'Course'}</h3>
                      <p className="text-sm text-muted-foreground">
                        Completed on {new Date(certificate.issuedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Download className="h-4 w-4" />
                    Download Certificate
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No certificates yet</h3>
              <p className="text-sm text-muted-foreground">
                Complete courses to earn certificates
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
