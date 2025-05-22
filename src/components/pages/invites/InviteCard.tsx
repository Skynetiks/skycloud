import RelativeDate from '@/components/RelativeDate';
import { Invite } from '@/lib/db/models/invite';
import { ActionIcon, Anchor, Card, Group, Menu, Stack, Text } from '@mantine/core';
import { IconCopy, IconDots, IconTrashFilled } from '@tabler/icons-react';
import { copyInviteUrl, deleteInvite } from './actions';
import { useClipboard } from '@mantine/hooks';
import { useSettingsStore } from '@/lib/store/settings';

export default function InviteCard({ invite }: { invite: Invite }) {
  const clipboard = useClipboard();

  const warnDeletion = useSettingsStore((state) => state.settings.warnDeletion);

  return (
    <>
      <Card withBorder shadow='sm' radius='sm'>
        <Card.Section withBorder inheritPadding py='xs'>
          <Group justify='space-between'>
            <Anchor href={`/invite/${invite.code}`} target='_blank' fw={400}>
              {invite.code}
            </Anchor>

            <Menu withinPortal position='bottom-end' shadow='sm'>
              <Group gap={2}>
                <Menu.Target>
                  <ActionIcon variant='transparent'>
                    <IconDots size='1rem' />
                  </ActionIcon>
                </Menu.Target>
              </Group>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconCopy size='1rem' />}
                  onClick={() => copyInviteUrl(invite, clipboard)}
                >
                  Copy URL
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconTrashFilled size='1rem' />}
                  color='red'
                  onClick={() => deleteInvite(warnDeletion, invite)}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Card.Section>

        <Card.Section inheritPadding py='xs'>
          <Stack gap={1}>
            <Text size='xs' c='dimmed'>
              <b>Created By:</b> {invite.inviter!.username}
            </Text>
            <Text size='xs' c='dimmed'>
              <b>Created:</b> <RelativeDate date={invite.createdAt} />
            </Text>
            {invite.expiresAt && (
              <Text size='xs' c='dimmed'>
                <b>Expires:</b> <RelativeDate date={invite.expiresAt} />
              </Text>
            )}
            <Text size='xs' c='dimmed'>
              <b>Max Uses:</b> {invite.maxUses ?? 'Unlimited'}
            </Text>
            <Text size='xs' c='dimmed'>
              <b>Uses:</b> {invite.uses.toLocaleString()}
            </Text>
          </Stack>
        </Card.Section>
      </Card>
    </>
  );
}
