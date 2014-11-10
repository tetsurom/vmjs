
module VisModelJS {

    export class TreeNodeView {
        IsVisible: boolean;
        private _folded: boolean;
        Label: string;
        Content: string;
        RelativeX: number = 0; // relative x from parent node
        RelativeY: number = 0; // relative y from parent node
        Parent: TreeNodeView;
        Left: TreeNodeView[] = null;
        Right: TreeNodeView[] = null;
        Children: TreeNodeView[] = null;
        Shape: Shape = null;
        ParentDirection: Direction;
        private ShouldReLayoutFlag: boolean = true;

        constructor() {
            this.IsVisible = true;
            this._folded = false;
        }

        get folded(): boolean {
            return this._folded;
        }

        set folded(value) {
            if (this._folded != value) {
                this.SetShouldReLayout(true);
            }
            this._folded = value;
        }


        SetShouldReLayout(Flag: boolean): void {
            if (!this.ShouldReLayoutFlag && Flag && this.Parent) {
                this.Parent.SetShouldReLayout(true);
            }
            this.ShouldReLayoutFlag = Flag;
        }

        ShouldReLayout(): boolean {
            return this.ShouldReLayoutFlag;
        }

        UpdateViewMap(ViewMap: { [index: string]: TreeNodeView }): void {
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
        }

        AppendChild(SubNode: TreeNodeView): void {
            if (this.Children == null) {
                this.Children = [];
            }
            this.Children.push(SubNode);
            SubNode.Parent = this;
        }

        AppendLeftNode(SubNode: TreeNodeView): void {
            if (this.Left == null) {
                this.Left = [];
            }
            this.Left.push(SubNode);
            SubNode.Parent = this;
        }

        AppendRightNode(SubNode: TreeNodeView): void {
            if (this.Right == null) {
                this.Right = [];
            }
            this.Right.push(SubNode);
            SubNode.Parent = this;
        }

        GetShape(): Shape {
            if (this.Shape == null) {
                this.Shape = ShapeFactory.CreateShape(this);
            }
            return this.Shape;
        }

        SetShape(Shape: Shape) {
            if (this.Shape) {
                this.Shape.NodeView = null;
            }
            if (Shape) {
                Shape.NodeView = this;
            }
            this.Shape = Shape;
        }

        /**
            Global X: Scale-independent and transform-independent X distance from leftside of the top goal.
            @return always 0 if this is top goal.
        */
        GetGX(): number {
            if (TreeNodeView.GlobalPositionCache != null && TreeNodeView.GlobalPositionCache[this.Label]) {
                return TreeNodeView.GlobalPositionCache[this.Label].x;
            }
            if (this.Parent == null) {
                return this.RelativeX;
            }
            return this.Parent.GetGX() + this.RelativeX;
        }

        /**
            Global Y: Scale-independent and transform-independent Y distance from top of the top goal.
            @eturn always 0 if this is top goal.
        */
        GetGY(): number {
            if (TreeNodeView.GlobalPositionCache != null && TreeNodeView.GlobalPositionCache[this.Label]) {
                return TreeNodeView.GlobalPositionCache[this.Label].y;
            }
            if (this.Parent == null) {
                return this.RelativeY;
            }
            return this.Parent.GetGY() + this.RelativeY;
        }

        // Global center X/Y: Node center position
        GetCenterGX(): number {
            return this.GetGX() + this.Shape.GetNodeWidth() * 0.5;
        }

        GetCenterGY(): number {
            return this.GetGY() + this.Shape.GetNodeHeight() * 0.5;
        }

        // For memorization
        private static GlobalPositionCache: { [index: string]: Point } = null;
        public static SetGlobalPositionCacheEnabled(State: boolean) {
            if (State && TreeNodeView.GlobalPositionCache == null) {
                TreeNodeView.GlobalPositionCache = {};
            } else if (!State) {
                TreeNodeView.GlobalPositionCache = null;
            }
        }

        /**
            Scale-independent and transform-independent distance from leftside of GSN.
            @return always (0, 0) if this is top goal.
        */
        private GetGlobalPosition(): Point {
            if (TreeNodeView.GlobalPositionCache != null && TreeNodeView.GlobalPositionCache[this.Label]) {
                return TreeNodeView.GlobalPositionCache[this.Label].clone();
            }
            if (this.Parent == null) {
                return new Point(this.RelativeX, this.RelativeY);
            }
            var ParentPosition = this.Parent.GetGlobalPosition();
            ParentPosition.x += this.RelativeX;
            ParentPosition.y += this.RelativeY;
            if (TreeNodeView.GlobalPositionCache != null) {
                TreeNodeView.GlobalPositionCache[this.Label] = ParentPosition.clone();
            }
            return ParentPosition;
        }

