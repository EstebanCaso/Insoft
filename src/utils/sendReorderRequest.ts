export async function notifyReorder({
  providerPhone,
  productName,
  quantity
}: {
  providerPhone: string;
  productName: string;
  quantity: number;
}) {
  await fetch("https://estebancaso.app.n8n.cloud/webhook/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ providerPhone, productName, quantity })
  });
}
