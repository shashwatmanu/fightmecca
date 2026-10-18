export type UserRole = 'student' | 'coach' | 'admin';
export type BeltRank = 'white' | 'blue' | 'purple' | 'brown' | 'black' | 'coral' | 'red';
export type MartialArtStyle = 'bjj' | 'muay_thai' | 'boxing' | 'wrestling' | 'mma' | 'judo';
export type SubmissionStatus = 'pending_review' | 'graded' | 'resubmit_required';
export type DrillMode = 'video_upload' | 'camera_motion_ai';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: UserRole;
  belt: BeltRank;
  stripes: number;
  martialArtStyle: MartialArtStyle;
  gymAffiliation: string;
  streakDays: number;
  totalXp: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  instructorId: string;
  instructorName: string;
  instructorBelt: string;
  style: MartialArtStyle;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  durationHours: number;
  modulesCount: number;
  lessonsCount: number;
  progressPercent?: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl: string;
  durationMinutes: number;
  orderIndex: number;
  drillPdfUrl?: string;
  keyTakeaways: string[];
  completed?: boolean;
  bookmarked?: boolean;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
  description: string;
  lessons: Lesson[];
}

export interface Assignment {
  id: string;
  courseId?: string;
  courseTitle?: string;
  lessonId?: string;
  classId?: string;
  coachId: string;
  coachName: string;
  title: string;
  instructions: string;
  dueDate: string;
  targetTechnique: string;
  targetReps: number;
  minScore: number;
  techniqueId: string; // Motion AI technique identifier
  aiMetricsJson?: Record<string, unknown>;
  completedByStudent?: boolean;
  submissionCount?: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  studentBelt: BeltRank;
  submissionMode: DrillMode;
  videoUrl?: string;
  recordedReps: number;
  motionScore: number;
  status: SubmissionStatus;
  coachFeedback?: string;
  coachGrade?: number;
  submittedAt: string;
  reviewedAt?: string;
  aiMetricsJson?: {
    repDurations?: number[];
    averageFormScore?: number;
    hipRotationAngle?: number;
    guardStabilityPercent?: number;
    notes?: string[];
  };
}

export interface DojoClass {
  id: string;
  name: string;
  coachId: string;
  coachName: string;
  inviteCode: string;
  scheduleDescription: string;
  style: MartialArtStyle;
  room: string;
  enrolledStudentsCount: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorRole: UserRole;
  category: 'Seminar' | 'Grading' | 'Tournament' | 'General';
  createdAt: string;
  likesCount: number;
}
