import Layout from '@/components/Layout';
import ViewFiles from '@/components/pages/users/ViewUserFiles';
import { prisma } from '@/lib/db';
import { User, userSelect } from '@/lib/db/models/user';
import useLogin from '@/lib/hooks/useLogin';
import { withSafeConfig } from '@/lib/middleware/next/withSafeConfig';
import { canInteract } from '@/lib/role';
import { getSession } from '@/server/session';
import { LoadingOverlay } from '@mantine/core';
import { InferGetServerSidePropsType } from 'next';
import Head from 'next/head';

export default function DashboardAdminUsersId({
  user,
  config,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { loading } = useLogin();
  if (loading) return <LoadingOverlay visible />;
  if (!user) return null;

  return (
    <>
      <Head>
        <title>{`${config.website.title ?? 'SkyCloud'} – ${user.username}'s files`}</title>
      </Head>
      <Layout config={config}>
        <ViewFiles user={user} />
      </Layout>
    </>
  );
}

export const getServerSideProps = withSafeConfig(async (ctx) => {
  const user = await prisma.user.findUnique({
    where: {
      id: ctx.query.id as string,
    },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  if (!user)
    return {
      notFound: true,
    };

  const session = await getSession(ctx.req, ctx.res);
  if (!session.id || !session.sessionId)
    return {
      notFound: true,
    };

  const currentUser = await prisma.user.findFirst({
    where: {
      sessions: {
        has: session.sessionId,
      },
    },
    select: userSelect,
  });

  if (!currentUser)
    return {
      notFound: true,
    };

  if (!canInteract(currentUser.role, user?.role))
    return {
      notFound: true,
    };

  return {
    user: user as User,
  };
});
