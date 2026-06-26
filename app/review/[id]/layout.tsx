import { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const unwrapped = await params;
  const title = `Submit Review for Booking #${unwrapped.id.slice(0, 8)} - ServeGo`;
  const description = "Share your feedback for your recent ServeGo service completion. Help us maintain the highest service quality standards.";

  return {
    title,
    description,
    robots: "noindex, nofollow", // Do not index specific review submit pages for customer privacy
    openGraph: {
      title,
      description,
      url: `https://servego.shop/review/${unwrapped.id}`,
      siteName: "ServeGo",
      locale: "en_IN",
      type: "website",
    },
  };
}

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
