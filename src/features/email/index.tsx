// H1 email and notifications (Hamzat): start.ng/emails (choose your emails; where confirm and unsubscribe links land),
// the admin tab "Email", and the email section on your own profile. Sending runs on the API (app/features/email).
import { lazy, Suspense } from "react";
import { registerAdminTab, registerPage, registerProfileSection, type AdminTabProps, type ProfileSectionProps } from "../registry";

const EmailTab = lazy(() => import("./EmailTab"));
const EmailPrefs = lazy(() => import("./EmailPrefs"));

registerPage({ feature: "email", path: "/emails", shell: "app", load: () => import("./EmailsPage") });

registerAdminTab({
  feature: "email",
  key: "email",
  label: "Email",
  order: 40,
  permission: "email.view",
  Component: (props: AdminTabProps) => (
    <Suspense fallback={null}>
      <EmailTab {...props} />
    </Suspense>
  ),
});

registerProfileSection({
  feature: "email",
  key: "email",
  title: "Emails",
  Component: ({ isMe }: ProfileSectionProps) => (isMe ? <Suspense fallback={null}><EmailPrefs /></Suspense> : null),
});
