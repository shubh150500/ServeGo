import { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const unwrapped = await params;
  const title = `Track Booking #${unwrapped.id.slice(0, 8)} - ServeGo`;
  const description = "Track your ServeGo local service booking in real-time. Check worker assignment, dispatch status, and job completion.";

  return {
    title,
    description,
    robots: "noindex, nofollow", // Do not index specific tracking pages for customer privacy
    openGraph: {
      title,
      description,
      url: `https://servego.vercel.app/track/${unwrapped.id}`,
      siteName: "ServeGo",
      locale: "en_IN",
      type: "website",
    },
  };
}

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
