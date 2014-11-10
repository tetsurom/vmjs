
module VisModelJS {

    export class TreeNodeView {
        visible: boolean;
        private _folded: boolean;
        label: string;
        content: string;
        relativeX: number = 0; // relative x from parent node
        relativeY: number = 0; // relative y from parent node
        parent: TreeNodeView;
        leftNodes: TreeNodeView[] = null;
        rightNodes: TreeNodeView[] = null;
        childNodes: TreeNodeView[] = null;
        private _shape: Shape = null;
        parentDirection: Direction;
        private _shouldReLayout: boolean = true;

        constructor() {
            this.visible = true;
            this._folded = false;
        }

        get folded(): boolean {
            return this._folded;
        }
        set folded(value) {
            if (this._folded != value) {
                this.shouldReLayout = true;
            }
            this._folded = value;
        }

        get shouldReLayout(): boolean {
            return this._shouldReLayout;
        }
        set shouldReLayout(value: boolean) {
            if (!this._shouldReLayout && value && this.parent) {
                this.parent.shouldReLayout = true;
            }
            this._shouldReLayout = value;
        }

        //FixMe
        UpdateViewMap(viewMap: { [index: string]: TreeNodeView }): void {
            viewMap[this.label] = this;
            if (this.leftNodes != null) {
                for (var i = 0; i < this.leftNodes.length; i++) {
                    this.leftNodes[i].UpdateViewMap(viewMap);
                }
            }
            if (this.rightNodes != null) {
                for (var i = 0; i < this.rightNodes.length; i++) {
                    this.rightNodes[i].UpdateViewMap(viewMap);
                }
            }
            if (this.childNodes != null) {
                for (var i = 0; i < this.childNodes.length; i++) {
                    this.childNodes[i].UpdateViewMap(viewMap);
                }
            }
        }

        appendChild(node: TreeNodeView): void {
            if (this.childNodes == null) {
                this.childNodes = [];
            }
            this.childNodes.push(node);
            node.parent = this;
        }

        appendLeftNode(node: TreeNodeView): void {
            if (this.leftNodes == null) {
                this.leftNodes = [];
            }
            this.leftNodes.push(node);
            node.parent = this;
        }

        appendRightNode(node: TreeNodeView): void {
            if (this.rightNodes == null) {
                this.rightNodes = [];
            }
            this.rightNodes.push(node);
            node.parent = this;
        }

        get shape(): Shape {
            if (this._shape == null) {
                this._shape = ShapeFactory.CreateShape(this);
            }
            return this._shape;
        }

        set shape(value: Shape) {
            if (this._shape) {
                this._shape.NodeView = null;
            }
            if (value) {
                value.NodeView = this;
            }
            this._shape = value;
        }

        /**
            Global X: Scale-independent and transform-independent X distance from leftside of the top goal.
            @return always 0 if this is top goal.
        */
        get gx(): number {
            if (TreeNodeView.globalPositionCache != null && TreeNodeView.globalPositionCache[this.label]) {
                return TreeNodeView.globalPositionCache[this.label].x;
            }
            if (this.parent == null) {
                return this.relativeX;
            }
            return this.parent.gx + this.relativeX;
        }

        /**
            Global Y: Scale-independent and transform-independent Y distance from top of the top goal.
            @eturn always 0 if this is top goal.
        */
        get gy(): number {
            if (TreeNodeView.globalPositionCache != null && TreeNodeView.globalPositionCache[this.label]) {
                return TreeNodeView.globalPositionCache[this.label].y;
            }
            if (this.parent == null) {
                return this.relativeY;
            }
            return this.parent.gy + this.relativeY;
        }

        // Global center X/Y: Node center position
        get centerGx(): number {
            return this.gx + this._shape.GetNodeWidth() * 0.5;
        }

        get centerGy(): number {
            return this.gy + this._shape.GetNodeHeight() * 0.5;
        }

        // For memorization
        private static globalPositionCache: { [index: string]: Point } = null;
        public static setGlobalPositionCacheEnabled(State: boolean) {
            if (State && TreeNodeView.globalPositionCache == null) {
                TreeNodeView.globalPositionCache = {};
            } else if (!State) {
                TreeNodeView.globalPositionCache = null;
            }
        }

