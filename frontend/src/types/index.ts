export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  bio: string | null;
  roles: Role[];
  activeRole: ActiveRole;
  isEmailVerified: boolean;
  subscriptionPlan: string;
  profile?: Profile;
  createdAt: string;
}

export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';
export type ActiveRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface Profile {
  id: string;
  headline: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  twitter: string | null;
  location: string | null;
  timezone: string | null;
  language: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string;
  thumbnail: string | null;
  previewVideo: string | null;
  price: number;
  discountPrice: number | null;
  currency: string;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
  shortDescription?: string | null;
  coverImage?: string | null;
  promotionalVideo?: string | null;
  certificateEligible?: boolean;
  isFlagged?: boolean;
  difficulty: DifficultyLevel;
  language: string;
  duration: number;
  requirements: string[];
  learningGoals: string[];
  tags: string[];
  isFeatured: boolean;
  instructorId: string;
  categoryId: string | null;
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    bio?: string;
  };
  category: Category | null;
  topics?: Topic[];
  _count?: {
    enrollments: number;
    reviews: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  children?: Category[];
  _count?: { courses: number };
}

export interface Topic {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  subtopics: Subtopic[];
}

export interface Subtopic {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  summary: string | null;
  keyTakeaways: string[];
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  type: 'VIDEO' | 'MARKDOWN' | 'CODING';
  content: string | null;
  videoUrl: string | null;
  videoDuration: number | null;
  isFree: boolean;
  sortOrder: number;
}

export interface Enrollment {
  id: string;
  courseId: string;
  progress: number;
  completedAt: string | null;
  course: Pick<Course, 'id' | 'title' | 'slug' | 'thumbnail'> & {
    instructor: { firstName: string; lastName: string };
  };
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  user: { firstName: string; lastName: string; avatar: string | null };
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface CodingChallenge {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: DifficultyLevel;
  language: 'JAVASCRIPT' | 'TYPESCRIPT' | 'HTML' | 'CSS';
  starterCode: string;
  solutionCode: string;
  testCases: unknown;
  hints: string[];
  points: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface TeacherApplication {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  bio: string;
  expertise: string[];
  experience: string;
  portfolioLinks: string[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}
