import React from "react";
import * as LucideIcons from "lucide-react";

interface ServiceIconProps {
  name: string;
  className?: string;
}

export default function ServiceIcon({ name, className }: ServiceIconProps) {
  // Safe lookup for the icon component in Lucide
  const IconComponent = (LucideIcons as any)[name];

  if (!IconComponent) {
    return <LucideIcons.Sparkles className={className} />;
  }

  return <IconComponent className={className} />;
}
export { LucideIcons };
