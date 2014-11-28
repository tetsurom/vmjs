
module VisModelJS {
    export class LayoutEngine {
        doLayout(pictgramPanel: VisualModelPanel, nodeView: TreeNodeView): void {
        }
    }

    
    export class VerticalTreeLayoutEngine extends LayoutEngine {
        static sideNodeHorizontalMargin = 32;
        static sideNodeVerticalMargin = 10;
        static childrenVerticalMargin = 64;
        static childrenHorizontalMargin = 12;

        private render(thisNode: TreeNodeView, divFrag: DocumentFragment, SVGNodeFrag: DocumentFragment, SVGConnectionFrag: DocumentFragment): void {
            if (thisNode.visible) {
                thisNode.shape.prepareContent();
                thisNode.shape.render(divFrag, SVGNodeFrag, SVGConnectionFrag);
                if (!thisNode.folded) {
                    thisNode.forEachVisibleAllSubNodes((SubNode: TreeNodeView) => {
                        this.render(SubNode, divFrag, SVGNodeFrag, SVGConnectionFrag);
                    });
                }
            }
        }

        doLayout(pictgramPanel: VisualModelPanel, nodeView: TreeNodeView): void {
            var divFragment = document.createDocumentFragment();
            var svgNodeFragment = document.createDocumentFragment();
            var svgConnectionFragment = document.createDocumentFragment();
            var dummy = document.createDocumentFragment();

            this.render(nodeView, divFragment, svgNodeFragment, svgConnectionFragment);

            pictgramPanel.contentLayer.appendChild(divFragment);
            pictgramPanel.SVGLayerConnectorGroup.appendChild(svgConnectionFragment);
            pictgramPanel.SVGLayerNodeGroup.appendChild(svgNodeFragment);
            this.prepareNodeSize(nodeView);
            dummy.appendChild(divFragment);
            dummy.appendChild(svgConnectionFragment);
            dummy.appendChild(svgNodeFragment);

            this.layout(nodeView);
            pictgramPanel.contentLayer.appendChild(divFragment);
            pictgramPanel.SVGLayer.appendChild(svgConnectionFragment);
            pictgramPanel.SVGLayer.appendChild(svgNodeFragment);
        }

        private prepareNodeSize(thisNode: TreeNodeView): void {
            var Shape = thisNode.shape;
            Shape.nodeWidth;
            Shape.nodeHeight;
            if (thisNode.folded) {
                return;
            }
            thisNode.forEachVisibleLeftNodes((SubNode: TreeNodeView) => {
                this.prepareNodeSize(SubNode);
            });
            thisNode.forEachVisibleRightNodes((SubNode: TreeNodeView) => {
                this.prepareNodeSize(SubNode);
            });
            thisNode.forEachVisibleChildren((SubNode: TreeNodeView) => {
                this.prepareNodeSize(SubNode);
            });
        }

