// ***************************************************************************
// Copyright (c) 2014, AssureNote project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// *  Redistributions of source code must retain the above copyright notice,
//    this list of conditions and the following disclaimer.
// *  Redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
// TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
// PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
// OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
// **************************************************************************

module VisModelJS {

    export class ShapeSizePreFetcher {
        private queue: Shape[] = [];
        private timerHandle: number = 0;
        private dummyDiv: HTMLDivElement = document.createElement("div");

        constructor() {
            this.dummyDiv.style.position = "absolute";
            this.dummyDiv.style.top = "1000%";
            document.body.appendChild(this.dummyDiv);
        }

        private start() {
            this.timerHandle = setInterval(() => {
                var StartTime = Utils.getTime();
                while (this.queue.length > 0 && Utils.getTime() - StartTime < 16) {
                    var shape = this.queue.shift();
                    if (shape.nodeView && !shape.isSizeCached) {
                        shape.prepareContent();
                        if (!shape.content.parentElement) {
                            this.dummyDiv.appendChild(shape.content);
                        }
                        shape.nodeWidth;
                        shape.headHeight;
                        this.dummyDiv.removeChild(shape.content);
                    }
                }
                if (this.queue.length == 0) {
                    clearInterval(this.timerHandle);
                    this.timerHandle = 0;
                }
            }, 20);
        }

        addShape(shape: Shape) {
            this.queue.push(shape);
            if (!this.timerHandle) {
                this.start();
            }
        }
    }

    export class ShapeFactory {
        private static factory: ShapeFactory;

        static setFactory(factory: ShapeFactory) {
            ShapeFactory.factory = factory;
        }

        static createShape(node: TreeNodeView): Shape {
            return ShapeFactory.factory.createShape(node);
        }

        createShape(node: TreeNodeView): Shape {
            throw Error("Not impremented");
            return null;
        }
    }

    export class Shape {
        shapeGroup: SVGGElement;
        arrowPath: SVGPathElement;
        content: HTMLElement;
        private colorStyles: string[] = [ColorStyle.Default];
        private nodeWidthCache: number;
        private nodeHeightCache: number;
        private headBoundingBox: Rect; // Head is the node and Left and Right.
        private treeBoundingBox: Rect; // Tree is Head and Children

        private static asyncSizePrefetcher: ShapeSizePreFetcher;
        private static nodeHeightCache: { [index: string]: number } = {};

        private static defaultWidth = 150;

        private static arrowPathMaster: SVGPathElement = (() => {
            var Master = Utils.createSVGElement("path");
            Master.setAttribute("marker-end", "url(#Triangle-black)");
            Master.setAttribute("fill", "none");
            Master.setAttribute("stroke", "gray");
            Master.setAttribute("d", "M0,0 C0,0 0,0 0,0");
            return Master;
        })();


        constructor(public nodeView: TreeNodeView) {
            this.content = null;
            this.nodeWidthCache = Shape.defaultWidth;
            this.nodeHeightCache = 0;
            this.headBoundingBox = new Rect(0, 0, 0, 0);
            this.treeBoundingBox = new Rect(0, 0, 0, 0);
            if (Shape.asyncSizePrefetcher == null) {
                Shape.asyncSizePrefetcher = new ShapeSizePreFetcher();
            }
            Shape.asyncSizePrefetcher.addShape(this);
        }

        get isSizeCached(): boolean {
            return this.nodeHeightCache != 0 && this.nodeWidthCache != 0
        }

        private static createArrowPath(): SVGPathElement {
            return <SVGPathElement>Shape.arrowPathMaster.cloneNode();
        }

        setTreeRect(localX: number, localY: number, width: number, height: number): void {
            this.setTreeUpperLeft(localX, localY);
            this.setTreeSize(width, height);
        }

        setHeadRect(localX: number, localY: number, width: number, height: number): void {
            this.setHeadUpperLeft(localX, localY);
            this.setHeadSize(width, height);
        }

        setTreeSize(width: number, height: number): void {
            this.treeBoundingBox.width = width;
            this.treeBoundingBox.height = height;
        }

        setHeadSize(width: number, height: number): void {
            this.headBoundingBox.width = width;
            this.headBoundingBox.height = height;
        }

        get nodeWidth(): number {
            return this.nodeWidthCache;
        }

