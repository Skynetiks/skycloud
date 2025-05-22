import { getSkyCloud } from '@/lib/db/models/skycloud';
import { GetServerSideProps } from 'next';
import Head from 'next/head';

export default function Index() {
  return (
    <>
      <Head>
        <title>SkyCloud</title>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
      </Head>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { firstSetup } = await getSkyCloud();

  if (firstSetup) {
    return {
      redirect: {
        destination: '/setup',
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: '/dashboard',
      permanent: false,
    },
  };
};
