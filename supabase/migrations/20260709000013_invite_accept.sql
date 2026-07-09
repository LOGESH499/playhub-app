-- PLAYHUB Module 3: Secure tenant invite acceptance via RPC

CREATE OR REPLACE FUNCTION public.accept_tenant_invite(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.tenant_invites%ROWTYPE;
  v_user_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_user_email
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  SELECT * INTO v_invite
  FROM public.tenant_invites
  WHERE token = p_token
    AND accepted_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite';
  END IF;

  IF lower(v_invite.email) <> lower(v_user_email) THEN
    RAISE EXCEPTION 'Invite email mismatch';
  END IF;

  INSERT INTO public.tenant_members (tenant_id, user_id, role, status, joined_at)
  VALUES (v_invite.tenant_id, auth.uid(), v_invite.role, 'active', now())
  ON CONFLICT (tenant_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        status = 'active',
        joined_at = COALESCE(public.tenant_members.joined_at, now()),
        updated_at = now();

  UPDATE public.tenant_invites
  SET accepted_at = now()
  WHERE id = v_invite.id;

  RETURN v_invite.tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_tenant_invite(TEXT) TO authenticated;
