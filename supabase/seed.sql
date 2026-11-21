-- ============================================================================
-- SURAKSHA SATHI — Demonstration Seed Data
-- Clearly labeled simulated data for testing District Epidemiology,
-- Biosecurity Pathshala Lessons, and Official Demo Alerts.
-- ============================================================================

INSERT INTO public.district_profiles
  (district_name, state_name, asf_risk_level, hpai_risk_level, seasonal_risk, environmental_factor, is_demo_data, source_name, last_updated)
VALUES
  ('Kamrup Metro', 'Assam', 'High', 'Moderate', 'High', 'Heavy monsoon runoff & backyard pig density near peri-urban corridors', TRUE, 'Demo Data — Simulated District Profile', CURRENT_DATE),
  ('Lakhimpur', 'Assam', 'Low', 'Low', 'Moderate', 'Scattered rural smallholdings with riverine seasonal humidity', TRUE, 'Demo Data — Simulated District Profile', CURRENT_DATE),
  ('Namakkal', 'Tamil Nadu', 'Low', 'High', 'Moderate', 'High commercial poultry cluster density & shared transport routes', TRUE, 'Demo Data — Simulated District Profile', CURRENT_DATE),
  ('Pune Rural', 'Maharashtra', 'Low', 'Moderate', 'Low', 'Mixed poultry and semi-intensive farms near seasonal migratory wetlands', TRUE, 'Demo Data — Simulated District Profile', CURRENT_DATE),
  ('Ludhiana', 'Punjab', 'Moderate', 'Low', 'Moderate', 'Intensive feed transport network and winter temperature shifts', TRUE, 'Demo Data — Simulated District Profile', CURRENT_DATE)
ON CONFLICT (district_name) DO NOTHING;

INSERT INTO public.alerts
  (farm_id, alert_category, severity, district, title, message, trigger_reason, next_step, source_name, is_simulated, issued_date)
VALUES
  (
    NULL,
    'official',
    'Advisory',
    'Kamrup Metro',
    'Demo Advisory: Enhanced Pig Transport & Swill Precautions',
    'Simulated seasonal advisory recommending strict vehicle disinfection and complete avoidance of untreated kitchen swill in pig units.',
    'Simulated high seasonal ASF pressure in demonstration district profile.',
    'Review gate footbath records and restrict non-essential livestock traders.',
    'Demo Data — Simulated State Veterinary Bulletin',
    TRUE,
    CURRENT_DATE - INTERVAL '2 days'
  ),
  (
    NULL,
    'official',
    'High',
    'Namakkal',
    'Demo Advisory: Wild Bird Netting & Water Hygiene Check',
    'Simulated regional advisory reminding poultry units to inspect bird-proofing mesh and sanitize drinking water lines.',
    'Simulated elevated HPAI seasonal pressure along demonstration poultry corridor.',
    'Check shed wire mesh for gaps and log daily disinfectant footbath refresh.',
    'Demo Data — Simulated Poultry Biosecurity Cell',
    TRUE,
    CURRENT_DATE - INTERVAL '1 day'
  );
