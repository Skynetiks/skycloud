import { prisma } from '..';

export async function getSkyCloud() {
  const skycloud = await prisma.skyCloud.findFirst();
  if (!skycloud) {
    return prisma.skyCloud.create({
      data: {
        coreTempDirectory: '/tmp/skycloud',
      },
    });
  }

  return skycloud;
}
