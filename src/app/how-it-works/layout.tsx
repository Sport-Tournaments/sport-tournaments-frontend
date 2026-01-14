import MainLayout from '@/components/layout/MainLayout';

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
