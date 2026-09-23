export default function LandingPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto max-w-[1600px] px-8 py-8">{children}</div>;
}
