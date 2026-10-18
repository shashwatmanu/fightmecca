import { create } from 'zustand';
import { UserRole, UserProfile, Course, Assignment, Submission, DojoClass, Announcement } from '@/types';
import { 
  INITIAL_PROFILES, 
  INITIAL_COURSES, 
  INITIAL_ASSIGNMENTS, 
  INITIAL_SUBMISSIONS, 
  INITIAL_CLASSES, 
  INITIAL_ANNOUNCEMENTS 
} from '@/lib/data/mockData';

interface LMSState {
  // Current user & Role
  currentRole: UserRole;
  userProfile: UserProfile;
  setRole: (role: UserRole) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;

  // Active Course & Video Player
  courses: Course[];
  selectedCourseId: string;
  selectedLessonId: string;
  selectCourse: (courseId: string) => void;
  selectLesson: (lessonId: string) => void;
  toggleLessonComplete: (courseId: string, lessonId: string) => void;
  toggleLessonBookmark: (lessonId: string) => void;

  // Assignments & Motion AI Submissions
  assignments: Assignment[];
  submissions: Submission[];
  addAssignment: (assignment: Omit<Assignment, 'id' | 'coachId' | 'coachName' | 'submissionCount'>) => void;
  submitDrill: (submission: Omit<Submission, 'id' | 'submittedAt' | 'status'>) => void;
  gradeSubmission: (submissionId: string, grade: number, feedback: string) => void;

  // Dojo Classes & Rosters
  classes: DojoClass[];
  addClass: (cls: Omit<DojoClass, 'id' | 'coachId' | 'coachName' | 'enrolledStudentsCount'>) => void;
  joinClassByCode: (code: string) => { success: boolean; message: string };

  // Announcements
  announcements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'likesCount'>) => void;
  likeAnnouncement: (id: string) => void;

  // Motion AI session state (temporary)
  activeMotionCamera: boolean;
  setActiveMotionCamera: (active: boolean) => void;
}

export const useLMSStore = create<LMSState>((set, get) => ({
  currentRole: 'student',
  userProfile: INITIAL_PROFILES['student'],

  setRole: (role: UserRole) => {
    set({
      currentRole: role,
      userProfile: INITIAL_PROFILES[role],
    });
  },

  updateProfile: (partial) => {
    set((state) => ({
      userProfile: { ...state.userProfile, ...partial },
    }));
  },

  // Courses
  courses: INITIAL_COURSES,
  selectedCourseId: 'crs-01',
  selectedLessonId: 'lsn-01',
  selectCourse: (courseId) => set({ selectedCourseId: courseId }),
  selectLesson: (lessonId) => set({ selectedLessonId: lessonId }),

  toggleLessonComplete: (courseId, lessonId) => {
    set((state) => {
      const updatedCourses = state.courses.map((course) => {
        if (course.id === courseId) {
          const current = course.progressPercent || 0;
          const next = Math.min(100, current + 15);
          return { ...course, progressPercent: next };
        }
        return course;
      });
      return { courses: updatedCourses };
    });
  },

  toggleLessonBookmark: (lessonId) => {
    // handled locally or in lesson progress
  },

  // Assignments
  assignments: INITIAL_ASSIGNMENTS,
  submissions: INITIAL_SUBMISSIONS,

  addAssignment: (newAsg) => {
    const state = get();
    const created: Assignment = {
      ...newAsg,
      id: `asg-${Date.now()}`,
      coachId: state.userProfile.id,
      coachName: state.userProfile.fullName,
      submissionCount: 0,
      completedByStudent: false,
    };
    set((state) => ({
      assignments: [created, ...state.assignments],
    }));
  },

  submitDrill: (submissionData) => {
    const createdSub: Submission = {
      ...submissionData,
      id: `sub-${Date.now()}`,
      submittedAt: 'Just now',
      status: 'pending_review',
    };

    set((state) => ({
      submissions: [createdSub, ...state.submissions],
      assignments: state.assignments.map((a) =>
        a.id === submissionData.assignmentId ? { ...a, completedByStudent: true, submissionCount: (a.submissionCount || 0) + 1 } : a
      ),
      userProfile: {
        ...state.userProfile,
        totalXp: state.userProfile.totalXp + 250,
      },
    }));
  },

  gradeSubmission: (submissionId, grade, feedback) => {
    set((state) => ({
      submissions: state.submissions.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              coachGrade: grade,
              coachFeedback: feedback,
              status: 'graded',
              reviewedAt: 'Just now',
            }
          : s
      ),
    }));
  },

  // Classes
  classes: INITIAL_CLASSES,
  addClass: (cls) => {
    const state = get();
    const created: DojoClass = {
      ...cls,
      id: `cls-${Date.now()}`,
      coachId: state.userProfile.id,
      coachName: state.userProfile.fullName,
      enrolledStudentsCount: 1,
    };
    set((state) => ({
      classes: [created, ...state.classes],
    }));
  },

  joinClassByCode: (code) => {
    const state = get();
    const found = state.classes.find((c) => c.inviteCode.toUpperCase() === code.trim().toUpperCase());
    if (found) {
      set((state) => ({
        classes: state.classes.map((c) =>
          c.id === found.id ? { ...c, enrolledStudentsCount: c.enrolledStudentsCount + 1 } : c
        ),
      }));
      return { success: true, message: `Successfully joined ${found.name}!` };
    }
    return { success: false, message: 'Invalid or expired dojo invite code.' };
  },

  // Announcements
  announcements: INITIAL_ANNOUNCEMENTS,
  addAnnouncement: (ann) => {
    const created: Announcement = {
      ...ann,
      id: `ann-${Date.now()}`,
      createdAt: 'Just now',
      likesCount: 0,
    };
    set((state) => ({
      announcements: [created, ...state.announcements],
    }));
  },

  likeAnnouncement: (id) => {
    set((state) => ({
      announcements: state.announcements.map((a) =>
        a.id === id ? { ...a, likesCount: a.likesCount + 1 } : a
      ),
    }));
  },

  activeMotionCamera: false,
  setActiveMotionCamera: (active) => set({ activeMotionCamera: active }),
}));
