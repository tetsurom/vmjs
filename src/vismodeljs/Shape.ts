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
        Queue: Shape[] = [];
        TimerHandle: number = 0;
        DummyDiv: HTMLDivElement = document.createElement("div");

        constructor() {
            this.DummyDiv.style.position = "absolute";
            this.DummyDiv.style.top = "1000%";
            document.body.appendChild(this.DummyDiv);
            var LastQueueSize = 0;
            //for debug
            setInterval(() => {
                if (!LastQueueSize) {
                    LastQueueSize = this.Queue.length;
                }
                if (LastQueueSize - this.Queue.length) {
                    console.log("size prefetch: " + this.Queue.length + " nodes left. " + (1000 / (LastQueueSize - this.Queue.length)) + "ms/node");
                }
                LastQueueSize = this.Queue.length;
            }, 1000);
        }

        private Start() {
            this.TimerHandle = setInterval(() => {
                var StartTime = Utils.getTime();
                while (this.Queue.length > 0 && Utils.getTime() - StartTime < 16) {
                    var Shape = this.Queue.shift();
                    if (Shape.NodeView && !Shape.IsSizeCached()) {
                        Shape.PrepareContent();
                        if (!Shape.Content.parentElement) {
                            this.DummyDiv.appendChild(Shape.Content);
                        }
                        Shape.GetNodeWidth();
                        Shape.GetHeadHeight();
                        this.DummyDiv.removeChild(Shape.Content);
                    }
                }
                if (this.Queue.length == 0) {
                    clearInterval(this.TimerHandle);
                    this.TimerHandle = 0;
                }
            }, 20);
        }

        AddShape(Shape: Shape) {
            this.Queue.push(Shape);
            if (!this.TimerHandle) {
                this.Start();
            }
        }
    }

    export class ShapeFactory {
        private static Factory: ShapeFactory;

        static SetFactory(Factory: ShapeFactory) {
            ShapeFactory.Factory = Factory;
        }

        static CreateShape(Node: TreeNodeView): Shape {
            return ShapeFactory.Factory.CreateShape(Node);
        }

        CreateShape(Node: TreeNodeView): Shape {
            throw Error("Not impremented");
            return null;
        }
    }

    export class Shape {
        ShapeGroup: SVGGElement;
        ArrowPath: SVGPathElement;
        Content: HTMLElement;
        private ColorStyles: string[] = [ColorStyle.Default];
        private NodeWidthCache: number;
        private NodeHeightCache: number;
        private HeadBoundingBox: Rect; // Head is the node and Left and Right.
        private TreeBoundingBox: Rect; // Tree is Head and Children

        private static AsyncSizePrefetcher: ShapeSizePreFetcher;
        private static NodeHeightCache: { [index: string]: number } = {};

        private static DefaultWidth = 150;

        private static ArrowPathMaster: SVGPathElement = (() => {
            var Master = Utils.createSVGElement("path");
            Master.setAttribute("marker-end", "url(#Triangle-black)");
            Master.setAttribute("fill", "none");
            Master.setAttribute("stroke", "gray");
            Master.setAttribute("d", "M0,0 C0,0 0,0 0,0");
            return Master;
        })();


        constructor(public NodeView: TreeNodeView) {
            this.Content = null;
            this.NodeWidthCache = Shape.DefaultWidth;
            this.NodeHeightCache = 0;
            this.HeadBoundingBox = new Rect(0, 0, 0, 0);
            this.TreeBoundingBox = new Rect(0, 0, 0, 0);
            if (Shape.AsyncSizePrefetcher == null) {
                Shape.AsyncSizePrefetcher = new ShapeSizePreFetcher();
            }
            Shape.AsyncSizePrefetcher.AddShape(this);
        }

        IsSizeCached(): boolean {
            return this.NodeHeightCache != 0 && this.NodeWidthCache != 0
        }

        private static CreateArrowPath(): SVGPathElement {
            return <SVGPathElement>Shape.ArrowPathMaster.cloneNode();
        }

        SetTreeRect(LocalX: number, LocalY: number, Width: number, Height: number): void {
            this.SetTreeUpperLeft(LocalX, LocalY);
            this.SetTreeSize(Width, Height);
        }

        SetHeadRect(LocalX: number, LocalY: number, Width: number, Height: number): void {
            this.SetHeadUpperLeft(LocalX, LocalY);
            this.SetHeadSize(Width, Height);
        }

        SetTreeSize(Width: number, Height: number): void {
            this.TreeBoundingBox.width = Width;
            this.TreeBoundingBox.height = Height;
        }

        SetHeadSize(Width: number, Height: number): void {
            this.HeadBoundingBox.width = Width;
            this.HeadBoundingBox.height = Height;
        }

        GetNodeWidth(): number {
            return this.NodeWidthCache;
        }

        GetNodeHeight(): number {
            if (this.NodeHeightCache == 0) {
                var Cached = Shape.NodeHeightCache[this.Content.innerHTML];
                if (Cached) {
                    this.NodeHeightCache = Cached;
                } else {
                    Shape.NodeHeightCache[this.Content.innerHTML] = this.NodeHeightCache = this.Content.clientHeight;
                }
            }
            return this.NodeHeightCache;
        }

        GetTreeWidth(): number {
            if (this.TreeBoundingBox.width == 0) {
                this.TreeBoundingBox.width = 150; //FIXME
            }
            return this.TreeBoundingBox.width;
        }

        GetTreeHeight(): number {
            if (this.TreeBoundingBox.height == 0) {
                this.TreeBoundingBox.height = 100; //FIXME
            }
            return this.TreeBoundingBox.height;
        }

        GetHeadWidth(): number {
            if (this.HeadBoundingBox.width == 0) {
                this.HeadBoundingBox.width = 150; //FIXME
            }
            return this.HeadBoundingBox.width;
        }

        GetHeadHeight(): number {
            if (this.HeadBoundingBox.height == 0) {
                this.HeadBoundingBox.height = 100; //FIXME
            }
            return this.HeadBoundingBox.height;
        }

        GetTreeLeftLocalX(): number {
            return this.TreeBoundingBox.x;
        }

        GetHeadLeftLocalX(): number {
            return this.HeadBoundingBox.x;
        }

        SetTreeUpperLeft(LocalX: number, LocalY: number): void {
            this.TreeBoundingBox.x = LocalX;
            this.TreeBoundingBox.y = LocalY;
        }

        SetHeadUpperLeft(LocalX: number, LocalY: number): void {
            this.HeadBoundingBox.x = LocalX;
            this.HeadBoundingBox.y = LocalY;
        }

        UpdateHtmlClass() {
            this.Content.className = "node";
        }

        private FormatNewLine(doc: string) {
            return doc.replace(/\r\n|\n|\r/g, '<br>');
        }

        PrepareHTMLContent(): void {
            if (this.Content == null) {
                var div = document.createElement("div");
                this.Content = div;

                div.id = this.NodeView.label;
                div.setAttribute("data-nodelabel", this.NodeView.label);

                if (this.NodeView.label) {
                    var h4 = document.createElement("h4");
                    h4.textContent = this.NodeView.label;
                    div.appendChild(h4);
                }
                if (this.NodeView.content) {
                    var p = document.createElement("p");
                    p.innerText = this.NodeView.content.trim();
                    div.appendChild(p);
                }
                this.UpdateHtmlClass();
            }
        }

        PrepareContent() {
            this.PrepareHTMLContent();
            this.PrepareSVGContent();
        }

        Render(HtmlContentFragment: DocumentFragment, SvgNodeFragment: DocumentFragment, SvgConnectionFragment: DocumentFragment): void {
            SvgNodeFragment.appendChild(this.ShapeGroup);
            if (this.ArrowPath != null && this.NodeView.parent != null) {
                SvgConnectionFragment.appendChild(this.ArrowPath);
            }
            HtmlContentFragment.appendChild(this.Content);
        }

        FitSizeToContent(): void {
        }

        private willFadein = false;
        private GXCache = null;
        private GYCache = null;

        private RemoveAnimateElement(Animate: SVGElement) {
            if (Animate) {
                var Parent = Animate.parentNode;
                if (Parent) {
                    Parent.removeChild(Animate);
                }
            }
        }

        SetPosition(x: number, y: number): void {
            if (this.NodeView.visible) {
                var div = this.Content;
                if (div != null) {
                    div.style.left = x + "px";
                    div.style.top = y + "px";
                }
                var mat = this.ShapeGroup.transform.baseVal.getItem(0).matrix;
                mat.e = x;
                mat.f = y;
            }
            this.GXCache = x;
            this.GYCache = y;
        }

        private SetOpacity(Opacity: number) {
            this.Content.style.opacity = Opacity.toString();
            this.ShapeGroup.style.opacity = Opacity.toString();
        }

        private Fadein(AnimationCallbacks: Function[], Duration: number): void {
            var V = 1 / Duration;
            var Opacity = 0;
            AnimationCallbacks.push((deltaT: number) => {
                Opacity += V * deltaT;
                this.SetOpacity(Opacity);
                this.SetArrowOpacity(Opacity);
            });
        }

        static __Debug_Animation_SkippedNodeCount;
        static __Debug_Animation_TotalNodeCount;

        public MoveTo(AnimationCallbacks: Function[], x: number, y: number, Duration: number, ScreenRect?: Rect): void {
            if (Duration <= 0) {
                this.SetPosition(x, y);
                return;
            }

            if (this.WillFadein()) {
                if (ScreenRect && (y + this.GetNodeHeight() < ScreenRect.y || y > ScreenRect.y + ScreenRect.height)) {
                    this.SetPosition(x, y);
                    this.willFadein = false;
                    return;
                }
                this.Fadein(AnimationCallbacks, Duration);
                this.willFadein = false;
                if (this.GXCache == null || this.GYCache == null) {
                    this.SetPosition(x, y);
                    return;
                }
            }

            if (ScreenRect) {
                Shape.__Debug_Animation_TotalNodeCount++;
                if (this.GXCache + this.GetNodeWidth() < ScreenRect.x || this.GXCache > ScreenRect.x + ScreenRect.width) {
                    if (x + this.GetNodeWidth() < ScreenRect.x || x > ScreenRect.x + ScreenRect.width) {
                        this.SetPosition(x, y);
                        return;
                    }
                }
                if (this.GYCache + this.GetNodeHeight() < ScreenRect.y || this.GYCache > ScreenRect.y + ScreenRect.height) {
                    this.SetPosition(x, y);
                    return;
                }
            }

            var VX = (x - this.GXCache) / Duration;
            var VY = (y - this.GYCache) / Duration;
            
            AnimationCallbacks.push((deltaT: number) => this.SetPosition(this.GXCache + VX * deltaT, this.GYCache + VY * deltaT));
        }

        SetFadeinBasePosition(StartGX: number, StartGY: number): void {
            this.willFadein = true;
            this.GXCache = StartGX;
            this.GYCache = StartGY;
            this.ArrowP1Cache = this.ArrowP2Cache = new Point(StartGX + this.GetNodeWidth() * 0.5, StartGY + this.GetNodeHeight() * 0.5);
        }

        GetGXCache(): number {
            return this.GXCache;
        }

        GetGYCache(): number {
            return this.GYCache;
        }

        WillFadein(): boolean {
            return this.willFadein || this.GXCache == null || this.GYCache == null;
        }

        ClearAnimationCache(): void {
            this.GXCache = null;
            this.GYCache = null;
        }

        private ArrowStart: SVGPathSegMovetoAbs;
        private ArrowCurve: SVGPathSegCurvetoCubicAbs;

        PrepareSVGContent(): void {
            this.ShapeGroup = Utils.createSVGElement("g");
            this.ShapeGroup.setAttribute("transform", "translate(0,0)");
            this.ShapeGroup.setAttribute("class", this.ColorStyles.join(" "));
            this.ArrowPath = Shape.CreateArrowPath();
            this.ArrowStart = <SVGPathSegMovetoAbs>this.ArrowPath.pathSegList.getItem(0);
            this.ArrowCurve = <SVGPathSegCurvetoCubicAbs>this.ArrowPath.pathSegList.getItem(1);
        }

        private ArrowP1Cache: Point;
        private ArrowP2Cache: Point;

        GetArrowP1Cache(): Point {
            return this.ArrowP1Cache;
        }

        GetArrowP2Cache(): Point {
            return this.ArrowP2Cache;
        }

        SetArrowPosition(P1: Point, P2: Point, Dir: Direction) {
            var start = this.ArrowStart;
            var curve = this.ArrowCurve;
            start.x = P1.x;
            start.y = P1.y;
            curve.x = P2.x;
            curve.y = P2.y;
            if (Dir == Direction.Bottom || Dir == Direction.Top) {
                var DiffX = Math.abs(P1.x - P2.x);
                curve.x1 = (9 * P1.x + P2.x) / 10;
                curve.y1 = P2.y;
                curve.x2 = (9 * P2.x + P1.x) / 10;
                curve.y2 = P1.y;
                if (DiffX > 300) {
                    curve.x1 = P1.x - 10 * (P1.x - P2.x < 0 ? -1 : 1);
                    curve.x2 = P2.x + 10 * (P1.x - P2.x < 0 ? -1 : 1);
                }
                if (DiffX < 50) {
                    curve.y1 = curve.y2 = (P1.y + P2.y) * 0.5;
                }
            } else {
                curve.x1 = (P1.x + P2.x) / 2;
                curve.y1 = (9 * P1.y + P2.y) / 10;
                curve.x2 = (P1.x + P2.x) / 2;
                curve.y2 = (9 * P2.y + P1.y) / 10;
            }
            this.ArrowP1Cache = P1;
            this.ArrowP2Cache = P2;
        }

        private SetArrowOpacity(Opacity: number) {
            this.ArrowPath.style.opacity = Opacity.toString();
        }

        MoveArrowTo(AnimationCallbacks: Function[], P1: Point, P2: Point, Dir: Direction, Duration: number, ScreenRect?: Rect) {
            if (Duration <= 0) {
                this.SetArrowPosition(P1, P2, Dir);
                return;
            }
            if (ScreenRect) {
                var R0 = this.ArrowP1Cache.x < this.ArrowP2Cache.x ? this.ArrowP2Cache.x : this.ArrowP1Cache.x; 
                var L0 = this.ArrowP1Cache.x < this.ArrowP2Cache.x ? this.ArrowP1Cache.x : this.ArrowP2Cache.x; 
                if (R0 < ScreenRect.x || L0 > ScreenRect.x + ScreenRect.width) {
                    var R1 = P1.x < P2.x ? P2.x : P1.x; 
                    var L1 = P1.x < P2.x ? P1.x : P2.x; 
                    if (R1  < ScreenRect.x || L1 > ScreenRect.x + ScreenRect.width) {
                        this.SetArrowPosition(P1, P2, Dir);
                        return;
                    }
                }
                if (this.ArrowP2Cache.y < ScreenRect.y || this.ArrowP1Cache.y > ScreenRect.y + ScreenRect.height) {
                    this.SetArrowPosition(P1, P2, Dir);
                    return;
                }
            }

            if (this.ArrowP1Cache == this.ArrowP2Cache && ScreenRect && (P2.y + this.GetNodeHeight() < ScreenRect.y || P1.y > ScreenRect.y + ScreenRect.height)) {
                this.SetArrowPosition(P1, P2, Dir);
                return;
            }

            var P1VX = (P1.x - this.ArrowP1Cache.x) / Duration;
            var P1VY = (P1.y - this.ArrowP1Cache.y) / Duration;
            var P2VX = (P2.x - this.ArrowP2Cache.x) / Duration;
            var P2VY = (P2.y - this.ArrowP2Cache.y) / Duration;

            var CurrentP1 = this.ArrowP1Cache.clone();
            var CurrentP2 = this.ArrowP2Cache.clone();

            AnimationCallbacks.push((deltaT: number) => {
                CurrentP1.x += P1VX * deltaT;
                CurrentP1.y += P1VY * deltaT;
                CurrentP2.x += P2VX * deltaT;
                CurrentP2.y += P2VY * deltaT;
                this.SetArrowPosition(CurrentP1, CurrentP2, Dir);
            });
        }

        SetArrowColorWhite(IsWhite: boolean) {
            if (IsWhite) {
                this.ArrowPath.setAttribute("marker-end", "url(#Triangle-white)");
            } else {
                this.ArrowPath.setAttribute("marker-end", "url(#Triangle-black)");
            }
        }

        GetConnectorPosition(Dir: Direction): Point {
            switch (Dir) {
                case Direction.Right:
                    return new Point(this.GetNodeWidth(), this.GetNodeHeight() / 2);
                case Direction.Left:
                    return new Point(0, this.GetNodeHeight() / 2);
                case Direction.Top:
                    return new Point(this.GetNodeWidth() / 2, 0);
                case Direction.Bottom:
                    return new Point(this.GetNodeWidth() / 2, this.GetNodeHeight());
                default:
                    return new Point(0, 0);
            }
        }

        addColorStyle(ColorStyleCode: string): void {
            if (ColorStyleCode) {
                if (this.ColorStyles.indexOf(ColorStyleCode) < 0) {
                    this.ColorStyles.push(ColorStyleCode);
                }
                if (this.ShapeGroup) {
                    this.ShapeGroup.setAttribute("class", this.ColorStyles.join(" "));
                }
            }
        }

        removeColorStyle(ColorStyleCode: string): void {
            if (ColorStyleCode && ColorStyleCode != ColorStyle.Default) {
                var Index = this.ColorStyles.indexOf(ColorStyleCode);
                if (Index > 0) {
                    this.ColorStyles.splice(Index, 1);
                }
                if (this.ShapeGroup) {
                    this.ShapeGroup.setAttribute("class", this.ColorStyles.join(" "));
                }
            }
        }

        getColorStyle(): string[] {
            return this.ColorStyles;
        }

        setColorStyle(Styles: string[]): void {
            this.ColorStyles = Styles;
            if (this.ColorStyles.indexOf(ColorStyle.Default) < 0) {
                this.ColorStyles.push(ColorStyle.Default);
            }
        }

        ClearColorStyle(): void {
            this.ColorStyles = [ColorStyle.Default];
            if (this.ShapeGroup) {
                this.ShapeGroup.setAttribute("class", this.ColorStyles.join(" "));
            }
        }
    }
    /*
    export class GSNGoalShape extends Shape {
        BodyRect: SVGRectElement;
        ModuleRect: SVGRectElement;
        UndevelopedSymbol: SVGPolygonElement;

        private static ModuleSymbolMaster: SVGRectElement = (() => {
            var Master = Utils.CreateSVGElement("rect");
            Master.setAttribute("width", "80px");
            Master.setAttribute("height", "13px");
            Master.setAttribute("y", "-13px");
            return Master;
        })();

        private static UndevelopedSymbolMaster: SVGPolygonElement = (() => {
            var Master = Utils.CreateSVGElement("polygon");
            Master.setAttribute("points", "0 -20 -20 0 0 20 20 0");
            return Master;
        })();


        PrerenderSVGContent(manager: PluginManager): void {
            super.PrepareSVGContent(manager);
            this.BodyRect = Utils.CreateSVGElement("rect");
            this.ShapeGroup.appendChild(this.BodyRect);
            if (this.NodeView.IsFolded()) {
                this.ShapeGroup.appendChild(GSNGoalShape.ModuleSymbolMaster.cloneNode());
            }
            if (this.NodeView.Children == null && !this.NodeView.IsFolded()) {
                this.UndevelopedSymbol = <SVGPolygonElement>GSNGoalShape.UndevelopedSymbolMaster.cloneNode();
                this.ShapeGroup.appendChild(this.UndevelopedSymbol);
            }
        }

        FitSizeToContent(): void {
            this.BodyRect.setAttribute("width", this.GetNodeWidth().toString());
            this.BodyRect.setAttribute("height", this.GetNodeHeight().toString());
            if (this.NodeView.Children == null && !this.NodeView.IsFolded()) {
                var x = (this.GetNodeWidth() / 2).toString();
                var y = (this.GetNodeHeight() + 20).toString();
                this.UndevelopedSymbol.setAttribute("transform", "translate(" + x + "," + y + ")");
                this.UndevelopedSymbol.setAttribute("y", y + "px");
            }
        }

        UpdateHtmlClass() {
            this.Content.className = "node node-goal";
        }
    }

    export class GSNContextShape extends Shape {
        BodyRect: SVGRectElement;

        PrerenderSVGContent(manager: PluginManager): void {
            super.PrepareSVGContent(manager);
            this.BodyRect = Utils.CreateSVGElement("rect");
            this.ArrowPath.setAttribute("marker-end", "url(#Triangle-white)");
            this.BodyRect.setAttribute("rx", "10");
            this.BodyRect.setAttribute("ry", "10");
            this.ShapeGroup.appendChild(this.BodyRect);
        }

        FitSizeToContent(): void {
            this.BodyRect.setAttribute("width", this.GetNodeWidth().toString());
            this.BodyRect.setAttribute("height", this.GetNodeHeight().toString());
        }

        UpdateHtmlClass() {
            this.Content.className = "node node-context";
        }
    }

    export class GSNStrategyShape extends Shape {
        BodyPolygon: SVGPolygonElement;
        delta: number = 20;

        PrerenderSVGContent(manager: PluginManager): void {
            super.PrepareSVGContent(manager);
            this.BodyPolygon = Utils.CreateSVGElement("polygon");
            this.ShapeGroup.appendChild(this.BodyPolygon);
        }

        FitSizeToContent(): void {
            var w: number = this.GetNodeWidth();
            var h: number = this.GetNodeHeight();
            this.BodyPolygon.setAttribute("points", "" + this.delta + ",0 " + w + ",0 " + (w - this.delta) + "," + h + " 0," + h);
        }

        UpdateHtmlClass() {
            this.Content.className = "node node-strategy";
        }

        GetConnectorPosition(Dir: Direction): Point {
            switch (Dir) {
                case Direction.Right:
                    return new Point(this.GetNodeWidth() - this.delta / 2, this.GetNodeHeight() / 2);
                case Direction.Left:
                    return new Point(this.delta / 2, this.GetNodeHeight() / 2);
                case Direction.Top:
                    return new Point(this.GetNodeWidth() / 2, 0);
                case Direction.Bottom:
                    return new Point(this.GetNodeWidth() / 2, this.GetNodeHeight());
            }
        }
    }

    export class GSNEvidenceShape extends Shape {
        private BodyEllipse: SVGEllipseElement;
        private ClientHeight: number;

        PrerenderSVGContent(manager: PluginManager): void {
            super.PrepareSVGContent(manager);
            this.BodyEllipse = Utils.CreateSVGElement("ellipse");
            this.ShapeGroup.appendChild(this.BodyEllipse);
        }

        FitSizeToContent(): void {
            this.BodyEllipse.setAttribute("cx", (this.GetNodeWidth() / 2).toString());
            this.BodyEllipse.setAttribute("cy", (this.GetNodeHeight() / 2).toString());
            this.BodyEllipse.setAttribute("rx", (this.GetNodeWidth() / 2).toString());
            this.BodyEllipse.setAttribute("ry", (this.GetNodeHeight() / 2).toString());
        }

        UpdateHtmlClass() {
            this.Content.className = "node node-evidence";
        }
    }

    export class DCaseEvidenceShape extends Shape {
        private BodyEllipse: SVGEllipseElement;
        private ClientHeight: number;

        PrerenderSVGContent(manager: PluginManager): void {
            super.PrepareSVGContent(manager);
            this.BodyEllipse = Utils.CreateSVGElement("ellipse");
            this.ShapeGroup.appendChild(this.BodyEllipse);
        }

        FitSizeToContent(): void {
            this.BodyEllipse.setAttribute("cx", (this.GetNodeWidth() / 2).toString());
            this.BodyEllipse.setAttribute("cy", (this.GetNodeHeight() / 2).toString());
            this.BodyEllipse.setAttribute("rx", (this.GetNodeWidth() / 2).toString());
            this.BodyEllipse.setAttribute("ry", (this.GetNodeHeight() / 2).toString());
        }

        UpdateHtmlClass() {
            this.Content.className = "node node-evidence";
        }
    }
*/
}
