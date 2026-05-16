/**
 * PR-005 · Renderer18Bit
 * Tile-based 18-bit renderer for the HIVE world.
 * Manages a 2D tile grid with palette-mapped colours and viewport culling.
 */
import { TextureAtlas18Bit, WORLD_PALETTE, toCss, Colour18Bit } from './TextureAtlas18Bit';

export interface RenderTile {
  type: string;
  colour: Colour18Bit;
}

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RenderFrame {
  tiles: RenderTile[][];
  viewport: Viewport;
  dayPhase: number; // 0–1 (0=midnight, 0.5=noon)
  fogIntensity: number; // 0–1
  frameNumber: number;
}

export class Renderer18Bit {
  private readonly atlas: TextureAtlas18Bit;
  private readonly tileSize: number;
  private frameNumber = 0;

  constructor(atlas: TextureAtlas18Bit, opts: { tileSize?: number } = {}) {
    this.atlas = atlas;
    this.tileSize = opts.tileSize ?? 16;
  }

  buildFrame(params: {
    worldTiles: string[][];
    viewport: Viewport;
    dayPhase?: number;
    fogIntensity?: number;
  }): RenderFrame {
    const { worldTiles, viewport } = params;
    const dayPhase = params.dayPhase ?? 0.5;
    const fogIntensity = params.fogIntensity ?? 0;

    const startRow = Math.floor(viewport.y / this.tileSize);
    const endRow   = Math.ceil((viewport.y + viewport.height) / this.tileSize);
    const startCol = Math.floor(viewport.x / this.tileSize);
    const endCol   = Math.ceil((viewport.x + viewport.width) / this.tileSize);

    const tiles: RenderTile[][] = [];
    for (let row = startRow; row < endRow; row++) {
      const tileRow: RenderTile[] = [];
      for (let col = startCol; col < endCol; col++) {
        const type = worldTiles[row]?.[col] ?? 'grass';
        const base = WORLD_PALETTE[type] ?? WORLD_PALETTE['grass']!;
        const colour = this.applyDayNight(base, dayPhase);
        tileRow.push({ type, colour });
      }
      tiles.push(tileRow);
    }

    return {
      tiles,
      viewport,
      dayPhase,
      fogIntensity,
      frameNumber: ++this.frameNumber,
    };
  }

  private applyDayNight(colour: Colour18Bit, dayPhase: number): Colour18Bit {
    // Night = dark (dayPhase ~0 or ~1), noon = bright (dayPhase ~0.5)
    const brightness = Math.sin(dayPhase * Math.PI);
    const scale = 0.4 + brightness * 0.6;
    return {
      r: Math.max(0, Math.round(colour.r * scale)) as Colour18Bit['r'],
      g: Math.max(0, Math.round(colour.g * scale)) as Colour18Bit['g'],
      b: Math.max(0, Math.round(colour.b * scale)) as Colour18Bit['b'],
    };
  }

  tileToCss(type: string, dayPhase = 0.5): string {
    const base = WORLD_PALETTE[type] ?? WORLD_PALETTE['grass']!;
    return toCss(this.applyDayNight(base, dayPhase));
  }

  getAtlas(): TextureAtlas18Bit {
    return this.atlas;
  }
}
