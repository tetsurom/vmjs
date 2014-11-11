
module VisModelJS {

    export class NodeViewEvent extends VisModelEvent {
        node: TreeNodeView;
    }

    /**
        @class VisModelJS.VisualModelPanel
    */
    export class VisualModelPanel extends EventTarget {
        LayoutEngine: LayoutEngine;
        RootElement: HTMLDivElement;
        SVGLayerBox: SVGSVGElement;
        SVGLayer: SVGGElement;
        SVGLayerConnectorGroup: SVGGElement;
        SVGLayerNodeGroup: SVGGElement;
        EventMapLayer: HTMLDivElement;
        ContentLayer: HTMLDivElement;
        ControlLayer: HTMLDivElement;
        HiddenNodeBuffer: DocumentFragment;
        Viewport: ViewportManager;
        ViewMap: { [index: string]: TreeNodeView };
        TopNodeView: TreeNodeView;
        ActiveFlag: boolean;
        FocusedFlag: boolean;

        OnScreenNodeMap: { [index: string]: TreeNodeView } = {};
        HiddenNodeMap: { [index: string]: TreeNodeView } = {};

        private FocusedLabel: string;// A label pointed out or clicked.
        // We do not use FocusedView but FocusedLabel to make it modular.

        private FoldingAnimationTask = new VisModelJS.AnimationFrameTask();

        private makeItLayer(element: HTMLElement, width: string, height: string);
        private makeItLayer(element: SVGElement, width: string, height: string);
        private makeItLayer(element: any, width: string, height: string) {
            var style = element.style;
            style.position = "absolute";
            style.width = width;
            style.height = height;
            style.top = "0px";
            style.left = "0px";
        }
        
        constructor(placeHolder: HTMLDivElement) {
            super();
            if (!placeHolder) {
                throw new TypeError("placeHolder cannot be null.");
            }
            // Create Inner DOM
            this.RootElement = placeHolder
            var rootStyle = this.RootElement.style;
            if (rootStyle.position == "static") {
                rootStyle.position = "relative";
            }
            rootStyle.overflow = "hidden";

            // Create SVG Layer
            this.SVGLayerBox = Utils.createSVGElement("svg");
            this.makeItLayer(this.SVGLayerBox, "100%", "100%");

            this.SVGLayer = Utils.createSVGElement("g");
            this.SVGLayer.className.baseVal = "vismodel-svglayer";
            this.SVGLayerConnectorGroup = Utils.createSVGElement("g");
            this.SVGLayerNodeGroup = Utils.createSVGElement("g");

            this.SVGLayer.appendChild(this.SVGLayerConnectorGroup);
            this.SVGLayer.appendChild(this.SVGLayerNodeGroup);

            this.SVGLayer.id = "svg-layer";
            this.SVGLayer.setAttribute("transform", "translate(0,0)");
            this.SVGLayerBox.appendChild(this.SVGLayer);

            this.RootElement.appendChild(this.SVGLayerBox);

            // Create HTML Layer
            this.EventMapLayer = document.createElement("div");
            this.ContentLayer = document.createElement("div");
            this.EventMapLayer.className = "vismodel-eventmaplayer";
            this.ContentLayer.className = "vismodel-contentlayer";

            this.makeItLayer(this.EventMapLayer, "100%", "100%");
            this.makeItLayer(this.ContentLayer, "0px", "0px");
            this.ContentLayer.style.pointerEvents = "none";

            this.RootElement.appendChild(this.EventMapLayer);
            this.RootElement.appendChild(this.ContentLayer);

            // End of DOM creation

            this.HiddenNodeBuffer = document.createDocumentFragment();

            this.Viewport = new ViewportManager(this);
            this.LayoutEngine = new VerticalTreeLayoutEngine();

            this.Viewport.addEventListener("cameramove", () => {
                this.UpdateHiddenNodeList();
            });


            var clickEventIsHandledInViewport = false;
            var focused = false;
            document.addEventListener("click", (event: MouseEvent) => {
                clickEventIsHandledInViewport = false;
                setTimeout(() => {
                    if (focused && !clickEventIsHandledInViewport) {
                        focused = false;
                    } else if(!focused && clickEventIsHandledInViewport){
                        focused = true;
                    }
                }, 0);
            }, true);

            this.RootElement.addEventListener("click", (event: MouseEvent) => {
                var Label: string = Utils.getNodeLabelFromEvent(event);
                if (this.IsActive()) {
                    this.ChangeFocusedLabel(Label);
                }
                clickEventIsHandledInViewport = true;
                event.preventDefault();
                event.stopPropagation();
            });

            this.ContentLayer.addEventListener("dblclick", (event: MouseEvent) => {
                var Label: string = Utils.getNodeLabelFromEvent(event);
                if (Label) {
                    var node = this.ViewMap[Label];
                    var nodeevent = new NodeViewEvent();
                    nodeevent.type = "dblclick";
                    nodeevent.target = this;
                    nodeevent.node = node;
                    this.dispatchEvent(nodeevent);
                    event.stopPropagation();
                    event.preventDefault();
                }
            });

            document.addEventListener("keydown", (Event: KeyboardEvent) => {
                if (focused) {
                    this.OnKeyDown(Event);
                }
            }, true);

            var DragHandler = (e) => {
                e.stopPropagation();
                e.preventDefault();
            };

            this.ActiveFlag = true;
        }

