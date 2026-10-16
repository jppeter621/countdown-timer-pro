/* global process */
import { useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

// Default is real charges. Set BILLING_IS_TEST=true in Vercel only while testing or during review.
const isTestBilling = () => process.env.BILLING_IS_TEST === "true";

export const loader = async ({ request }) => {
  const { billing, session } = await authenticate.admin(request);

  const billingCheck = await billing.check({
    plans: ["monthlyPlan"],
    isTest: isTestBilling(),
  });

  return {
    hasActivePayment: billingCheck.hasActivePayment,
    shop: session.shop,
    apiKey: process.env.SHOPIFY_API_KEY || "",
  };
};

export const action = async ({ request }) => {
  const { billing } = await authenticate.admin(request);

  try {
    return await billing.request({
      plan: "monthlyPlan",
      isTest: isTestBilling(),
      trialDays: 3,
    });
  } catch (error) {
    console.error("BILLING ERROR:", JSON.stringify(error, null, 2));
    throw error;
  }
};

export default function Index() {
  const { hasActivePayment, shop, apiKey } = useLoaderData();
  const fetcher = useFetcher();
  const isLoading = fetcher.state !== "idle";

  const subscribe = () => fetcher.submit({}, { method: "POST" });

  useEffect(() => {
    if (fetcher.data?.confirmationUrl) {
      open(fetcher.data.confirmationUrl, "_top");
    }
  }, [fetcher.data]);

  const themeEditorUrl = `https://${shop}/admin/themes/current/editor?context=apps&activateAppId=${apiKey}/countdown-timer`;

  if (!hasActivePayment) {
    return (
      <s-page heading="Countdown Sale Timer">
        <s-section heading="Subscribe to activate your countdown bar">
          <s-paragraph>
            Start your 3-day free trial for $4.99/month. Add an animated
            countdown timer to your storefront in minutes - no coding
            required.
          </s-paragraph>
          <s-button
            variant="primary"
            onClick={subscribe}
            {...(isLoading ? { loading: true } : {})}
          >
            Start free trial
          </s-button>
        </s-section>
      </s-page>
    );
  }

  return (
    <s-page heading="Countdown Sale Timer">
      <s-section heading="You're all set!">
        <s-paragraph>
          Your subscription is active. To show the countdown bar at the top of
          your storefront:
        </s-paragraph>
        <s-unordered-list>
          <s-list-item>
            Click the button below to open the theme editor with App embeds
          </s-list-item>
          <s-list-item>Turn on the Countdown Sale Timer toggle</s-list-item>
          <s-list-item>
            Set your message, end date and colors, then click Save
          </s-list-item>
        </s-unordered-list>
        <s-button variant="primary" href={themeEditorUrl} target="_blank">
          Open theme editor
        </s-button>
      </s-section>

      <s-section heading="Need help?">
        <s-paragraph>
          If the bar does not appear after you save, go to Online Store -
          Themes - Customize, click the App embeds icon on the left, and make
          sure Countdown Sale Timer is switched on.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};