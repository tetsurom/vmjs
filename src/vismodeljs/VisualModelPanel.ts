
module VisModelJS {

    export class NodeViewEvent extends VisModelEvent {
        node: TreeNodeView;
    }

    /**
        @class VisModelJS.VisualModelPanel
    */
    export class VisualModelPanel extends EventTarget {
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
        viewMap: { [index: string]: TreeNodeView };
        topNodeView: TreeNodeView;
        _active: boolean;
        FocusedFlag: boolean;

        onScreenNodeMap: { [index: string]: TreeNodeView } = {};
        hiddenNodeMap: { [index: string]: TreeNodeView } = {};

        private _focusedLabel: string;// A label pointed out or clicked.
        // We do not use FocusedView but FocusedLabel to make it modular.

        private foldingAnimationTask = new VisModelJS.AnimationFrameTask();

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
            this.rootElement = placeHolder
            var rootStyle = this.rootElement.style;
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

            this.rootElement.appendChild(this.SVGLayerBox);

            // Create HTML Layer
            this.eventMapLayer = document.createElement("div");
            this.contentLayer = document.createElement("div");
            this.eventMapLayer.className = "vismodel-eventmaplayer";
            this.contentLayer.className = "vismodel-contentlayer";

            this.makeItLayer(this.eventMapLayer, "100%", "100%");
            this.makeItLayer(this.contentLayer, "0px", "0px");
            this.contentLayer.style.pointerEvents = "none";

            this.rootElement.appendChild(this.eventMapLayer);
            this.rootElement.appendChild(this.contentLayer);

            // End of DOM creation

            this.hiddenNodeBuffer = document.createDocumentFragment();

            this.viewport = new ViewportManager(this);
            this.layoutEngine = new VerticalTreeLayoutEngine();