        /**
            Scale-independent and transform-independent distance from leftside of GSN.
            @return always (0, 0) if this is top goal.
        */
        private get globalPosition(): Point {
            if (TreeNodeView.globalPositionCache != null && TreeNodeView.globalPositionCache[this.label]) {
                return TreeNodeView.globalPositionCache[this.label].clone();
            }
            if (this.parent == null) {
                return new Point(this.relativeX, this.relativeY);
            }
            var parentPos = this.parent.globalPosition;
            parentPos.x += this.relativeX;
            parentPos.y += this.relativeY;
            if (TreeNodeView.globalPositionCache != null) {
                TreeNodeView.globalPositionCache[this.label] = parentPos.clone();
            }
            return parentPos;
        }

        /**
            Append content elements of this node to layer fragments.
        */
        render(htmlLayerFlagment: DocumentFragment, svgLayerFlagment: DocumentFragment, svgConnectorFlagment: DocumentFragment): void {
            this._shape.Render(htmlLayerFlagment, svgLayerFlagment, svgConnectorFlagment);
        }

        /**
            Try to reuse shape.
        */
        copyFlagsFromOldView(oldView: TreeNodeView): void {
            if (oldView) {
                this._folded = oldView._folded;
                
                var isContentChanged = this.content != oldView.content;

                if (isContentChanged) {
                    this.shape.setColorStyle(oldView.shape.getColorStyle());
                } else {
                    this.shape = oldView.shape;
                }
            }
        }

        private getConnectorPosition(dir: Direction, globalPosition: Point): Point {
            var P = this._shape.GetConnectorPosition(dir);
            P.x += globalPosition.x;
            P.y += globalPosition.y;
            return P;
        }

        /**
            Update DOM node position by the position that layout engine caluculated
        */
        updateNodePosition(animationCallbacks?: Function[], duration?: number, screenRect?: Rect, unfoldBaseNode?: TreeNodeView): void {
            duration = duration || 0;
            if (!this.visible) {
                return
            }
            var updateSubNode = (SubNode: TreeNodeView) => {
                var base = unfoldBaseNode;
                if (!base && SubNode._shape.WillFadein()) {
                    base = this;
                }
                if (base && duration > 0) {
                    SubNode._shape.SetFadeinBasePosition(base._shape.GetGXCache(), base._shape.GetGYCache());
                    SubNode.updateNodePosition(animationCallbacks, duration, screenRect, base);
                } else {
                    SubNode.updateNodePosition(animationCallbacks, duration, screenRect);
                }
            }

            var gp = this.globalPosition;
            this._shape.MoveTo(animationCallbacks, gp.x, gp.y, duration, screenRect);

            var directions = [Direction.Bottom, Direction.Right, Direction.Left];
            var subNodeTypes = [this.childNodes, this.rightNodes, this.leftNodes];
            for (var i = 0; i < 3; ++i) {
                var p1 = this.getConnectorPosition(directions[i], gp);
                var arrowGoalDirection = reverseDirection(directions[i]);
                this.forEachVisibleSubNode(subNodeTypes[i], (SubNode: TreeNodeView) => {
                    var p2 = SubNode.getConnectorPosition(arrowGoalDirection, SubNode.globalPosition);
                    updateSubNode(SubNode);
                    SubNode._shape.MoveArrowTo(animationCallbacks, p1, p2, directions[i], duration, screenRect);
                    SubNode.parentDirection = reverseDirection(directions[i]);
                });
            }
        }

