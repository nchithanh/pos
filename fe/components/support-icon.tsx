const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Icon Support (headset + chat) — Zalo founder. */
export function SupportIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <img
      src={`${basePath}/brand/support.png`}
      alt=""
      width={40}
      height={40}
      className={`shrink-0 object-contain ${className}`}
      aria-hidden
    />
  );
}
