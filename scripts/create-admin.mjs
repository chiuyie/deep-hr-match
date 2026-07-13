import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD?.trim();
const name = process.env.ADMIN_NAME?.trim() || "Platform Admin";

const placeholders = new Set([
  "https://your-project.supabase.co",
  "your-anon-key",
  "your-service-role-key",
]);

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

if (!url || placeholders.has(url)) {
  fail("Set NEXT_PUBLIC_SUPABASE_URL in .env.local");
}

if (!serviceRoleKey || placeholders.has(serviceRoleKey)) {
  fail("Set SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

if (!email) {
  fail("Set ADMIN_EMAIL in .env.local (e.g. admin@yourcompany.com)");
}

if (!password || password.length < 8) {
  fail("Set ADMIN_PASSWORD in .env.local (minimum 8 characters)");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

if (listError) {
  fail(listError.message);
}

const existing = existingUsers.users.find(
  (user) => user.email?.toLowerCase() === email.toLowerCase()
);

let authUserId = existing?.id;

if (!authUserId) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error || !data.user) {
    fail(error?.message ?? "Failed to create auth user");
  }

  authUserId = data.user.id;
  console.log(`Created auth user for ${email}`);
} else {
  const { error } = await supabase.auth.admin.updateUserById(authUserId, {
    password,
    user_metadata: { name },
  });

  if (error) {
    fail(error.message);
  }

  console.log(`Updated existing auth user for ${email}`);
}

const { error: roleError } = await supabase
  .from("users")
  .update({ role: "admin", name })
  .eq("auth_user_id", authUserId);

if (roleError) {
  fail(roleError.message);
}

console.log("");
console.log("Admin user is ready.");
console.log(`  Email:    ${email}`);
console.log(`  Sign in:  ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/admin/sign-in`);
console.log("");
