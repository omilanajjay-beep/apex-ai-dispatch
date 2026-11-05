export type BookingNotification = {
  client_name: string;
  client_email: string;
  client_phone: string;
  contractor_email: string;
  service_type: string;
  booking_time: string;
  notes: string;
};

export async function sendBookingNotification(payload: BookingNotification) {
  const webhookUrl = process.env.PIPEDREAM_WEBHOOK_URL?.trim();
  if (!webhookUrl) return false;

  let url: URL;
  try {
    url = new URL(webhookUrl);
    if (url.protocol !== 'https:') return false;
  } catch {
    return false;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
