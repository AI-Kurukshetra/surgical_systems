import { AuthConfirmClient } from "./auth-confirm-client";

/**
 * Auth callback page for email links (e.g. password reset).
 * Renders client component so we can read URL hash (tokens are not sent to the server).
 */
export default function AuthConfirmPage() {
  return <AuthConfirmClient />;
}
