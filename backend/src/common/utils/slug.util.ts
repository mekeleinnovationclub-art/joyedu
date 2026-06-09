import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';

export function generateSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true });
  const suffix = uuidv4().slice(0, 6);
  return `${base}-${suffix}`;
}
