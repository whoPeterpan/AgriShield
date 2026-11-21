-- ============================================================================
-- SURAKSHA SATHI — PostgreSQL & Supabase Schema
-- Digital Biosecurity Management Portal for Pig and Poultry Farms
-- ============================================================================
-- Run this script in the Supabase SQL Editor to initialize all 14 tables,
-- foreign keys, Role-Based Row Level Security (RLS) policies, aggregate
-- authority views, and the evidence storage bucket.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES (extends auth.users with application role & language)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('farmer', 'veterinarian', 'authority')) DEFAULT 'farmer',
  phone_or_email TEXT,
  preferred_language TEXT NOT NULL CHECK (preferred_language IN ('en', 'hi')) DEFAULT 'en',
  district TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. DISTRICT PROFILES (Local Epidemiology Demonstration Profiles)
CREATE TABLE IF NOT EXISTS public.district_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_name TEXT NOT NULL UNIQUE,
  state_name TEXT NOT NULL,
  asf_risk_level TEXT NOT NULL CHECK (asf_risk_level IN ('Low', 'Moderate', 'High')) DEFAULT 'Low',
  hpai_risk_level TEXT NOT NULL CHECK (hpai_risk_level IN ('Low', 'Moderate', 'High')) DEFAULT 'Low',
  seasonal_risk TEXT NOT NULL CHECK (seasonal_risk IN ('Low', 'Moderate', 'High')) DEFAULT 'Moderate',
  environmental_factor TEXT NOT NULL,
  is_demo_data BOOLEAN NOT NULL DEFAULT TRUE,
  source_name TEXT NOT NULL DEFAULT 'Demonstration Epidemiology Profile (Simulated)',
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. FARMS (Registered Pig or Poultry Farms)
CREATE TABLE IF NOT EXISTS public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_vet_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  farmer_name TEXT NOT NULL,
  farm_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  farm_type TEXT NOT NULL CHECK (farm_type IN ('Pig', 'Poultry')),
  animal_count INTEGER NOT NULL CHECK (animal_count >= 1),
  farm_size TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AUDIT TEMPLATES (Species-Specific Biosecurity Templates)
CREATE TABLE IF NOT EXISTS public.audit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_type TEXT NOT NULL CHECK (farm_type IN ('Pig', 'Poultry')),
  title TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. AUDIT QUESTIONS (Weighted Questions with Explanations & References)
CREATE TABLE IF NOT EXISTS public.audit_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.audit_templates(id) ON DELETE CASCADE,
  question_code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_text_hi TEXT,
  risk_weight NUMERIC(5,2) NOT NULL CHECK (risk_weight > 0),
  explanation TEXT NOT NULL,
  corrective_action TEXT NOT NULL,
  reference_source TEXT,
  risk_tags TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 6. AUDITS (Completed or Draft Assessments per Farm)
CREATE TABLE IF NOT EXISTS public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.audit_templates(id) ON DELETE SET NULL,
  district_name TEXT NOT NULL,
  overall_risk_score NUMERIC(5,2) NOT NULL CHECK (overall_risk_score >= 0 AND overall_risk_score <= 100),
  risk_category TEXT NOT NULL CHECK (risk_category IN ('Low Risk', 'Moderate Risk', 'High Risk', 'Critical Risk')),
  category_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('draft', 'completed')) DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AUDIT ANSWERS (Individual Question Responses & Applied Multipliers)
CREATE TABLE IF NOT EXISTS public.audit_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.audit_questions(id) ON DELETE SET NULL,
  question_code TEXT NOT NULL,
  answer TEXT NOT NULL CHECK (answer IN ('Yes', 'Partially', 'No', 'Not Applicable')),
  base_weight NUMERIC(5,2) NOT NULL,
  local_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  weighted_risk_points NUMERIC(6,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. RECOMMENDATIONS (Personalised Action Plan Items)
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  identified_problem TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  action_steps TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Critical', 'High', 'Medium')) DEFAULT 'High',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. LESSONS (Biosecurity Pathshala Educational Content)
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  species TEXT NOT NULL CHECK (species IN ('Both', 'Pig', 'Poultry')) DEFAULT 'Both',
  title TEXT NOT NULL,
  title_hi TEXT,
  summary TEXT NOT NULL,
  summary_hi TEXT,
  dos TEXT[] NOT NULL DEFAULT '{}',
  donts TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  reference_source TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Track lesson completion per user profile
CREATE TABLE IF NOT EXISTS public.lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, lesson_id)
);