        /**
            Append content elements of this node to layer fragments.
        */
        Render(DivFrag: DocumentFragment, SvgNodeFrag: DocumentFragment, SvgConnectionFrag: DocumentFragment): void {
            this.Shape.Render(DivFrag, SvgNodeFrag, SvgConnectionFrag);
        }

        /**
            Try to reuse shape.
        */
        SaveFlags(OldView: TreeNodeView): void {
            if (OldView) {
                this._folded = OldView._folded;
                
                var IsContentChanged = this.Content != OldView.Content;
                var IsTypeChanged = false;//this.GetNodeType() != OldView.GetNodeType();

                if (IsContentChanged || IsTypeChanged) {
                    this.GetShape().SetColorStyle(OldView.GetShape().GetColorStyle());
                } else {
                    this.SetShape(OldView.GetShape());
                }
            }
        }

        private GetConnectorPosition(Dir: Direction, GlobalPosition: Point): Point {
            var P = this.Shape.GetConnectorPosition(Dir);
            P.x += GlobalPosition.x;
            P.y += GlobalPosition.y;
            return P;
        }

        /**
            Update DOM node position by the position that layout engine caluculated
        */
        UpdateNodePosition(AnimationCallbacks?: Function[], Duration?: number, ScreenRect?: Rect, UnfoldBaseNode?: TreeNodeView): void {
            Duration = Duration || 0;
            if (!this.IsVisible) {
                return
            }
            var UpdateSubNode = (SubNode: TreeNodeView) => {
                var Base = UnfoldBaseNode;
                if (!Base && SubNode.Shape.WillFadein()) {
                    Base = this;
                }
                if (Base && Duration > 0) {
                    SubNode.Shape.SetFadeinBasePosition(Base.Shape.GetGXCache(), Base.Shape.GetGYCache());
                    SubNode.UpdateNodePosition(AnimationCallbacks, Duration, ScreenRect, Base);
                } else {
                    SubNode.UpdateNodePosition(AnimationCallbacks, Duration, ScreenRect);
                }
            }

            var GlobalPosition = this.GetGlobalPosition();
            this.Shape.MoveTo(AnimationCallbacks, GlobalPosition.x, GlobalPosition.y, Duration, ScreenRect);

            var ArrowDirections = [Direction.Bottom, Direction.Right, Direction.Left];
            var SubNodeTypes = [this.Children, this.Right, this.Left];
            for (var i = 0; i < 3; ++i) {
                var P1 = this.GetConnectorPosition(ArrowDirections[i], GlobalPosition);
                var ArrowToDirection = ReverseDirection(ArrowDirections[i]);
                this.ForEachVisibleSubNode(SubNodeTypes[i], (SubNode: TreeNodeView) => {
                    var P2 = SubNode.GetConnectorPosition(ArrowToDirection, SubNode.GetGlobalPosition());
                    UpdateSubNode(SubNode);
                    SubNode.Shape.MoveArrowTo(AnimationCallbacks, P1, P2, ArrowDirections[i], Duration, ScreenRect);
                    SubNode.ParentDirection = ReverseDirection(ArrowDirections[i]);
                });
            }
        }

