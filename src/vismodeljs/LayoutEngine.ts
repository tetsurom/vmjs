
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
            if (ThisNode.IsVisible) {
                ThisNode.GetShape().PrepareContent();
                ThisNode.Render(DivFrag, SvgNodeFrag, SvgConnectionFrag);
                if (!ThisNode.folded) {
                    ThisNode.ForEachVisibleAllSubNodes((SubNode: TreeNodeView) => {
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
            var Shape = ThisNode.GetShape();
            Shape.GetNodeWidth();
            Shape.GetNodeHeight();
            if (ThisNode.folded) {
                return;
            }
            ThisNode.ForEachVisibleLeftNodes((SubNode: TreeNodeView) => {
                this.PrepareNodeSize(SubNode);
            });
            ThisNode.ForEachVisibleRightNodes((SubNode: TreeNodeView) => {
                this.PrepareNodeSize(SubNode);
            });
            ThisNode.ForEachVisibleChildren((SubNode: TreeNodeView) => {
                this.PrepareNodeSize(SubNode);
            });
        }

        private Layout(ThisNode: TreeNodeView): void {
            if (!ThisNode.IsVisible) {
                return;
            }
            var Shape = ThisNode.GetShape();
            if (!ThisNode.ShouldReLayout()) {
                ThisNode.TraverseVisibleNode((Node: TreeNodeView) => {
                    Node.Shape.FitSizeToContent();
                });
                return;
            }
            ThisNode.SetShouldReLayout(false);
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
            if (ThisNode.Left != null) {
                var LeftNodesWidth = 0;
                var LeftNodesHeight = -VerticalTreeLayoutEngine.SideNodeVerticalMargin;
                ThisNode.ForEachVisibleLeftNodes((SubNode: TreeNodeView) => {
                    SubNode.GetShape().FitSizeToContent();
                    LeftNodesHeight += VerticalTreeLayoutEngine.SideNodeVerticalMargin;
                    SubNode.RelativeX = -(SubNode.Shape.GetNodeWidth() + VerticalTreeLayoutEngine.SideNodeHorizontalMargin);
                    SubNode.RelativeY = LeftNodesHeight;
                    LeftNodesWidth = Math.max(LeftNodesWidth, SubNode.Shape.GetNodeWidth());
                    LeftNodesHeight += SubNode.Shape.GetNodeHeight();
                });
                var LeftShift = (ThisNode.Shape.GetNodeHeight() - LeftNodesHeight) / 2;
                if (LeftShift > 0) {
                    ThisNode.ForEachVisibleLeftNodes((SubNode: TreeNodeView) => {
                        SubNode.RelativeY += LeftShift;
                    });
                }
                if (LeftNodesHeight > 0) {
                    TreeLeftX = -(LeftNodesWidth + VerticalTreeLayoutEngine.SideNodeHorizontalMargin);
                    TreeHeight = Math.max(TreeHeight, LeftNodesHeight);
                }
            }
            if (ThisNode.Right != null) {
                var RightNodesWidth = 0;
                var RightNodesHeight = -VerticalTreeLayoutEngine.SideNodeVerticalMargin;
                ThisNode.ForEachVisibleRightNodes((SubNode: TreeNodeView) => {
                    SubNode.GetShape().FitSizeToContent();
                    RightNodesHeight += VerticalTreeLayoutEngine.SideNodeVerticalMargin;
                    SubNode.RelativeX = (ThisNodeWidth + VerticalTreeLayoutEngine.SideNodeHorizontalMargin);
                    SubNode.RelativeY = RightNodesHeight;
                    RightNodesWidth = Math.max(RightNodesWidth, SubNode.Shape.GetNodeWidth());
                    RightNodesHeight += SubNode.Shape.GetNodeHeight();
                });
                var RightShift = (ThisNode.Shape.GetNodeHeight() - RightNodesHeight) / 2;
                if (RightShift > 0) {
                    ThisNode.ForEachVisibleRightNodes((SubNode: TreeNodeView) => {
                        SubNode.RelativeY += RightShift;
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
            if (ThisNode.Children != null && ThisNode.Children.length > 0) {
                var IsPreviousChildFolded = false;

                ThisNode.ForEachVisibleChildren((SubNode: TreeNodeView) => {
                    VisibleChildrenCount++;
                    this.Layout(SubNode);
                    var ChildTreeWidth = SubNode.Shape.GetTreeWidth();
                    var ChildHeadWidth = SubNode.folded ? SubNode.Shape.GetNodeWidth() : SubNode.Shape.GetHeadWidth();
                    var ChildHeadHeight = SubNode.folded ? SubNode.Shape.GetNodeHeight() : SubNode.Shape.GetHeadHeight();
                    var ChildHeadLeftSideMargin = SubNode.Shape.GetHeadLeftLocalX() - SubNode.Shape.GetTreeLeftLocalX();
                    var ChildHeadRightX = ChildHeadLeftSideMargin + ChildHeadWidth;
                    var ChildTreeHeight = SubNode.Shape.GetTreeHeight();
                    var HMargin = VerticalTreeLayoutEngine.ChildrenHorizontalMargin;

                    var IsUndeveloped = SubNode.Children == null || SubNode.Children.length == 0;
                    var IsFoldedLike = (SubNode.folded || IsUndeveloped) && ChildHeadHeight <= FormarUnfoldedChildHeight;

                    if (IsFoldedLike) {
                        SubNode.RelativeX = ChildrenTopWidth;
                        ChildrenTopWidth = ChildrenTopWidth + ChildHeadWidth + HMargin;
                        FoldedNodeRun.push(SubNode);
                    } else {
                        if (IsPreviousChildFolded) {
                            // Arrange the folded nodes between open nodes to equal distance
                            var WidthDiff = ChildrenTopWidth - ChildrenBottomWidth;
                            if (WidthDiff < ChildHeadLeftSideMargin) {
                                SubNode.RelativeX = ChildrenBottomWidth;
                                ChildrenTopWidth = ChildrenBottomWidth + ChildHeadRightX + HMargin;
                                ChildrenBottomWidth = ChildrenBottomWidth + ChildTreeWidth + HMargin;
                                if (SubNode.RelativeX == 0) {
                                    for (var i = 0; i < FoldedNodeRun.length; i++) {
                                        FoldedNodeRun[i].RelativeX += ChildHeadLeftSideMargin - WidthDiff;
                                    }
                                } else {
                                    var FoldedRunMargin = (ChildHeadLeftSideMargin - WidthDiff) / (FoldedNodeRun.length + 1)
                                    for (var i = 0; i < FoldedNodeRun.length; i++) {
                                        FoldedNodeRun[i].RelativeX += FoldedRunMargin * (i + 1);
                                    }
                                }
                            } else {
                                SubNode.RelativeX = ChildrenTopWidth - ChildHeadLeftSideMargin;
                                ChildrenBottomWidth = ChildrenTopWidth + ChildTreeWidth - ChildHeadLeftSideMargin + HMargin;
                                ChildrenTopWidth = ChildrenTopWidth + ChildHeadWidth + HMargin;
                            }
                        } else {
                            var ChildrenWidth = Math.max(ChildrenTopWidth, ChildrenBottomWidth);
                            SubNode.RelativeX = ChildrenWidth;
                            ChildrenTopWidth = ChildrenWidth + ChildHeadRightX + HMargin;
                            ChildrenBottomWidth = ChildrenWidth + ChildTreeWidth + HMargin;
                        }
                        FoldedNodeRun = [];
                        FormarUnfoldedChildHeight = ChildHeadHeight;
                    }
                    SubNode.RelativeX += -SubNode.Shape.GetTreeLeftLocalX();
                    SubNode.RelativeY = TreeHeight;

                    IsPreviousChildFolded = IsFoldedLike;
                    ChildrenHeight = Math.max(ChildrenHeight, ChildTreeHeight);
                    //console.log("T" + ChildrenTopWidth + ", B" + ChildrenBottomWidth);
                });

                var ChildrenWidth = Math.max(ChildrenTopWidth, ChildrenBottomWidth) - VerticalTreeLayoutEngine.ChildrenHorizontalMargin;
                var ShiftX = (ChildrenWidth - ThisNodeWidth) / 2;
                
                if (VisibleChildrenCount == 1) {
                    ThisNode.ForEachVisibleChildren((SubNode: TreeNodeView) => {
                        ShiftX = -SubNode.Shape.GetTreeLeftLocalX();
                        if (!SubNode.HasSideNode() || SubNode.folded) {
                            var ShiftY = 0;
                            var SubNodeHeight = SubNode.Shape.GetNodeHeight();
                            var ThisHeight = ThisNode.Shape.GetNodeHeight();
                            var VMargin = VerticalTreeLayoutEngine.ChildrenVerticalMargin;
                            if (!SubNode.HasChildren() || ThisHeight + VMargin * 2 + SubNodeHeight > TreeHeight) {
                                ShiftY = TreeHeight - (ThisHeight + VMargin);
                            } else {
                                ShiftY = SubNodeHeight + VMargin;
                            }
                            SubNode.RelativeY -= ShiftY;
                            ChildrenHeight -= ShiftY;
                        }
                    });
                }
                TreeLeftX = Math.min(TreeLeftX, -ShiftX);
                ThisNode.ForEachVisibleChildren((SubNode: TreeNodeView) => {
                    SubNode.RelativeX -= ShiftX;
                });

                TreeHeight += ChildrenHeight;
                TreeRightX = Math.max(TreeLeftX + ChildrenWidth, HeadRightX);
            }
            Shape.SetTreeRect(TreeLeftX, 0, TreeRightX - TreeLeftX, TreeHeight);
            //console.log(ThisNode.Label + ": " + (<any>ThisNode.Shape).TreeBoundingBox.toString());
        }

    }

}
