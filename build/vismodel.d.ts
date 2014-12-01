// Type definitions for VisModel.js
// Project: https://github.com/tetsurom/vmjs
// Definitions by: Tetsuro Matsumura https://github.com/tetsurom

declare module VisModelJS {
    class LayoutEngine {
        doLayout(pictgramPanel: VisualModelPanel, nodeView: TreeNodeView): void;
    }
    class TreeNodeView {
        visible: boolean;
        label: string;
        content: string;
        relativeX: number;
        relativeY: number;
        parent: TreeNodeView;
        leftNodes: TreeNodeView[];
        rightNodes: TreeNodeView[];
        childNodes: TreeNodeView[];
        parentDirection: Direction;
        constructor();
        folded: boolean;
        shouldReLayout: boolean;
        UpdateViewMap(viewMap: {
            [x: string]: TreeNodeView;
        }): void;
        appendChild(node: TreeNodeView): void;
        appendLeftNode(node: TreeNodeView): void;
        appendRightNode(node: TreeNodeView): void;
        shape: Shape;
        /**
            Global X: Scale-independent and transform-independent X distance from leftside of the top goal.
            @return always 0 if this is top goal.
        */
        gx: number;
        /**
            Global Y: Scale-independent and transform-independent Y distance from top of the top goal.
            @eturn always 0 if this is top goal.
        */
        gy: number;
        centerGx: number;
        centerGy: number;
        forEachVisibleChildren(action: (subNode: TreeNodeView) => any): void;
        forEachVisibleRightNodes(action: (subNode: TreeNodeView) => any): void;
        forEachVisibleLeftNodes(action: (subNode: TreeNodeView) => any): void;
        forEachVisibleAllSubNodes(action: (subNode: TreeNodeView) => any): boolean;
        traverseVisibleNode(action: (subNode: TreeNodeView) => any): void;
        forEachAllSubNodes(action: (subNode: TreeNodeView) => any): boolean;
        traverseNode(action: (subNode: TreeNodeView) => any): boolean;
        hasSideNode: boolean;
        hasChildren: boolean;
    }
    class ShapeFactory {
        static setFactory(factory: ShapeFactory): void;
        static createShape(node: TreeNodeView): Shape;
        createShape(node: TreeNodeView): Shape;
    }
    class Shape {
        nodeView: TreeNodeView;
        shapeGroup: SVGGElement;
        arrowPath: SVGPathElement;
        content: HTMLElement;
        constructor(nodeView: TreeNodeView);
        setTreeRect(localX: number, localY: number, width: number, height: number): void;
        setHeadRect(localX: number, localY: number, width: number, height: number): void;
        setTreeSize(width: number, height: number): void;
        setHeadSize(width: number, height: number): void;
        nodeWidth: number;
        nodeHeight: number;
        treeWidth: number;
        treeHeight: number;
        headWidth: number;
        headHeight: number;
        treeLeftLocalX: number;
        headLeftLocalX: number;
        setTreeUpperLeft(localX: number, localY: number): void;
        setHeadUpperLeft(localX: number, localY: number): void;
        updateHtmlClass(): void;
        prepareHTMLContent(): void;
        prepareContent(): void;
        render(htmlContentFragment: DocumentFragment, svgNodeFragment: DocumentFragment, svgConnectionFragment: DocumentFragment): void;
        fitSizeToContent(): void;
        setPosition(x: number, y: number): void;
        moveTo(animationCallbacks: Function[], x: number, y: number, duration: number, screenRect?: Rect): void;
        setFadeinBasePosition(startGX: number, startGY: number): void;
        willFadein: boolean;
        clearAnimationCache(): void;
        prepareSVGContent(): void;
        setArrowPosition(p1: Point, p2: Point, dir: Direction): void;
        moveArrowTo(animationCallbacks: Function[], p1: Point, p2: Point, dir: Direction, duration: number, screenRect?: Rect): void;
        setArrowColorWhite(isWhite: boolean): void;
        getConnectorPosition(dir: Direction): Point;
        addColorStyle(colorStyleCode: string): void;
        removeColorStyle(ColorStyleCode: string): void;
        getColorStyle(): string[];
        setColorStyle(styles: string[]): void;
        clearColorStyle(): void;
    }
    module Utils {
        function createSVGElement(name: "a"): SVGAElement;
        function createSVGElement(name: "circle"): SVGCircleElement;
        function createSVGElement(name: "clippath"): SVGClipPathElement;
        function createSVGElement(name: "componenttransferfunction"): SVGComponentTransferFunctionElement;
        function createSVGElement(name: "defs"): SVGDefsElement;
        function createSVGElement(name: "desc"): SVGDescElement;
        function createSVGElement(name: "ellipse"): SVGEllipseElement;
        function createSVGElement(name: "feblend"): SVGFEBlendElement;
        function createSVGElement(name: "fecolormatrix"): SVGFEColorMatrixElement;
        function createSVGElement(name: "fecomponenttransfer"): SVGFEComponentTransferElement;
        function createSVGElement(name: "fecomposite"): SVGFECompositeElement;
        function createSVGElement(name: "feconvolvematrix"): SVGFEConvolveMatrixElement;
        function createSVGElement(name: "fediffuselighting"): SVGFEDiffuseLightingElement;
        function createSVGElement(name: "fedisplacementmap"): SVGFEDisplacementMapElement;
        function createSVGElement(name: "fedistantlight"): SVGFEDistantLightElement;
        function createSVGElement(name: "feflood"): SVGFEFloodElement;
        function createSVGElement(name: "fegaussianblur"): SVGFEGaussianBlurElement;
        function createSVGElement(name: "feimage"): SVGFEImageElement;
        function createSVGElement(name: "femerge"): SVGFEMergeElement;
        function createSVGElement(name: "femergenode"): SVGFEMergeNodeElement;
        function createSVGElement(name: "femorphology"): SVGFEMorphologyElement;
        function createSVGElement(name: "feoffset"): SVGFEOffsetElement;
        function createSVGElement(name: "fepointlight"): SVGFEPointLightElement;
        function createSVGElement(name: "fespecularlighting"): SVGFESpecularLightingElement;
        function createSVGElement(name: "fespotlight"): SVGFESpotLightElement;
        function createSVGElement(name: "fetile"): SVGFETileElement;
        function createSVGElement(name: "feturbulence"): SVGFETurbulenceElement;
        function createSVGElement(name: "filter"): SVGFilterElement;
        function createSVGElement(name: "g"): SVGGElement;
        function createSVGElement(name: "gradient"): SVGGradientElement;
        function createSVGElement(name: "image"): SVGImageElement;
        function createSVGElement(name: "line"): SVGLineElement;
        function createSVGElement(name: "marker"): SVGMarkerElement;
        function createSVGElement(name: "mask"): SVGMaskElement;
        function createSVGElement(name: "metadata"): SVGMetadataElement;
        function createSVGElement(name: "path"): SVGPathElement;
        function createSVGElement(name: "pattern"): SVGPatternElement;
        function createSVGElement(name: "polygon"): SVGPolygonElement;
        function createSVGElement(name: "polyline"): SVGPolylineElement;
        function createSVGElement(name: "rect"): SVGRectElement;
        function createSVGElement(name: "script"): SVGScriptElement;
        function createSVGElement(name: "stop"): SVGStopElement;
        function createSVGElement(name: "style"): SVGStyleElement;
        function createSVGElement(name: "svg"): SVGSVGElement;
        function createSVGElement(name: "switch"): SVGSwitchElement;
        function createSVGElement(name: "symbol"): SVGSymbolElement;
        function createSVGElement(name: "text"): SVGTextElement;
        function createSVGElement(name: "textcontent"): SVGTextContentElement;
        function createSVGElement(name: "title"): SVGTitleElement;
        function createSVGElement(name: "use"): SVGUseElement;
        function createSVGElement(name: "view"): SVGViewElement;
        function createSVGElement(name: string): SVGElement;
        function HTMLEncode(text: string): string;
        function foreachLine(Text: string, LineWidth: number, Callback: any): void;
        function removeFirstLine(Text: string): string;
        function generateUID(): number;
        function generateRandomString(): string;
        class UserAgant {
            static isLessThanIE6(): boolean;
            static isLessThanIE7(): boolean;
            static isLessThanIE8(): boolean;
            static isLessThanIE9(): boolean;
            static isGreaterThanIE10(): boolean;
            static isTrident(): boolean;
            static isGecko(): boolean;
            static isPresto(): boolean;
            static isBlink(): boolean;
            static isWebkit(): boolean;
            static isTouchEnabled(): boolean;
            static isPointerEnabled(): boolean;
            static isMSPoniterEnabled(): boolean;
            static isPerformanceEnabled(): boolean;
            static isAnimationFrameEnabled(): boolean;
            static isTouchDevice(): boolean;
        }
        var requestAnimationFrame: (Callback: FrameRequestCallback) => number;
        var cancelAnimationFrame: (Handle: number) => void;
        var getTime: () => number;
        var setTransformOriginToElement: (Element: HTMLElement, Value: string) => void;
        var setTransformToElement: (Element: HTMLElement, Value: string) => void;
    }
    class AnimationFrameTask {
        start(duration: number, callback: (deltaT: number) => void): void;
        start(duration: number, callback: (deltaT: number, currentTime: number, startTime: number) => void): void;
        start(duration: number, callback: () => void): void;
        startMany(Duration: number, Callbacks: Function[]): void;
        isRunning(): boolean;
        cancel(RunToEnd?: boolean): void;
    }
    class VisModelEvent {
        target: EventTarget;
        type: string;
        defaultPrevented: boolean;
        preventDefault(): void;
    }
    class EventTarget {
        removeEventListener(type: string, listener: EventListener): void;
        addEventListener(type: string, listener: () => void): void;
        addEventListener(type: string, listener: () => any): void;
        addEventListener(type: string, listener: (e: VisModelEvent) => void): void;
        dispatchEvent(e: VisModelEvent): boolean;
    }
    class ColorStyle {
        static Default: string;
        static Highlight: string;
    }
    class Rect {
        x: number;
        y: number;
        width: number;
        height: number;
        constructor(x: number, y: number, width: number, height: number);
        toString(): string;
        clone(): Rect;
    }
    class Point {
        x: number;
        y: number;
        constructor(x: number, y: number);
        clone(): Point;
        toString(): string;
    }
    enum Direction {
        Left = 0,
        Top = 1,
        Right = 2,
        Bottom = 3,
    }
    function reverseDirection(Dir: Direction): Direction;
    class Pointer {
        x: number;
        y: number;
        id: number;
        constructor(x: number, y: number, id: number);
        setPosition(x: number, y: number): void;
    }
    /**
        Controll scroll by mouse, touch and pen and zoom by wheel.
        @class VisModelJS.ScrollManager
        @for VisModelJS.ViewportManager
    */
    class ScrollManager {
        onPointerEvent(e: PointerEvent, viewport: ViewportManager): void;
        onDragged: (dx: number, dy: number) => void;
        onMouseWheel(e: WheelEvent, screen: ViewportManager): void;
    }
    interface Camera {
        /**
            @property gx
            Scale-independent camera X-position in visual model.
        */
        gx: number;
        /**
            @property gy
            Scale-independent camera Y-position in visual model.
        */
        gy: number;
        /**
            @method setPosition
            @param {number} gx Scale-independent camera X position in visual model.
            @param {number} gy Scale-independent camera Y position in visual model.
        */
        setPosition(gx: number, gy: number): any;
        /**
            Set camera's position and scale one time.
            @method setPositionAndScale
            @param {number} gx Scale-independent camera X position in visual model.
            @param {number} gy Scale-independent camera Y position in visual model.
            @param {number} scale Scale of camera. 1.0 for 100%.
        */
        setPositionAndScale(gx: number, gy: number, scale: number): any;
        /**
            @property scale
            Scale of camera. 1.0 for 100%.
        */
        scale: number;
        /**
            @property centerPageX
            X-position of camera's vanishing point in page.
        */
        centerPageX: number;
        /**
            @property centerPageY
            Y-position of camera's vanishing point in page.
        */
        centerPageY: number;
        /**
            Set camera's vanishing point in web page.
            @method setCenterPagePosition
            @param {number} pageX X of camera's vanishing point in page.
            @param {number} pageY Y of camera's vanishing point in page.
        */
        setCenterPagePosition(pageX: number, pageY: number): any;
        limitRect: Rect;
        maxScale: number;
        minScale: number;
        move(GX: number, GY: number, Scale: number, Duration: number): void;
        moveTo(GX: number, GY: number, Scale: number, Duration: number): void;
    }
    /**
        @class VisModelJS.ViewportManager
    */
    class ViewportManager extends EventTarget {
        scrollManager: ScrollManager;
        isPointerEnabled: boolean;
        constructor(panel: VisualModelPanel);
        camera: Camera;
        /**
            Calcurate PageX from GX
            @method PageXFromGX
            @param {number} GX Scale-independent X position in GSN.
            @return {number} PageX for given GX. It is depend on camera's position, scale and vanishing point.
        */
        pageXFromGX(gx: number): number;
        /**
            Calcurate PageY from GY
            @method PageYFromGY
            @param {number} GY Scale-independent Y position in GSN.
            @return {number} PageY for given GY. It is depend on camera's position, scale and vanishing point.
        */
        pageYFromGY(gy: number): number;
        /**
            Calcurate GX from PageX
            @method GXFromPageX
            @param {number} PageX X position in web page.
            @return {number} GX for given PageX. It is depend on camera's position, scale and vanishing point.
        */
        gxFromPageX(pageX: number): number;
        /**
            Calcurate GY from PageY
            @method GYFromPageY
            @param {number} PageY Y position in web page.
            @return {number} GY for given PageY. It is depend on camera's position, scale and vanishing point.
        */
        gyFromPageY(pageY: number): number;
        convertRectGlobalXYFromPageXY(pageRect: Rect): Rect;
        pageRectInGxGy: Rect;
        areaWidth: number;
        areaHeight: number;
        areaCenterX: number;
        areaCenterY: number;
        createMoveTaskFunction(gx: number, gy: number, scale: number, duration: number): (a: number, b: number, c: number) => void;
        createMoveToTaskFunction(gx: number, gy: number, scale: number, duration: number): (a: number, b: number, c: number) => void;
    }
    class NodeViewEvent extends VisModelEvent {
        node: TreeNodeView;
    }
    /**
        @class VisModelJS.VisualModelPanel
    */
    class VisualModelPanel extends EventTarget {
        layoutEngine: LayoutEngine;
        rootElement: HTMLDivElement;
        SVGLayerBox: SVGSVGElement;
        SVGLayer: SVGGElement;
        SVGLayerConnectorGroup: SVGGElement;
        SVGLayerNodeGroup: SVGGElement;
        eventMapLayer: HTMLDivElement;
        contentLayer: HTMLDivElement;
        ControlLayer: HTMLDivElement;
        hiddenNodeBuffer: DocumentFragment;
        viewport: ViewportManager;
        viewMap: {
            [x: string]: TreeNodeView;
        };
        topNodeView: TreeNodeView;
        constructor(placeHolder: HTMLDivElement);
        active: boolean;
        onKeyDown(event: KeyboardEvent): void;
        onActivate(): void;
        onDeactivate(): void;
        /**
            @method MoveToNearestNode
            @param {AssureNote.Direction} Dir
        */
        moveToNearestNode(dir: Direction): boolean;
        /**
            @method FocusAndMoveToNode
        */
        focusAndMoveToNode(node: TreeNodeView): void;
        focusAndMoveToNode(label: string): void;
        /**
            @method FindNearestNode
            @param {AssureNote.NodeView} CenterNode. If null is given, Camera position is used instead of the node.
            @param {AssureNote.Direction} Dir
            @return {AssureNote.NodeView} Found node. If no node is found, null is retured.
        */
        findNearestNode(centerNode: TreeNodeView, dir: Direction): TreeNodeView;
        /**
           @method ChangeFocusedLabel
           @param {string} Label If label is null, there is no focused label.
        */
        changeFocusedLabel(label: string): void;
        focusedLabel: string;
        initializeView(nodeView: TreeNodeView): void;
        draw(label?: string, duration?: number, fixedNode?: TreeNodeView): void;
        forceAppendAllOutOfScreenNode(): void;
        clear(): void;
        focusedView: TreeNodeView;
        navigateUp(): boolean;
        navigateDown(): boolean;
        navigateLeft(): boolean;
        navigateRight(): boolean;
        navigateHome(): void;
        navigateParent(): void;
    }
}
