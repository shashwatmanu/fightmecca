-- ==============================================================================
-- Fight Mecca Combat Sports LMS Database Schema (PostgreSQL / Supabase compatible)
-- ==============================================================================

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('student', 'coach', 'admin');
CREATE TYPE belt_rank AS ENUM ('white', 'blue', 'purple', 'brown', 'black', 'coral', 'red');
CREATE TYPE martial_art_style AS ENUM ('bjj', 'muay_thai', 'boxing', 'wrestling', 'mma', 'judo');
CREATE TYPE submission_status AS ENUM ('pending_review', 'graded', 'resubmit_required');
CREATE TYPE drill_mode AS ENUM ('video_upload', 'camera_motion_ai');

-- 2. USERS / PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role DEFAULT 'student',
    belt belt_rank DEFAULT 'white',
    stripes INT DEFAULT 0,
    martial_art_style martial_art_style DEFAULT 'bjj',
    gym_affiliation TEXT DEFAULT 'Fight Mecca HQ',
    streak_days INT DEFAULT 0,
    total_xp INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. COURSES & CURRICULUM
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    instructor_name TEXT NOT NULL,
    instructor_belt TEXT DEFAULT 'Black Belt',
    style martial_art_style DEFAULT 'bjj',
    level TEXT DEFAULT 'All Levels', -- Beginner, Intermediate, Advanced
    duration_hours NUMERIC(4, 1) DEFAULT 4.5,
    modules_count INT DEFAULT 4,
    lessons_count INT DEFAULT 18,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. COURSE MODULES & LESSONS
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    duration_minutes INT DEFAULT 10,
    order_index INT NOT NULL DEFAULT 1,
    drill_pdf_url TEXT,
    key_takeaways JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CLASSES & DOJO ROSTERS
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    invite_code VARCHAR(12) UNIQUE NOT NULL,
    schedule_description TEXT,
    style martial_art_style DEFAULT 'bjj',
    room TEXT DEFAULT 'Mat 1 - Championship Hall',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

-- 6. ASSIGNMENTS & DRILL CRITERIA (WITH CRUCIAL MOTION AI PREP)
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    instructions TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    target_technique TEXT NOT NULL, -- e.g. "Triangle Choke Setup", "Switch Kick", "Double Leg Takedown"
    target_reps INT DEFAULT 10,
    min_score INT DEFAULT 80, -- Minimum acceptable form score (0-100)
    technique_id TEXT, -- References motion tracking model / MediaPipe pose definition
    ai_metrics_json JSONB DEFAULT '{}'::jsonb, -- e.g. {"keypoints": ["hip_rotation", "shin_angle"], "expected_velocity": 4.2}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SUBMISSIONS & MOTION AI DRILL LOGS
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    submission_mode drill_mode DEFAULT 'camera_motion_ai',
    video_url TEXT,
    recorded_reps INT DEFAULT 0,
    motion_score INT DEFAULT 0, -- AI computed accuracy/form score (0-100)
    status submission_status DEFAULT 'pending_review',
    coach_feedback TEXT,
    coach_grade INT, -- Optional manual override / official coach score (0-100)
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    ai_metrics_json JSONB DEFAULT '{}'::jsonb, -- Detailed per-rep frame breakdown from MediaPipe
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. STUDENT PROGRESS & BOOKMARKS
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    watched_seconds INT DEFAULT 0,
    bookmarked BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, lesson_id)
);

-- 9. COMMUNITY & ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_role user_role DEFAULT 'coach',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Seminar', -- 'Grading', 'Tournament', 'General', 'Seminar'
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    technique_tag TEXT,
    reply_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
