import Image from "next/image";

/** DEA logotip. "light" = bijeli znak za tamnu podlogu, "dark" = tamni znak za svijetlu. */
export function Logo({ variant = "light", className = "", priority = false }: { variant?: "light" | "dark"; className?: string; priority?: boolean }) {
  return (
    <Image
      src={variant === "light" ? "/brand/dea-logo-light.png" : "/brand/dea-logo-dark.png"}
      alt="Auto Centar DEA"
      width={1086}
      height={492}
      priority={priority}
      className={`h-auto ${className}`}
      sizes="160px"
    />
  );
}