        IsActive(): boolean {
            return this.ActiveFlag;
        }

        OnKeyDown(Event: KeyboardEvent): void {
            var Label: string;
            var handled = true;
            switch (Event.keyCode) {
                case 27: /*Esc*/
                    Event.preventDefault();
                    break;
                case 13: /*Enter*/
                    Event.preventDefault();
                    break;
                case 72: /*h*/
                case 37: /*left*/
                    this.NavigateLeft();
                    Event.preventDefault();
                    break;
                case 74: /*j*/
                case 40: /*down*/
                    this.NavigateDown();
                    Event.preventDefault();
                    break;
                case 75: /*k*/
                case 38: /*up*/
                    var Moved = this.NavigateUp();
                    if (!Moved && this.FocusedLabel) {
                        this.NavigateParent();
                    }
                    Event.preventDefault();
                    break;
                case 76: /*l*/
                case 39: /*right*/
                    this.NavigateRight();
                    Event.preventDefault();
                    break;
                case 36: /*home*/
                    this.NavigateHome();
                    Event.preventDefault();
                    break;
                case 187: /*+*/
                    if (Event.shiftKey) {
                        this.Viewport.camera.scale += 0.1;
                    }
                    Event.preventDefault();
                    break;
                case 189: /*-*/
                    if (Event.shiftKey) {
                        this.Viewport.camera.scale -= 0.1;
                    }
                    Event.preventDefault();
                    break;
                default:
                    handled = false;
                    break;
            }
            //if (handled) {
            //    Event.stopPropagation();
            //}
        }

        OnActivate(): void {
            this.Viewport.isPointerEnabled = true;
        }

        OnDeactivate(): void {
            this.Viewport.isPointerEnabled = false;
        }

        /**
            @method MoveToNearestNode
            @param {AssureNote.Direction} Dir 
        */
        MoveToNearestNode(Dir: Direction): boolean {
            var NextNode = this.FindNearestNode(this.ViewMap[this.FocusedLabel], Dir);
            if (NextNode) {
                this.FocusAndMoveToNode(NextNode);
            }
            return !!NextNode;
        }

        /**
            @method FocusAndMoveToNode
        */
        FocusAndMoveToNode(Node: TreeNodeView): void;
        FocusAndMoveToNode(Label: string): void;
        FocusAndMoveToNode(Node: any): void {
            if (Node != null) {
                var NextNode: TreeNodeView = Node.constructor == String ? this.ViewMap[Node] : Node;
                if (NextNode != null) {
                    this.ChangeFocusedLabel(NextNode.label);
                    this.Viewport.camera.moveTo(NextNode.centerGx, NextNode.centerGy, this.Viewport.camera.scale, 50);
                }
            }
        }

