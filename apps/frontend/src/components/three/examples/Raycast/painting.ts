export function hexToRgba(hex: string, a: number) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;
    const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  
  export function makePaintCanvas(size = 1024) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    // jasna baza „tynku”
    ctx.fillStyle = "#f1f3f5";
    ctx.fillRect(0, 0, size, size);
    return { canvas, ctx };
  }
  
  export function paintDot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    hex: string
  ) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hex);
    g.addColorStop(1, hexToRgba(hex, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  
  export function fillCanvas(ctx: CanvasRenderingContext2D, hex: string) {
    ctx.save();
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }