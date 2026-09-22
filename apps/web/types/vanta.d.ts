declare module "vanta/dist/vanta.halo.min" {
  interface VantaHaloOptions {
    el: HTMLElement | null;
    THREE?: unknown;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    baseColor?: number;
    backgroundColor?: number;
    amplitudeFactor?: number;
    size?: number;
    xOffset?: number;
    yOffset?: number;
  }
  interface VantaEffect {
    destroy: () => void;
  }
  export default function HALO(options: VantaHaloOptions): VantaEffect;
}
