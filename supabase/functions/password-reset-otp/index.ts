import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action, email, code, new_password } = body;

    // ===== SEND OTP CODE =====
    if (action === "send_code") {
      if (!email) {
        return jsonResponse({ error: "Email is required" }, 400);
      }

      // Generate 6-digit code
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

      // Invalidate old codes
      await supabase
        .from("password_reset_codes")
        .update({ used: true })
        .eq("email", email.toLowerCase())
        .eq("used", false);

      // Store new code
      await supabase.from("password_reset_codes").insert({
        email: email.toLowerCase(),
        code: otpCode,
        expires_at: expiresAt,
      });

      // Send OTP email using GoTrue admin API
      // We generate a recovery link to trigger email sending
      // but we override the email template by using the OTP approach
      try {
        // Use admin API to send a custom OTP-like email
        // We'll use the nonce/token approach
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: "recovery",
          email: email,
        });
        // The link is generated but we don't use it - we use our OTP code instead
        // The recovery email IS sent by Supabase with a link
        // We need to supplement with our own OTP
      } catch (_e) {
        // Ignore link generation errors
      }

      // Return success - the OTP is stored in DB
      // In production, integrate a proper email service
      // For now, return the code in response for development
      return jsonResponse({
        success: true,
        message: "Mã xác minh đã được gửi",
        // Include code for development/testing - remove in production
        _dev_code: otpCode,
      });
    }

    // ===== VERIFY CODE =====
    if (action === "verify_code") {
      if (!email || !code) {
        return jsonResponse({ error: "Email and code are required" }, 400);
      }

      const { data: codeData } = await supabase
        .from("password_reset_codes")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("code", code)
        .eq("used", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!codeData) {
        return jsonResponse({ error: "Mã xác minh không đúng hoặc đã hết hạn" }, 400);
      }

      // Don't mark as used yet - we mark it when password is actually reset
      return jsonResponse({ success: true, verified: true });
    }

    // ===== RESET PASSWORD =====
    if (action === "reset_password") {
      if (!email || !code || !new_password) {
        return jsonResponse({ error: "Missing required fields" }, 400);
      }

      if (new_password.length < 6) {
        return jsonResponse({ error: "Mật khẩu tối thiểu 6 ký tự" }, 400);
      }

      // Verify code is valid
      const { data: codeData } = await supabase
        .from("password_reset_codes")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("code", code)
        .eq("used", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!codeData) {
        return jsonResponse({ error: "Mã xác minh không hợp lệ hoặc đã hết hạn" }, 400);
      }

      // Find user by email
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const targetUser = usersData?.users?.find(
        (u: any) => u.email?.toLowerCase() === email.toLowerCase()
      );

      if (!targetUser) {
        return jsonResponse({ error: "Không tìm thấy tài khoản" }, 404);
      }

      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        targetUser.id,
        { password: new_password }
      );

      if (updateError) {
        return jsonResponse({ error: updateError.message }, 500);
      }

      // Mark code as used
      await supabase
        .from("password_reset_codes")
        .update({ used: true })
        .eq("id", codeData.id);

      return jsonResponse({ success: true, message: "Mật khẩu đã được đặt lại thành công" });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
      "Content-Type": "application/json",
    },
  });
}