        private ForEachVisibleSubNode(SubNodes: TreeNodeView[], Action: (NodeView) => any): boolean {
            if (SubNodes != null && !this._folded) {
                for (var i = 0; i < SubNodes.length; i++) {
                    if (SubNodes[i].IsVisible) {
                        if (Action(SubNodes[i]) === false) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        ForEachVisibleChildren(Action: (SubNode: TreeNodeView) => any): void {
            this.ForEachVisibleSubNode(this.Children, Action);
        }

        ForEachVisibleRightNodes(Action: (SubNode: TreeNodeView) => any): void {
            this.ForEachVisibleSubNode(this.Right, Action);
        }

        ForEachVisibleLeftNodes(Action: (SubNode: TreeNodeView) => any): void {
            this.ForEachVisibleSubNode(this.Left, Action);
        }

        ForEachVisibleAllSubNodes(Action: (SubNode: TreeNodeView) => any): boolean {
            if (this.ForEachVisibleSubNode(this.Left, Action) &&
                this.ForEachVisibleSubNode(this.Right, Action) &&
                this.ForEachVisibleSubNode(this.Children, Action)) return true;
            return false;
        }

        TraverseVisibleNode(Action: (SubNode: TreeNodeView) => any): void {
            Action(this);
            this.ForEachVisibleAllSubNodes((SubNode: TreeNodeView) => { SubNode.TraverseVisibleNode(Action); });
        }

        private ForEachSubNode(SubNodes: TreeNodeView[], Action: (NodeView) => any): boolean {
            if (SubNodes != null) {
                for (var i = 0; i < SubNodes.length; i++) {
                    if (Action(SubNodes[i]) === false) {
                        return false;
                    }
                }
            }
            return true;
        }

        ForEachAllSubNodes(Action: (SubNode: TreeNodeView) => any): boolean {
            if (this.ForEachSubNode(this.Left, Action) &&
                this.ForEachSubNode(this.Right, Action) &&
                this.ForEachSubNode(this.Children, Action)) return true;
            return false;
        }

        TraverseNode(Action: (SubNode: TreeNodeView) => any): boolean {
            if (Action(this) === false) return false;
            if (this.ForEachAllSubNodes((SubNode: TreeNodeView) => { return SubNode.TraverseNode(Action); })) return true;
            return false;
        }

        /**
            Clear position cache and enable to fading in when the node re-appearing.
            This method should be called after the node became invibible or the node never fade in.
        */
        ClearAnimationCache(Force?: boolean): void {
            if (Force || !this.IsVisible) {
                this.GetShape().ClearAnimationCache();
            }
            if (Force || this._folded) {
                this.ForEachAllSubNodes((SubNode: TreeNodeView) => {
                    SubNode.ClearAnimationCache(true);
                });
            }
            else {
                this.ForEachAllSubNodes((SubNode: TreeNodeView) => {
                    SubNode.ClearAnimationCache(false);
                });
            }
        }

        HasSideNode(): boolean {
            return (this.Left != null && this.Left.length > 0) || (this.Right != null && this.Right.length > 0)
        }

        HasChildren(): boolean {
            return (this.Children != null && this.Children.length > 0);
        }

        AddColorStyle(ColorStyle: string): void {
            this.Shape.AddColorStyle(ColorStyle);
        }

        RemoveColorStyle(ColorStyle: string): void {    
            this.Shape.RemoveColorStyle(ColorStyle);
        }

        IsInRect(Target: Rect): boolean {
            // While animation playing, cached position(visible position) != this.position(logical position)
            var GXC = this.Shape.GetGXCache();
            var GYC = this.Shape.GetGYCache();
            var Pos: Point;
            if (GXC != null && GYC != null) {
                Pos = new Point(GXC, GYC);
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
        }

        IsConnectorInRect(Target: Rect): boolean {
            if (!this.Parent) {
                return false;
            }
            var PA: Point;
            var PB: Point;
            if (this.Shape.GetGXCache() != null && this.Shape.GetGYCache() != null) {
                PA = this.Shape.GetArrowP1Cache();
                PB = this.Shape.GetArrowP2Cache();
            } else {
                PA = this.GetConnectorPosition(this.ParentDirection, this.GetGlobalPosition());
                PB = this.Parent.GetConnectorPosition(ReverseDirection(this.ParentDirection), this.Parent.GetGlobalPosition());
            }
            var Pos = new Point(Math.min(PA.x, PB.x), Math.min(PA.y, PB.y));
            if (Pos.x > Target.x + Target.width || Pos.y > Target.y + Target.height) {
                return false;
            }
            Pos.x = Math.max(PA.x, PB.x);
            Pos.y = Math.max(PA.y, PB.y);
            if (Pos.x < Target.x || Pos.y < Target.y) {
                return false;
            }
            return true;
        }

        /**
           @method FoldDeepSubGoals
           @param {NodeView} NodeView
        */
        FoldDeepSubGoals(limitDepth: number): void {
            if (limitDepth <= 0) {
                this.folded = true;
            } else {
                this.ForEachVisibleChildren(SubNode => SubNode.FoldDeepSubGoals(limitDepth - 1));
            }
        }

    }

}