        /**
            @method FindNearestNode
            @param {AssureNote.NodeView} CenterNode. If null is given, Camera position is used instead of the node.
            @param {AssureNote.Direction} Dir 
            @return {AssureNote.NodeView} Found node. If no node is found, null is retured.
        */
        FindNearestNode(CenterNode: TreeNodeView, Dir: Direction): TreeNodeView {
            var RightLimitVectorX: number = 1;
            var RightLimitVectorY: number = 1;
            var LeftLimitVectorX: number = 1;
            var LeftLimitVectorY: number = 1;

            switch (Dir) {
                case Direction.Right:
                    LeftLimitVectorY = -1;
                    break;
                case Direction.Left:
                    RightLimitVectorX = -1;
                    RightLimitVectorY = -1;
                    LeftLimitVectorX = -1;
                    break;
                case Direction.Top:
                    RightLimitVectorY = -1;
                    LeftLimitVectorX = -1;
                    LeftLimitVectorY = -1;
                    break;
                case Direction.Bottom:
                    RightLimitVectorX = -1;
                    break;
            }
            var NearestNode: TreeNodeView = null;
            var CurrentMinimumDistanceSquere = Infinity;
            var CX = CenterNode ? CenterNode.centerGx : this.Viewport.camera.gx;
            var CY = CenterNode ? CenterNode.centerGy : this.Viewport.camera.gy;
            this.TopNodeView.traverseVisibleNode((Node: TreeNodeView) => {
                var DX = Node.centerGx - CX;
                var DY = Node.centerGy - CY;
                var DDotR = DX * RightLimitVectorX + DY * RightLimitVectorY;
                var DDotL = DX * LeftLimitVectorX + DY * LeftLimitVectorY;
                if (DDotR > 0 && DDotL > 0) {
                    var DistanceSquere = DX * DX + DY * DY;
                    if (DistanceSquere < CurrentMinimumDistanceSquere) {
                        CurrentMinimumDistanceSquere = DistanceSquere;
                        NearestNode = Node;
                    }
                }
            });
            return NearestNode;
        }

        /**
           @method ChangeFocusedLabel
           @param {string} Label If label is null, there is no focused label.
        */
        ChangeFocusedLabel(Label: string): void {
            //Utils.UpdateHash(Label);
            if (Label == null) {
                var oldNodeView = this.ViewMap[this.FocusedLabel];
                if (oldNodeView != null) {
                    oldNodeView.shape.removeColorStyle(ColorStyle.Highlight);
                }
                this.FocusedLabel = null;
                return;
            }
            var nodeview = this.ViewMap[Label];
            if (nodeview != null) {
                var oldNodeView = this.ViewMap[this.FocusedLabel];
                if (oldNodeView != null) {
                    oldNodeView.shape.removeColorStyle(ColorStyle.Highlight);
                }
                this.FocusedLabel = Label;
                nodeview.shape.addColorStyle(ColorStyle.Highlight);
            }
        }

        GetFocusedLabel(): string {
            return this.FocusedLabel;
        }

        InitializeView(NodeView: TreeNodeView): void {
            this.TopNodeView = NodeView;
            this.ViewMap = {};
            this.TopNodeView.UpdateViewMap(this.ViewMap);
        }

