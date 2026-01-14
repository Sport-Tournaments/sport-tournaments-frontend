import MainLayout from '@/components/layout/MainLayout';

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
