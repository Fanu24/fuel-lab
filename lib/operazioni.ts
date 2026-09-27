export type Order = {
  id: string; user_id: string; email: string; status: string; service: string; fulfillment: string;
  requested_date: string | null; production_date: string | null; fulfillment_date: string | null;
  customer_name: string; phone: string; comune: string; address: string;
  notes: string; internal_note: string; dietary_preferences: string | null; meals: number; created_at: string; updated_at: string;
  items: Array<{ id: string; name: string; day: string; meal: string; extras: string[] }>;
};

export const STATES = [
  { id: "requested", label: "Da confermare" },
  { id: "confirmed", label: "Confermata" },
  { id: "preparing", label: "In preparazione" },
  { id: "ready", label: "Pronta" },
  { id: "completed", label: "Completata" },
  { id: "cancelled", label: "Annullata" },
];

export const statusLabel = (status: string) => STATES.find((state) => state.id === status)?.label ?? status;
export const isActive = (order: Order) => order.status !== "completed" && order.status !== "cancelled";

export function todayRome() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function operationalQueues(orders: Order[], today: string) {
  const active = orders.filter(isActive);
  const newRequests = active.filter((order) => order.status === "requested");
  const unscheduled = active.filter((order) => order.status !== "requested" && (!order.production_date || !order.fulfillment_date));
  const overdue = active.filter((order) =>
    order.status === "requested" ? !!order.requested_date && order.requested_date < today :
    order.status === "ready" ? !!order.fulfillment_date && order.fulfillment_date < today :
    !!(order.production_date && order.production_date < today || order.fulfillment_date && order.fulfillment_date < today));
  const productionToday = active.filter((order) => order.production_date === today && ["confirmed", "preparing"].includes(order.status));
  const fulfillmentToday = active.filter((order) => order.fulfillment_date === today && order.status !== "requested");
  const ready = active.filter((order) => order.status === "ready");
  const attentionIds = new Set([...newRequests, ...unscheduled, ...overdue].map((order) => order.id));
  const attention = active.filter((order) => attentionIds.has(order.id)).sort((a, b) => {
    const priority = (order: Order) => overdue.some((item) => item.id === order.id) ? 0 : order.status === "requested" ? 1 : 2;
    return priority(a) - priority(b) || a.created_at.localeCompare(b.created_at);
  });
  const portionsToday = productionToday.reduce((sum, order) => sum + order.meals, 0);
  return { active, newRequests, unscheduled, overdue, productionToday, fulfillmentToday, ready, attention, portionsToday };
}

export function aggregateItems(orders: Order[], type: "dishes" | "extras") {
  const counts = new Map<string, number>();
  for (const order of orders) for (const item of order.items) {
    const names = type === "dishes" ? [item.name] : item.extras;
    for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "it"));
}
