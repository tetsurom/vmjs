
interface PolymerGestures {
    addEventListener(capture: HTMLElement, en: "down", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(capture: HTMLElement, en: "up", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(capture: HTMLElement, en: "trackstart", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(capture: HTMLElement, en: "track", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(capture: HTMLElement, en: "trackend", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(capture: HTMLElement, en: "tap", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(capture: HTMLElement, en: "hold", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(capture: HTMLElement, en: "holdpulse", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(capture: HTMLElement, en: "release", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(capture: HTMLElement, en: any, re: Function, useCapture?: boolean): void;
}

declare var PolymerGestures: PolymerGestures;
