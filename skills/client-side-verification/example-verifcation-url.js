const baseUrl = "https://app.getvouch.io/prove";
const url = new URL(baseUrl);
const redirectBackUrl =
  "https://your-website.com/user/your-user-id/success";
const webhookUrl =
  "https://your-website.com/api/webhooks/your-webhook-id";

url.searchParams.set("requestId", requestId); // uuid linked to user / verification on your end
url.searchParams.set("customerId", ""); // your customer ID
url.searchParams.set("datasourceId", ""); // your datasource ID
url.searchParams.set("redirectBackUrl", redirectBackUrl);
url.searchParams.set("webhookUrl", webhookUrl);

const verificationUrl = url.toString();