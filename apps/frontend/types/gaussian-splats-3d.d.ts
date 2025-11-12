declare module "@mkkellogg/gaussian-splats-3d" {
  import type { Object3D } from "three";

  export interface DropInViewerOptions {
    gpuAcceleratedSort?: boolean;
    sharedMemoryForWorkers?: boolean;
    selfDrivenMode?: boolean;
  }

  export interface AddSplatSceneOptions {
    splatAlphaRemovalThreshold?: number;
    position?: [number, number, number];
    rotation?: [number, number, number, number];
    scale?: [number, number, number];
    showLoadingUI?: boolean;
  }

  export class DropInViewer extends Object3D {
    constructor(options?: DropInViewerOptions);
    addSplatScene(url: string, options?: AddSplatSceneOptions): Promise<void>;
    clearScenes(): void;
  }

  export interface ViewerOptions {
    selfDrivenMode?: boolean;
    sharedMemoryForWorkers?: boolean;
  }

  export class Viewer extends Object3D {
    constructor(options?: ViewerOptions);
    update(time?: number): void;
    render(): void;
    addSplatScene(url: string, options?: AddSplatSceneOptions): Promise<void>;
    clearScenes(): void;
  }
}
