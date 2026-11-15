import Privacy from "@/views/Privacy";
import { staticMetadata } from "@/lib/seo";

export const generateMetadata = () => staticMetadata("privacy", "en");

export default function Page() {
  return <Privacy lang="en" />;
}
