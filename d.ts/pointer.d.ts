
interface Element {
    addEventListener(type: "gotpointercapture", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "lostpointercapture", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    setPointerCapture(pointerId: number): void;
    releasePointerCapture(pointerId: number): void;
}

interface HTMLElement {
    onpointerdown: (ev: PointerEvent) => any;
    onpointerup: (ev: PointerEvent) => any;
    onpointercancel: (ev: PointerEvent) => any;
    onpointermove: (ev: PointerEvent) => any;
    onpointerover: (ev: PointerEvent) => any;
    onpointerout: (ev: PointerEvent) => any;
    onpointerenter: (ev: PointerEvent) => any;
    onpointerleave: (ev: PointerEvent) => any;
    addEventListener(type: "pointerdown", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointerup", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointercancel", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointermove", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointerover", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointerout", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointerenter", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointerleave", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
}

interface Document {
    onpointerdown: (ev: PointerEvent) => any;
    onpointerup: (ev: PointerEvent) => any;
    onpointercancel: (ev: PointerEvent) => any;
    onpointermove: (ev: PointerEvent) => any;
    onpointerover: (ev: PointerEvent) => any;
    onpointerout: (ev: PointerEvent) => any;
    onpointerenter: (ev: PointerEvent) => any;
    onpointerleave: (ev: PointerEvent) => any;
    addEventListener(type: "pointerdown", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointerup", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointercancel", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointermove", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointerover", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointerout", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointerenter", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointerleave", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
}

interface Window {
    onpointerdown: (ev: PointerEvent) => any;
    onpointerup: (ev: PointerEvent) => any;
    onpointercancel: (ev: PointerEvent) => any;
    onpointermove: (ev: PointerEvent) => any;
    onpointerover: (ev: PointerEvent) => any;
    onpointerout: (ev: PointerEvent) => any;
    onpointerenter: (ev: PointerEvent) => any;
    onpointerleave: (ev: PointerEvent) => any;
    addEventListener(type: "pointerdown", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointerup", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointercancel", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointermove", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointerover", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointerout", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointerenter", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
    addEventListener(type: "pointerleave", listener: (ev: PointerEvent) => any, useCapture?: boolean): void;
}

declare var onpointerdown: (ev: PointerEvent) => any;
declare var onpointerup: (ev: PointerEvent) => any;
declare var onpointercancel: (ev: PointerEvent) => any;
declare var onpointermove: (ev: PointerEvent) => any;
declare var onpointerover: (ev: PointerEvent) => any;
declare var onpointerout: (ev: PointerEvent) => any;
declare var onpointerenter: (ev: PointerEvent) => any;
declare var onpointerleave: (ev: PointerEvent) => any;
declare function addEventListener(type: "pointerdown", listener: (ev: PointerEvent) => any, useCapture?: boolean): void ;
declare function addEventListener(type: "pointerup", listener: (ev: PointerEvent) => any, useCapture?: boolean): void ;
declare function addEventListener(type: "pointercancel", listener: (ev: PointerEvent) => any, useCapture?: boolean): void ;
declare function addEventListener(type: "pointermove", listener: (ev: PointerEvent) => any, useCapture?: boolean): void ;
declare function addEventListener(type: "pointerover", listener: (ev: PointerEvent) => any, useCapture?: boolean): void ;
declare function addEventListener(type: "pointerout", listener: (ev: PointerEvent) => any, useCapture?: boolean): void ;
declare function addEventListener(type: "pointerenter", listener: (ev: PointerEvent) => any, useCapture?: boolean): void ;
declare function addEventListener(type: "pointerleave", listener: (ev: PointerEvent) => any, useCapture?: boolean): void ;

interface GestureScaleEvent extends Event {
	centerX: number;
	centerY: number;
	scale: number;
}

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
