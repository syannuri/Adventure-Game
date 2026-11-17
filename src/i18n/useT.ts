import { useGame } from '../systems/store';
import { DICTS } from './index';

/** Current language dictionary; components re-render when the player switches language. */
export function useT() {
  const lang = useGame((s) => s.save.settings.language);
  return DICTS[lang] ?? DICTS.id;
}