        get nodeHeight(): number {
            if (this.nodeHeightCache == 0) {
                var Cached = Shape.nodeHeightCache[this.content.innerHTML];
                if (Cached) {
                    this.nodeHeightCache = Cached;
                } else {
                    Shape.nodeHeightCache[this.content.innerHTML] = this.nodeHeightCache = this.content.clientHeight;
                }
            }
            return this.nodeHeightCache;
        }

        get treeWidth(): number {
            if (this.treeBoundingBox.width == 0) {
                this.treeBoundingBox.width = 150; //FIXME
            }
            return this.treeBoundingBox.width;
        }

        get treeHeight(): number {
            if (this.treeBoundingBox.height == 0) {
                this.treeBoundingBox.height = 100; //FIXME
            }
            return this.treeBoundingBox.height;
        }

        get headWidth(): number {
            if (this.headBoundingBox.width == 0) {
                this.headBoundingBox.width = 150; //FIXME
            }
            return this.headBoundingBox.width;
        }

        get headHeight(): number {
            if (this.headBoundingBox.height == 0) {
                this.headBoundingBox.height = 100; //FIXME
            }
            return this.headBoundingBox.height;
        }

        get treeLeftLocalX(): number {
            return this.treeBoundingBox.x;
        }

        get headLeftLocalX(): number {
            return this.headBoundingBox.x;
        }

        setTreeUpperLeft(localX: number, localY: number): void {
            this.treeBoundingBox.x = localX;
            this.treeBoundingBox.y = localY;
        }

        setHeadUpperLeft(localX: number, localY: number): void {
            this.headBoundingBox.x = localX;
            this.headBoundingBox.y = localY;
        }

        updateHtmlClass() {
            this.content.className = "node";
        }

        private formatNewLine(doc: string) {
            return doc.replace(/\r\n|\n|\r/g, '<br>');
        }

        prepareHTMLContent(): void {
            if (this.content == null) {
                var div = document.createElement("div");
                this.content = div;

                div.id = this.nodeView.label;
                div.setAttribute("data-nodelabel", this.nodeView.label);

                if (this.nodeView.label) {
                    var h4 = document.createElement("h4");
                    h4.textContent = this.nodeView.label;
                    div.appendChild(h4);
                }
                if (this.nodeView.content) {
                    var p = document.createElement("p");
                    p.innerText = this.nodeView.content.trim();
                    div.appendChild(p);
                }
                this.updateHtmlClass();
            }
        }

        prepareContent() {
            this.prepareHTMLContent();
            this.prepareSVGContent();
        }

        render(htmlContentFragment: DocumentFragment, svgNodeFragment: DocumentFragment, svgConnectionFragment: DocumentFragment): void {
            svgNodeFragment.appendChild(this.shapeGroup);
            if (this.arrowPath != null && this.nodeView.parent != null) {
                svgConnectionFragment.appendChild(this.arrowPath);
            }
            htmlContentFragment.appendChild(this.content);
        }

        fitSizeToContent(): void {
        }

        private _willFadein = false;
        private _gxCache = null;
        private _gyCache = null;

        setPosition(x: number, y: number): void {
            if (this.nodeView.visible) {
                var div = this.content;
                if (div != null) {
                    div.style.left = x + "px";
                    div.style.top = y + "px";
                }
                var mat = this.shapeGroup.transform.baseVal.getItem(0).matrix;
                mat.e = x;
                mat.f = y;
            }
            this._gxCache = x;
            this._gyCache = y;
        }

        private set opacity(value: number) {
            this.content.style.opacity = value.toString();
            this.shapeGroup.style.opacity = value.toString();
        }

        private fadein(animationCallbacks: Function[], duration: number): void {
            var V = 1 / duration;
            var opacity = 0;
            animationCallbacks.push((deltaT: number) => {
                opacity += V * deltaT;
                this.opacity = this.arrowOpacity = opacity;
            });
        }

        static __Debug_Animation_SkippedNodeCount;
        static __Debug_Animation_TotalNodeCount;

