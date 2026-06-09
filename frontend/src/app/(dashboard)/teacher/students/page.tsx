'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, BookOpen, TrendingUp, Clock, MoreHorizontal, MessageSquare, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function TeacherStudents() {
  const { accessToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [progressSort, setProgressSort] = useState('none');
  const [nameSort, setNameSort] = useState('none');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [extensionDate, setExtensionDate] = useState('');

  const { data: students, isLoading, error } = useQuery({
    queryKey: ['instructor-students'],
    queryFn: () =>
      api.get('/courses/instructor/students', { token: accessToken || undefined }),
    enabled: !!accessToken,
    retry: 1,
  });

  const { data: courses } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: () =>
      api.get('/courses/instructor/my-courses', { token: accessToken || undefined }),
    enabled: !!accessToken,
  });

  const handleViewDetails = (student: any) => {
    setSelectedStudent(student);
    setDetailsDialogOpen(true);
  };

  const handleMessage = (student: any) => {
    setSelectedStudent(student);
    setMessageDialogOpen(true);
  };

  const handleExtendDeadline = (student: any) => {
    setSelectedStudent(student);
    setDeadlineDialogOpen(true);
  };

  const filteredAndSortedStudents = () => {
    let result = Array.isArray(students) ? [...students] : [];

    if (searchQuery) {
      result = result.filter((s: any) =>
        s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (progressSort === 'high') {
      result.sort((a: any, b: any) => (b.completedCourses || 0) - (a.completedCourses || 0));
    } else if (progressSort === 'low') {
      result.sort((a: any, b: any) => (a.completedCourses || 0) - (b.completedCourses || 0));
    }

    if (nameSort === 'asc') {
      result.sort((a: any, b: any) => a.username?.localeCompare(b.username));
    } else if (nameSort === 'desc') {
      result.sort((a: any, b: any) => b.username?.localeCompare(a.username));
    }

    return result;
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground mt-1">View your enrolled students</p>
        </div>
        <Input 
          placeholder="Search students..." 
          className="max-w-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="course-filter">Filter by Course:</Label>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger id="course-filter" className="w-[180px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {Array.isArray(courses) && courses.map((course: any) => (
                <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="progress-sort">Sort by Progress:</Label>
          <Select value={progressSort} onValueChange={setProgressSort}>
            <SelectTrigger id="progress-sort" className="w-[180px]">
              <SelectValue placeholder="Progress" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="high">Highest Progress</SelectItem>
              <SelectItem value="low">Lowest Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="name-sort">Sort Alphabetically:</Label>
          <Select value={nameSort} onValueChange={setNameSort}>
            <SelectTrigger id="name-sort" className="w-[180px]">
              <SelectValue placeholder="Name" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="asc">Name A-Z</SelectItem>
              <SelectItem value="desc">Name Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Array.isArray(students) ? students.length : 0}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Array.isArray(students) ? students.reduce((sum: number, s: any) => sum + (s.enrolledCourses || 0), 0) : 0}
              </p>
              <p className="text-sm text-muted-foreground">Total Enrollments</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Array.isArray(students) ? students.reduce((sum: number, s: any) => sum + (s.completedCourses || 0), 0) : 0}
              </p>
              <p className="text-sm text-muted-foreground">Completed Courses</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredAndSortedStudents().length > 0 ? (
        <div className="space-y-4">
          {filteredAndSortedStudents().map((student: any) => (
            <Card key={student.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium">{student.username}</h3>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">{student.enrolledCourses || 0}</p>
                    <p className="text-xs text-muted-foreground">Enrolled</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{student.completedCourses || 0}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : ''}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(student)}>
                        <Users className="h-4 w-4 mr-2" />
                        View Student Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleMessage(student)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message Student
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExtendDeadline(student)}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Extend Deadline
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No students yet</h3>
            <p className="text-muted-foreground">
              Students will appear here when they enroll in your courses
            </p>
          </CardContent>
        </Card>
      )}

      {/* Student Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Name</Label>
                <p className="text-sm font-medium">{selectedStudent.username}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm font-medium">{selectedStudent.email}</p>
              </div>
              <div>
                <Label>Enrolled Courses</Label>
                <p className="text-sm font-medium">{selectedStudent.enrolledCourses || 0}</p>
              </div>
              <div>
                <Label>Completed Courses</Label>
                <p className="text-sm font-medium">{selectedStudent.completedCourses || 0}</p>
              </div>
              <div>
                <Label>Completion Percentage</Label>
                <p className="text-sm font-medium">
                  {selectedStudent.enrolledCourses > 0
                    ? Math.round(((selectedStudent.completedCourses || 0) / selectedStudent.enrolledCourses) * 100)
                    : 0}%
                </p>
              </div>
              <div>
                <Label>Last Login</Label>
                <p className="text-sm font-medium">
                  {selectedStudent.lastActive ? new Date(selectedStudent.lastActive).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Student Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Student</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 py-4">
              <div>
                <Label>To</Label>
                <p className="text-sm font-medium">{selectedStudent.username} ({selectedStudent.email})</p>
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <textarea
                  id="message"
                  className="w-full min-h-[120px] p-3 border rounded-md resize-none"
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setMessageDialogOpen(false)}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Deadline Dialog */}
      <Dialog open={deadlineDialogOpen} onOpenChange={setDeadlineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Deadline</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Student</Label>
                <p className="text-sm font-medium">{selectedStudent.username}</p>
              </div>
              <div>
                <Label htmlFor="extension-date">New Deadline</Label>
                <Input
                  id="extension-date"
                  type="date"
                  value={extensionDate}
                  onChange={(e) => setExtensionDate(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeadlineDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setDeadlineDialogOpen(false)}>
              Extend Deadline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
