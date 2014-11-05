
module VisModelJS {
    export module Utils {

        export function SaveAs(ContentString: string, FileName: string): void {
            var blob = new Blob([ContentString], { type: 'text/plain; charset=UTF-8' });
            saveAs(blob, FileName);
        }

        export function GetNodeLabelFromEvent(event: Event): string {
            var element = <HTMLElement>event.target || <HTMLElement>event.srcElement;
            while (element != null) {
                if (element.id != "") {
                    return element.id;
                }
                element = element.parentElement;
            }
            return "";
        }

        export function GetNodePosition(Label: string): Point {
            var element = document.getElementById(Label);
            var view = element.getBoundingClientRect();
            return new Point(view.left, view.top);
        }

        export function CreateSVGElement(name: "a"): SVGAElement;
        export function CreateSVGElement(name: "circle"): SVGCircleElement;
        export function CreateSVGElement(name: "clippath"): SVGClipPathElement;
        export function CreateSVGElement(name: "componenttransferfunction"): SVGComponentTransferFunctionElement;
        export function CreateSVGElement(name: "defs"): SVGDefsElement;
        export function CreateSVGElement(name: "desc"): SVGDescElement;
        export function CreateSVGElement(name: "ellipse"): SVGEllipseElement;
        export function CreateSVGElement(name: "feblend"): SVGFEBlendElement;
        export function CreateSVGElement(name: "fecolormatrix"): SVGFEColorMatrixElement;
        export function CreateSVGElement(name: "fecomponenttransfer"): SVGFEComponentTransferElement;
        export function CreateSVGElement(name: "fecomposite"): SVGFECompositeElement;
        export function CreateSVGElement(name: "feconvolvematrix"): SVGFEConvolveMatrixElement;
        export function CreateSVGElement(name: "fediffuselighting"): SVGFEDiffuseLightingElement;
        export function CreateSVGElement(name: "fedisplacementmap"): SVGFEDisplacementMapElement;
        export function CreateSVGElement(name: "fedistantlight"): SVGFEDistantLightElement;
        export function CreateSVGElement(name: "feflood"): SVGFEFloodElement;
        export function CreateSVGElement(name: "fegaussianblur"): SVGFEGaussianBlurElement;
        export function CreateSVGElement(name: "feimage"): SVGFEImageElement;
        export function CreateSVGElement(name: "femerge"): SVGFEMergeElement;
        export function CreateSVGElement(name: "femergenode"): SVGFEMergeNodeElement;
        export function CreateSVGElement(name: "femorphology"): SVGFEMorphologyElement;
        export function CreateSVGElement(name: "feoffset"): SVGFEOffsetElement;
        export function CreateSVGElement(name: "fepointlight"): SVGFEPointLightElement;
        export function CreateSVGElement(name: "fespecularlighting"): SVGFESpecularLightingElement;
        export function CreateSVGElement(name: "fespotlight"): SVGFESpotLightElement;
        export function CreateSVGElement(name: "fetile"): SVGFETileElement;
        export function CreateSVGElement(name: "feturbulence"): SVGFETurbulenceElement;
        export function CreateSVGElement(name: "filter"): SVGFilterElement;
        export function CreateSVGElement(name: "g"): SVGGElement;
        export function CreateSVGElement(name: "gradient"): SVGGradientElement;
        export function CreateSVGElement(name: "image"): SVGImageElement;
        export function CreateSVGElement(name: "line"): SVGLineElement;
        export function CreateSVGElement(name: "marker"): SVGMarkerElement;
        export function CreateSVGElement(name: "mask"): SVGMaskElement;
        export function CreateSVGElement(name: "metadata"): SVGMetadataElement;
        export function CreateSVGElement(name: "path"): SVGPathElement;
        export function CreateSVGElement(name: "pattern"): SVGPatternElement;
        export function CreateSVGElement(name: "polygon"): SVGPolygonElement;
        export function CreateSVGElement(name: "polyline"): SVGPolylineElement;
        export function CreateSVGElement(name: "rect"): SVGRectElement;
        export function CreateSVGElement(name: "script"): SVGScriptElement;
        export function CreateSVGElement(name: "stop"): SVGStopElement;
        export function CreateSVGElement(name: "style"): SVGStyleElement;
        export function CreateSVGElement(name: "svg"): SVGSVGElement;
        export function CreateSVGElement(name: "switch"): SVGSwitchElement;
        export function CreateSVGElement(name: "symbol"): SVGSymbolElement;
        export function CreateSVGElement(name: "text"): SVGTextElement;
        export function CreateSVGElement(name: "textcontent"): SVGTextContentElement;
        export function CreateSVGElement(name: "title"): SVGTitleElement;
        export function CreateSVGElement(name: "use"): SVGUseElement;
        export function CreateSVGElement(name: "view"): SVGViewElement;
        export function CreateSVGElement(name: string): SVGElement;
        export function CreateSVGElement(name: string): SVGElement {
            return <SVGElement>document.createElementNS('http://www.w3.org/2000/svg', name);
        }

