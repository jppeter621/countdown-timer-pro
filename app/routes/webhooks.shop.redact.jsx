import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Shop has requested full data erasure (48 hours after uninstall).
  // Remove any remaining session data for this shop.
  await db.session.deleteMany({ where: { shop } });

  return new Response();
};