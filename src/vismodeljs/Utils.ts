
// Filesaver.js
declare function saveAs(data: Blob, filename: String): void;

module VisModelJS {
    export module Utils {

        export function saveStringAs(content: string, fileName: string): void {
            var blob = new Blob([content], { type: 'text/plain; charset=UTF-8' });
            saveAs(blob, fileName);
        }

        export function getNodeLabelFromEvent(event: Event): string {
            var element = <HTMLElement>event.target || <HTMLElement>event.srcElement;
            while (element != null) {
                var label = element.getAttribute("data-nodelabel");
                if (label != null && label != "") {
                    return label;
                }
                element = element.parentElement;
            }
            return "";
        }

        export function getPositionById(Label: string): Point {
            var element = document.getElementById(Label);
            var view = element.getBoundingClientRect();
            return new Point(view.left, view.top);
        }

        export function createSVGElement(name: "a"): SVGAElement;
        export function createSVGElement(name: "circle"): SVGCircleElement;
        export function createSVGElement(name: "clippath"): SVGClipPathElement;
        export function createSVGElement(name: "componenttransferfunction"): SVGComponentTransferFunctionElement;
        export function createSVGElement(name: "defs"): SVGDefsElement;
        export function createSVGElement(name: "desc"): SVGDescElement;
        export function createSVGElement(name: "ellipse"): SVGEllipseElement;
        export function createSVGElement(name: "feblend"): SVGFEBlendElement;
        export function createSVGElement(name: "fecolormatrix"): SVGFEColorMatrixElement;
        export function createSVGElement(name: "fecomponenttransfer"): SVGFEComponentTransferElement;
        export function createSVGElement(name: "fecomposite"): SVGFECompositeElement;
        export function createSVGElement(name: "feconvolvematrix"): SVGFEConvolveMatrixElement;
        export function createSVGElement(name: "fediffuselighting"): SVGFEDiffuseLightingElement;
        export function createSVGElement(name: "fedisplacementmap"): SVGFEDisplacementMapElement;
        export function createSVGElement(name: "fedistantlight"): SVGFEDistantLightElement;
        export function createSVGElement(name: "feflood"): SVGFEFloodElement;
        export function createSVGElement(name: "fegaussianblur"): SVGFEGaussianBlurElement;
        export function createSVGElement(name: "feimage"): SVGFEImageElement;
        export function createSVGElement(name: "femerge"): SVGFEMergeElement;
        export function createSVGElement(name: "femergenode"): SVGFEMergeNodeElement;
        export function createSVGElement(name: "femorphology"): SVGFEMorphologyElement;
        export function createSVGElement(name: "feoffset"): SVGFEOffsetElement;
        export function createSVGElement(name: "fepointlight"): SVGFEPointLightElement;
        export function createSVGElement(name: "fespecularlighting"): SVGFESpecularLightingElement;
        export function createSVGElement(name: "fespotlight"): SVGFESpotLightElement;
        export function createSVGElement(name: "fetile"): SVGFETileElement;
        export function createSVGElement(name: "feturbulence"): SVGFETurbulenceElement;
        export function createSVGElement(name: "filter"): SVGFilterElement;
        export function createSVGElement(name: "g"): SVGGElement;
        export function createSVGElement(name: "gradient"): SVGGradientElement;
        export function createSVGElement(name: "image"): SVGImageElement;
        export function createSVGElement(name: "line"): SVGLineElement;
        export function createSVGElement(name: "marker"): SVGMarkerElement;
        export function createSVGElement(name: "mask"): SVGMaskElement;
        export function createSVGElement(name: "metadata"): SVGMetadataElement;
        export function createSVGElement(name: "path"): SVGPathElement;
        export function createSVGElement(name: "pattern"): SVGPatternElement;
        export function createSVGElement(name: "polygon"): SVGPolygonElement;
        export function createSVGElement(name: "polyline"): SVGPolylineElement;
        export function createSVGElement(name: "rect"): SVGRectElement;
        export function createSVGElement(name: "script"): SVGScriptElement;
        export function createSVGElement(name: "stop"): SVGStopElement;
        export function createSVGElement(name: "style"): SVGStyleElement;
        export function createSVGElement(name: "svg"): SVGSVGElement;
        export function createSVGElement(name: "switch"): SVGSwitchElement;
        export function createSVGElement(name: "symbol"): SVGSymbolElement;
        export function createSVGElement(name: "text"): SVGTextElement;
        export function createSVGElement(name: "textcontent"): SVGTextContentElement;
        export function createSVGElement(name: "title"): SVGTitleElement;
        export function createSVGElement(name: "use"): SVGUseElement;
        export function createSVGElement(name: "view"): SVGViewElement;
        export function createSVGElement(name: string): SVGElement;
        export function createSVGElement(name: string): SVGElement {
            return <SVGElement>document.createElementNS('http://www.w3.org/2000/svg', name);
        }

        var element: HTMLDivElement = document.createElement('div');
        export function HTMLEncode(text: string): string {
            element.textContent = text;
            return element.innerHTML;
        }

