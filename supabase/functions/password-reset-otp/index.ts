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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action, email, code, new_password } = body;

    // ===== SEND OTP CODE =====
    if (action === "send_code") {
      if (!email) {
        return jsonResponse({ error: "Email is required" }, 400);
      }

      if (!resendApiKey) {
        return jsonResponse({ error: "Email service not configured" }, 500);
      }

      // === Rate limiting ===
      const now = new Date();

      // Cooldown: 1 request per 60 seconds
      const { data: lastCode } = await supabase
        .from("password_reset_codes")
        .select("created_at")
        .eq("email", email.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastCode) {
        const lastSentAt = new Date(lastCode.created_at);
        const diffSeconds = (now.getTime() - lastSentAt.getTime()) / 1000;
        if (diffSeconds < 60) {
          const waitSeconds = Math.ceil(60 - diffSeconds);
          return jsonResponse(
            { error: `Vui lòng chờ ${waitSeconds} giây trước khi gửi lại mã.` },
            429
          );
        }
      }

      // Burst limit: max 3 codes per 15 minutes
      const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
      const { data: recentCodes } = await supabase
        .from("password_reset_codes")
        .select("id")
        .eq("email", email.toLowerCase())
        .gte("created_at", fifteenMinAgo);

      if (recentCodes && recentCodes.length >= 3) {
        return jsonResponse(
          { error: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút." },
          429
        );
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

      // Send OTP email via Resend
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "TeamWorks UEH <no-reply@resend.dev>",
          to: [email.toLowerCase()],
          subject: `Mã xác minh đặt lại mật khẩu: ${otpCode}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">TeamWorks UEH</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 8px;color:#18181b;font-size:18px;font-weight:600;">Đặt lại mật khẩu</h2>
              <p style="margin:0 0 24px;color:#71717a;font-size:14px;line-height:1.6;">
                Bạn đã yêu cầu đặt lại mật khẩu. Sử dụng mã xác minh bên dưới để tiếp tục. Mã có hiệu lực trong <strong>10 phút</strong>.
              </p>
              <!-- OTP Code -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:16px 0;">
                    <div style="display:inline-block;background-color:#f4f4f5;border:2px dashed #d4d4d8;border-radius:12px;padding:20px 40px;">
                      <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#18181b;font-family:'Courier New',monospace;">${otpCode}</span>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#a1a1aa;font-size:12px;line-height:1.5;text-align:center;">
                Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background-color:#fafafa;border-top:1px solid #f4f4f5;text-align:center;">
              <p style="margin:0;color:#a1a1aa;font-size:11px;">© ${new Date().getFullYear()} TeamWorks UEH. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        }),
      });

      if (!emailResponse.ok) {
        const errData = await emailResponse.text();
        console.error("Resend error:", errData);
        return jsonResponse({ error: "Không thể gửi email. Vui lòng thử lại sau." }, 500);
      }

      await emailResponse.json();

      return jsonResponse({
        success: true,
        message: "Mã xác minh đã được gửi đến email của bạn",
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
