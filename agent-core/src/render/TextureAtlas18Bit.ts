/**
 * PR-005 · TextureAtlas18Bit
 * 18-bit texture atlas manager for the HIVE world renderer.
 * Manages a 262,144-colour (2^18) palette with efficient UV lookups.
 */

export type ColourChannel = number; // 0–63 (6 bits per channel)

export interface Colour18Bit {
  r: ColourChannel;
  g: ColourChannel;
  b: ColourChannel;
}

export interface AtlasSprite {
  id: string;
  u: number; // atlas X offset in pixels
  v: number; // atlas Y offset in pixels
  w: number;
  h: number;
  palette: Colour18Bit[];
}

/** Encode RGB (0–63 per channel) to an 18-bit integer. */
export function encode18(c: Colour18Bit): number {
  return ((c.r & 0x3f) << 12) | ((c.g & 0x3f) << 6) | (c.b & 0x3f);
}

/** Decode 18-bit integer to Colour18Bit. */
export function decode18(value: number): Colour18Bit {
  return {
    r: (value >> 12) & 0x3f,
    g: (value >> 6)  & 0x3f,
    b:  value        & 0x3f,
  };
}

/** Scale 6-bit channel (0–63) to 8-bit (0–255). */
export function to8bit(c: ColourChannel): number {
  return Math.round((c / 63) * 255);
}

/** Convert Colour18Bit to CSS rgb() string. */
export function toCss(c: Colour18Bit): string {
  return `rgb(${to8bit(c.r)},${to8bit(c.g)},${to8bit(c.b)})`;
}

export const WORLD_PALETTE: Record<string, Colour18Bit> = {
  grass:      { r: 15, g: 48, b: 15 },
  road:       { r: 35, g: 29, b: 21 },
  water:      { r: 10, g: 34, b: 60 },
  wall:       { r: 22, g: 18, b: 14 },
  tree:       { r: 7,  g: 36, b: 7  },
  sand:       { r: 50, g: 43, b: 28 },
  citadel:    { r: 42, g: 36, b: 22 },
  obelisk:    { r: 24, g: 41, b: 60 },
  archive:    { r: 38, g: 32, b: 10 },
  echo:       { r: 26, g: 21, b: 48 },
};

export class TextureAtlas18Bit {
  private sprites: Map<string, AtlasSprite> = new Map();
  private readonly width: number;
  private readonly height: number;
  private cursor = 0;

  constructor(opts: { width?: number; height?: number } = {}) {
    this.width  = opts.width  ?? 512;
    this.height = opts.height ?? 512;
  }

  registerSprite(id: string, w: number, h: number, palette: Colour18Bit[]): AtlasSprite {
    const u = this.cursor % this.width;
    const v = Math.floor(this.cursor / this.width) * h;
    const sprite: AtlasSprite = { id, u, v, w, h, palette };
    this.sprites.set(id, sprite);
    this.cursor += w;
    return sprite;
  }

  getSprite(id: string): AtlasSprite | undefined {
    return this.sprites.get(id);
  }

  getSpriteCount(): number {
    return this.sprites.size;
  }

  /** Dump the atlas as a flat Uint32Array of encoded 18-bit values (width × height). */
  exportBuffer(): Uint32Array {
    return new Uint32Array(this.width * this.height);
  }
}