        export function foreachLine(Text: string, LineWidth: number, Callback): void {
            if (!Callback) return;
            var rest: string = Text;
            var maxLength: number = LineWidth || 20;
            maxLength = maxLength < 1 ? 1 : maxLength;
            var length = 0;
            var i = 0;
            for (var pos = 0; pos < rest.length; ++pos) {
                var code = rest.charCodeAt(pos);
                length += code < 128 ? 1 : 2;
                if (length > maxLength || rest.charAt(pos) == "\n") {
                    Callback(rest.substr(0, pos), i);
                    if (rest.charAt(pos) == "\n") {
                        pos++;
                    }
                    rest = rest.substr(pos, rest.length - pos);
                    pos = -1;
                    length = 0;
                    i++;
                }
            }
            Callback(rest, i);
        }

        export function RemoveFirstLine(Text: string): string {
            return Text.replace(/^.+$(\r\n|\r|\n)?/m, "");
        }

        export function GenerateUID(): number {
            return Math.floor(Math.random() * 2147483647);
        }

        export function GenerateRandomString(): string {
            return GenerateUID().toString(36);
        }

        export function UpdateHash(hash: string) {
            if (!hash) hash = '';
            window.location.hash = hash;
        }

        export class UserAgant {
            private static ua: any = (() => {
                return {
                    ltIE6: typeof window.addEventListener == "undefined" && typeof document.documentElement.style.maxHeight == "undefined",
                    ltIE7: typeof window.addEventListener == "undefined" && typeof document.querySelectorAll == "undefined",
                    ltIE8: typeof window.addEventListener == "undefined" && typeof document.getElementsByClassName == "undefined",
                    ltIE9: document.uniqueID && !window.matchMedia,
                    gtIE10: document.uniqueID && document.documentMode >= 10,
                    Trident: document.uniqueID,
                    Gecko: 'MozAppearance' in document.documentElement.style,
                    Presto: (<any>window).opera,
                    Blink: (<any>window).chrome,
                    Webkit: !(<any>window).chrome && 'WebkitAppearance' in document.documentElement.style,
                    Touch: typeof (<any>document).ontouchstart != "undefined",
                    Mobile: typeof (<any>document).orientation != "undefined",
                    Pointer: (typeof (<any>document).navigator != "undefined") && !!(<any>document).navigator.pointerEnabled,
                    MSPoniter: (typeof (<any>document).navigator != "undefined") && !!(<any>document).navigator.msPointerEnabled,
                    Performance: typeof window.performance != "undefined",
                    AnimationFrame: typeof window.requestAnimationFrame != "undefined"
                };
            })();
            static isLessThanIE6(): boolean {
                return !!UserAgant.ua.ltIE6;
            }
            static isLessThanIE7(): boolean {
                return !!UserAgant.ua.ltIE7;
            }
            static isLessThanIE8(): boolean {
                return !!UserAgant.ua.ltIE8;
            }
            static isLessThanIE9(): boolean {
                return !!UserAgant.ua.ltIE9;
            }
            static isGreaterThanIE10(): boolean {
                return !!UserAgant.ua.gtIE10;
            }
            static isTrident(): boolean {
                return !!UserAgant.ua.Trident;
            }
            static isGecko(): boolean {
                return !!UserAgant.ua.Gecko;
            }
            static isPresto(): boolean {
                return !!UserAgant.ua.Presto;
            }
            static isBlink(): boolean {
                return !!UserAgant.ua.Blink;
            }
            static isWebkit(): boolean {
                return !!UserAgant.ua.Webkit;
            }
            static isTouchEnabled(): boolean {
                return !!UserAgant.ua.Touch;
            }
            static isPointerEnabled(): boolean {
                return !!UserAgant.ua.Pointer;
            }
            static isMSPoniterEnabled(): boolean {
                return !!UserAgant.ua.MSPoniter;
            }
            static isPerformanceEnabled(): boolean {
                return !!UserAgant.ua.Performance;
            }
            static isAnimationFrameEnabled(): boolean {
                return !!UserAgant.ua.AnimationFrame;
            }
            static isTouchDevice(): boolean {
                return UserAgant.ua.Touch;
            }
        }

        export var requestAnimationFrame: (Callback: FrameRequestCallback) => number
            = UserAgant.isAnimationFrameEnabled() ? window.requestAnimationFrame.bind(window) : ((c) => setTimeout(c, 16.7));

        export var cancelAnimationFrame: (Handle: number) => void
            = UserAgant.isAnimationFrameEnabled() ? window.cancelAnimationFrame.bind(window) : window.clearTimeout.bind(window);

        export var getTime: () => number
            = UserAgant.isPerformanceEnabled() ? performance.now.bind(performance) : Date.now.bind(Date);

        /**
        Define new color style.
        @param {string} StyleName Style name. The name can be used as a parameter for NodeView#Addd/RemoveColorStyle
        @param {Object} StyleDef jQuery.css style definition. ex) { fill: #FFFFFF, stroke: #000000 }
        */
        //export function defineColorStyle(StyleName: string, StyleDef: Object): void {
        //    $("<style>").html("." + StyleName + " { " + $("span").css(StyleDef).attr("style") + " }").appendTo("head");
        //}

