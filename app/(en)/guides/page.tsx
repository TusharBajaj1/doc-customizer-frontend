import GuidesIndex from "@/views/GuidesIndex";
import { staticMetadata } from "@/lib/seo";

export const generateMetadata = () => staticMetadata("guides", "en");

export default function Page() {
  return <GuidesIndex lang="en" />;
}