        private forEachVisibleSubNode(subNodes: TreeNodeView[], action: (NodeView) => any): boolean {
            if (subNodes != null && !this._folded) {
                for (var i = 0; i < subNodes.length; i++) {
                    if (subNodes[i].visible) {
                        if (action(subNodes[i]) === false) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        forEachVisibleChildren(action: (subNode: TreeNodeView) => any): void {
            this.forEachVisibleSubNode(this.childNodes, action);
        }

        forEachVisibleRightNodes(action: (subNode: TreeNodeView) => any): void {
            this.forEachVisibleSubNode(this.rightNodes, action);
        }

        forEachVisibleLeftNodes(action: (subNode: TreeNodeView) => any): void {
            this.forEachVisibleSubNode(this.leftNodes, action);
        }

        forEachVisibleAllSubNodes(action: (subNode: TreeNodeView) => any): boolean {
            if (this.forEachVisibleSubNode(this.leftNodes, action) &&
                this.forEachVisibleSubNode(this.rightNodes, action) &&
                this.forEachVisibleSubNode(this.childNodes, action)) return true;
            return false;
        }

        traverseVisibleNode(action: (subNode: TreeNodeView) => any): void {
            action(this);
            this.forEachVisibleAllSubNodes((subNode: TreeNodeView) => { subNode.traverseVisibleNode(action); });
        }

        private forEachSubNode(subNodes: TreeNodeView[], action: (NodeView) => any): boolean {
            if (subNodes != null) {
                for (var i = 0; i < subNodes.length; i++) {
                    if (action(subNodes[i]) === false) {
                        return false;
                    }
                }
            }
            return true;
        }

        forEachAllSubNodes(action: (subNode: TreeNodeView) => any): boolean {
            if (this.forEachSubNode(this.leftNodes, action) &&
                this.forEachSubNode(this.rightNodes, action) &&
                this.forEachSubNode(this.childNodes, action)) return true;
            return false;
        }

        traverseNode(action: (subNode: TreeNodeView) => any): boolean {
            if (action(this) === false) return false;
            if (this.forEachAllSubNodes(subNode => subNode.traverseNode(action))) return true;
            return false;
        }

        /**
            Clear position cache and enable to fading in when the node re-appearing.
            This method should be called after the node became invibible or the node never fade in.
        */
        clearAnimationCache(force?: boolean): void {
            if (force || !this.visible) {
                this.shape.ClearAnimationCache();
            }
            if (force || this._folded) {
                this.forEachAllSubNodes((SubNode: TreeNodeView) => {
                    SubNode.clearAnimationCache(true);
                });
            }
            else {
                this.forEachAllSubNodes((SubNode: TreeNodeView) => {
                    SubNode.clearAnimationCache(false);
                });
            }
        }

        get hasSideNode(): boolean {
            return (this.leftNodes != null && this.leftNodes.length > 0) || (this.rightNodes != null && this.rightNodes.length > 0)
        }

        get hasChildren(): boolean {
            return (this.childNodes != null && this.childNodes.length > 0);
        }

        isInRect(target: Rect): boolean {
            // While animation playing, cached position(visible position) != this.position(logical position)
            var gxCached = this._shape.GetGXCache();
            var gyCached = this._shape.GetGYCache();
            var pos: Point;
            if (gxCached != null && gyCached != null) {
                pos = new Point(gxCached, gyCached);
            } else {
                pos = this.globalPosition;
            }
            if (pos.x > target.x + target.width || pos.y > target.y + target.height) {
                return false;
            }
            pos.x += this._shape.GetNodeWidth();
            pos.y += this._shape.GetNodeHeight();
            if (pos.x < target.x || pos.y < target.y) {
                return false;
            }
            return true;
        }

        isConnectorInRect(target: Rect): boolean {
            if (!this.parent) {
                return false;
            }
            var pa: Point;
            var pb: Point;
            if (this._shape.GetGXCache() != null && this._shape.GetGYCache() != null) {
                pa = this._shape.GetArrowP1Cache();
                pb = this._shape.GetArrowP2Cache();
            } else {
                pa = this.getConnectorPosition(this.parentDirection, this.globalPosition);
                pb = this.parent.getConnectorPosition(reverseDirection(this.parentDirection), this.parent.globalPosition);
            }
            var pos = new Point(Math.min(pa.x, pb.x), Math.min(pa.y, pb.y));
            if (pos.x > target.x + target.width || pos.y > target.y + target.height) {
                return false;
            }
            pos.x = Math.max(pa.x, pb.x);
            pos.y = Math.max(pa.y, pb.y);
            if (pos.x < target.x || pos.y < target.y) {
                return false;
            }
            return true;
        }

        /**
           @method FoldDeepSubGoals
           @param {NodeView} NodeView
        */
        foldDeepSubGoals(limitDepth: number): void {
            if (limitDepth <= 0) {
                this.folded = true;
            } else {
                this.forEachVisibleChildren(SubNode => SubNode.foldDeepSubGoals(limitDepth - 1));
            }
        }

    }

}
