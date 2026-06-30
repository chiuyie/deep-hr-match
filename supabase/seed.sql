# Deep HR Match — Phase 1 MVP Seed Data
# Run after migrations. Demo/placeholder data clearly labeled.

-- 7×7 Matrix Categories (placeholder)
INSERT INTO matrix_categories (id, name, description, sort_order, is_active) VALUES
  ('a1000000-0000-4000-8000-000000000001', 'Work Style', '[PLACEHOLDER] How you prefer to work', 1, true),
  ('a1000000-0000-4000-8000-000000000002', 'Values Alignment', '[PLACEHOLDER] Core values and culture fit', 2, true),
  ('a1000000-0000-4000-8000-000000000003', 'Skills Depth', '[PLACEHOLDER] Technical and soft skills', 3, true),
  ('a1000000-0000-4000-8000-000000000004', 'Growth Mindset', '[PLACEHOLDER] Learning and development orientation', 4, true)
ON CONFLICT (id) DO NOTHING;

-- Questions
INSERT INTO matrix_questions (id, category_id, question_text, question_type, target_role, sort_order, is_required, is_active) VALUES
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', '[PLACEHOLDER] Preferred work environment?', 'single_select', 'both', 1, true, true),
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', '[PLACEHOLDER] Team collaboration style?', 'single_select', 'both', 2, true, true),
  ('b1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002', '[PLACEHOLDER] Most important company value?', 'single_select', 'both', 1, true, true),
  ('b1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000003', '[PLACEHOLDER] Primary skill domain?', 'single_select', 'candidate', 1, true, true),
  ('b1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000003', '[PLACEHOLDER] Required skill level for this role?', 'single_select', 'employer', 1, true, true),
  ('b1000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000004', '[PLACEHOLDER] Rate your growth ambition (1-10)', 'scale', 'candidate', 1, false, true),
  ('b1000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000004', '[PLACEHOLDER] Describe ideal career progression', 'text', 'both', 2, false, true)
ON CONFLICT (id) DO NOTHING;

-- Options
INSERT INTO matrix_options (id, question_id, option_text, option_value, sort_order, is_active) VALUES
  ('c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'Remote', 'remote', 1, true),
  ('c1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 'Hybrid', 'hybrid', 2, true),
  ('c1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 'On-site', 'onsite', 3, true),
  ('c1000000-0000-4000-8000-000000000004', 'b1000000-0000-4000-8000-000000000002', 'Independent', 'independent', 1, true),
  ('c1000000-0000-4000-8000-000000000005', 'b1000000-0000-4000-8000-000000000002', 'Collaborative', 'collaborative', 2, true),
  ('c1000000-0000-4000-8000-000000000006', 'b1000000-0000-4000-8000-000000000003', 'Innovation', 'innovation', 1, true),
  ('c1000000-0000-4000-8000-000000000007', 'b1000000-0000-4000-8000-000000000003', 'Integrity', 'integrity', 2, true),
  ('c1000000-0000-4000-8000-000000000008', 'b1000000-0000-4000-8000-000000000003', 'Customer Focus', 'customer', 3, true),
  ('c1000000-0000-4000-8000-000000000009', 'b1000000-0000-4000-8000-000000000004', 'Engineering', 'engineering', 1, true),
  ('c1000000-0000-4000-8000-000000000010', 'b1000000-0000-4000-8000-000000000004', 'Product', 'product', 2, true),
  ('c1000000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000004', 'Design', 'design', 3, true),
  ('c1000000-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000005', 'Junior', 'junior', 1, true),
  ('c1000000-0000-4000-8000-000000000013', 'b1000000-0000-4000-8000-000000000005', 'Mid-level', 'mid', 2, true),
  ('c1000000-0000-4000-8000-000000000014', 'b1000000-0000-4000-8000-000000000005', 'Senior', 'senior', 3, true)
ON CONFLICT (id) DO NOTHING;

-- NOTE: Demo users must be created via Supabase Auth first.
-- After creating auth users, link them and run the profile seed below.
--
-- Example: Assign admin role manually:
-- UPDATE users SET role = 'admin' WHERE email = 'admin@deephrmatch.demo';
--
-- Demo candidate/employer profiles are created on signup.
-- To seed demo match results, sign up demo users, mark candidate ready,
-- create a job, and click "Generate Matching Results" in the employer UI.