        public moveTo(animationCallbacks: Function[], x: number, y: number, duration: number, screenRect?: Rect): void {
            if (duration <= 0) {
                this.setPosition(x, y);
                return;
            }

            if (this.willFadein) {
                if (screenRect && (y + this.nodeHeight < screenRect.y || y > screenRect.y + screenRect.height)) {
                    this.setPosition(x, y);
                    this._willFadein = false;
                    return;
                }
                this.fadein(animationCallbacks, duration);
                this._willFadein = false;
                if (this._gxCache == null || this._gyCache == null) {
                    this.setPosition(x, y);
                    return;
                }
            }

            if (screenRect) {
                Shape.__Debug_Animation_TotalNodeCount++;
                if (this._gxCache + this.nodeWidth < screenRect.x || this._gxCache > screenRect.x + screenRect.width) {
                    if (x + this.nodeWidth < screenRect.x || x > screenRect.x + screenRect.width) {
                        this.setPosition(x, y);
                        return;
                    }
                }
                if (this._gyCache + this.nodeHeight < screenRect.y || this._gyCache > screenRect.y + screenRect.height) {
                    this.setPosition(x, y);
                    return;
                }
            }

            var VX = (x - this._gxCache) / duration;
            var VY = (y - this._gyCache) / duration;
            
            animationCallbacks.push((deltaT: number) => this.setPosition(this._gxCache + VX * deltaT, this._gyCache + VY * deltaT));
        }

        setFadeinBasePosition(startGX: number, startGY: number): void {
            this._willFadein = true;
            this._gxCache = startGX;
            this._gyCache = startGY;
            this._arrowP1Cache = this._arrowP2Cache = new Point(startGX + this.nodeWidth * 0.5, startGY + this.nodeHeight * 0.5);
        }

        get gxCache(): number {
            return this._gxCache;
        }

        get gyCache(): number {
            return this._gyCache;
        }

        get willFadein(): boolean {
            return this._willFadein || this._gxCache == null || this._gyCache == null;
        }

        clearAnimationCache(): void {
            this._gxCache = null;
            this._gyCache = null;
        }

        private arrowStart: SVGPathSegMovetoAbs;
        private arrowCurve: SVGPathSegCurvetoCubicAbs;

        prepareSVGContent(): void {
            this.shapeGroup = Utils.createSVGElement("g");
            this.shapeGroup.setAttribute("transform", "translate(0,0)");
            this.shapeGroup.setAttribute("class", this.colorStyles.join(" "));
            this.arrowPath = Shape.createArrowPath();
            this.arrowStart = <SVGPathSegMovetoAbs>this.arrowPath.pathSegList.getItem(0);
            this.arrowCurve = <SVGPathSegCurvetoCubicAbs>this.arrowPath.pathSegList.getItem(1);
        }

        private _arrowP1Cache: Point;
        private _arrowP2Cache: Point;

        get arrowP1Cache(): Point {
            return this._arrowP1Cache;
        }

        get arrowP2Cache(): Point {
            return this._arrowP2Cache;
        }

        setArrowPosition(p1: Point, p2: Point, dir: Direction) {
            var start = this.arrowStart;
            var curve = this.arrowCurve;
            start.x = p1.x;
            start.y = p1.y;
            curve.x = p2.x;
            curve.y = p2.y;
            if (dir == Direction.Bottom || dir == Direction.Top) {
                var dx = Math.abs(p1.x - p2.x);
                curve.x1 = (9 * p1.x + p2.x) / 10;
                curve.y1 = p2.y;
                curve.x2 = (9 * p2.x + p1.x) / 10;
                curve.y2 = p1.y;
                if (dx > 300) {
                    curve.x1 = p1.x - 10 * (p1.x - p2.x < 0 ? -1 : 1);
                    curve.x2 = p2.x + 10 * (p1.x - p2.x < 0 ? -1 : 1);
                }
                if (dx < 50) {
                    curve.y1 = curve.y2 = (p1.y + p2.y) * 0.5;
                }
            } else {
                curve.x1 = (p1.x + p2.x) / 2;
                curve.y1 = (9 * p1.y + p2.y) / 10;
                curve.x2 = (p1.x + p2.x) / 2;
                curve.y2 = (9 * p2.y + p1.y) / 10;
            }
            this._arrowP1Cache = p1;
            this._arrowP2Cache = p2;
        }

        private set arrowOpacity(opacity: number) {
            this.arrowPath.style.opacity = opacity.toString();
        }

