import MainLayout from '@/components/layout/MainLayout';

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
