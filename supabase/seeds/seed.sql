-- ============================================================
-- SUPERADMIN ACCOUNT CREATION
-- ============================================================

-- 1. Create a new user in Supabase Auth
-- NOTE: replace 'superadmin@example.com' and 'SuperSecretPass123!' yourself
SELECT
    auth.sign_up(
        email := 'su@admin.com',
        password := 'superuser12345!',
        data := jsonb_build_object(
            'full_name', 'Super Admin',
            'created_by_seed', true
        )
    ) AS superadmin;

-- 2. Get user ID of newly created superadmin
-- IMPORTANT: This will fetch the user directly by email.
WITH su AS (
    SELECT id FROM auth.users WHERE email = 'su@admin.com'
)
-- 3. Insert admin role in user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM su
ON CONFLICT DO NOTHING;
