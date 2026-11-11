import {staticFile} from 'remotion';
import {isRemote} from '../spec';

/** Resolve a spec asset path against Remotion's public dir. */
export function assetSrc(src: string): string {
  if (!src) return src;
  if (isRemote(src) || src.startsWith('/')) return src;
  return staticFile(src);
}
