import { useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing } = await authenticate.admin(request);

  const billingCheck = await billing.check({
    plans: ["monthlyPlan"],
    isTest: false,
  });

  return { hasActivePayment: billingCheck.hasActivePayment };
};

export const action = async ({ request }) => {
  const { billing } = await authenticate.admin(request);

  try {
    return await billing.request({
      plan: "monthlyPlan",
      isTest: false,
      trialDays: 3,
    });
  } catch (error) {
    console.error("🔴 BILLING ERROR:", JSON.stringify(error, null, 2));
    throw error;
  }
};

export default function Index() {
  const { hasActivePayment } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isLoading = fetcher.state !== "idle";

  const subscribe = () => fetcher.submit({}, { method: "POST" });

  useEffect(() => {
    if (fetcher.data?.confirmationUrl) {
      open(fetcher.data.confirmationUrl, "_top");
    }
  }, [fetcher.data]);

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
          Your subscription is active. To show the countdown bar on your
          storefront:
        </s-paragraph>
        <s-unordered-list>
          <s-list-item>Go to Online Store - Themes - Customize</s-list-item>
          <s-list-item>
            Click Add section and choose Countdown Sale Timer
          </s-list-item>
          <s-list-item>
            Set your end date and message, then click Save
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};