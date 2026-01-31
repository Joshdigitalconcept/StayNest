
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Server, Database, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminHealthPage() {
  const services = [
    { name: 'Firestore Database', status: 'Healthy', icon: Database, color: 'text-green-500' },
    { name: 'Firebase Authentication', status: 'Healthy', icon: Lock, color: 'text-green-500' },
    { name: 'Image Hosting Service', status: 'Degraded', icon: Server, color: 'text-amber-500' },
    { name: 'API Gateway', status: 'Healthy', icon: Activity, color: 'text-green-500' },
  ];

  const logs = [
    { event: 'Security Rule Denied', path: '/bookings/xxx', time: '2 mins ago', severity: 'High' },
    { event: 'User Login Success', path: 'auth/login', time: '5 mins ago', severity: 'Info' },
    { event: 'Database Query Spike', path: '/listings', time: '12 mins ago', severity: 'Medium' },
    { event: 'New Listing Created', path: '/listings/yyy', time: '1 hour ago', severity: 'Info' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Health & Logs</h1>
        <p className="text-muted-foreground">Monitor infrastructure stability and real-time security events.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {services.map(service => (
          <Card key={service.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider">{service.name}</CardTitle>
              <service.icon className={`h-4 w-4 ${service.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {service.status === 'Healthy' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-amber-500" />}
                <span className="text-sm font-medium">{service.status}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Audit Logs</CardTitle>
          <CardDescription>Live stream of platform events and security activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Context / Path</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, i) => (
                <TableRow key={i}>
                  <TableCell className="font-semibold text-sm">{log.event}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.path}</TableCell>
                  <TableCell>
                    <Badge variant={log.severity === 'High' ? 'destructive' : log.severity === 'Medium' ? 'secondary' : 'outline'} className="text-[10px]">
                      {log.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
