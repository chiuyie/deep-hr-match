-- Fix "Database error saving new user" on signup.
-- The auth trigger must bypass RLS and run with a stable search_path.

DROP POLICY IF EXISTS "Allow user insert on signup" ON users;
CREATE POLICY "Allow user insert on signup" ON users
  FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Allow candidate profile insert on signup" ON candidate_profiles;
CREATE POLICY "Allow candidate profile insert on signup" ON candidate_profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id AND u.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Allow employer profile insert on signup" ON employer_profiles;
CREATE POLICY "Allow employer profile insert on signup" ON employer_profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_id AND u.auth_user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_role user_role;
  v_name TEXT;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', '');

  v_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' = 'employer' THEN 'employer'::user_role
    ELSE 'candidate'::user_role
  END;

  INSERT INTO public.users (auth_user_id, email, name, role)
  VALUES (NEW.id, NEW.email, v_name, v_role)
  RETURNING id INTO v_user_id;

  IF v_role = 'employer' THEN
    INSERT INTO public.employer_profiles (user_id) VALUES (v_user_id);
  ELSE
    INSERT INTO public.candidate_profiles (user_id, email, full_name)
    VALUES (v_user_id, NEW.email, v_name);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
