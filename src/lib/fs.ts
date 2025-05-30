import { PathLike } from 'fs';
import { access } from 'fs/promises';

export async function exists(path: PathLike): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