        Draw(Label?: string, Duration?: number, FixedNode?: TreeNodeView): void {
            var t0 = Utils.getTime();
            this.Clear();
            var t1 = Utils.getTime();
            //console.log("Clear: " + (t1 - t0));
            var TargetView = this.ViewMap[Label];

            if (TargetView == null) {
                TargetView = this.TopNodeView;
            }

            var FixedNodeGX0: number;
            var FixedNodeGY0: number;
            var FixedNodeDX: number;
            var FixedNodeDY: number;
            if (FixedNode) {
                FixedNodeGX0 = FixedNode.gx;
                FixedNodeGY0 = FixedNode.gy;
            }

            this.LayoutEngine.DoLayout(this, TargetView);

            this.ContentLayer.style.display = "none";
            this.SVGLayer.style.display = "none";

            //GSNShape.__Debug_Animation_SkippedNodeCount = 0;
            //GSNShape.__Debug_Animation_TotalNodeCount = 0;

            this.FoldingAnimationTask.cancel(true);

            TreeNodeView.setGlobalPositionCacheEnabled(true);
            var FoldingAnimationCallbacks: Function[] = [];

            var PageRect = this.Viewport.pageRectInGxGy;
            if (FixedNode) {
                FixedNodeDX = FixedNode.gx - FixedNodeGX0;
                FixedNodeDY = FixedNode.gy - FixedNodeGY0;
                if (FixedNodeDX > 0) {
                    PageRect.width += FixedNodeDX;
                } else {
                    PageRect.width -= FixedNodeDX;
                    PageRect.x += FixedNodeDX;
                }
                var Scale = this.Viewport.camera.scale;
                var Task = this.Viewport.createMoveTaskFunction(FixedNodeDX, FixedNodeDY, Scale, Duration);
                if (Task) {
                    FoldingAnimationCallbacks.push(Task);
                } else {
                    FoldingAnimationCallbacks.push(() => { this.UpdateHiddenNodeList(); });
                }
            } else {
                FoldingAnimationCallbacks.push(() => { this.UpdateHiddenNodeList(); });
            }

            var t2 = Utils.getTime();
            TargetView.updateNodePosition(FoldingAnimationCallbacks, Duration, PageRect);
            TargetView.clearAnimationCache();
            var t3 = Utils.getTime();
            //console.log("Update: " + (t3 - t2));
            this.FoldingAnimationTask.startMany(Duration, FoldingAnimationCallbacks);

            var Shape = TargetView.shape;
            this.Viewport.camera.limitRect = new Rect(Shape.GetTreeLeftLocalX() - 100, -100, Shape.GetTreeWidth() + 200, Shape.GetTreeHeight() + 200);

            this.TopNodeView.traverseVisibleNode((Node: TreeNodeView) => {
                if (Node.isInRect(PageRect)) {
                    this.OnScreenNodeMap[Node.label] = Node;
                } else {
                    this.HiddenNodeMap[Node.label] = Node;
                    this.HiddenNodeBuffer.appendChild(Node.shape.Content);
                    this.HiddenNodeBuffer.appendChild(Node.shape.ShapeGroup);
                }
            });

            TreeNodeView.setGlobalPositionCacheEnabled(false);
            this.ContentLayer.style.display = "";
            this.SVGLayer.style.display = "";
            //console.log("Animation: " + GSNShape.__Debug_Animation_TotalNodeCount + " nodes moved, " +
            //    GSNShape.__Debug_Animation_SkippedNodeCount + " nodes skipped. reduce rate = " +
            //    GSNShape.__Debug_Animation_SkippedNodeCount / GSNShape.__Debug_Animation_TotalNodeCount);
        }

        public ForceAppendAllOutOfScreenNode() {
            var UpdateArrow = (Node: TreeNodeView) => {
                if (Node.parent) {
                    var Arrow = Node.shape.ArrowPath;
                    if (Arrow.parentNode != this.HiddenNodeBuffer) {
                        this.HiddenNodeBuffer.appendChild(Arrow);
                    }
                }
            };
            for (var Label in this.HiddenNodeMap) {
                var Node = this.HiddenNodeMap[<string>Label];
                delete this.HiddenNodeMap[<string>Label];
                this.OnScreenNodeMap[<string>Label] = Node;
                this.ContentLayer.appendChild(Node.shape.Content);
                this.SVGLayerNodeGroup.appendChild(Node.shape.ShapeGroup);
                UpdateArrow(Node);
            }
        }

