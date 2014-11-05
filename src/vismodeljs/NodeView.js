var VisModelJS;
(function (VisModelJS) {
    var NodeView = (function () {
        function NodeView() {
            this.RelativeX = 0;
            this.RelativeY = 0;
            this.Left = null;
            this.Right = null;
            this.Children = null;
            this.Shape = null;
            this.ShouldReLayoutFlag = true;
            this.IsVisible = true;
            this.FoldedFlag = false;
        }
        /*
        constructor(public Model: GSNNode, IsRecursive: boolean) {
        this.Label = Model.GetLabel();
        this.NodeDoc = Model.NodeDoc;
        this.IsVisible = true;
        this.IsFoldedFlag = false;
        this.Status   = EditStatus.TreeEditable;
        if (IsRecursive && Model.SubNodeList != null) {
        for (var i = 0; i < Model.SubNodeList.length; i++) {
        var SubNode = Model.SubNodeList[i];
        var SubView = new NodeView(SubNode, IsRecursive);
        if (SubNode.NodeType == GSNType.Assumption || SubNode.NodeType == GSNType.Exception) {
        // Layout Engine allowed to move a node left-side
        this.AppendLeftNode(SubView);
        }else if (SubNode.NodeType == GSNType.Context || SubNode.NodeType == GSNType.Justification) {
        // Layout Engine allowed to move a node left-side
        this.AppendRightNode(SubView);
        } else {
        this.AppendChild(SubView);
        }
        }
        }
        }
        */
        NodeView.prototype.IsFolded = function () {
            return this.FoldedFlag;
        };

        NodeView.prototype.SetIsFolded = function (Flag) {
            if (this.FoldedFlag != Flag) {
                this.SetShouldReLayout(true);
            }
            this.FoldedFlag = Flag;
        };

        NodeView.prototype.SetShouldReLayout = function (Flag) {
            if (!this.ShouldReLayoutFlag && Flag && this.Parent) {
                this.Parent.SetShouldReLayout(true);
            }
            this.ShouldReLayoutFlag = Flag;
        };

        NodeView.prototype.ShouldReLayout = function () {
            return this.ShouldReLayoutFlag;
        };

        NodeView.prototype.UpdateViewMap = function (ViewMap) {
            ViewMap[this.Label] = this;
            if (this.Left != null) {
                for (var i = 0; i < this.Left.length; i++) {
                    this.Left[i].UpdateViewMap(ViewMap);
                }
            }
            if (this.Right != null) {
                for (var i = 0; i < this.Right.length; i++) {
                    this.Right[i].UpdateViewMap(ViewMap);
                }
            }
            if (this.Children != null) {
                for (var i = 0; i < this.Children.length; i++) {
                    this.Children[i].UpdateViewMap(ViewMap);
                }
            }
        };

        NodeView.prototype.AppendChild = function (SubNode) {
            if (this.Children == null) {
                this.Children = [];
            }
            this.Children.push(SubNode);
            SubNode.Parent = this;
        };

        NodeView.prototype.AppendLeftNode = function (SubNode) {
            if (this.Left == null) {
                this.Left = [];
            }
            this.Left.push(SubNode);
            SubNode.Parent = this;
        };

        NodeView.prototype.AppendRightNode = function (SubNode) {
            if (this.Right == null) {
                this.Right = [];
            }
            this.Right.push(SubNode);
            SubNode.Parent = this;
        };

        NodeView.prototype.GetShape = function () {
            if (this.Shape == null) {
                this.Shape = VisModelJS.ShapeFactory.CreateShape(this);
            }
            return this.Shape;
        };

        NodeView.prototype.SetShape = function (Shape) {
            if (this.Shape) {
                this.Shape.NodeView = null;
            }
            if (Shape) {
                Shape.NodeView = this;
            }
            this.Shape = Shape;
        };

        /**
        Global X: Scale-independent and transform-independent X distance from leftside of the top goal.
        @return always 0 if this is top goal.
        */
        NodeView.prototype.GetGX = function () {
            if (NodeView.GlobalPositionCache != null && NodeView.GlobalPositionCache[this.Label]) {
                return NodeView.GlobalPositionCache[this.Label].x;
            }
            if (this.Parent == null) {
                return this.RelativeX;
            }
            return this.Parent.GetGX() + this.RelativeX;
        };

        /**
        Global Y: Scale-independent and transform-independent Y distance from top of the top goal.
        @eturn always 0 if this is top goal.
        */
        NodeView.prototype.GetGY = function () {
            if (NodeView.GlobalPositionCache != null && NodeView.GlobalPositionCache[this.Label]) {
                return NodeView.GlobalPositionCache[this.Label].y;
            }
            if (this.Parent == null) {
                return this.RelativeY;
            }
            return this.Parent.GetGY() + this.RelativeY;
        };

        // Global center X/Y: Node center position
        NodeView.prototype.GetCenterGX = function () {
            return this.GetGX() + this.Shape.GetNodeWidth() * 0.5;
        };

        NodeView.prototype.GetCenterGY = function () {
            return this.GetGY() + this.Shape.GetNodeHeight() * 0.5;
        };

        NodeView.SetGlobalPositionCacheEnabled = function (State) {
            if (State && NodeView.GlobalPositionCache == null) {
                NodeView.GlobalPositionCache = {};
            } else if (!State) {
                NodeView.GlobalPositionCache = null;
            }
        };

        /**
        Scale-independent and transform-independent distance from leftside of GSN.
        @return always (0, 0) if this is top goal.
        */
        NodeView.prototype.GetGlobalPosition = function () {
            if (NodeView.GlobalPositionCache != null && NodeView.GlobalPositionCache[this.Label]) {
                return NodeView.GlobalPositionCache[this.Label].clone();
            }
            if (this.Parent == null) {
                return new VisModelJS.Point(this.RelativeX, this.RelativeY);
            }
            var ParentPosition = this.Parent.GetGlobalPosition();
            ParentPosition.x += this.RelativeX;
            ParentPosition.y += this.RelativeY;
            if (NodeView.GlobalPositionCache != null) {
                NodeView.GlobalPositionCache[this.Label] = ParentPosition.clone();
            }
            return ParentPosition;
        };

        /**
        Append content elements of this node to layer fragments.
        */
        NodeView.prototype.Render = function (DivFrag, SvgNodeFrag, SvgConnectionFrag) {
            this.Shape.Render(DivFrag, SvgNodeFrag, SvgConnectionFrag);
        };

        /**
        Try to reuse shape.
        */
        NodeView.prototype.SaveFlags = function (OldView) {
            if (OldView) {
                this.FoldedFlag = OldView.FoldedFlag;

                var IsContentChanged = this.Content != OldView.Content;
                var IsTypeChanged = false;

                if (IsContentChanged || IsTypeChanged) {
                    this.GetShape().SetColorStyle(OldView.GetShape().GetColorStyle());
                } else {
                    this.SetShape(OldView.GetShape());
                }
            }
        };

        NodeView.prototype.GetConnectorPosition = function (Dir, GlobalPosition) {
            var P = this.Shape.GetConnectorPosition(Dir);
            P.x += GlobalPosition.x;
            P.y += GlobalPosition.y;
            return P;
        };

        /**
        Update DOM node position by the position that layout engine caluculated
        */
        NodeView.prototype.UpdateNodePosition = function (AnimationCallbacks, Duration, ScreenRect, UnfoldBaseNode) {
            var _this = this;
            Duration = Duration || 0;
            if (!this.IsVisible) {
                return;
            }
            var UpdateSubNode = function (SubNode) {
                var Base = UnfoldBaseNode;
                if (!Base && SubNode.Shape.WillFadein()) {
                    Base = _this;
                }
                if (Base && Duration > 0) {
                    SubNode.Shape.SetFadeinBasePosition(Base.Shape.GetGXCache(), Base.Shape.GetGYCache());
                    SubNode.UpdateNodePosition(AnimationCallbacks, Duration, ScreenRect, Base);
                } else {
                    SubNode.UpdateNodePosition(AnimationCallbacks, Duration, ScreenRect);
                }
            };

            var GlobalPosition = this.GetGlobalPosition();
            this.Shape.MoveTo(AnimationCallbacks, GlobalPosition.x, GlobalPosition.y, Duration, ScreenRect);

            var ArrowDirections = [3 /* Bottom */, 2 /* Right */, 0 /* Left */];
            var SubNodeTypes = [this.Children, this.Right, this.Left];
            for (var i = 0; i < 3; ++i) {
                var P1 = this.GetConnectorPosition(ArrowDirections[i], GlobalPosition);
                var ArrowToDirection = VisModelJS.ReverseDirection(ArrowDirections[i]);
                this.ForEachVisibleSubNode(SubNodeTypes[i], function (SubNode) {
                    var P2 = SubNode.GetConnectorPosition(ArrowToDirection, SubNode.GetGlobalPosition());
                    UpdateSubNode(SubNode);
                    SubNode.Shape.MoveArrowTo(AnimationCallbacks, P1, P2, ArrowDirections[i], Duration, ScreenRect);
                    SubNode.ParentDirection = VisModelJS.ReverseDirection(ArrowDirections[i]);
                });
            }
        };

        NodeView.prototype.ForEachVisibleSubNode = function (SubNodes, Action) {
            if (SubNodes != null && !this.FoldedFlag) {
                for (var i = 0; i < SubNodes.length; i++) {
                    if (SubNodes[i].IsVisible) {
                        if (Action(SubNodes[i]) === false) {
                            return false;
                        }
                    }
                }
            }
            return true;
        };

        NodeView.prototype.ForEachVisibleChildren = function (Action) {
            this.ForEachVisibleSubNode(this.Children, Action);
        };

        NodeView.prototype.ForEachVisibleRightNodes = function (Action) {
            this.ForEachVisibleSubNode(this.Right, Action);
        };

        NodeView.prototype.ForEachVisibleLeftNodes = function (Action) {
            this.ForEachVisibleSubNode(this.Left, Action);
        };

        NodeView.prototype.ForEachVisibleAllSubNodes = function (Action) {
            if (this.ForEachVisibleSubNode(this.Left, Action) && this.ForEachVisibleSubNode(this.Right, Action) && this.ForEachVisibleSubNode(this.Children, Action))
                return true;
            return false;
        };

        NodeView.prototype.TraverseVisibleNode = function (Action) {
            Action(this);
            this.ForEachVisibleAllSubNodes(function (SubNode) {
                SubNode.TraverseVisibleNode(Action);
            });
        };

        NodeView.prototype.ForEachSubNode = function (SubNodes, Action) {
            if (SubNodes != null) {
                for (var i = 0; i < SubNodes.length; i++) {
                    if (Action(SubNodes[i]) === false) {
                        return false;
                    }
                }
            }
            return true;
        };

        NodeView.prototype.ForEachAllSubNodes = function (Action) {
            if (this.ForEachSubNode(this.Left, Action) && this.ForEachSubNode(this.Right, Action) && this.ForEachSubNode(this.Children, Action))
                return true;
            return false;
        };

        NodeView.prototype.TraverseNode = function (Action) {
            if (Action(this) === false)
                return false;
            if (this.ForEachAllSubNodes(function (SubNode) {
                return SubNode.TraverseNode(Action);
            }))
                return true;
            return false;
        };

        /**
        Clear position cache and enable to fading in when the node re-appearing.
        This method should be called after the node became invibible or the node never fade in.
        */
        NodeView.prototype.ClearAnimationCache = function (Force) {
            if (Force || !this.IsVisible) {
                this.GetShape().ClearAnimationCache();
            }
            if (Force || this.FoldedFlag) {
                this.ForEachAllSubNodes(function (SubNode) {
                    SubNode.ClearAnimationCache(true);
                });
            } else {
                this.ForEachAllSubNodes(function (SubNode) {
                    SubNode.ClearAnimationCache(false);
                });
            }
        };

        NodeView.prototype.HasSideNode = function () {
            return (this.Left != null && this.Left.length > 0) || (this.Right != null && this.Right.length > 0);
        };

        NodeView.prototype.HasChildren = function () {
            return (this.Children != null && this.Children.length > 0);
        };

        NodeView.prototype.AddColorStyle = function (ColorStyle) {
            this.Shape.AddColorStyle(ColorStyle);
        };

        NodeView.prototype.RemoveColorStyle = function (ColorStyle) {
            this.Shape.RemoveColorStyle(ColorStyle);
        };

        NodeView.prototype.IsInRect = function (Target) {
            // While animation playing, cached position(visible position) != this.position(logical position)
            var GXC = this.Shape.GetGXCache();
            var GYC = this.Shape.GetGYCache();
            var Pos;
            if (GXC != null && GYC != null) {
                Pos = new VisModelJS.Point(GXC, GYC);
            } else {
                Pos = this.GetGlobalPosition();
            }
            if (Pos.x > Target.x + Target.width || Pos.y > Target.y + Target.height) {
                return false;
            }
            Pos.x += this.Shape.GetNodeWidth();
            Pos.y += this.Shape.GetNodeHeight();
            if (Pos.x < Target.x || Pos.y < Target.y) {
                return false;
            }
            return true;
        };

        NodeView.prototype.IsConnectorInRect = function (Target) {
            if (!this.Parent) {
                return false;
            }
            var PA;
            var PB;
            if (this.Shape.GetGXCache() != null && this.Shape.GetGYCache() != null) {
                PA = this.Shape.GetArrowP1Cache();
                PB = this.Shape.GetArrowP2Cache();
            } else {
                PA = this.GetConnectorPosition(this.ParentDirection, this.GetGlobalPosition());
                PB = this.Parent.GetConnectorPosition(VisModelJS.ReverseDirection(this.ParentDirection), this.Parent.GetGlobalPosition());
            }
            var Pos = new VisModelJS.Point(Math.min(PA.x, PB.x), Math.min(PA.y, PB.y));
            if (Pos.x > Target.x + Target.width || Pos.y > Target.y + Target.height) {
                return false;
            }
            Pos.x = Math.max(PA.x, PB.x);
            Pos.y = Math.max(PA.y, PB.y);
            if (Pos.x < Target.x || Pos.y < Target.y) {
                return false;
            }
            return true;
        };

        /**
        @method FoldDeepSubGoals
        @param {NodeView} NodeView
        */
        NodeView.prototype.FoldDeepSubGoals = function (limitDepth) {
            if (limitDepth <= 0) {
                this.SetIsFolded(true);
            } else {
                this.ForEachVisibleChildren(function (SubNode) {
                    return SubNode.FoldDeepSubGoals(limitDepth - 1);
                });
            }
        };
        NodeView.GlobalPositionCache = null;
        return NodeView;
    })();
    VisModelJS.NodeView = NodeView;
})(VisModelJS || (VisModelJS = {}));
//# sourceMappingURL=NodeView.js.map
