import Image from "next/image";

type BrandLogoProps = Readonly<{
  className?: string;
  priority?: boolean;
  size?: "landing" | "reader";
}>;

export function BrandLogo({ className = "", priority = false, size = "reader" }: BrandLogoProps) {
  const dimension = size === "landing" ? 88 : 72;
  const imageClassName = `block rounded-sm object-contain ${className}`;

  return <>
    <Image
      src="/brand/rawi2.png"
      alt="Al-Rawi"
      width={dimension}
      height={dimension}
      priority={priority}
      className={`${imageClassName} dark:hidden`}
    />
    <Image
      src="/brand/rawi2-dark.png"
      alt=""
      aria-hidden="true"
      width={dimension}
      height={dimension}
      priority={priority}
      className={`${imageClassName} hidden dark:block`}
    />
  </>;
}