        moveArrowTo(animationCallbacks: Function[], p1: Point, p2: Point, dir: Direction, duration: number, screenRect?: Rect) {
            if (duration <= 0) {
                this.setArrowPosition(p1, p2, dir);
                return;
            }
            if (screenRect) {
                var R0 = this._arrowP1Cache.x < this._arrowP2Cache.x ? this._arrowP2Cache.x : this._arrowP1Cache.x; 
                var L0 = this._arrowP1Cache.x < this._arrowP2Cache.x ? this._arrowP1Cache.x : this._arrowP2Cache.x; 
                if (R0 < screenRect.x || L0 > screenRect.x + screenRect.width) {
                    var R1 = p1.x < p2.x ? p2.x : p1.x; 
                    var L1 = p1.x < p2.x ? p1.x : p2.x; 
                    if (R1  < screenRect.x || L1 > screenRect.x + screenRect.width) {
                        this.setArrowPosition(p1, p2, dir);
                        return;
                    }
                }
                if (this._arrowP2Cache.y < screenRect.y || this._arrowP1Cache.y > screenRect.y + screenRect.height) {
                    this.setArrowPosition(p1, p2, dir);
                    return;
                }
            }

            if (this._arrowP1Cache == this._arrowP2Cache && screenRect && (p2.y + this.nodeHeight < screenRect.y || p1.y > screenRect.y + screenRect.height)) {
                this.setArrowPosition(p1, p2, dir);
                return;
            }

            var P1VX = (p1.x - this._arrowP1Cache.x) / duration;
            var P1VY = (p1.y - this._arrowP1Cache.y) / duration;
            var P2VX = (p2.x - this._arrowP2Cache.x) / duration;
            var P2VY = (p2.y - this._arrowP2Cache.y) / duration;

            var CurrentP1 = this._arrowP1Cache.clone();
            var CurrentP2 = this._arrowP2Cache.clone();

            animationCallbacks.push((deltaT: number) => {
                CurrentP1.x += P1VX * deltaT;
                CurrentP1.y += P1VY * deltaT;
                CurrentP2.x += P2VX * deltaT;
                CurrentP2.y += P2VY * deltaT;
                this.setArrowPosition(CurrentP1, CurrentP2, dir);
            });
        }

        setArrowColorWhite(isWhite: boolean) {
            if (isWhite) {
                this.arrowPath.setAttribute("marker-end", "url(#Triangle-white)");
            } else {
                this.arrowPath.setAttribute("marker-end", "url(#Triangle-black)");
            }
        }

        getConnectorPosition(dir: Direction): Point {
            switch (dir) {
                case Direction.Right:
                    return new Point(this.nodeWidth, this.nodeHeight / 2);
                case Direction.Left:
                    return new Point(0, this.nodeHeight / 2);
                case Direction.Top:
                    return new Point(this.nodeWidth / 2, 0);
                case Direction.Bottom:
                    return new Point(this.nodeWidth / 2, this.nodeHeight);
                default:
                    return new Point(0, 0);
            }
        }

        addColorStyle(colorStyleCode: string): void {
            if (colorStyleCode) {
                if (this.colorStyles.indexOf(colorStyleCode) < 0) {
                    this.colorStyles.push(colorStyleCode);
                }
                if (this.shapeGroup) {
                    this.shapeGroup.setAttribute("class", this.colorStyles.join(" "));
                }
            }
        }

        removeColorStyle(ColorStyleCode: string): void {
            if (ColorStyleCode && ColorStyleCode != ColorStyle.Default) {
                var Index = this.colorStyles.indexOf(ColorStyleCode);
                if (Index > 0) {
                    this.colorStyles.splice(Index, 1);
                }
                if (this.shapeGroup) {
                    this.shapeGroup.setAttribute("class", this.colorStyles.join(" "));
                }
            }
        }

        getColorStyle(): string[] {
            return this.colorStyles;
        }

        setColorStyle(styles: string[]): void {
            this.colorStyles = styles;
            if (this.colorStyles.indexOf(ColorStyle.Default) < 0) {
                this.colorStyles.push(ColorStyle.Default);
            }
        }

        clearColorStyle(): void {
            this.colorStyles = [ColorStyle.Default];
            if (this.shapeGroup) {
                this.shapeGroup.setAttribute("class", this.colorStyles.join(" "));
            }
        }
    }
}
