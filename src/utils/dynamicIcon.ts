import { Capacitor, registerPlugin } from '@capacitor/core';

interface DynamicIconPlugin {
  setIcon(options: { name: 'default' | 'sad' | 'angry' }): Promise<void>;
  getIcon(): Promise<{ name: string }>;
}

const DynamicIcon = registerPlugin<DynamicIconPlugin>('DynamicIcon');

export type IconVariant = 'default' | 'sad' | 'angry';

/**
 * Change the Android launcher icon.
 * Falls back silently on web/iOS.
 */
export const setLauncherIcon = async (variant: IconVariant): Promise<void> => {
  if (Capacitor.getPlatform() !== 'android') return;

  try {
    await DynamicIcon.setIcon({ name: variant });
    console.log(`[DynamicIcon] Launcher icon set to: ${variant}`);
  } catch (e) {
    console.warn('[DynamicIcon] Failed to set icon:', e);
  }
};

/**
 * Get the current launcher icon variant.
 */
export const getLauncherIcon = async (): Promise<IconVariant> => {
  if (Capacitor.getPlatform() !== 'android') return 'default';

  try {
    const result = await DynamicIcon.getIcon();
    return (result.name as IconVariant) || 'default';
  } catch {
    return 'default';
  }
};
