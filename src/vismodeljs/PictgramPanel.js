var VisModelJS;
(function (VisModelJS) {
    /**
    @class VisModelJS.VisualModelPanel
    */
    var VisualModelPanel = (function () {
        function VisualModelPanel(placeHolder) {
            var _this = this;
            this.OnScreenNodeMap = {};
            this.HiddenNodeMap = {};
            // We do not use FocusedView but FocusedLabel to make it modular.
            this.FoldingAnimationTask = new VisModelJS.AnimationFrameTask();
            if (!placeHolder) {
                throw new TypeError("placeHolder cannot be null.");
            }

            // Create Inner DOM
            this.RootElement = document.createElement("div");
            var placeHolderStyle = window.getComputedStyle(placeHolder);
            var rootStyle = this.RootElement.style;
            rootStyle.position = placeHolderStyle.position == "static" ? "relative" : placeHolderStyle.position;
            rootStyle.width = placeHolder.style.width;
            rootStyle.height = placeHolder.style.height;
            rootStyle.top = placeHolder.style.top;
            rootStyle.left = placeHolder.style.left;
            rootStyle.overflow = "hidden";

            // Create SVG Layer
            this.SVGLayerBox = VisModelJS.Utils.createSVGElement("svg");
            this.makeAsFullSizeLayer(this.SVGLayerBox);

            this.SVGLayer = VisModelJS.Utils.createSVGElement("g");
            this.SVGLayerConnectorGroup = VisModelJS.Utils.createSVGElement("g");
            this.SVGLayerNodeGroup = VisModelJS.Utils.createSVGElement("g");

            this.SVGLayer.appendChild(this.SVGLayerConnectorGroup);
            this.SVGLayer.appendChild(this.SVGLayerNodeGroup);

            this.SVGLayer.id = "svg-layer";
            this.SVGLayer.setAttribute("transform", "translate(0,0)");
            this.SVGLayerBox.appendChild(this.SVGLayer);

            this.RootElement.appendChild(this.SVGLayerBox);

            // Create HTML Layer
            this.EventMapLayer = document.createElement("div");
            this.ContentLayer = document.createElement("div");

            this.makeAsFullSizeLayer(this.EventMapLayer);
            this.makeAsFullSizeLayer(this.ContentLayer);
            this.ContentLayer.style.pointerEvents = "none";

            this.RootElement.appendChild(this.EventMapLayer);
            this.RootElement.appendChild(this.ContentLayer);

            // Replace placeholder
            placeHolder.parentElement.insertBefore(this.RootElement, placeHolder);
            placeHolder.style.display = "none";

            // End of DOM creation
            this.HiddenNodeBuffer = document.createDocumentFragment();

            this.Viewport = new VisModelJS.ViewportManager(this.SVGLayer, this.EventMapLayer, this.ContentLayer);
            this.LayoutEngine = new VisModelJS.SimpleLayoutEngine();

            this.Viewport.addEventListener("cameramove", function () {
                _this.UpdateHiddenNodeList();
            });

            this.ContentLayer.addEventListener("click", function (event) {
                var Label = VisModelJS.Utils.getNodeLabelFromEvent(event);

                //this.App.DebugP("click:" + Label);
                if (_this.IsActive()) {
                    _this.ChangeFocusedLabel(Label);
                }
                event.stopPropagation();
                event.preventDefault();
            });

            this.EventMapLayer.addEventListener("pointerdown", function (event) {
                if (_this.IsActive()) {
                    _this.ChangeFocusedLabel(null);
                }
            });

            //this.ContentLayer.addEventListener("contextmenu", (event: MouseEvent) => {
            //    var Label: string = Utils.GetNodeLabelFromEvent(event);
            //    var NodeView = this.ViewMap[Label];
            //    if (NodeView != null) {
            //        this.ChangeFocusedLabel(Label);
            //    } else {
            //        this.FocusedLabel = null;
            //    }
            //    event.preventDefault();
            //});
            //this.ContentLayer.addEventListener("dblclick", (event: MouseEvent) => {
            //    var Label: string = Utils.getNodeLabelFromEvent(event);
            //    var NodeView = this.ViewMap[Label];
            //    this.App.ExecDoubleClicked(NodeView);
            //    event.stopPropagation();
            //    event.preventDefault();
            //});
            this.ContentLayer.addEventListener("mouseover", function (event) {
            });

            this.ContentLayer.addEventListener("mouseleave", function (event) {
                /* We use mouseleave event instead of mouseout since mouseout/mouseenter fires
                every time the pointer enters the sub-element of ContentLayer.
                Mouseleave can prevent this annoying event firing. */
            });

            var DragHandler = function (e) {
                e.stopPropagation();
                e.preventDefault();
            };
        }
        VisualModelPanel.prototype.makeAsFullSizeLayer = function (element) {
            var style = element.style;
            style.position = "absolute";
            style.width = "100%";
            style.height = "100%";
            style.top = "0px";
            style.left = "0px";
        };

        VisualModelPanel.prototype.IsActive = function () {
            return this.ActiveFlag;
        };

        VisualModelPanel.prototype.OnKeyDown = function (Event) {
            var Label;
            var handled = true;
            switch (Event.keyCode) {
                case 27:
                    Event.preventDefault();
                    break;
                case 13:
                    Event.preventDefault();
                    break;
                case 72:
                case 37:
                    this.NavigateLeft();
                    Event.preventDefault();
                    break;
                case 74:
                case 40:
                    this.NavigateDown();
                    Event.preventDefault();
                    break;
                case 75:
                case 38:
                    var Moved = this.NavigateUp();
                    if (!Moved && this.FocusedLabel) {
                        this.NavigateParent();
                    }
                    Event.preventDefault();
                    break;
                case 76:
                case 39:
                    this.NavigateRight();
                    Event.preventDefault();
                    break;
                case 36:
                    this.NavigateHome();
                    Event.preventDefault();
                    break;

                case 187:
                    if (Event.shiftKey) {
                        this.Viewport.SetCameraScale(this.Viewport.GetCameraScale() + 0.1);
                    }
                    Event.preventDefault();
                    break;
                case 189:
                    if (Event.shiftKey) {
                        this.Viewport.SetCameraScale(this.Viewport.GetCameraScale() - 0.1);
                    }
                    Event.preventDefault();
                    break;
                default:
                    handled = false;
                    break;
            }
            if (handled) {
                Event.stopPropagation();
            }
        };

        VisualModelPanel.prototype.OnActivate = function () {
            this.Viewport.IsPointerEnabled = true;
        };

        VisualModelPanel.prototype.OnDeactivate = function () {
            this.Viewport.IsPointerEnabled = false;
        };

        /**
        @method MoveToNearestNode
        @param {AssureNote.Direction} Dir
        */
        VisualModelPanel.prototype.MoveToNearestNode = function (Dir) {
            var NextNode = this.FindNearestNode(this.ViewMap[this.FocusedLabel], Dir);
            if (NextNode) {
                this.FocusAndMoveToNode(NextNode);
            }
            return !!NextNode;
        };

        VisualModelPanel.prototype.FocusAndMoveToNode = function (Node) {
            if (Node != null) {
                var NextNode = Node.constructor == String ? this.ViewMap[Node] : Node;
                if (NextNode != null) {
                    this.ChangeFocusedLabel(NextNode.Label);
                    this.Viewport.MoveTo(NextNode.GetCenterGX(), NextNode.GetCenterGY(), this.Viewport.GetCameraScale(), 50);
                }
            }
        };

        /**
        @method FindNearestNode
        @param {AssureNote.NodeView} CenterNode. If null is given, Camera position is used instead of the node.
        @param {AssureNote.Direction} Dir
        @return {AssureNote.NodeView} Found node. If no node is found, null is retured.
        */
        VisualModelPanel.prototype.FindNearestNode = function (CenterNode, Dir) {
            var RightLimitVectorX = 1;
            var RightLimitVectorY = 1;
            var LeftLimitVectorX = 1;
            var LeftLimitVectorY = 1;

            switch (Dir) {
                case 2 /* Right */:
                    LeftLimitVectorY = -1;
                    break;
                case 0 /* Left */:
                    RightLimitVectorX = -1;
                    RightLimitVectorY = -1;
                    LeftLimitVectorX = -1;
                    break;
                case 1 /* Top */:
                    RightLimitVectorY = -1;
                    LeftLimitVectorX = -1;
                    LeftLimitVectorY = -1;
                    break;
                case 3 /* Bottom */:
                    RightLimitVectorX = -1;
                    break;
            }
            var NearestNode = null;
            var CurrentMinimumDistanceSquere = Infinity;
            var CX = CenterNode ? CenterNode.GetCenterGX() : this.Viewport.GetCameraGX();
            var CY = CenterNode ? CenterNode.GetCenterGY() : this.Viewport.GetCameraGY();
            this.TopNodeView.TraverseVisibleNode(function (Node) {
                var DX = Node.GetCenterGX() - CX;
                var DY = Node.GetCenterGY() - CY;
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
        };

        /**
        @method ChangeFocusedLabel
        @param {string} Label If label is null, there is no focused label.
        */
        VisualModelPanel.prototype.ChangeFocusedLabel = function (Label) {
            VisModelJS.Utils.UpdateHash(Label);
            if (Label == null) {
                var oldNodeView = this.ViewMap[this.FocusedLabel];
                if (oldNodeView != null) {
                    oldNodeView.RemoveColorStyle(VisModelJS.ColorStyle.Highlight);
                }
                this.FocusedLabel = null;
                return;
            }
            var NodeView = this.ViewMap[Label];
            if (NodeView != null) {
                var oldNodeView = this.ViewMap[this.FocusedLabel];
                if (oldNodeView != null) {
                    oldNodeView.RemoveColorStyle(VisModelJS.ColorStyle.Highlight);
                }
                this.FocusedLabel = Label;
                NodeView.AddColorStyle(VisModelJS.ColorStyle.Highlight);
            }
        };

        VisualModelPanel.prototype.GetFocusedLabel = function () {
            return this.FocusedLabel;
        };

        VisualModelPanel.prototype.HasMonitorNode = function () {
            for (var Label in this.ViewMap) {
                var View = this.ViewMap[Label];
            }
            return false;
        };

        //DrawGSN(Node: GSNNode): void {
        //    var NewNodeView: NodeView = new NodeView(Node, true);
        //    this.InitializeView(NewNodeView);
        //    this.Draw();
        //}
        VisualModelPanel.prototype.InitializeView = function (NodeView) {
            this.TopNodeView = NodeView;
            this.ViewMap = {};
            this.TopNodeView.UpdateViewMap(this.ViewMap);
        };

        VisualModelPanel.prototype.Draw = function (Label, Duration, FixedNode) {
            var _this = this;
            var t0 = VisModelJS.Utils.getTime();
            this.Clear();
            var t1 = VisModelJS.Utils.getTime();

            //console.log("Clear: " + (t1 - t0));
            var TargetView = this.ViewMap[Label];

            if (TargetView == null) {
                TargetView = this.TopNodeView;
            }

            var FixedNodeGX0;
            var FixedNodeGY0;
            var FixedNodeDX;
            var FixedNodeDY;
            if (FixedNode) {
                FixedNodeGX0 = FixedNode.GetGX();
                FixedNodeGY0 = FixedNode.GetGY();
            }

            this.LayoutEngine.DoLayout(this, TargetView);

            this.ContentLayer.style.display = "none";
            this.SVGLayer.style.display = "none";

            //GSNShape.__Debug_Animation_SkippedNodeCount = 0;
            //GSNShape.__Debug_Animation_TotalNodeCount = 0;
            this.FoldingAnimationTask.cancel(true);

            VisModelJS.NodeView.SetGlobalPositionCacheEnabled(true);
            var FoldingAnimationCallbacks = [];

            var ScreenRect = this.Viewport.GetPageRectInGxGy();
            if (FixedNode) {
                FixedNodeDX = FixedNode.GetGX() - FixedNodeGX0;
                FixedNodeDY = FixedNode.GetGY() - FixedNodeGY0;
                if (FixedNodeDX > 0) {
                    ScreenRect.width += FixedNodeDX;
                } else {
                    ScreenRect.width -= FixedNodeDX;
                    ScreenRect.x += FixedNodeDX;
                }
                var Scale = this.Viewport.GetCameraScale();
                var Task = this.Viewport.CreateMoveTaskFunction(FixedNodeDX, FixedNodeDY, Scale, Duration);
                if (Task) {
                    FoldingAnimationCallbacks.push(Task);
                } else {
                    FoldingAnimationCallbacks.push(function () {
                        _this.UpdateHiddenNodeList();
                    });
                }
            } else {
                FoldingAnimationCallbacks.push(function () {
                    _this.UpdateHiddenNodeList();
                });
            }

            var t2 = VisModelJS.Utils.getTime();
            TargetView.UpdateNodePosition(FoldingAnimationCallbacks, Duration, ScreenRect);
            TargetView.ClearAnimationCache();
            var t3 = VisModelJS.Utils.getTime();

            //console.log("Update: " + (t3 - t2));
            this.FoldingAnimationTask.startMany(Duration, FoldingAnimationCallbacks);

            var Shape = TargetView.GetShape();
            this.Viewport.CameraLimitRect = new VisModelJS.Rect(Shape.GetTreeLeftLocalX() - 100, -100, Shape.GetTreeWidth() + 200, Shape.GetTreeHeight() + 200);

            var PageRect = this.Viewport.GetPageRectInGxGy();
            this.TopNodeView.TraverseVisibleNode(function (Node) {
                if (Node.IsInRect(PageRect)) {
                    _this.OnScreenNodeMap[Node.Label] = Node;
                } else {
                    _this.HiddenNodeMap[Node.Label] = Node;
                    _this.HiddenNodeBuffer.appendChild(Node.Shape.Content);
                    _this.HiddenNodeBuffer.appendChild(Node.Shape.ShapeGroup);
                }
            });

            VisModelJS.NodeView.SetGlobalPositionCacheEnabled(false);
            this.ContentLayer.style.display = "";
            this.SVGLayer.style.display = "";
            //console.log("Animation: " + GSNShape.__Debug_Animation_TotalNodeCount + " nodes moved, " +
            //    GSNShape.__Debug_Animation_SkippedNodeCount + " nodes skipped. reduce rate = " +
            //    GSNShape.__Debug_Animation_SkippedNodeCount / GSNShape.__Debug_Animation_TotalNodeCount);
        };

        VisualModelPanel.prototype.ForceAppendAllOutOfScreenNode = function () {
            var _this = this;
            var UpdateArrow = function (Node) {
                if (Node.Parent) {
                    var Arrow = Node.Shape.ArrowPath;
                    if (Arrow.parentNode != _this.HiddenNodeBuffer) {
                        _this.HiddenNodeBuffer.appendChild(Arrow);
                    }
                }
            };
            for (var Label in this.HiddenNodeMap) {
                var Node = this.HiddenNodeMap[Label];
                delete this.HiddenNodeMap[Label];
                this.OnScreenNodeMap[Label] = Node;
                this.ContentLayer.appendChild(Node.Shape.Content);
                this.SVGLayerNodeGroup.appendChild(Node.Shape.ShapeGroup);
                UpdateArrow(Node);
            }
        };

        VisualModelPanel.prototype.UpdateHiddenNodeList = function () {
            var _this = this;
            VisModelJS.NodeView.SetGlobalPositionCacheEnabled(true);
            var PageRect = this.Viewport.GetPageRectInGxGy();
            var UpdateArrow = function (Node) {
                if (Node.Parent) {
                    var Arrow = Node.Shape.ArrowPath;
                    if (Node.IsConnectorInRect(PageRect)) {
                        if (Arrow.parentNode != _this.SVGLayerConnectorGroup) {
                            _this.SVGLayerConnectorGroup.appendChild(Arrow);
                        }
                    } else {
                        if (Arrow.parentNode != _this.HiddenNodeBuffer) {
                            _this.HiddenNodeBuffer.appendChild(Arrow);
                        }
                    }
                }
            };
            for (var Label in this.OnScreenNodeMap) {
                var Node = this.OnScreenNodeMap[Label];
                if (!Node.IsInRect(PageRect)) {
                    delete this.OnScreenNodeMap[Label];
                    this.HiddenNodeMap[Label] = Node;
                    this.HiddenNodeBuffer.appendChild(Node.Shape.Content);
                    this.HiddenNodeBuffer.appendChild(Node.Shape.ShapeGroup);
                }
                UpdateArrow(Node);
            }
            for (var Label in this.HiddenNodeMap) {
                var Node = this.HiddenNodeMap[Label];
                if (Node.IsInRect(PageRect)) {
                    delete this.HiddenNodeMap[Label];
                    this.OnScreenNodeMap[Label] = Node;
                    this.ContentLayer.appendChild(Node.Shape.Content);
                    this.SVGLayerNodeGroup.appendChild(Node.Shape.ShapeGroup);
                }
                UpdateArrow(Node);
            }
            VisModelJS.NodeView.SetGlobalPositionCacheEnabled(false);
            ////console.log("Visible:Hidden = " + Object.keys(this.OnScreenNodeMap).length + ":" + Object.keys(this.HiddenNodeMap).length);
        };

        VisualModelPanel.prototype.Clear = function () {
            this.RootElement.style.display = "none";
            this.ContentLayer.innerHTML = "";
            this.SVGLayer.removeChild(this.SVGLayerConnectorGroup);
            this.SVGLayer.removeChild(this.SVGLayerNodeGroup);
            this.SVGLayerConnectorGroup = VisModelJS.Utils.createSVGElement("g");
            this.SVGLayerNodeGroup = VisModelJS.Utils.createSVGElement("g");
            this.SVGLayer.appendChild(this.SVGLayerConnectorGroup);
            this.SVGLayer.appendChild(this.SVGLayerNodeGroup);
            this.Viewport.SVGLayer = this.SVGLayer;
            this.HiddenNodeMap = {};
            this.OnScreenNodeMap = {};
            this.HiddenNodeBuffer = document.createDocumentFragment();
            this.RootElement.style.display = "";
        };

        VisualModelPanel.prototype.GetFocusedView = function () {
            if (this.ViewMap) {
                return this.ViewMap[this.FocusedLabel];
            }
            return null;
        };

        VisualModelPanel.prototype.NavigateUp = function () {
            return this.MoveToNearestNode(1 /* Top */);
        };
        VisualModelPanel.prototype.NavigateDown = function () {
            return this.MoveToNearestNode(3 /* Bottom */);
        };
        VisualModelPanel.prototype.NavigateLeft = function () {
            return this.MoveToNearestNode(0 /* Left */);
        };
        VisualModelPanel.prototype.NavigateRight = function () {
            return this.MoveToNearestNode(2 /* Right */);
        };
        VisualModelPanel.prototype.NavigateHome = function () {
            this.FocusAndMoveToNode(this.TopNodeView);
        };
        VisualModelPanel.prototype.NavigateParent = function () {
            if (this.FocusedLabel) {
                var Parent = this.ViewMap[this.FocusedLabel].Parent;
                if (Parent) {
                    this.FocusAndMoveToNode(this.ViewMap[this.FocusedLabel].Parent);
                    return;
                }
            }
            this.FocusAndMoveToNode(this.TopNodeView);
        };
        return VisualModelPanel;
    })();
    VisModelJS.VisualModelPanel = VisualModelPanel;
})(VisModelJS || (VisModelJS = {}));
//# sourceMappingURL=PictgramPanel.js.map
