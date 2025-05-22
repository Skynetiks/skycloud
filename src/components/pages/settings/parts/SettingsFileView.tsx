import { Response } from '@/lib/api/response';
import { fetchApi } from '@/lib/fetchApi';
import { useUserStore } from '@/lib/store/user';
import {
  Button,
  ColorInput,
  Divider,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconAlignCenter,
  IconAlignLeft,
  IconAlignRight,
  IconCheck,
  IconDeviceFloppy,
  IconFileX,
} from '@tabler/icons-react';
import { mutate } from 'swr';
import { useShallow } from 'zustand/shallow';

const alignIcons: Record<string, React.ReactNode> = {
  left: <IconAlignLeft size='1rem' />,
  center: <IconAlignCenter size='1rem' />,
  right: <IconAlignRight size='1rem' />,
};

export default function SettingsFileView() {
  const [user, setUser] = useUserStore(useShallow((state) => [state.user, state.setUser]));

  const form = useForm({
    initialValues: {
      enabled: user?.view.enabled ?? false,
      content: user?.view.content ?? '',
      embed: user?.view.embed ?? false,
      embedTitle: user?.view.embedTitle ?? '',
      embedDescription: user?.view.embedDescription ?? '',
      embedSiteName: user?.view.embedSiteName ?? '',
      embedColor: user?.view.embedColor ?? '',
      align: user?.view.align ?? 'left',
      showMimetype: user?.view.showMimetype ?? false,
      showTags: user?.view.showTags ?? false,
      showFolder: user?.view.showFolder ?? false,
    },
  });

  const onSubmit = async (values: typeof form.values) => {
    const valuesTrimmed = {
      enabled: values.enabled,
      embed: values.embed,
      content: values.content.trim() || null,
      embedTitle: values.embedTitle.trim() || null,
      embedDescription: values.embedDescription.trim() || null,
      embedSiteName: values.embedSiteName.trim() || null,
      embedColor: values.embedColor.trim() || null,
      align: values.align,
      showMimetype: values.showMimetype,
      showTags: values.showTags,
      showFolder: values.showFolder,
    };

    const { data, error } = await fetchApi<Response['/api/user']>('/api/user', 'PATCH', {
      view: valuesTrimmed,
    });

    if (!data && error) {
      notifications.show({
        title: 'Error while updating view settings',
        message: error.error,
        color: 'red',
        icon: <IconFileX size='1rem' />,
      });
    }

    if (!data?.user) return;

    mutate('/api/user');
    setUser(data.user);
    notifications.show({
      message: 'View settings updated',
      color: 'green',
      icon: <IconCheck size='1rem' />,
    });
  };

  return (
    <Paper withBorder p='sm'>
      <Title order={2}>Viewing Files</Title>
      <Text c='dimmed' mt='xs'>
        All text fields support using variables.
      </Text>
      <Stack gap='sm' mt='xs'>
        <form onSubmit={form.onSubmit(onSubmit)}>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing='sm' mb='xs'>
            <Switch
              label='Enable View Routes'
              description='Enable viewing files through customizable view-routes'
              {...form.getInputProps('enabled', { type: 'checkbox' })}
            />

            <Switch
              label='Show mimetype'
              description='Show the mimetype of the file in the view-route'
              disabled={!form.values.enabled}
              {...form.getInputProps('showMimetype', { type: 'checkbox' })}
            />

            <Switch
              label='Show tags'
              description="Show the file's tags in the view-route"
              disabled={!form.values.enabled}
              {...form.getInputProps('showTags', { type: 'checkbox' })}
            />

            <Switch
              label='Show folder'
              description='Show the name/link of the folder if possible in the view-route'
              disabled={!form.values.enabled}
              {...form.getInputProps('showFolder', { type: 'checkbox' })}
            />
          </SimpleGrid>

          <Textarea
            label='View Content'
            description='Change the content within view-routes. Most HTML is valid, while the use of JavaScript is unavailable.'
            disabled={!form.values.enabled}
            mb='xs'
            minRows={5}
            autosize
            {...form.getInputProps('content')}
          />

          <Select
            label='View Content Alignment'
            description='Change the alignment of the content within view-routes'
            data={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
            renderOption={({ option }) => (
              <Group gap='xs'>
                {alignIcons[option.value]}
                {option.label}
              </Group>
            )}
            disabled={!form.values.enabled}
            {...form.getInputProps('align')}
          />

          <Divider my='sm' />

          <Switch
            label='Enable Embed'
            description='Enable the following embed properties. These properties take advantage of OpenGraph tags. View routes will need to be enabled for this to work.'
            disabled={!form.values.enabled}
            my='xs'
            {...form.getInputProps('embed', { type: 'checkbox' })}
          />

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing='sm'>
            <TextInput
              label='Embed Title'
              disabled={!form.values.embed || !form.values.enabled}
              {...form.getInputProps('embedTitle')}
            />
            <TextInput
              label='Embed Description'
              disabled={!form.values.embed || !form.values.enabled}
              {...form.getInputProps('embedDescription')}
            />
            <TextInput
              label='Embed Site Name'
              disabled={!form.values.embed || !form.values.enabled}
              {...form.getInputProps('embedSiteName')}
            />
            <ColorInput
              label='Embed Color'
              disabled={!form.values.embed || !form.values.enabled}
              {...form.getInputProps('embedColor')}
            />
          </SimpleGrid>

          <Group justify='left' mt='sm'>
            <Button type='submit' leftSection={<IconDeviceFloppy size='1rem' />}>
              Save
            </Button>
          </Group>
        </form>
      </Stack>
    </Paper>
  );
}
