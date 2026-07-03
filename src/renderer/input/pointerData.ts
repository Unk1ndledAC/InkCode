// InkCode Pointer Event — inspired by Krita's KoPointerEvent
// Unifies mouse, tablet (pen), and touch input with pressure/tilt/rotation data

export interface PointerData {
  // Position
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;

  // Pressure (0.0 ~ 1.0, mouse defaults to 1.0)
  pressure: number;

  // Tilt (-60 to +60 degrees, mapped to 0.0~1.0)
  tiltX: number;
  tiltY: number;

  // Pen rotation (degrees)
  rotation: number;

  // Tangential pressure (airbrush wheel, -1.0 ~ 1.0)
  tangentialPressure: number;

  // Source type
  pointerType: 'mouse' | 'pen' | 'touch' | 'unknown';

  // Button state
  buttons: number;

  // Timestamp
  timestamp: number;

  // Whether this came from a tablet device
  isTabletEvent: boolean;

  // Unique pointer ID
  pointerId: number;
}

export function pointerEventToData(e: PointerEvent): PointerData {
  return {
    x: e.clientX,
    y: e.clientY,
    offsetX: e.offsetX,
    offsetY: e.offsetY,
    pressure: e.pressure > 0 ? e.pressure : 1.0, // mouse default
    tiltX: e.tiltX ?? 0,
    tiltY: e.tiltY ?? 0,
    rotation: (e as any).twist ?? 0, // twist = rotation
    tangentialPressure: 0, // not available in web PointerEvent
    pointerType: e.pointerType as PointerData['pointerType'] || 'unknown',
    buttons: e.buttons,
    timestamp: e.timeStamp,
    isTabletEvent: e.pointerType === 'pen',
    pointerId: e.pointerId
  };
}

export function mouseEventToData(e: MouseEvent): PointerData {
  return {
    x: e.clientX,
    y: e.clientY,
    offsetX: e.offsetX,
    offsetY: e.offsetY,
    pressure: 1.0,
    tiltX: 0,
    tiltY: 0,
    rotation: 0,
    tangentialPressure: 0,
    pointerType: 'mouse',
    buttons: e.buttons,
    timestamp: e.timeStamp,
    isTabletEvent: false,
    pointerId: -1
  };
}
