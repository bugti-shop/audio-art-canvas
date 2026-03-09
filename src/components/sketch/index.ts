// Barrel export for sketch editor modules
export * from './SketchTypes';
export { drawStroke, drawBackground, drawSelectionBox, drawArrowhead, createShapeFillStyle } from './SketchDrawing';
export { recognizeShape, convertToCleanShape } from './SketchRecognition';
export type { RecognizedShapeData, ShapeRecognitionResult } from './SketchRecognition';
export { WASHI_PATTERNS, washiPatternCache, drawTornEdge, drawWashiTape } from './SketchWashiTape';
export type { WashiTapePattern } from './SketchWashiTape';
