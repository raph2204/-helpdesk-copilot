export async function fetchServiceDeskTickets() {
  const baseUrl = process.env.SDP_BASE_URL;
  const token = process.env.SDP_ACCESS_TOKEN;

  if (!baseUrl || !token) {
    throw new Error("Missing SDP_BASE_URL or SDP_ACCESS_TOKEN in backend .env");
  }

  const res = await fetch(`${baseUrl}/api/v3/requests`, {
    method: "GET",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      Accept: "application/vnd.manageengine.sdp.v3+json"
    }
  });

  if (!res.ok) {
    throw new Error(`ServiceDesk Plus API failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();

  return (data.requests || []).map((r) => ({
    id: String(r.id),
    title: r.subject || r.title || "Untitled Ticket",
    requester: r.requester?.name || "Unknown",
    description: r.description || r.short_description || "",
    status: r.status?.name || "Open",
    source: "ServiceDesk Plus"
  }));
}