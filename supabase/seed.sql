# Deep HR Match — Phase 1 MVP Seed Data
# Run after migrations. Demo/placeholder data clearly labeled.
#
# Full 7×7 depth: npm run seed-matrix-77
# Spec: docs/matrix-matching-language.md

-- 7^7 Matrix — 7 matching factors only × 1 sub-level × 7 words (minimal placeholder)
INSERT INTO matrix_categories (id, name, description, sort_order, is_active) VALUES
  ('a1000000-0000-4000-8000-000000000001', '[PLACEHOLDER] Matching Factor 1', '[PLACEHOLDER] 7^7 matching factor 1 of 7', 1, true),
  ('a1000000-0000-4000-8000-000000000002', '[PLACEHOLDER] Matching Factor 2', '[PLACEHOLDER] 7^7 matching factor 2 of 7', 2, true),
  ('a1000000-0000-4000-8000-000000000003', '[PLACEHOLDER] Matching Factor 3', '[PLACEHOLDER] 7^7 matching factor 3 of 7', 3, true),
  ('a1000000-0000-4000-8000-000000000004', '[PLACEHOLDER] Matching Factor 4', '[PLACEHOLDER] 7^7 matching factor 4 of 7', 4, true),
  ('a1000000-0000-4000-8000-000000000005', '[PLACEHOLDER] Matching Factor 5', '[PLACEHOLDER] 7^7 matching factor 5 of 7', 5, true),
  ('a1000000-0000-4000-8000-000000000006', '[PLACEHOLDER] Matching Factor 6', '[PLACEHOLDER] 7^7 matching factor 6 of 7', 6, true),
  ('a1000000-0000-4000-8000-000000000007', '[PLACEHOLDER] Matching Factor 7', '[PLACEHOLDER] 7^7 matching factor 7 of 7', 7, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

INSERT INTO matrix_questions (id, category_id, question_text, question_type, target_role, sort_order, is_required, is_active) VALUES
  ('b1000000-0000-4000-8000-010100000101', 'a1000000-0000-4000-8000-000000000001', '[PLACEHOLDER] Matching Factor 1 — sub-level 1: choose one word', 'single_select', 'both', 1, true, true),
  ('b1000000-0000-4000-8000-020100000101', 'a1000000-0000-4000-8000-000000000002', '[PLACEHOLDER] Matching Factor 2 — sub-level 1: choose one word', 'single_select', 'both', 1, true, true),
  ('b1000000-0000-4000-8000-030100000101', 'a1000000-0000-4000-8000-000000000003', '[PLACEHOLDER] Matching Factor 3 — sub-level 1: choose one word', 'single_select', 'both', 1, true, true),
  ('b1000000-0000-4000-8000-040100000101', 'a1000000-0000-4000-8000-000000000004', '[PLACEHOLDER] Matching Factor 4 — sub-level 1: choose one word', 'single_select', 'both', 1, true, true),
  ('b1000000-0000-4000-8000-050100000101', 'a1000000-0000-4000-8000-000000000005', '[PLACEHOLDER] Matching Factor 5 — sub-level 1: choose one word', 'single_select', 'both', 1, true, true),
  ('b1000000-0000-4000-8000-060100000101', 'a1000000-0000-4000-8000-000000000006', '[PLACEHOLDER] Matching Factor 6 — sub-level 1: choose one word', 'single_select', 'both', 1, true, true),
  ('b1000000-0000-4000-8000-070100000101', 'a1000000-0000-4000-8000-000000000007', '[PLACEHOLDER] Matching Factor 7 — sub-level 1: choose one word', 'single_select', 'both', 1, true, true)
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  question_text = EXCLUDED.question_text,
  question_type = EXCLUDED.question_type,
  target_role = EXCLUDED.target_role,
  sort_order = EXCLUDED.sort_order,
  is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active;

INSERT INTO matrix_options (id, question_id, option_text, option_value, sort_order, is_active) VALUES
  ('c1000000-0000-4000-8000-010101000101', 'b1000000-0000-4000-8000-010100000101', 'factor1', 'factor1', 1, true),
  ('c1000000-0000-4000-8000-010102000101', 'b1000000-0000-4000-8000-010100000101', 'factor2', 'factor2', 2, true),
  ('c1000000-0000-4000-8000-010103000101', 'b1000000-0000-4000-8000-010100000101', 'factor3', 'factor3', 3, true),
  ('c1000000-0000-4000-8000-010104000101', 'b1000000-0000-4000-8000-010100000101', 'factor4', 'factor4', 4, true),
  ('c1000000-0000-4000-8000-010105000101', 'b1000000-0000-4000-8000-010100000101', 'factor5', 'factor5', 5, true),
  ('c1000000-0000-4000-8000-010106000101', 'b1000000-0000-4000-8000-010100000101', 'factor6', 'factor6', 6, true),
  ('c1000000-0000-4000-8000-010107000101', 'b1000000-0000-4000-8000-010100000101', 'factor7', 'factor7', 7, true),
  ('c1000000-0000-4000-8000-020101000101', 'b1000000-0000-4000-8000-020100000101', 'factor1', 'factor1', 1, true),
  ('c1000000-0000-4000-8000-020102000101', 'b1000000-0000-4000-8000-020100000101', 'factor2', 'factor2', 2, true),
  ('c1000000-0000-4000-8000-020103000101', 'b1000000-0000-4000-8000-020100000101', 'factor3', 'factor3', 3, true),
  ('c1000000-0000-4000-8000-020104000101', 'b1000000-0000-4000-8000-020100000101', 'factor4', 'factor4', 4, true),
  ('c1000000-0000-4000-8000-020105000101', 'b1000000-0000-4000-8000-020100000101', 'factor5', 'factor5', 5, true),
  ('c1000000-0000-4000-8000-020106000101', 'b1000000-0000-4000-8000-020100000101', 'factor6', 'factor6', 6, true),
  ('c1000000-0000-4000-8000-020107000101', 'b1000000-0000-4000-8000-020100000101', 'factor7', 'factor7', 7, true),
  ('c1000000-0000-4000-8000-030101000101', 'b1000000-0000-4000-8000-030100000101', 'factor1', 'factor1', 1, true),
  ('c1000000-0000-4000-8000-030102000101', 'b1000000-0000-4000-8000-030100000101', 'factor2', 'factor2', 2, true),
  ('c1000000-0000-4000-8000-030103000101', 'b1000000-0000-4000-8000-030100000101', 'factor3', 'factor3', 3, true),
  ('c1000000-0000-4000-8000-030104000101', 'b1000000-0000-4000-8000-030100000101', 'factor4', 'factor4', 4, true),
  ('c1000000-0000-4000-8000-030105000101', 'b1000000-0000-4000-8000-030100000101', 'factor5', 'factor5', 5, true),
  ('c1000000-0000-4000-8000-030106000101', 'b1000000-0000-4000-8000-030100000101', 'factor6', 'factor6', 6, true),
  ('c1000000-0000-4000-8000-030107000101', 'b1000000-0000-4000-8000-030100000101', 'factor7', 'factor7', 7, true),
  ('c1000000-0000-4000-8000-040101000101', 'b1000000-0000-4000-8000-040100000101', 'factor1', 'factor1', 1, true),
  ('c1000000-0000-4000-8000-040102000101', 'b1000000-0000-4000-8000-040100000101', 'factor2', 'factor2', 2, true),
  ('c1000000-0000-4000-8000-040103000101', 'b1000000-0000-4000-8000-040100000101', 'factor3', 'factor3', 3, true),
  ('c1000000-0000-4000-8000-040104000101', 'b1000000-0000-4000-8000-040100000101', 'factor4', 'factor4', 4, true),
  ('c1000000-0000-4000-8000-040105000101', 'b1000000-0000-4000-8000-040100000101', 'factor5', 'factor5', 5, true),
  ('c1000000-0000-4000-8000-040106000101', 'b1000000-0000-4000-8000-040100000101', 'factor6', 'factor6', 6, true),
  ('c1000000-0000-4000-8000-040107000101', 'b1000000-0000-4000-8000-040100000101', 'factor7', 'factor7', 7, true),
  ('c1000000-0000-4000-8000-050101000101', 'b1000000-0000-4000-8000-050100000101', 'factor1', 'factor1', 1, true),
  ('c1000000-0000-4000-8000-050102000101', 'b1000000-0000-4000-8000-050100000101', 'factor2', 'factor2', 2, true),
  ('c1000000-0000-4000-8000-050103000101', 'b1000000-0000-4000-8000-050100000101', 'factor3', 'factor3', 3, true),
  ('c1000000-0000-4000-8000-050104000101', 'b1000000-0000-4000-8000-050100000101', 'factor4', 'factor4', 4, true),
  ('c1000000-0000-4000-8000-050105000101', 'b1000000-0000-4000-8000-050100000101', 'factor5', 'factor5', 5, true),
  ('c1000000-0000-4000-8000-050106000101', 'b1000000-0000-4000-8000-050100000101', 'factor6', 'factor6', 6, true),
  ('c1000000-0000-4000-8000-050107000101', 'b1000000-0000-4000-8000-050100000101', 'factor7', 'factor7', 7, true),
  ('c1000000-0000-4000-8000-060101000101', 'b1000000-0000-4000-8000-060100000101', 'factor1', 'factor1', 1, true),
  ('c1000000-0000-4000-8000-060102000101', 'b1000000-0000-4000-8000-060100000101', 'factor2', 'factor2', 2, true),
  ('c1000000-0000-4000-8000-060103000101', 'b1000000-0000-4000-8000-060100000101', 'factor3', 'factor3', 3, true),
  ('c1000000-0000-4000-8000-060104000101', 'b1000000-0000-4000-8000-060100000101', 'factor4', 'factor4', 4, true),
  ('c1000000-0000-4000-8000-060105000101', 'b1000000-0000-4000-8000-060100000101', 'factor5', 'factor5', 5, true),
  ('c1000000-0000-4000-8000-060106000101', 'b1000000-0000-4000-8000-060100000101', 'factor6', 'factor6', 6, true),
  ('c1000000-0000-4000-8000-060107000101', 'b1000000-0000-4000-8000-060100000101', 'factor7', 'factor7', 7, true),
  ('c1000000-0000-4000-8000-070101000101', 'b1000000-0000-4000-8000-070100000101', 'factor1', 'factor1', 1, true),
  ('c1000000-0000-4000-8000-070102000101', 'b1000000-0000-4000-8000-070100000101', 'factor2', 'factor2', 2, true),
  ('c1000000-0000-4000-8000-070103000101', 'b1000000-0000-4000-8000-070100000101', 'factor3', 'factor3', 3, true),
  ('c1000000-0000-4000-8000-070104000101', 'b1000000-0000-4000-8000-070100000101', 'factor4', 'factor4', 4, true),
  ('c1000000-0000-4000-8000-070105000101', 'b1000000-0000-4000-8000-070100000101', 'factor5', 'factor5', 5, true),
  ('c1000000-0000-4000-8000-070106000101', 'b1000000-0000-4000-8000-070100000101', 'factor6', 'factor6', 6, true),
  ('c1000000-0000-4000-8000-070107000101', 'b1000000-0000-4000-8000-070100000101', 'factor7', 'factor7', 7, true)
ON CONFLICT (id) DO NOTHING;

-- NOTE: Demo users must be created via Supabase Auth first.
-- After creating auth users, link them and run the profile seed below.
--
-- Example: Assign admin role manually:
-- UPDATE users SET role = 'admin' WHERE email = 'admin@deephrmatch.demo';
--
-- Demo candidate/employer profiles are created on signup.
-- To seed demo match results, sign up demo users, mark candidate ready,
-- complete 7^7 forms, create a job, and generate matches in the employer UI.