            this.viewport.addEventListener("cameramove", () => {
                this.updateHiddenNodeList();
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

            this.rootElement.addEventListener("click", (event: MouseEvent) => {
                var label: string = Utils.getNodeLabelFromEvent(event);
                if (this.active) {
                    this.changeFocusedLabel(label);
                }
                clickEventIsHandledInViewport = true;
                event.preventDefault();
                event.stopPropagation();
            });

            this.contentLayer.addEventListener("dblclick", (event: MouseEvent) => {
                var Label: string = Utils.getNodeLabelFromEvent(event);
                if (Label) {
                    var node = this.viewMap[Label];
                    var nodeevent = new NodeViewEvent();
                    nodeevent.type = "dblclick";
                    nodeevent.target = this;
                    nodeevent.node = node;
                    this.dispatchEvent(nodeevent);
                    event.stopPropagation();
                    event.preventDefault();
                }
            });

            document.addEventListener("keydown", (event: KeyboardEvent) => {
                if (focused) {
                    this.onKeyDown(event);
                }
            }, true);

            this._active = true;
        }

        get active(): boolean {
            return this._active;
        }

        onKeyDown(event: KeyboardEvent): void {
            var Label: string;
            var handled = true;
            switch (event.keyCode) {
                case 27: /*Esc*/
                    event.preventDefault();
                    break;
                case 13: /*Enter*/
                    event.preventDefault();
                    break;
                case 72: /*h*/
                case 37: /*left*/
                    this.navigateLeft();
                    event.preventDefault();
                    break;
                case 74: /*j*/
                case 40: /*down*/
                    this.navigateDown();
                    event.preventDefault();
                    break;
                case 75: /*k*/
                case 38: /*up*/
                    var Moved = this.navigateUp();
                    if (!Moved && this._focusedLabel) {
                        this.navigateParent();
                    }
                    event.preventDefault();
                    break;
                case 76: /*l*/
                case 39: /*right*/
                    this.navigateRight();
                    event.preventDefault();
                    break;
                case 36: /*home*/
                    this.navigateHome();
                    event.preventDefault();
                    break;
                case 187: /*+*/
                    if (event.shiftKey) {
                        this.viewport.camera.scale += 0.1;
                    }
                    event.preventDefault();
                    break;
                case 189: /*-*/
                    if (event.shiftKey) {
                        this.viewport.camera.scale -= 0.1;
                    }
                    event.preventDefault();
                    break;
                default:
                    handled = false;
                    break;
            }
            //if (handled) {
            //    Event.stopPropagation();
            //}
        }

        onActivate(): void {
            this.viewport.isPointerEnabled = true;
        }

        onDeactivate(): void {
            this.viewport.isPointerEnabled = false;
        }

        /**
            @method MoveToNearestNode
            @param {AssureNote.Direction} Dir 
        */
        moveToNearestNode(dir: Direction): boolean {
            var nextNode = this.findNearestNode(this.viewMap[this._focusedLabel], dir);
            if (nextNode) {
                this.focusAndMoveToNode(nextNode);
            }
            return !!nextNode;
        }

        /**
            @method FocusAndMoveToNode
        */
        focusAndMoveToNode(node: TreeNodeView): void;
        focusAndMoveToNode(label: string): void;
        focusAndMoveToNode(node: any): void {
            if (node != null) {
                var nextNode: TreeNodeView = node.constructor == String ? this.viewMap[node] : node;
                if (nextNode != null) {
                    this.changeFocusedLabel(nextNode.label);
                    this.viewport.camera.moveTo(nextNode.centerGx, nextNode.centerGy, this.viewport.camera.scale, 50);
                }
            }
        }

        /**
            @method FindNearestNode
            @param {AssureNote.NodeView} CenterNode. If null is given, Camera position is used instead of the node.
            @param {AssureNote.Direction} Dir 
            @return {AssureNote.NodeView} Found node. If no node is found, null is retured.
        */
        findNearestNode(centerNode: TreeNodeView, dir: Direction): TreeNodeView {
            var rightLimitVectorX: number = 1;
            var rightLimitVectorY: number = 1;
            var leftLimitVectorX: number = 1;
            var leftLimitVectorY: number = 1;

            switch (dir) {
                case Direction.Right:
                    leftLimitVectorY = -1;
                    break;
                case Direction.Left:
                    rightLimitVectorX = -1;
                    rightLimitVectorY = -1;
                    leftLimitVectorX = -1;
                    break;
                case Direction.Top:
                    rightLimitVectorY = -1;
                    leftLimitVectorX = -1;
                    leftLimitVectorY = -1;
                    break;
                case Direction.Bottom:
                    rightLimitVectorX = -1;
                    break;
            }
            var nearestNode: TreeNodeView = null;
            var currentMinimumDistanceSquere = Infinity;
            var cx = centerNode ? centerNode.centerGx : this.viewport.camera.gx;
            var cy = centerNode ? centerNode.centerGy : this.viewport.camera.gy;
            this.topNodeView.traverseVisibleNode((Node: TreeNodeView) => {
                var dx = Node.centerGx - cx;
                var dy = Node.centerGy - cy;
                var DDotR = dx * rightLimitVectorX + dy * rightLimitVectorY;
                var DDotL = dx * leftLimitVectorX + dy * leftLimitVectorY;
                if (DDotR > 0 && DDotL > 0) {
                    var distanceSquere = dx * dx + dy * dy;
                    if (distanceSquere < currentMinimumDistanceSquere) {
                        currentMinimumDistanceSquere = distanceSquere;
                        nearestNode = Node;
                    }
                }
            });
            return nearestNode;
        }

        /**
           @method ChangeFocusedLabel
           @param {string} Label If label is null, there is no focused label.
        */
        changeFocusedLabel(label: string): void {
            //Utils.UpdateHash(Label);
            if (label == null) {
                var oldNodeView = this.viewMap[this._focusedLabel];
                if (oldNodeView != null) {
                    oldNodeView.shape.removeColorStyle(ColorStyle.Highlight);
                }
                this._focusedLabel = null;
                return;
            }
            var nodeview = this.viewMap[label];
            if (nodeview != null) {
                var oldNodeView = this.viewMap[this._focusedLabel];
                if (oldNodeView != null) {
                    oldNodeView.shape.removeColorStyle(ColorStyle.Highlight);
                }
                this._focusedLabel = label;
                nodeview.shape.addColorStyle(ColorStyle.Highlight);
            }
        }

        get focusedLabel(): string {
            return this._focusedLabel;
        }

        initializeView(nodeView: TreeNodeView): void {
            this.topNodeView = nodeView;
            this.viewMap = {};
            this.topNodeView.UpdateViewMap(this.viewMap);
        }

        draw(label?: string, duration?: number, fixedNode?: TreeNodeView): void {
            var t0 = Utils.getTime();
            this.clear();
            var t1 = Utils.getTime();
            //console.log("Clear: " + (t1 - t0));
            var target = this.viewMap[label];

            if (target == null) {
                target = this.topNodeView;
            }

            var fixedNodeGX0: number;
            var fixedNodeGY0: number;
            var fixedNodeDX: number;
            var fixedNodeDY: number;
            if (fixedNode) {
                fixedNodeGX0 = fixedNode.gx;
                fixedNodeGY0 = fixedNode.gy;
            }

            this.layoutEngine.doLayout(this, target);

            this.contentLayer.style.display = "none";
            this.SVGLayer.style.display = "none";

            //GSNShape.__Debug_Animation_SkippedNodeCount = 0;
            //GSNShape.__Debug_Animation_TotalNodeCount = 0;

            this.foldingAnimationTask.cancel(true);

            TreeNodeView.setGlobalPositionCacheEnabled(true);
            var foldingAnimationCallbacks: Function[] = [];

            var pageRect = this.viewport.pageRectInGxGy;
            if (fixedNode) {
                fixedNodeDX = fixedNode.gx - fixedNodeGX0;
                fixedNodeDY = fixedNode.gy - fixedNodeGY0;
                if (fixedNodeDX > 0) {
                    pageRect.width += fixedNodeDX;
                } else {
                    pageRect.width -= fixedNodeDX;
                    pageRect.x += fixedNodeDX;
                }
                var Scale = this.viewport.camera.scale;
                var Task = this.viewport.createMoveTaskFunction(fixedNodeDX, fixedNodeDY, Scale, duration);
                if (Task) {
                    foldingAnimationCallbacks.push(Task);
                } else {
                    foldingAnimationCallbacks.push(() => { this.updateHiddenNodeList(); });
                }
            } else {
                foldingAnimationCallbacks.push(() => { this.updateHiddenNodeList(); });
            }

            var t2 = Utils.getTime();
            target.updateNodePosition(foldingAnimationCallbacks, duration, pageRect);
            target.clearAnimationCache();
            var t3 = Utils.getTime();
            //console.log("Update: " + (t3 - t2));
            this.foldingAnimationTask.startMany(duration, foldingAnimationCallbacks);

            var Shape = target.shape;
            this.viewport.camera.limitRect = new Rect(Shape.treeLeftLocalX - 100, -100, Shape.treeWidth + 200, Shape.treeHeight + 200);

            this.topNodeView.traverseVisibleNode((Node: TreeNodeView) => {
                if (Node.isInRect(pageRect)) {
                    this.onScreenNodeMap[Node.label] = Node;
                } else {
                    this.hiddenNodeMap[Node.label] = Node;
                    this.hiddenNodeBuffer.appendChild(Node.shape.content);
                    this.hiddenNodeBuffer.appendChild(Node.shape.shapeGroup);
                }
            });

            TreeNodeView.setGlobalPositionCacheEnabled(false);
            this.contentLayer.style.display = "";
            this.SVGLayer.style.display = "";
            //console.log("Animation: " + GSNShape.__Debug_Animation_TotalNodeCount + " nodes moved, " +
            //    GSNShape.__Debug_Animation_SkippedNodeCount + " nodes skipped. reduce rate = " +
            //    GSNShape.__Debug_Animation_SkippedNodeCount / GSNShape.__Debug_Animation_TotalNodeCount);
        }

        public forceAppendAllOutOfScreenNode() {
            var UpdateArrow = (node: TreeNodeView) => {
                if (node.parent) {
                    var Arrow = node.shape.arrowPath;
                    if (Arrow.parentNode != this.hiddenNodeBuffer) {
                        this.hiddenNodeBuffer.appendChild(Arrow);
                    }
                }
            };
            for (var label in this.hiddenNodeMap) {
                var node = this.hiddenNodeMap[<string>label];
                delete this.hiddenNodeMap[<string>label];
                this.onScreenNodeMap[<string>label] = node;
                this.contentLayer.appendChild(node.shape.content);
                this.SVGLayerNodeGroup.appendChild(node.shape.shapeGroup);
                UpdateArrow(node);
            }
        }

        private updateHiddenNodeList() {
            TreeNodeView.setGlobalPositionCacheEnabled(true);
            var pageRect = this.viewport.pageRectInGxGy;
            var updateArrow = (node: TreeNodeView) => {
                if (node.parent) {
                    var arrow = node.shape.arrowPath;
                    if (node.isConnectorInRect(pageRect)) {
                        if (arrow.parentNode != this.SVGLayerConnectorGroup) {
                            this.SVGLayerConnectorGroup.appendChild(arrow);
                        }
                    } else {
                        if (arrow.parentNode != this.hiddenNodeBuffer) {
                            this.hiddenNodeBuffer.appendChild(arrow);
                        }
                    }
                }
            };
            for (var label in this.onScreenNodeMap) {
                var node = this.onScreenNodeMap[<string>label];
                if (!node.isInRect(pageRect)) {
                    delete this.onScreenNodeMap[<string>label];
                    this.hiddenNodeMap[<string>label] = node;
                    this.hiddenNodeBuffer.appendChild(node.shape.content);
                    this.hiddenNodeBuffer.appendChild(node.shape.shapeGroup);
                }
                updateArrow(node);
            }
            for (var label in this.hiddenNodeMap) {
                var node = this.hiddenNodeMap[<string>label];
                if (node.isInRect(pageRect)) {
                    delete this.hiddenNodeMap[<string>label];
                    this.onScreenNodeMap[<string>label] = node;
                    this.contentLayer.appendChild(node.shape.content);
                    this.SVGLayerNodeGroup.appendChild(node.shape.shapeGroup);
                }
                updateArrow(node);
            }
            TreeNodeView.setGlobalPositionCacheEnabled(false);
            ////console.log("Visible:Hidden = " + Object.keys(this.OnScreenNodeMap).length + ":" + Object.keys(this.HiddenNodeMap).length);
        }

        clear(): void {
            this.rootElement.style.display = "none";
            this.contentLayer.innerHTML = "";
            this.SVGLayer.removeChild(this.SVGLayerConnectorGroup);
            this.SVGLayer.removeChild(this.SVGLayerNodeGroup);
            this.SVGLayerConnectorGroup = Utils.createSVGElement("g");
            this.SVGLayerNodeGroup = Utils.createSVGElement("g");
            this.SVGLayer.appendChild(this.SVGLayerConnectorGroup);
            this.SVGLayer.appendChild(this.SVGLayerNodeGroup);
            this.hiddenNodeMap = {};
            this.onScreenNodeMap = {};
            this.hiddenNodeBuffer = document.createDocumentFragment();
            this.rootElement.style.display = "";
        }

        get focusedView(): TreeNodeView {
            if (this.viewMap) {
                return this.viewMap[this._focusedLabel];
            }
            return null;
        }

        navigateUp(): boolean {
            return this.moveToNearestNode(Direction.Top);
        }
        navigateDown(): boolean {
            return this.moveToNearestNode(Direction.Bottom);
        }
        navigateLeft(): boolean {
            return this.moveToNearestNode(Direction.Left);
        }
        navigateRight(): boolean {
            return this.moveToNearestNode(Direction.Right);
        }
        navigateHome(): void {
            this.focusAndMoveToNode(this.topNodeView);
        }
        navigateParent(): void {
            if (this._focusedLabel) {
                var Parent = this.viewMap[this._focusedLabel].parent;
                if (Parent) {
                    this.focusAndMoveToNode(this.viewMap[this._focusedLabel].parent);
                    return;
                }
            }
            this.focusAndMoveToNode(this.topNodeView);
        }

    }
}
