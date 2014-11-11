
module VisModelJS {
    export class LayoutEngine {
        DoLayout(PictgramPanel: VisualModelPanel, NodeView: TreeNodeView): void {
        }
    }

    
    export class VerticalTreeLayoutEngine extends LayoutEngine {
        static SideNodeHorizontalMargin = 32;
        static SideNodeVerticalMargin = 10;
        static ChildrenVerticalMargin = 64;
        static ChildrenHorizontalMargin = 12;

        private Render(ThisNode: TreeNodeView, DivFrag: DocumentFragment, SvgNodeFrag: DocumentFragment, SvgConnectionFrag: DocumentFragment): void {
            if (ThisNode.visible) {
                ThisNode.shape.PrepareContent();
                ThisNode.shape.Render(DivFrag, SvgNodeFrag, SvgConnectionFrag);
                if (!ThisNode.folded) {
                    ThisNode.forEachVisibleAllSubNodes((SubNode: TreeNodeView) => {
                        this.Render(SubNode, DivFrag, SvgNodeFrag, SvgConnectionFrag);
                    });
                }
            }
        }

        DoLayout(PictgramPanel: VisualModelPanel, NodeView: TreeNodeView): void {
            var DivFragment = document.createDocumentFragment();
            var SvgNodeFragment = document.createDocumentFragment();
            var SvgConnectionFragment = document.createDocumentFragment();
            var Dummy = document.createDocumentFragment();

            this.Render(NodeView, DivFragment, SvgNodeFragment, SvgConnectionFragment);

            PictgramPanel.ContentLayer.appendChild(DivFragment);
            PictgramPanel.SVGLayerConnectorGroup.appendChild(SvgConnectionFragment);
            PictgramPanel.SVGLayerNodeGroup.appendChild(SvgNodeFragment);
            this.PrepareNodeSize(NodeView);
            Dummy.appendChild(DivFragment);
            Dummy.appendChild(SvgConnectionFragment);
            Dummy.appendChild(SvgNodeFragment);

            this.Layout(NodeView);
            PictgramPanel.ContentLayer.appendChild(DivFragment);
            PictgramPanel.SVGLayer.appendChild(SvgConnectionFragment);
            PictgramPanel.SVGLayer.appendChild(SvgNodeFragment);
        }

        private PrepareNodeSize(ThisNode: TreeNodeView): void {
            var Shape = ThisNode.shape;
            Shape.GetNodeWidth();
            Shape.GetNodeHeight();
            if (ThisNode.folded) {
                return;
            }
            ThisNode.forEachVisibleLeftNodes((SubNode: TreeNodeView) => {
                this.PrepareNodeSize(SubNode);
            });
            ThisNode.forEachVisibleRightNodes((SubNode: TreeNodeView) => {
                this.PrepareNodeSize(SubNode);
            });
            ThisNode.forEachVisibleChildren((SubNode: TreeNodeView) => {
                this.PrepareNodeSize(SubNode);
            });
        }

