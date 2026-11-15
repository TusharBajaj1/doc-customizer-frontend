import Request from "@/views/Request";
import { staticMetadata } from "@/lib/seo";

export const generateMetadata = () => staticMetadata("request", "en");

export default function Page() {
  return <Request lang="en" />;
}
