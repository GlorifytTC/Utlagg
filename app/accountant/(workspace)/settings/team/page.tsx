import { metaTitle } from "@/lib/i18n-server";
import { AccountantTeam } from "@/components/accountant/AccountantTeam";

export const generateMetadata = metaTitle("Team", "Team");
export const dynamic = "force-dynamic";

export default function AccountantTeamPage() {
  return <AccountantTeam />;
}
