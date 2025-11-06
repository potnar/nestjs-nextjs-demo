import * as THREE from "three";

/** Prosty height-field na CPU, spięty z PlaneGeometry. */
export class HeightField {
  private res: number;
  private size: number;
  private geom: THREE.PlaneGeometry;
  private pos: Float32Array;
  private heights: Float32Array;
  private vels: Float32Array;
  private normalEvery = 0;

  constructor(res: number, size: number, geom: THREE.PlaneGeometry) {
    this.res = res;
    this.size = size;
    this.geom = geom;

    const count = (res + 1) * (res + 1);
    this.heights = new Float32Array(count);
    this.vels = new Float32Array(count);
    this.pos = geom.attributes.position.array as Float32Array;
  }

  private idx(ix: number, iz: number) {
    return iz * (this.res + 1) + ix;
  }
  private worldPos(ix: number, iz: number) {
    const step = this.size / this.res;
    return { x: -this.size / 2 + ix * step, z: -this.size / 2 + iz * step };
  }

  brush(x: number, z: number, radius: number, strength: number, dir: number) {
    const step = this.size / this.res;
    const minX = Math.max(0, Math.floor((x - radius + this.size / 2) / step));
    const maxX = Math.min(this.res, Math.ceil((x + radius + this.size / 2) / step));
    const minZ = Math.max(0, Math.floor((z - radius + this.size / 2) / step));
    const maxZ = Math.min(this.res, Math.ceil((z + radius + this.size / 2) / step));

    for (let iz = minZ; iz <= maxZ; iz++) {
      for (let ix = minX; ix <= maxX; ix++) {
        const wp = this.worldPos(ix, iz);
        const dx = wp.x - x, dz = wp.z - z;
        const dist = Math.hypot(dx, dz);
        if (dist > radius) continue;
        const t = dist / radius;
        const falloff = 1 - t * t * (3 - 2 * t); // smoothstep(1->0)
        this.vels[this.idx(ix, iz)] += strength * dir * falloff;
      }
    }
  }

  step(dt: number, damping: number) {
    const TENSION = 0.02;
    for (let iz = 1; iz < this.res; iz++) {
      for (let ix = 1; ix < this.res; ix++) {
        const i = this.idx(ix, iz);
        const lap =
          this.heights[this.idx(ix - 1, iz)] +
          this.heights[this.idx(ix + 1, iz)] +
          this.heights[this.idx(ix, iz - 1)] +
          this.heights[this.idx(ix, iz + 1)] -
          4 * this.heights[i];
        this.vels[i] += lap * TENSION;
      }
    }
    for (let i = 0; i < this.heights.length; i++) {
      this.vels[i] *= damping;
      this.heights[i] += this.vels[i] * dt * 60;
    }
    for (let i = 0; i < this.pos.length; i += 3) {
      this.pos[i + 1] = this.heights[i / 3];
    }
    const g = this.geom as unknown as THREE.BufferGeometry;
    g.attributes.position.needsUpdate = true;
    if ((this.normalEvery = (this.normalEvery + 1) & 1) === 0) g.computeVertexNormals();
  }

  reset() {
    this.heights.fill(0);
    this.vels.fill(0);
    for (let i = 0; i < this.pos.length; i += 3) this.pos[i + 1] = 0;
    const g = this.geom as unknown as THREE.BufferGeometry;
    g.attributes.position.needsUpdate = true;
    g.computeVertexNormals();
  }
}