-- 10. FARM LOGS (Visitors, Cleaning, Mortality, Animal Movement, Observations)
CREATE TABLE IF NOT EXISTS public.farm_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL CHECK (log_type IN ('visitor', 'cleaning', 'mortality', 'animal_movement', 'observation')),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  numeric_value INTEGER DEFAULT 0,
  created_offline BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. EVIDENCE ITEMS (Photos & Documents for Compartment Readiness)
CREATE TABLE IF NOT EXISTS public.evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Cleaning Log', 'Visitor Register', 'Footbath Setup', 'Fencing & Netting', 'Waste Disposal', 'Other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. ALERTS (Official Demo Alerts & Farm Signal Alerts)
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  alert_category TEXT NOT NULL CHECK (alert_category IN ('official', 'community', 'farm_signal')),
  severity TEXT NOT NULL CHECK (severity IN ('Info', 'Advisory', 'High')) DEFAULT 'Advisory',
  district TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  trigger_reason TEXT NOT NULL,
  next_step TEXT NOT NULL,
  source_name TEXT NOT NULL,
  is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
  is_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. VET CASES (Farmer-to-Veterinarian Case Submissions & Responses)
CREATE TABLE IF NOT EXISTS public.vet_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  vet_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  concern_title TEXT NOT NULL,
  concern_description TEXT NOT NULL,
  observation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  farm_observations TEXT,
  photo_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('New', 'Under Review', 'Response Sent', 'Closed')) DEFAULT 'New',
  vet_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. COMMUNITY REPORTS (Anonymised Regional Pattern Tracking — >= 3 Farms Rule)
CREATE TABLE IF NOT EXISTS public.community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  district TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('Pig', 'Poultry')),
  pattern_type TEXT NOT NULL,
  notes TEXT,
  reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ANONYMISED AUTHORITY VIEWS (Protect Individual Farm Identities)
-- ============================================================================

CREATE OR REPLACE VIEW public.authority_district_summary AS
SELECT
  f.district,
  f.state,
  COUNT(DISTINCT f.id) AS total_farms,
  COUNT(DISTINCT f.id) FILTER (WHERE f.farm_type = 'Pig') AS pig_farms,
  COUNT(DISTINCT f.id) FILTER (WHERE f.farm_type = 'Poultry') AS poultry_farms,
  ROUND(AVG(a.overall_risk_score)::numeric, 1) AS avg_risk_score,
  COUNT(DISTINCT a.farm_id) AS assessed_farms
FROM public.farms f
LEFT JOIN public.audits a ON a.farm_id = f.id AND a.status = 'completed'
GROUP BY f.district, f.state;

CREATE OR REPLACE VIEW public.authority_community_patterns AS
SELECT
  district,
  species,
  pattern_type,
  COUNT(DISTINCT farm_id) AS distinct_farms_reporting,
  MAX(reported_date) AS latest_report_date
FROM public.community_reports
WHERE reported_date >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY district, species, pattern_type
HAVING COUNT(DISTINCT farm_id) >= 3;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.district_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