        private UpdateHiddenNodeList() {
            TreeNodeView.setGlobalPositionCacheEnabled(true);
            var PageRect = this.Viewport.pageRectInGxGy;
            var UpdateArrow = (Node: TreeNodeView) => {
                if (Node.parent) {
                    var Arrow = Node.shape.ArrowPath;
                    if (Node.isConnectorInRect(PageRect)) {
                        if (Arrow.parentNode != this.SVGLayerConnectorGroup) {
                            this.SVGLayerConnectorGroup.appendChild(Arrow);
                        }
                    } else {
                        if (Arrow.parentNode != this.HiddenNodeBuffer) {
                            this.HiddenNodeBuffer.appendChild(Arrow);
                        }
                    }
                }
            };
            for (var Label in this.OnScreenNodeMap) {
                var Node = this.OnScreenNodeMap[<string>Label];
                if (!Node.isInRect(PageRect)) {
                    delete this.OnScreenNodeMap[<string>Label];
                    this.HiddenNodeMap[<string>Label] = Node;
                    this.HiddenNodeBuffer.appendChild(Node.shape.Content);
                    this.HiddenNodeBuffer.appendChild(Node.shape.ShapeGroup);
                }
                UpdateArrow(Node);
            }
            for (var Label in this.HiddenNodeMap) {
                var Node = this.HiddenNodeMap[<string>Label];
                if (Node.isInRect(PageRect)) {
                    delete this.HiddenNodeMap[<string>Label];
                    this.OnScreenNodeMap[<string>Label] = Node;
                    this.ContentLayer.appendChild(Node.shape.Content);
                    this.SVGLayerNodeGroup.appendChild(Node.shape.ShapeGroup);
                }
                UpdateArrow(Node);
            }
            TreeNodeView.setGlobalPositionCacheEnabled(false);
            ////console.log("Visible:Hidden = " + Object.keys(this.OnScreenNodeMap).length + ":" + Object.keys(this.HiddenNodeMap).length);
        }

        Clear(): void {
            this.RootElement.style.display = "none";
            this.ContentLayer.innerHTML = "";
            this.SVGLayer.removeChild(this.SVGLayerConnectorGroup);
            this.SVGLayer.removeChild(this.SVGLayerNodeGroup);
            this.SVGLayerConnectorGroup = Utils.createSVGElement("g");
            this.SVGLayerNodeGroup = Utils.createSVGElement("g");
            this.SVGLayer.appendChild(this.SVGLayerConnectorGroup);
            this.SVGLayer.appendChild(this.SVGLayerNodeGroup);
            this.HiddenNodeMap = {};
            this.OnScreenNodeMap = {};
            this.HiddenNodeBuffer = document.createDocumentFragment();
            this.RootElement.style.display = "";
        }

        GetFocusedView(): TreeNodeView {
            if (this.ViewMap) {
                return this.ViewMap[this.FocusedLabel];
            }
            return null;
        }

        NavigateUp(): boolean {
            return this.MoveToNearestNode(Direction.Top);
        }
        NavigateDown(): boolean {
            return this.MoveToNearestNode(Direction.Bottom);
        }
        NavigateLeft(): boolean {
            return this.MoveToNearestNode(Direction.Left);
        }
        NavigateRight(): boolean {
            return this.MoveToNearestNode(Direction.Right);
        }
        NavigateHome(): void {
            this.FocusAndMoveToNode(this.TopNodeView);
        }
        NavigateParent(): void {
            if (this.FocusedLabel) {
                var Parent = this.ViewMap[this.FocusedLabel].parent;
                if (Parent) {
                    this.FocusAndMoveToNode(this.ViewMap[this.FocusedLabel].parent);
                    return;
                }
            }
            this.FocusAndMoveToNode(this.TopNodeView);
        }

    }
}
