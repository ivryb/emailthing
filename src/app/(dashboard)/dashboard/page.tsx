import { siteConfig } from "@/config/site";
import { Icons } from "@/components/ui/icons";
import { getServerAuthSession } from "@/server/auth";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
  PageActions,
} from "@/components/nav/page-header";

export default async function Dashboard() {
  const session = await getServerAuthSession();

  if (session) {
    console.log(session);
  }

  return (
    <>
      <PageHeader>
        <Icons.logo className="h-16 w-16" />
        <PageHeaderHeading>{siteConfig.name}</PageHeaderHeading>
        <PageHeaderDescription>{siteConfig.description}</PageHeaderDescription>
        <PageActions>
          Hi, {session?.user?.name}!{" "}
          </PageActions>
      </PageHeader>
    </>
  );
}
