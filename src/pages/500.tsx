import { Center, Title, Text, Button, Stack, Tooltip } from '@mantine/core';
import { IconArrowLeft, IconRefresh } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function FiveHundred() {
  const { asPath } = useRouter();

  return (
    <Center h='100vh'>
      <Tooltip label="Take a look at SkyCloud's logs and the browser console for more info">
        <Stack>
          <Title order={1}>500</Title>
          <Text c='dimmed' mt='-md'>
            Interval Server Error
          </Text>

          {asPath === '/dashboard' ? (
            <Button
              color='blue'
              fullWidth
              leftSection={<IconRefresh size='1rem' />}
              onClick={() => window.location.reload()}
            >
              Attempt refresh
            </Button>
          ) : (
            <Button
              component={Link}
              href='/'
              color='blue'
              fullWidth
              leftSection={<IconArrowLeft size='1rem' />}
            >
              Go home
            </Button>
          )}
        </Stack>
      </Tooltip>
    </Center>
  );
}

FiveHundred.title = 'Interval Server Error';
