/**
 * Interaction registry. World objects register an interactable; the InteractionSystem finds the
 * closest one, shows a friendly prompt and walks Anett over when the player presses E / taps.
 */
export interface Interactable {
  id: string;
  x: number;
  z: number;
  /** distance within which the prompt is shown */
  radius: number;
  /** Anett walks until she is this close before interacting */
  approach: number;
  label: () => string;
  /** label for the touch action button */
  verb?: 'talk' | 'take' | 'open';
  enabled: () => boolean;
  onInteract: () => void;
}

export const interactables = new Map<string, Interactable>();

export function registerInteractable(i: Interactable) {
  interactables.set(i.id, i);
  return () => {
    interactables.delete(i.id);
  };
}
