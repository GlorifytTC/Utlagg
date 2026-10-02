import { AccountantSettingsLayout } from "@/components/settings/AccountantSettingsLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AccountantSettingsLayout>{children}</AccountantSettingsLayout>;
}
