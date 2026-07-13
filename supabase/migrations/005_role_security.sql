-- Prevent non-admins from changing their own role
DROP POLICY IF EXISTS "Users can update own record" ON users;

CREATE POLICY "Users can update own record" ON users
  FOR UPDATE
  USING (auth_user_id = auth.uid() OR is_admin())
  WITH CHECK (
    is_admin()
    OR role = (
      SELECT u.role FROM users u WHERE u.auth_user_id = auth.uid()
    )
  );

-- Provision role + profile from auth metadata at signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