        private layout(thisNode: TreeNodeView): void {
            if (!thisNode.visible) {
                return;
            }
            var shape = thisNode.shape;
            if (!thisNode.shouldReLayout) {
                thisNode.traverseVisibleNode((Node: TreeNodeView) => {
                    Node.shape.fitSizeToContent();
                });
                return;
            }
            thisNode.shouldReLayout = false;
            shape.fitSizeToContent();
            var treeLeftX = 0;
            var thisNodeWidth = shape.nodeWidth;
            var treeRightX = thisNodeWidth;
            var treeHeight = shape.nodeHeight;
            if (thisNode.folded) {
                shape.setHeadRect(0, 0, thisNodeWidth, treeHeight);
                shape.setTreeRect(0, 0, thisNodeWidth, treeHeight);
                return;
            }
            if (thisNode.leftNodes != null) {
                var leftNodesWidth = 0;
                var leftNodesHeight = -VerticalTreeLayoutEngine.sideNodeVerticalMargin;
                thisNode.forEachVisibleLeftNodes((subNode: TreeNodeView) => {
                    subNode.shape.fitSizeToContent();
                    leftNodesHeight += VerticalTreeLayoutEngine.sideNodeVerticalMargin;
                    subNode.relativeX = -(subNode.shape.nodeWidth + VerticalTreeLayoutEngine.sideNodeHorizontalMargin);
                    subNode.relativeY = leftNodesHeight;
                    leftNodesWidth = Math.max(leftNodesWidth, subNode.shape.nodeWidth);
                    leftNodesHeight += subNode.shape.nodeHeight;
                });
                var leftShift = (thisNode.shape.nodeHeight - leftNodesHeight) / 2;
                if (leftShift > 0) {
                    thisNode.forEachVisibleLeftNodes((SubNode: TreeNodeView) => {
                        SubNode.relativeY += leftShift;
                    });
                }
                if (leftNodesHeight > 0) {
                    treeLeftX = -(leftNodesWidth + VerticalTreeLayoutEngine.sideNodeHorizontalMargin);
                    treeHeight = Math.max(treeHeight, leftNodesHeight);
                }
            }
            if (thisNode.rightNodes != null) {
                var rightNodesWidth = 0;
                var rightNodesHeight = -VerticalTreeLayoutEngine.sideNodeVerticalMargin;
                thisNode.forEachVisibleRightNodes((subNode: TreeNodeView) => {
                    subNode.shape.fitSizeToContent();
                    rightNodesHeight += VerticalTreeLayoutEngine.sideNodeVerticalMargin;
                    subNode.relativeX = (thisNodeWidth + VerticalTreeLayoutEngine.sideNodeHorizontalMargin);
                    subNode.relativeY = rightNodesHeight;
                    rightNodesWidth = Math.max(rightNodesWidth, subNode.shape.nodeWidth);
                    rightNodesHeight += subNode.shape.nodeHeight;
                });
                var rightShift = (thisNode.shape.nodeHeight - rightNodesHeight) / 2;
                if (rightShift > 0) {
                    thisNode.forEachVisibleRightNodes((SubNode: TreeNodeView) => {
                        SubNode.relativeY += rightShift;
                    });
                }
                if (rightNodesHeight > 0) {
                    treeRightX += rightNodesWidth + VerticalTreeLayoutEngine.sideNodeHorizontalMargin;
                    treeHeight = Math.max(treeHeight, rightNodesHeight);
                }
            }

            var headRightX = treeRightX;
            var headWidth = treeRightX - treeLeftX;
            shape.setHeadRect(treeLeftX, 0, headWidth, treeHeight);
            treeHeight += VerticalTreeLayoutEngine.childrenVerticalMargin;

            var childrenTopWidth = 0;
            var childrenBottomWidth = 0;
            var childrenHeight = 0;
            var formarUnfoldedChildHeight = Infinity;
            var foldedNodeRun: TreeNodeView[] = [];
            var visibleChildrenCount = 0;
            if (thisNode.childNodes != null && thisNode.childNodes.length > 0) {
                var isPreviousChildFolded = false;

                thisNode.forEachVisibleChildren((subNode: TreeNodeView) => {
                    visibleChildrenCount++;
                    this.layout(subNode);
                    var childTreeWidth = subNode.shape.treeWidth;
                    var childHeadWidth = subNode.folded ? subNode.shape.nodeWidth : subNode.shape.headWidth;
                    var childHeadHeight = subNode.folded ? subNode.shape.nodeHeight : subNode.shape.headHeight;
                    var childHeadLeftSideMargin = subNode.shape.headLeftLocalX - subNode.shape.treeLeftLocalX;
                    var childHeadRightX = childHeadLeftSideMargin + childHeadWidth;
                    var childTreeHeight = subNode.shape.treeHeight;
                    var hMargin = VerticalTreeLayoutEngine.childrenHorizontalMargin;

                    var isUndeveloped = subNode.childNodes == null || subNode.childNodes.length == 0;
                    var isFoldedLike = (subNode.folded || isUndeveloped) && childHeadHeight <= formarUnfoldedChildHeight;

                    if (isFoldedLike) {
                        subNode.relativeX = childrenTopWidth;
                        childrenTopWidth = childrenTopWidth + childHeadWidth + hMargin;
                        foldedNodeRun.push(subNode);
                    } else {
                        if (isPreviousChildFolded) {
                            // Arrange the folded nodes between open nodes to equal distance
                            var widthDiff = childrenTopWidth - childrenBottomWidth;
                            if (widthDiff < childHeadLeftSideMargin) {
                                subNode.relativeX = childrenBottomWidth;
                                childrenTopWidth = childrenBottomWidth + childHeadRightX + hMargin;
                                childrenBottomWidth = childrenBottomWidth + childTreeWidth + hMargin;
                                if (subNode.relativeX == 0) {
                                    for (var i = 0; i < foldedNodeRun.length; i++) {
                                        foldedNodeRun[i].relativeX += childHeadLeftSideMargin - widthDiff;
                                    }
                                } else {
                                    var foldedRunMargin = (childHeadLeftSideMargin - widthDiff) / (foldedNodeRun.length + 1)
                                    for (var i = 0; i < foldedNodeRun.length; i++) {
                                        foldedNodeRun[i].relativeX += foldedRunMargin * (i + 1);
                                    }
                                }
                            } else {
                                subNode.relativeX = childrenTopWidth - childHeadLeftSideMargin;
                                childrenBottomWidth = childrenTopWidth + childTreeWidth - childHeadLeftSideMargin + hMargin;
                                childrenTopWidth = childrenTopWidth + childHeadWidth + hMargin;
                            }
                        } else {
                            var childrenWidth = Math.max(childrenTopWidth, childrenBottomWidth);
                            subNode.relativeX = childrenWidth;
                            childrenTopWidth = childrenWidth + childHeadRightX + hMargin;
                            childrenBottomWidth = childrenWidth + childTreeWidth + hMargin;
                        }
                        foldedNodeRun = [];
                        formarUnfoldedChildHeight = childHeadHeight;
                    }
                    subNode.relativeX += -subNode.shape.treeLeftLocalX;
                    subNode.relativeY = treeHeight;

                    isPreviousChildFolded = isFoldedLike;
                    childrenHeight = Math.max(childrenHeight, childTreeHeight);
                    //console.log("T" + ChildrenTopWidth + ", B" + ChildrenBottomWidth);
                });

                var childrenWidth = Math.max(childrenTopWidth, childrenBottomWidth) - VerticalTreeLayoutEngine.childrenHorizontalMargin;
                var shiftX = (childrenWidth - thisNodeWidth) / 2;
                
                if (visibleChildrenCount == 1) {
                    thisNode.forEachVisibleChildren((subNode: TreeNodeView) => {
                        shiftX = -subNode.shape.treeLeftLocalX;
                        if (!subNode.hasSideNode || subNode.folded) {
                            var shiftY = 0;
                            var subNodeHeight = subNode.shape.nodeHeight;
                            var thisHeight = thisNode.shape.nodeHeight;
                            var vMargin = VerticalTreeLayoutEngine.childrenVerticalMargin;
                            if (!subNode.hasChildren || thisHeight + vMargin * 2 + subNodeHeight > treeHeight) {
                                shiftY = treeHeight - (thisHeight + vMargin);
                            } else {
                                shiftY = subNodeHeight + vMargin;
                            }
                            subNode.relativeY -= shiftY;
                            childrenHeight -= shiftY;
                        }
                    });
                }
                treeLeftX = Math.min(treeLeftX, -shiftX);
                thisNode.forEachVisibleChildren((SubNode: TreeNodeView) => {
                    SubNode.relativeX -= shiftX;
                });

                treeHeight += childrenHeight;
                treeRightX = Math.max(treeLeftX + childrenWidth, headRightX);
            }
            shape.setTreeRect(treeLeftX, 0, treeRightX - treeLeftX, treeHeight);
            //console.log(ThisNode.Label + ": " + (<any>ThisNode.Shape).TreeBoundingBox.toString());
        }

    }

}
