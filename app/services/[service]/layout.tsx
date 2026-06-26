import { Metadata } from "next";
import { SERVICES_LIST } from "@/lib/services";

interface Props {
  params: Promise<{ service: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const unwrapped = await params;
  const service = SERVICES_LIST.find((s) => s.id === unwrapped.service);
  const title = service ? `${service.name} Services - ServeGo` : "ServeGo Services";
  const description = service 
    ? `Book professional ${service.name.toLowerCase()} services in your local area. Verified ratings, assurance guarantees, and zero middleman commissions.` 
    : "Book professional local services.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://servego.vercel.app/services/${unwrapped.service}`,
      siteName: "ServeGo",
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
