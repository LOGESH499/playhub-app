type EmailPayload = {
  id: string;
  to: string;
  subject: string;
  body: string;
};

export async function deliverEmail(payload: EmailPayload): Promise<{
  ok: boolean;
  error?: string;
}> {
  const webhook = process.env.NOTIFICATION_EMAIL_WEBHOOK;

  if (!webhook) {
    return {
      ok: false,
      error: "NOTIFICATION_EMAIL_WEBHOOK not configured",
    };
  }

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: payload.to,
        subject: payload.subject,
        body: payload.body,
        notificationEmailId: payload.id,
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `Webhook returned ${res.status}` };
    }

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Webhook failed",
    };
  }
}