-- Indexes on key relational foreign keys and filter columns
CREATE INDEX IF NOT EXISTS idx_farms_owner_id ON public.farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_farms_assigned_vet_id ON public.farms(assigned_vet_id);
CREATE INDEX IF NOT EXISTS idx_farms_district ON public.farms(district);
CREATE INDEX IF NOT EXISTS idx_audit_questions_template_id ON public.audit_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_audits_farm_id ON public.audits(farm_id);
CREATE INDEX IF NOT EXISTS idx_audit_answers_audit_id ON public.audit_answers(audit_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_farm_id ON public.recommendations(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_logs_farm_id ON public.farm_logs(farm_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_farm_id ON public.evidence_items(farm_id);
CREATE INDEX IF NOT EXISTS idx_alerts_farm_id ON public.alerts(farm_id);
CREATE INDEX IF NOT EXISTS idx_alerts_district ON public.alerts(district);
CREATE INDEX IF NOT EXISTS idx_vet_cases_farm_id ON public.vet_cases(farm_id);
CREATE INDEX IF NOT EXISTS idx_vet_cases_vet_id ON public.vet_cases(vet_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_farm_id ON public.community_reports(farm_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_district ON public.community_reports(district);

-- Helper function to fetch current user role safely
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Profiles: users read/update their own profile (without escalating role)
CREATE POLICY "profiles_self_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.get_my_role() = 'veterinarian');
CREATE POLICY "profiles_self_insert" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = public.get_my_role());

-- District Profiles, Templates, Questions, Lessons: readable by all authenticated users; editable by authority
CREATE POLICY "district_profiles_read" ON public.district_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "district_profiles_admin_write" ON public.district_profiles
  FOR ALL TO authenticated USING (public.get_my_role() = 'authority') WITH CHECK (public.get_my_role() = 'authority');

CREATE POLICY "templates_read" ON public.audit_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "questions_read" ON public.audit_questions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "lessons_read" ON public.lessons
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "lessons_admin_write" ON public.lessons
  FOR ALL TO authenticated USING (public.get_my_role() = 'authority') WITH CHECK (public.get_my_role() = 'authority');

CREATE POLICY "lesson_completions_self" ON public.lesson_completions
  FOR ALL TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- Farms: farmers see own farms; vets see assigned farms (Authorities use aggregate views)
CREATE POLICY "farms_farmer_and_vet" ON public.farms
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR assigned_vet_id = auth.uid());
CREATE POLICY "farms_farmer_insert" ON public.farms
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "farms_farmer_update" ON public.farms
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Audits, Answers, Recommendations, Farm Logs, Evidence: farm owner or assigned vet
CREATE POLICY "audits_owner_or_vet" ON public.audits
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND (f.owner_id = auth.uid() OR f.assigned_vet_id = auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.owner_id = auth.uid())
  );

CREATE POLICY "audit_answers_owner_or_vet" ON public.audit_answers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.audits a
      JOIN public.farms f ON f.id = a.farm_id
      WHERE a.id = audit_id AND (f.owner_id = auth.uid() OR f.assigned_vet_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits a
      JOIN public.farms f ON f.id = a.farm_id
      WHERE a.id = audit_id AND f.owner_id = auth.uid()
    )
  );

CREATE POLICY "recommendations_owner_or_vet" ON public.recommendations
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND (f.owner_id = auth.uid() OR f.assigned_vet_id = auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.owner_id = auth.uid())
  );

CREATE POLICY "farm_logs_owner_or_vet" ON public.farm_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND (f.owner_id = auth.uid() OR f.assigned_vet_id = auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.owner_id = auth.uid())
  );

CREATE POLICY "evidence_owner_or_vet" ON public.evidence_items
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND (f.owner_id = auth.uid() OR f.assigned_vet_id = auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.owner_id = auth.uid())
  );

-- Alerts: global official alerts readable by all; farm alerts readable by owner
CREATE POLICY "alerts_read" ON public.alerts
  FOR SELECT TO authenticated
  USING (
    farm_id IS NULL
    OR EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND (f.owner_id = auth.uid() OR f.assigned_vet_id = auth.uid()))
  );
CREATE POLICY "alerts_owner_update" ON public.alerts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.owner_id = auth.uid())
  );
CREATE POLICY "alerts_admin_insert" ON public.alerts
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_my_role() = 'authority'
    OR (
      farm_id IS NOT NULL
      AND alert_category = 'farm_signal'
      AND EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.owner_id = auth.uid())
    )
  );

-- Vet Cases: owner can create/read; assigned vet can read/update
CREATE POLICY "vet_cases_select" ON public.vet_cases
  FOR SELECT TO authenticated
  USING (
    vet_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND (f.owner_id = auth.uid() OR f.assigned_vet_id = auth.uid()))
  );
CREATE POLICY "vet_cases_farmer_insert" ON public.vet_cases
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.owner_id = auth.uid())
  );
CREATE POLICY "vet_cases_vet_update" ON public.vet_cases
  FOR UPDATE TO authenticated
  USING (
    public.get_my_role() = 'veterinarian'
    AND (vet_id = auth.uid() OR EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.assigned_vet_id = auth.uid()))
  );

-- Community Reports: farmers insert their own report; raw rows NOT readable by others (only aggregate view is exposed)
CREATE POLICY "community_reports_insert" ON public.community_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.owner_id = auth.uid())
  );
CREATE POLICY "community_reports_own_select" ON public.community_reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.farms f WHERE f.id = farm_id AND f.owner_id = auth.uid())
  );

-- ============================================================================
-- SUPABASE STORAGE BUCKET FOR FARM EVIDENCE
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('farm-evidence', 'farm-evidence', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "evidence_bucket_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'farm-evidence');

CREATE POLICY "evidence_bucket_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'farm-evidence');