        function generateStyleSetter(originalName: string): (Element: HTMLElement, Value: string) => void {
            var cameledName = originalName.substring(0, 1).toUpperCase() + originalName.substring(1);
            if (UserAgant.isTrident()) {
                cameledName = "ms" + cameledName;
                return (Element: HTMLElement, Value: string) => { Element.style[cameledName] = Value; }
            }
            if (UserAgant.isGecko()) {
                cameledName = "Moz" + cameledName;
                return (Element: HTMLElement, Value: string) => { Element.style[cameledName] = Value; }
            }
            if (UserAgant.isWebkit() || UserAgant.isBlink()) {
                cameledName = "webkit" + cameledName;
                return (Element: HTMLElement, Value: string) => { Element.style[cameledName] = Value; }
            }
            return (Element: HTMLElement, Value: string) => { Element.style[originalName] = Value; }
        }

        export var setTransformOriginToElement = generateStyleSetter("transformOrigin");

        export var setTransformToElement = generateStyleSetter("transform");
    }

    export class AnimationFrameTask {
        private timerHandle: number;
        private callback: Function;
        private lastTime: number;
        private startTime: number;
        private endTime: number;

        start(duration: number, callback: (deltaT: number) => void): void;
        start(duration: number, callback: (deltaT: number, currentTime: number, startTime: number) => void): void;
        start(duration: number, callback: () => void): void;
        start(duration: number, callback: Function): void {
            this.cancel();
            this.lastTime = this.startTime = Utils.getTime();
            this.endTime = this.startTime + duration;
            this.callback = callback;

            var update: any = () => {
                var currentTime: number = Utils.getTime();
                var deltaT = currentTime - this.lastTime;
                if (currentTime < this.endTime) {
                    this.timerHandle = Utils.requestAnimationFrame(update);
                } else {
                    deltaT = this.endTime - this.lastTime;
                    this.timerHandle = 0;
                }
                this.callback(deltaT, currentTime, this.startTime);
                this.lastTime = currentTime;
            }
            update();
        }

        startMany(Duration: number, Callbacks: Function[]): void {
            if (Callbacks && Callbacks.length > 0) {
                this.start(Duration, (DeltaT: number, CurrentTime: number, StartTime: number) => {
                    for (var i = 0; i < Callbacks.length; ++i) {
                        Callbacks[i](DeltaT, CurrentTime, StartTime);
                    }
                });
            }
        }

        isRunning(): boolean {
            return this.timerHandle != 0;
        }

        cancel(RunToEnd?: boolean): void {
            if (this.timerHandle) {
                Utils.cancelAnimationFrame(this.timerHandle);
                this.timerHandle = 0;
                if (RunToEnd) {
                    var DeltaT = this.endTime - this.lastTime;
                    this.callback(DeltaT, this.endTime, this.startTime);
                }
            }
        }
    }

    export class VisModelEvent {
        target: EventTarget;
        type: string;
        defaultPrevented: boolean;
        preventDefault() {
            this.defaultPrevented = true;
        }
    }

    export class EventTarget {
        private Listeners: { [index: string]: Function[] } = {}

        removeEventListener(type: string, listener: EventListener): void {
            var listeners = this.Listeners[type];
            if (listeners != null) {
                var i = listeners.indexOf(listener);
                if (i !== -1) {
                    listeners.splice(i, 1);
                }
            }
        }

        addEventListener(type: string, listener: () => void): void;
        addEventListener(type: string, listener: () => any): void;
        addEventListener(type: string, listener: (e: VisModelEvent) => void): void;
        addEventListener(type: string, listener: (e: VisModelEvent) => any): void {
            var listeners = this.Listeners[type];
            if (listeners == null) {
                this.Listeners[type] = [listener];
            } else if (listeners.indexOf(listener) === -1) {
                listeners.unshift(listener);
            }
        }

        dispatchEvent(e: VisModelEvent): boolean {
            e.target = this;
            if (this["on" + e.type] != null) {
                this["on" + e.type](e);
            }
            if (this["On" + e.type] != null) {
                this["On" + e.type](e);
            }
            var listeners = this.Listeners[e.type];
            if (listeners != null) {
                listeners = listeners.slice(0);
                for (var i = 0, len = listeners.length; i < len; i++) {
                    listeners[i].call(this, e);
                }
            }
            return !e.defaultPrevented;
        }
    }

    export class ColorStyle {
        static Default: string = "node-default";
        static Highlight: string = "node-selected";
    }

    export class Rect {
        constructor(public x: number, public y: number, public width: number, public height: number) {
        }
        toString(): string {
            return "(" + [this.x, this.y, this.width, this.height].join(", ") + ")";
        }
        clone(): Rect {
            return new Rect(this.x, this.y, this.width, this.height);
        }
    }

    export class Point {
        constructor(public x: number, public y: number) { }
        public clone(): Point {
            return new Point(this.x, this.y);
        }
        public toString() {
            return "(" + this.x + ", " + this.y + ")";
        }
    }

    export enum Direction {
        Left, Top, Right, Bottom
    }

    export function reverseDirection(Dir: Direction): Direction {
        return (Dir + 2) & 3;
    }
}
