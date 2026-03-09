import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Check system setting
    const { data: setting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "email_daily_digest")
      .single();

    if (!setting?.value?.enabled) {
      return new Response(
        JSON.stringify({ message: "Email digest is disabled", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const deadlineHours = setting.value.deadline_hours || 24;
    const now = new Date();
    const deadlineCutoff = new Date(
      now.getTime() + deadlineHours * 60 * 60 * 1000
    ).toISOString();
    const newTaskCutoff = new Date(
      now.getTime() - 24 * 60 * 60 * 1000
    ).toISOString();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).toISOString();

    // 2. Query tasks with upcoming deadlines
    const { data: deadlineTasks } = await supabase
      .from("task_assignments")
      .select(
        "user_id, tasks!inner(id, title, deadline, group_id, groups!inner(name))"
      )
      .not("tasks.deadline", "is", null)
      .gte("tasks.deadline", now.toISOString())
      .lte("tasks.deadline", deadlineCutoff)
      .neq("tasks.status", "DONE")
      .neq("tasks.status", "VERIFIED");

    // 3. Query new tasks created in last 24h
    const { data: newTasks } = await supabase
      .from("task_assignments")
      .select(
        "user_id, tasks!inner(id, title, deadline, created_at, group_id, groups!inner(name))"
      )
      .gte("tasks.created_at", newTaskCutoff);

    // 4. Group by user
    const userDigests: Record<
      string,
      {
        deadlines: Array<{
          title: string;
          deadline: string;
          project: string;
        }>;
        newTasks: Array<{
          title: string;
          deadline: string | null;
          project: string;
        }>;
      }
    > = {};

    deadlineTasks?.forEach((row: any) => {
      const uid = row.user_id;
      if (!userDigests[uid])
        userDigests[uid] = { deadlines: [], newTasks: [] };
      userDigests[uid].deadlines.push({
        title: row.tasks.title,
        deadline: row.tasks.deadline,
        project: row.tasks.groups.name,
      });
    });

    newTasks?.forEach((row: any) => {
      const uid = row.user_id;
      if (!userDigests[uid])
        userDigests[uid] = { deadlines: [], newTasks: [] };
      // Avoid duplicates
      const exists = userDigests[uid].newTasks.some(
        (t) => t.title === row.tasks.title && t.project === row.tasks.groups.name
      );
      if (!exists) {
        userDigests[uid].newTasks.push({
          title: row.tasks.title,
          deadline: row.tasks.deadline,
          project: row.tasks.groups.name,
        });
      }
    });

    // Filter users with no content
    const userIds = Object.keys(userDigests).filter(
      (uid) =>
        userDigests[uid].deadlines.length > 0 ||
        userDigests[uid].newTasks.length > 0
    );

    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No users with relevant tasks",
          sent: 0,
          skipped: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Get profiles (email_notifications = true)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, email_notifications")
      .in("id", userIds);

    // 6. Check already sent today
    const { data: sentToday } = await supabase
      .from("email_logs")
      .select("user_id")
      .eq("email_type", "daily_digest")
      .gte("sent_at", todayStart);

    const alreadySent = new Set(sentToday?.map((r: any) => r.user_id) || []);

    let sent = 0;
    let skipped = 0;

    for (const profile of profiles || []) {
      if (profile.email_notifications === false) {
        skipped++;
        continue;
      }
      if (alreadySent.has(profile.id)) {
        skipped++;
        continue;
      }

      const digest = userDigests[profile.id];
      if (!digest) continue;

      const totalTasks = digest.deadlines.length + digest.newTasks.length;

      // Build email HTML
      const subject = `📊 Cập nhật hàng ngày${
        digest.deadlines.length > 0
          ? ` - ${digest.deadlines.length} deadline sắp hết`
          : ""
      }${
        digest.newTasks.length > 0
          ? ` + ${digest.newTasks.length} task mới`
          : ""
      }`;

      let html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 24px 32px; color: white;">
            <h1 style="margin: 0; font-size: 20px;">📊 Cập nhật hàng ngày</h1>
            <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Xin chào ${profile.full_name},</p>
          </div>
          <div style="padding: 24px 32px;">
      `;

      if (digest.deadlines.length > 0) {
        html += `
          <h2 style="color: #dc2626; font-size: 16px; margin: 0 0 12px; display: flex; align-items: center; gap: 8px;">
            ⏰ Deadline sắp hết (${digest.deadlines.length} task)
          </h2>
          <div style="margin-bottom: 20px;">
        `;
        for (const task of digest.deadlines) {
          const deadline = new Date(task.deadline);
          const hoursLeft = Math.round(
            (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
          );
          html += `
            <div style="padding: 10px 14px; margin-bottom: 8px; background: #fef2f2; border-radius: 8px; border-left: 3px solid #dc2626;">
              <strong style="color: #1f2937;">${task.title}</strong>
              <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
                📁 ${task.project} · còn ${hoursLeft}h
              </div>
            </div>
          `;
        }
        html += `</div>`;
      }

      if (digest.newTasks.length > 0) {
        html += `
          <h2 style="color: #2563eb; font-size: 16px; margin: 0 0 12px;">
            📋 Task mới được giao (${digest.newTasks.length} task)
          </h2>
          <div style="margin-bottom: 20px;">
        `;
        for (const task of digest.newTasks) {
          const deadlineStr = task.deadline
            ? new Date(task.deadline).toLocaleDateString("vi-VN")
            : "Chưa có";
          html += `
            <div style="padding: 10px 14px; margin-bottom: 8px; background: #eff6ff; border-radius: 8px; border-left: 3px solid #2563eb;">
              <strong style="color: #1f2937;">${task.title}</strong>
              <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
                📁 ${task.project} · ⏰ Deadline: ${deadlineStr}
              </div>
            </div>
          `;
        }
        html += `</div>`;
      }

      html += `
            <div style="text-align: center; margin-top: 24px;">
              <p style="color: #6b7280; font-size: 13px;">Truy cập hệ thống để xem chi tiết.</p>
            </div>
          </div>
          <div style="background: #f9fafb; padding: 16px 32px; text-align: center; font-size: 12px; color: #9ca3af;">
            Email tự động từ UEH Task Manager · Bạn có thể tắt trong Thông tin cá nhân
          </div>
        </div>
      `;

      // Send via Resend
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "UEH Task Manager <onboarding@resend.dev>",
          to: [profile.email],
          subject,
          html,
        }),
      });

      if (resendRes.ok) {
        // Log to email_logs
        await supabase.from("email_logs").insert({
          user_id: profile.id,
          email_type: "daily_digest",
          recipient_email: profile.email,
          tasks_count: totalTasks,
          digest_data: {
            deadlines_count: digest.deadlines.length,
            new_tasks_count: digest.newTasks.length,
          },
        });
        sent++;
      } else {
        const errText = await resendRes.text();
        console.error(`Failed to send to ${profile.email}:`, errText);
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({
        sent,
        skipped,
        total_users: userIds.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email digest error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
