import Layout from '@/components/Layout';
import DashboardSettings from '@/components/pages/settings';
import useLogin from '@/lib/hooks/useLogin';
import { withSafeConfig } from '@/lib/middleware/next/withSafeConfig';
import { LoadingOverlay } from '@mantine/core';
import { InferGetServerSidePropsType } from 'next';

export default function DashboardUserSettings({
  config,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { loading } = useLogin();
  if (loading) return <LoadingOverlay visible />;

  return (
    <Layout config={config}>
      <DashboardSettings />
    </Layout>
  );
}

export const getServerSideProps = withSafeConfig();

DashboardUserSettings.title = 'Settings';