        var element: HTMLDivElement = document.createElement('div');
        export function HTMLEncode(text: string): string {
            element.textContent = text;
            return element.innerHTML;
        }

        export function ForeachLine(Text: string, LineWidth: number, Callback): void {
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
            static IsLessThanIE6(): boolean {
                return !!UserAgant.ua.ltIE6;
            }
            static IsLessThanIE7(): boolean {
                return !!UserAgant.ua.ltIE7;
            }
            static IsLessThanIE8(): boolean {
                return !!UserAgant.ua.ltIE8;
            }
            static IsLessThanIE9(): boolean {
                return !!UserAgant.ua.ltIE9;
            }
            static IsGreaterThanIE10(): boolean {
                return !!UserAgant.ua.gtIE10;
            }
            static IsTrident(): boolean {
                return !!UserAgant.ua.Trident;
            }
            static IsGecko(): boolean {
                return !!UserAgant.ua.Gecko;
            }
            static IsPresto(): boolean {
                return !!UserAgant.ua.Presto;
            }
            static IsBlink(): boolean {
                return !!UserAgant.ua.Blink;
            }
            static IsWebkit(): boolean {
                return !!UserAgant.ua.Webkit;
            }
            static IsTouchEnabled(): boolean {
                return !!UserAgant.ua.Touch;
            }
            static IsPointerEnabled(): boolean {
                return !!UserAgant.ua.Pointer;
            }
            static IsMSPoniterEnabled(): boolean {
                return !!UserAgant.ua.MSPoniter;
            }
            static IsPerformanceEnabled(): boolean {
                return !!UserAgant.ua.Performance;
            }
            static IsAnimationFrameEnabled(): boolean {
                return !!UserAgant.ua.AnimationFrame;
            }
            static IsTouchDevice(): boolean {
                return UserAgant.ua.Touch;
            }
        }

        export var RequestAnimationFrame: (Callback: FrameRequestCallback) => number
            = UserAgant.IsAnimationFrameEnabled() ? requestAnimationFrame : ((c) => setTimeout(c, 16.7));

        export var CancelAnimationFrame: (Handle: number) => void
            = UserAgant.IsAnimationFrameEnabled() ? cancelAnimationFrame : clearTimeout;

        export var GetTime: () => number
            = UserAgant.IsPerformanceEnabled() ? performance.now.bind(performance) : Date.now.bind(Date);

        /**
        Define new color style.
        @param {string} StyleName Style name. The name can be used as a parameter for NodeView#Addd/RemoveColorStyle
        @param {Object} StyleDef jQuery.css style definition. ex) { fill: #FFFFFF, stroke: #000000 }
        */
        export function DefineColorStyle(StyleName: string, StyleDef: Object): void {
            $("<style>").html("." + StyleName + " { " + $("span").css(StyleDef).attr("style") + " }").appendTo("head");
        }

        function GenerateStyleSetter(OriginalName: string): (Element: HTMLElement, Value: string) => void {
            var CameledName = OriginalName.substring(0, 1).toUpperCase() + OriginalName.substring(1);
            if (UserAgant.IsTrident()) {
                CameledName = "ms" + CameledName;
                return (Element: HTMLElement, Value: string) => { Element.style[CameledName] = Value; }
            }
            if (UserAgant.IsGecko()) {
                CameledName = "Moz" + CameledName;
                return (Element: HTMLElement, Value: string) => { Element.style[CameledName] = Value; }
            }
            if (UserAgant.IsWebkit() || UserAgant.IsBlink()) {
                CameledName = "webkit" + CameledName;
                return (Element: HTMLElement, Value: string) => { Element.style[CameledName] = Value; }
            }
            return (Element: HTMLElement, Value: string) => { Element.style[OriginalName] = Value; }
        }

        export var SetTransformOriginToElement: (Element: HTMLElement, Value: string) => void = GenerateStyleSetter("transformOrigin");

        export var SetTransformToElement: (Element: HTMLElement, Value: string) => void = GenerateStyleSetter("transform");

        export function IsOnline(): boolean {
            return navigator.onLine === undefined || navigator.onLine;
        }
    }

    export class AnimationFrameTask {
        private TimerHandle: number;
        private Callback: Function;
        private LastTime: number;
        private StartTime: number;
        private EndTime: number;

