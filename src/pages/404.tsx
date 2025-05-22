import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

export default function FourOhFour() {
  return (
    <Center h='100vh'>
      <Stack>
        <Title order={1}>404</Title>
        <Text c='dimmed' mt='-md'>
          Page not found
        </Text>

        <Button component={Link} href='/' color='blue' fullWidth leftSection={<IconArrowLeft size='1rem' />}>
          Go home
        </Button>
      </Stack>
    </Center>
  );
}

FourOhFour.title = '404';
