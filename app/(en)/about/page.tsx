import About from "@/views/About";
import { staticMetadata } from "@/lib/seo";

export const generateMetadata = () => staticMetadata("about", "en");

export default function Page() {
  return <About lang="en" />;
}