        Start(Duration: number, Callback: (DeltaT: number) => void): void;
        Start(Duration: number, Callback: (DeltaT: number, CurrentTime: number, StartTime: number) => void): void;
        Start(Duration: number, Callback: () => void): void;
        Start(Duration: number, Callback: Function): void {
            this.Cancel();
            this.LastTime = this.StartTime = Utils.GetTime();
            this.EndTime = this.StartTime + Duration;
            this.Callback = Callback;

            var Update: any = () => {
                var CurrentTime: number = Utils.GetTime();
                var DeltaT = CurrentTime - this.LastTime;
                if (CurrentTime < this.EndTime) {
                    this.TimerHandle = Utils.RequestAnimationFrame(Update);
                } else {
                    DeltaT = this.EndTime - this.LastTime;
                    this.TimerHandle = 0;
                }
                this.Callback(DeltaT, CurrentTime, this.StartTime);
                this.LastTime = CurrentTime;
            }
            Update();
        }

        StartMany(Duration: number, Callbacks: Function[]): void {
            if (Callbacks && Callbacks.length > 0) {
                this.Start(Duration, (DeltaT: number, CurrentTime: number, StartTime: number) => {
                    for (var i = 0; i < Callbacks.length; ++i) {
                        Callbacks[i](DeltaT, CurrentTime, StartTime);
                    }
                });
            }
        }

        IsRunning(): boolean {
            return this.TimerHandle != 0;
        }

        Cancel(RunToEnd?: boolean): void {
            if (this.TimerHandle) {
                Utils.CancelAnimationFrame(this.TimerHandle);
                this.TimerHandle = 0;
                if (RunToEnd) {
                    var DeltaT = this.EndTime - this.LastTime;
                    this.Callback(DeltaT, this.EndTime, this.StartTime);
                }
            }
        }
    }

    export class VisModelEvent {
        Target: EventTarget;
        Type: string;
        DefaultPrevented: boolean;
        PreventDefault() {
            this.DefaultPrevented = true;
        }
    }

    export class EventTarget {
        private Listeners: { [index: string]: Function[] } = {}

        RemoveEventListener(type: string, listener: EventListener): void {
            var listeners = this.Listeners[type];
            if (listeners != null) {
                var i = listeners.indexOf(listener);
                if (i !== -1) {
                    listeners.splice(i, 1);
                }
            }
        }

        AddEventListener(type: string, listener: () => void): void;
        AddEventListener(type: string, listener: () => any): void;
        AddEventListener(type: string, listener: (e: VisModelEvent) => void): void;
        AddEventListener(type: string, listener: (e: VisModelEvent) => any): void {
            var listeners = this.Listeners[type];
            if (listeners == null) {
                this.Listeners[type] = [listener];
            } else if (listeners.indexOf(listener) === -1) {
                listeners.unshift(listener);
            }
        }

        DispatchEvent(e: VisModelEvent): boolean {
            e.Target = this;
            if (this["on" + e.Type] != null) {
                this["on" + e.Type](e);
            }
            if (this["On" + e.Type] != null) {
                this["On" + e.Type](e);
            }
            var listeners = this.Listeners[e.Type];
            if (listeners != null) {
                listeners = listeners.slice(0);
                for (var i = 0, len = listeners.length; i < len; i++) {
                    listeners[i].call(this, e);
                }
            }
            return !e.DefaultPrevented;
        }
    }

    export class ColorStyle {
        static Default: string = "assurenote-default";
        static Highlight: string = "assurenote-default-highlight";
        static ToDo: string = "assurenote-todo";
        static Searched: string = "assurenote-search";
        static Danger: string = "assurenote-danger";
        static SingleEdit: string = "assurenote-singleedit";
        static Locked: string = "assurenote-locked";
        static Useless: string = "assurenote-useless";
    }

    export class Rect {
        constructor(public X: number, public Y: number, public Width: number, public Height: number) {
        }
        toString(): string {
            return "(" + [this.X, this.Y, this.Width, this.Height].join(", ") + ")";
        }
        Clone(): Rect {
            return new Rect(this.X, this.Y, this.Width, this.Height);
        }
    }

    export class Point {
        constructor(public X: number, public Y: number) { }
        public Clone(): Point {
            return new Point(this.X, this.Y);
        }
        public toString() {
            return "(" + this.X + ", " + this.Y + ")";
        }
    }

    export enum Direction {
        Left, Top, Right, Bottom
    }

    export function ReverseDirection(Dir: Direction): Direction {
        return (Dir + 2) & 3;
    }
}