        private Layout(ThisNode: TreeNodeView): void {
            if (!ThisNode.visible) {
                return;
            }
            var Shape = ThisNode.shape;
            if (!ThisNode.shouldReLayout) {
                ThisNode.traverseVisibleNode((Node: TreeNodeView) => {
                    Node.shape.FitSizeToContent();
                });
                return;
            }
            ThisNode.shouldReLayout = false;
            Shape.FitSizeToContent();
            var TreeLeftX = 0;
            var ThisNodeWidth = Shape.GetNodeWidth();
            var TreeRightX = ThisNodeWidth;
            var TreeHeight = Shape.GetNodeHeight();
            if (ThisNode.folded) {
                Shape.SetHeadRect(0, 0, ThisNodeWidth, TreeHeight);
                Shape.SetTreeRect(0, 0, ThisNodeWidth, TreeHeight);
                return;
            }
            if (ThisNode.leftNodes != null) {
                var LeftNodesWidth = 0;
                var LeftNodesHeight = -VerticalTreeLayoutEngine.SideNodeVerticalMargin;
                ThisNode.forEachVisibleLeftNodes((SubNode: TreeNodeView) => {
                    SubNode.shape.FitSizeToContent();
                    LeftNodesHeight += VerticalTreeLayoutEngine.SideNodeVerticalMargin;
                    SubNode.relativeX = -(SubNode.shape.GetNodeWidth() + VerticalTreeLayoutEngine.SideNodeHorizontalMargin);
                    SubNode.relativeY = LeftNodesHeight;
                    LeftNodesWidth = Math.max(LeftNodesWidth, SubNode.shape.GetNodeWidth());
                    LeftNodesHeight += SubNode.shape.GetNodeHeight();
                });
                var LeftShift = (ThisNode.shape.GetNodeHeight() - LeftNodesHeight) / 2;
                if (LeftShift > 0) {
                    ThisNode.forEachVisibleLeftNodes((SubNode: TreeNodeView) => {
                        SubNode.relativeY += LeftShift;
                    });
                }
                if (LeftNodesHeight > 0) {
                    TreeLeftX = -(LeftNodesWidth + VerticalTreeLayoutEngine.SideNodeHorizontalMargin);
                    TreeHeight = Math.max(TreeHeight, LeftNodesHeight);
                }
            }
            if (ThisNode.rightNodes != null) {
                var RightNodesWidth = 0;
                var RightNodesHeight = -VerticalTreeLayoutEngine.SideNodeVerticalMargin;
                ThisNode.forEachVisibleRightNodes((SubNode: TreeNodeView) => {
                    SubNode.shape.FitSizeToContent();
                    RightNodesHeight += VerticalTreeLayoutEngine.SideNodeVerticalMargin;
                    SubNode.relativeX = (ThisNodeWidth + VerticalTreeLayoutEngine.SideNodeHorizontalMargin);
                    SubNode.relativeY = RightNodesHeight;
                    RightNodesWidth = Math.max(RightNodesWidth, SubNode.shape.GetNodeWidth());
                    RightNodesHeight += SubNode.shape.GetNodeHeight();
                });
                var RightShift = (ThisNode.shape.GetNodeHeight() - RightNodesHeight) / 2;
                if (RightShift > 0) {
                    ThisNode.forEachVisibleRightNodes((SubNode: TreeNodeView) => {
                        SubNode.relativeY += RightShift;
                    });
                }
                if (RightNodesHeight > 0) {
                    TreeRightX += RightNodesWidth + VerticalTreeLayoutEngine.SideNodeHorizontalMargin;
                    TreeHeight = Math.max(TreeHeight, RightNodesHeight);
                }
            }

            var HeadRightX = TreeRightX;
            var HeadWidth = TreeRightX - TreeLeftX;
            Shape.SetHeadRect(TreeLeftX, 0, HeadWidth, TreeHeight);
            TreeHeight += VerticalTreeLayoutEngine.ChildrenVerticalMargin;

            var ChildrenTopWidth = 0;
            var ChildrenBottomWidth = 0;
            var ChildrenHeight = 0;
            var FormarUnfoldedChildHeight = Infinity;
            var FoldedNodeRun: TreeNodeView[] = [];
            var VisibleChildrenCount = 0;
            if (ThisNode.childNodes != null && ThisNode.childNodes.length > 0) {
                var IsPreviousChildFolded = false;

                ThisNode.forEachVisibleChildren((SubNode: TreeNodeView) => {
                    VisibleChildrenCount++;
                    this.Layout(SubNode);
                    var ChildTreeWidth = SubNode.shape.GetTreeWidth();
                    var ChildHeadWidth = SubNode.folded ? SubNode.shape.GetNodeWidth() : SubNode.shape.GetHeadWidth();
                    var ChildHeadHeight = SubNode.folded ? SubNode.shape.GetNodeHeight() : SubNode.shape.GetHeadHeight();
                    var ChildHeadLeftSideMargin = SubNode.shape.GetHeadLeftLocalX() - SubNode.shape.GetTreeLeftLocalX();
                    var ChildHeadRightX = ChildHeadLeftSideMargin + ChildHeadWidth;
                    var ChildTreeHeight = SubNode.shape.GetTreeHeight();
                    var HMargin = VerticalTreeLayoutEngine.ChildrenHorizontalMargin;

                    var IsUndeveloped = SubNode.childNodes == null || SubNode.childNodes.length == 0;
                    var IsFoldedLike = (SubNode.folded || IsUndeveloped) && ChildHeadHeight <= FormarUnfoldedChildHeight;

                    if (IsFoldedLike) {
                        SubNode.relativeX = ChildrenTopWidth;
                        ChildrenTopWidth = ChildrenTopWidth + ChildHeadWidth + HMargin;
                        FoldedNodeRun.push(SubNode);
                    } else {
                        if (IsPreviousChildFolded) {
                            // Arrange the folded nodes between open nodes to equal distance
                            var WidthDiff = ChildrenTopWidth - ChildrenBottomWidth;
                            if (WidthDiff < ChildHeadLeftSideMargin) {
                                SubNode.relativeX = ChildrenBottomWidth;
                                ChildrenTopWidth = ChildrenBottomWidth + ChildHeadRightX + HMargin;
                                ChildrenBottomWidth = ChildrenBottomWidth + ChildTreeWidth + HMargin;
                                if (SubNode.relativeX == 0) {
                                    for (var i = 0; i < FoldedNodeRun.length; i++) {
                                        FoldedNodeRun[i].relativeX += ChildHeadLeftSideMargin - WidthDiff;
                                    }
                                } else {
                                    var FoldedRunMargin = (ChildHeadLeftSideMargin - WidthDiff) / (FoldedNodeRun.length + 1)
                                    for (var i = 0; i < FoldedNodeRun.length; i++) {
                                        FoldedNodeRun[i].relativeX += FoldedRunMargin * (i + 1);
                                    }
                                }
                            } else {
                                SubNode.relativeX = ChildrenTopWidth - ChildHeadLeftSideMargin;
                                ChildrenBottomWidth = ChildrenTopWidth + ChildTreeWidth - ChildHeadLeftSideMargin + HMargin;
                                ChildrenTopWidth = ChildrenTopWidth + ChildHeadWidth + HMargin;
                            }
                        } else {
                            var ChildrenWidth = Math.max(ChildrenTopWidth, ChildrenBottomWidth);
                            SubNode.relativeX = ChildrenWidth;
                            ChildrenTopWidth = ChildrenWidth + ChildHeadRightX + HMargin;
                            ChildrenBottomWidth = ChildrenWidth + ChildTreeWidth + HMargin;
                        }
                        FoldedNodeRun = [];
                        FormarUnfoldedChildHeight = ChildHeadHeight;
                    }
                    SubNode.relativeX += -SubNode.shape.GetTreeLeftLocalX();
                    SubNode.relativeY = TreeHeight;

                    IsPreviousChildFolded = IsFoldedLike;
                    ChildrenHeight = Math.max(ChildrenHeight, ChildTreeHeight);
                    //console.log("T" + ChildrenTopWidth + ", B" + ChildrenBottomWidth);
                });

                var ChildrenWidth = Math.max(ChildrenTopWidth, ChildrenBottomWidth) - VerticalTreeLayoutEngine.ChildrenHorizontalMargin;
                var ShiftX = (ChildrenWidth - ThisNodeWidth) / 2;
                
                if (VisibleChildrenCount == 1) {
                    ThisNode.forEachVisibleChildren((SubNode: TreeNodeView) => {
                        ShiftX = -SubNode.shape.GetTreeLeftLocalX();
                        if (!SubNode.hasSideNode || SubNode.folded) {
                            var ShiftY = 0;
                            var SubNodeHeight = SubNode.shape.GetNodeHeight();
                            var ThisHeight = ThisNode.shape.GetNodeHeight();
                            var VMargin = VerticalTreeLayoutEngine.ChildrenVerticalMargin;
                            if (!SubNode.hasChildren || ThisHeight + VMargin * 2 + SubNodeHeight > TreeHeight) {
                                ShiftY = TreeHeight - (ThisHeight + VMargin);
                            } else {
                                ShiftY = SubNodeHeight + VMargin;
                            }
                            SubNode.relativeY -= ShiftY;
                            ChildrenHeight -= ShiftY;
                        }
                    });
                }
                TreeLeftX = Math.min(TreeLeftX, -ShiftX);
                ThisNode.forEachVisibleChildren((SubNode: TreeNodeView) => {
                    SubNode.relativeX -= ShiftX;
                });

                TreeHeight += ChildrenHeight;
                TreeRightX = Math.max(TreeLeftX + ChildrenWidth, HeadRightX);
            }
            Shape.SetTreeRect(TreeLeftX, 0, TreeRightX - TreeLeftX, TreeHeight);
            //console.log(ThisNode.Label + ": " + (<any>ThisNode.Shape).TreeBoundingBox.toString());
        }

    }

}
