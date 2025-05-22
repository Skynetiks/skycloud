import { Pill, isLightColor } from '@mantine/core';

export default function TagPill({
  tag,
  ...other
}: {
  tag: { color: string; name: string } | null;
  withRemoveButton?: boolean;
  onRemove?: () => void;
}) {
  if (!tag) return null;

  return (
    <Pill bg={tag.color || undefined} c={isLightColor(tag.color) ? 'black' : 'white'} {...other}>
      {tag.name}
    </Pill>
  );
}
