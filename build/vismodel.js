var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var VisModelJS;
(function (VisModelJS) {
    var LayoutEngine = (function () {
        function LayoutEngine() {
        }
        LayoutEngine.prototype.doLayout = function (pictgramPanel, nodeView) {
        };
        return LayoutEngine;
    })();
    VisModelJS.LayoutEngine = LayoutEngine;
    var VerticalTreeLayoutEngine = (function (_super) {
        __extends(VerticalTreeLayoutEngine, _super);
        function VerticalTreeLayoutEngine() {
            _super.apply(this, arguments);
        }
        VerticalTreeLayoutEngine.prototype.render = function (thisNode, divFrag, SVGNodeFrag, SVGConnectionFrag) {
            var _this = this;
            if (thisNode.visible) {
                thisNode.shape.prepareContent();
                thisNode.shape.render(divFrag, SVGNodeFrag, SVGConnectionFrag);
                if (!thisNode.folded) {
                    thisNode.forEachVisibleAllSubNodes(function (SubNode) {
                        _this.render(SubNode, divFrag, SVGNodeFrag, SVGConnectionFrag);
                    });
                }
            }
        };
        VerticalTreeLayoutEngine.prototype.doLayout = function (pictgramPanel, nodeView) {
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
        };
        VerticalTreeLayoutEngine.prototype.prepareNodeSize = function (thisNode) {
            var _this = this;
            var Shape = thisNode.shape;
            Shape.nodeWidth;
            Shape.nodeHeight;
            if (thisNode.folded) {
                return;
            }
            thisNode.forEachVisibleLeftNodes(function (SubNode) {
                _this.prepareNodeSize(SubNode);
            });
            thisNode.forEachVisibleRightNodes(function (SubNode) {
                _this.prepareNodeSize(SubNode);
            });
            thisNode.forEachVisibleChildren(function (SubNode) {
                _this.prepareNodeSize(SubNode);
            });
        };
        VerticalTreeLayoutEngine.prototype.layout = function (thisNode) {
            var _this = this;
            if (!thisNode.visible) {
                return;
            }
            var shape = thisNode.shape;
            if (!thisNode.shouldReLayout) {
                thisNode.traverseVisibleNode(function (Node) {
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
                thisNode.forEachVisibleLeftNodes(function (subNode) {
                    subNode.shape.fitSizeToContent();
                    leftNodesHeight += VerticalTreeLayoutEngine.sideNodeVerticalMargin;
                    subNode.relativeX = -(subNode.shape.nodeWidth + VerticalTreeLayoutEngine.sideNodeHorizontalMargin);
                    subNode.relativeY = leftNodesHeight;
                    leftNodesWidth = Math.max(leftNodesWidth, subNode.shape.nodeWidth);
                    leftNodesHeight += subNode.shape.nodeHeight;
                });
                var leftShift = (thisNode.shape.nodeHeight - leftNodesHeight) / 2;
                if (leftShift > 0) {
                    thisNode.forEachVisibleLeftNodes(function (SubNode) {
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
                thisNode.forEachVisibleRightNodes(function (subNode) {
                    subNode.shape.fitSizeToContent();
                    rightNodesHeight += VerticalTreeLayoutEngine.sideNodeVerticalMargin;
                    subNode.relativeX = (thisNodeWidth + VerticalTreeLayoutEngine.sideNodeHorizontalMargin);
                    subNode.relativeY = rightNodesHeight;
                    rightNodesWidth = Math.max(rightNodesWidth, subNode.shape.nodeWidth);
                    rightNodesHeight += subNode.shape.nodeHeight;
                });
                var rightShift = (thisNode.shape.nodeHeight - rightNodesHeight) / 2;
                if (rightShift > 0) {
                    thisNode.forEachVisibleRightNodes(function (SubNode) {
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
            var foldedNodeRun = [];
            var visibleChildrenCount = 0;
            if (thisNode.childNodes != null && thisNode.childNodes.length > 0) {
                var isPreviousChildFolded = false;
                thisNode.forEachVisibleChildren(function (subNode) {
                    visibleChildrenCount++;
                    _this.layout(subNode);
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
                    }
                    else {
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
                                }
                                else {
                                    var foldedRunMargin = (childHeadLeftSideMargin - widthDiff) / (foldedNodeRun.length + 1);
                                    for (var i = 0; i < foldedNodeRun.length; i++) {
                                        foldedNodeRun[i].relativeX += foldedRunMargin * (i + 1);
                                    }
                                }
                            }
                            else {
                                subNode.relativeX = childrenTopWidth - childHeadLeftSideMargin;
                                childrenBottomWidth = childrenTopWidth + childTreeWidth - childHeadLeftSideMargin + hMargin;
                                childrenTopWidth = childrenTopWidth + childHeadWidth + hMargin;
                            }
                        }
                        else {
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
                    thisNode.forEachVisibleChildren(function (subNode) {
                        shiftX = -subNode.shape.treeLeftLocalX;
                        if (!subNode.hasSideNode || subNode.folded) {
                            var shiftY = 0;
                            var subNodeHeight = subNode.shape.nodeHeight;
                            var thisHeight = thisNode.shape.nodeHeight;
                            var vMargin = VerticalTreeLayoutEngine.childrenVerticalMargin;
                            if (!subNode.hasChildren || thisHeight + vMargin * 2 + subNodeHeight > treeHeight) {
                                shiftY = treeHeight - (thisHeight + vMargin);
                            }
                            else {
                                shiftY = subNodeHeight + vMargin;
                            }
                            subNode.relativeY -= shiftY;
                            childrenHeight -= shiftY;
                        }
                    });
                }
                treeLeftX = Math.min(treeLeftX, -shiftX);
                thisNode.forEachVisibleChildren(function (SubNode) {
                    SubNode.relativeX -= shiftX;
                });
                treeHeight += childrenHeight;
                treeRightX = Math.max(treeLeftX + childrenWidth, headRightX);
            }
            shape.setTreeRect(treeLeftX, 0, treeRightX - treeLeftX, treeHeight);
            //console.log(ThisNode.Label + ": " + (<any>ThisNode.Shape).TreeBoundingBox.toString());
        };
        VerticalTreeLayoutEngine.sideNodeHorizontalMargin = 32;
        VerticalTreeLayoutEngine.sideNodeVerticalMargin = 10;
        VerticalTreeLayoutEngine.childrenVerticalMargin = 64;
        VerticalTreeLayoutEngine.childrenHorizontalMargin = 12;
        return VerticalTreeLayoutEngine;
    })(LayoutEngine);
    VisModelJS.VerticalTreeLayoutEngine = VerticalTreeLayoutEngine;
})(VisModelJS || (VisModelJS = {}));
var VisModelJS;
(function (VisModelJS) {
    var TreeNodeView = (function () {
        function TreeNodeView() {
            this.relativeX = 0; // relative x from parent node
            this.relativeY = 0; // relative y from parent node
            this.leftNodes = null;
            this.rightNodes = null;
            this.childNodes = null;
            this._shape = null;
            this._shouldReLayout = true;
            this.visible = true;
            this._folded = false;
        }
        Object.defineProperty(TreeNodeView.prototype, "folded", {
            get: function () {
                return this._folded;
            },
            set: function (value) {
                if (this._folded != value) {
                    this.shouldReLayout = true;
                }
                this._folded = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TreeNodeView.prototype, "shouldReLayout", {
            get: function () {
                return this._shouldReLayout;
            },
            set: function (value) {
                if (!this._shouldReLayout && value && this.parent) {
                    this.parent.shouldReLayout = true;
                }
                this._shouldReLayout = value;
            },
            enumerable: true,
            configurable: true
        });
        //FixMe
        TreeNodeView.prototype.UpdateViewMap = function (viewMap) {
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
        };
        TreeNodeView.prototype.appendChild = function (node) {
            if (this.childNodes == null) {
                this.childNodes = [];
            }
            this.childNodes.push(node);
            node.parent = this;
        };
        TreeNodeView.prototype.appendLeftNode = function (node) {
            if (this.leftNodes == null) {
                this.leftNodes = [];
            }
            this.leftNodes.push(node);
            node.parent = this;
        };
        TreeNodeView.prototype.appendRightNode = function (node) {
            if (this.rightNodes == null) {
                this.rightNodes = [];
            }
            this.rightNodes.push(node);
            node.parent = this;
        };
        Object.defineProperty(TreeNodeView.prototype, "shape", {
            get: function () {
                if (this._shape == null) {
                    this._shape = VisModelJS.ShapeFactory.createShape(this);
                }
                return this._shape;
            },
            set: function (value) {
                if (this._shape) {
                    this._shape.nodeView = null;
                }
                if (value) {
                    value.nodeView = this;
                }
                this._shape = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TreeNodeView.prototype, "gx", {
            /**
                Global X: Scale-independent and transform-independent X distance from leftside of the top goal.
                @return always 0 if this is top goal.
            */
            get: function () {
                if (TreeNodeView.globalPositionCache != null && TreeNodeView.globalPositionCache[this.label]) {
                    return TreeNodeView.globalPositionCache[this.label].x;
                }
                if (this.parent == null) {
                    return this.relativeX;
                }
                return this.parent.gx + this.relativeX;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TreeNodeView.prototype, "gy", {
            /**
                Global Y: Scale-independent and transform-independent Y distance from top of the top goal.
                @eturn always 0 if this is top goal.
            */
            get: function () {
                if (TreeNodeView.globalPositionCache != null && TreeNodeView.globalPositionCache[this.label]) {
                    return TreeNodeView.globalPositionCache[this.label].y;
                }
                if (this.parent == null) {
                    return this.relativeY;
                }
                return this.parent.gy + this.relativeY;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TreeNodeView.prototype, "centerGx", {
            // Global center X/Y: Node center position
            get: function () {
                return this.gx + this._shape.nodeWidth * 0.5;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TreeNodeView.prototype, "centerGy", {
            get: function () {
                return this.gy + this._shape.nodeHeight * 0.5;
            },
            enumerable: true,
            configurable: true
        });
        TreeNodeView.setGlobalPositionCacheEnabled = function (State) {
            if (State && TreeNodeView.globalPositionCache == null) {
                TreeNodeView.globalPositionCache = {};
            }
            else if (!State) {
                TreeNodeView.globalPositionCache = null;
            }
        };
        Object.defineProperty(TreeNodeView.prototype, "globalPosition", {
            /**
                Scale-independent and transform-independent distance from leftside of GSN.
                @return always (0, 0) if this is top goal.
            */
            get: function () {
                if (TreeNodeView.globalPositionCache != null && TreeNodeView.globalPositionCache[this.label]) {
                    return TreeNodeView.globalPositionCache[this.label].clone();
                }
                if (this.parent == null) {
                    return new VisModelJS.Point(this.relativeX, this.relativeY);
                }
                var parentPos = this.parent.globalPosition;
                parentPos.x += this.relativeX;
                parentPos.y += this.relativeY;
                if (TreeNodeView.globalPositionCache != null) {
                    TreeNodeView.globalPositionCache[this.label] = parentPos.clone();
                }
                return parentPos;
            },
            enumerable: true,
            configurable: true
        });
        /**
            Try to reuse shape.
        */
        TreeNodeView.prototype.copyFlagsFromOldView = function (oldView) {
            if (oldView) {
                this._folded = oldView._folded;
                var isContentChanged = this.content != oldView.content;
                if (isContentChanged) {
                    this.shape.setColorStyle(oldView.shape.getColorStyle());
                }
                else {
                    this.shape = oldView.shape;
                }
            }
        };
        TreeNodeView.prototype.getConnectorPosition = function (dir, globalPosition) {
            var P = this._shape.getConnectorPosition(dir);
            P.x += globalPosition.x;
            P.y += globalPosition.y;
            return P;
        };
        /**
            Update DOM node position by the position that layout engine caluculated
        */
        TreeNodeView.prototype.updateNodePosition = function (animationCallbacks, duration, screenRect, unfoldBaseNode) {
            var _this = this;
            duration = duration || 0;
            if (!this.visible) {
                return;
            }
            var updateSubNode = function (SubNode) {
                var base = unfoldBaseNode;
                if (!base && SubNode._shape.willFadein) {
                    base = _this;
                }
                if (base && duration > 0) {
                    SubNode._shape.setFadeinBasePosition(base._shape.gxCache, base._shape.gyCache);
                    SubNode.updateNodePosition(animationCallbacks, duration, screenRect, base);
                }
                else {
                    SubNode.updateNodePosition(animationCallbacks, duration, screenRect);
                }
            };
            var gp = this.globalPosition;
            this._shape.moveTo(animationCallbacks, gp.x, gp.y, duration, screenRect);
            var directions = [3 /* Bottom */, 2 /* Right */, 0 /* Left */];
            var subNodeTypes = [this.childNodes, this.rightNodes, this.leftNodes];
            for (var i = 0; i < 3; ++i) {
                var p1 = this.getConnectorPosition(directions[i], gp);
                var arrowGoalDirection = VisModelJS.reverseDirection(directions[i]);
                this.forEachVisibleSubNode(subNodeTypes[i], function (SubNode) {
                    var p2 = SubNode.getConnectorPosition(arrowGoalDirection, SubNode.globalPosition);
                    updateSubNode(SubNode);
                    SubNode._shape.moveArrowTo(animationCallbacks, p1, p2, directions[i], duration, screenRect);
                    SubNode.parentDirection = VisModelJS.reverseDirection(directions[i]);
                });
            }
        };
        TreeNodeView.prototype.forEachVisibleSubNode = function (subNodes, action) {
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
        };
        TreeNodeView.prototype.forEachVisibleChildren = function (action) {
            this.forEachVisibleSubNode(this.childNodes, action);
        };
        TreeNodeView.prototype.forEachVisibleRightNodes = function (action) {
            this.forEachVisibleSubNode(this.rightNodes, action);
        };
        TreeNodeView.prototype.forEachVisibleLeftNodes = function (action) {
            this.forEachVisibleSubNode(this.leftNodes, action);
        };
        TreeNodeView.prototype.forEachVisibleAllSubNodes = function (action) {
            if (this.forEachVisibleSubNode(this.leftNodes, action) && this.forEachVisibleSubNode(this.rightNodes, action) && this.forEachVisibleSubNode(this.childNodes, action))
                return true;
            return false;
        };
        TreeNodeView.prototype.traverseVisibleNode = function (action) {
            action(this);
            this.forEachVisibleAllSubNodes(function (subNode) {
                subNode.traverseVisibleNode(action);
            });
        };
        TreeNodeView.prototype.forEachSubNode = function (subNodes, action) {
            if (subNodes != null) {
                for (var i = 0; i < subNodes.length; i++) {
                    if (action(subNodes[i]) === false) {
                        return false;
                    }
                }
            }
            return true;
        };
        TreeNodeView.prototype.forEachAllSubNodes = function (action) {
            if (this.forEachSubNode(this.leftNodes, action) && this.forEachSubNode(this.rightNodes, action) && this.forEachSubNode(this.childNodes, action))
                return true;
            return false;
        };
        TreeNodeView.prototype.traverseNode = function (action) {
            if (action(this) === false)
                return false;
            if (this.forEachAllSubNodes(function (subNode) { return subNode.traverseNode(action); }))
                return true;
            return false;
        };
        /**
            Clear position cache and enable to fading in when the node re-appearing.
            This method should be called after the node became invibible or the node never fade in.
        */
        TreeNodeView.prototype.clearAnimationCache = function (force) {
            if (force || !this.visible) {
                this.shape.clearAnimationCache();
            }
            if (force || this._folded) {
                this.forEachAllSubNodes(function (SubNode) {
                    SubNode.clearAnimationCache(true);
                });
            }
            else {
                this.forEachAllSubNodes(function (SubNode) {
                    SubNode.clearAnimationCache(false);
                });
            }
        };
        Object.defineProperty(TreeNodeView.prototype, "hasSideNode", {
            get: function () {
                return (this.leftNodes != null && this.leftNodes.length > 0) || (this.rightNodes != null && this.rightNodes.length > 0);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TreeNodeView.prototype, "hasChildren", {
            get: function () {
                return (this.childNodes != null && this.childNodes.length > 0);
            },
            enumerable: true,
            configurable: true
        });
        TreeNodeView.prototype.isInRect = function (target) {
            // While animation playing, cached position(visible position) != this.position(logical position)
            var gyCached = this._shape.gyCache;
            var gxCached = this._shape.gxCache;
            var pos;
            if (gxCached != null && gyCached != null) {
                pos = new VisModelJS.Point(gxCached, gyCached);
            }
            else {
                pos = this.globalPosition;
            }
            if (pos.x > target.x + target.width || pos.y > target.y + target.height) {
                return false;
            }
            pos.x += this._shape.nodeWidth;
            pos.y += this._shape.nodeHeight;
            if (pos.x < target.x || pos.y < target.y) {
                return false;
            }
            return true;
        };
        TreeNodeView.prototype.isConnectorInRect = function (target) {
            if (!this.parent) {
                return false;
            }
            var pa;
            var pb;
            if (this._shape.gxCache != null && this._shape.gyCache != null) {
                pa = this._shape.arrowP1Cache;
                pb = this._shape.arrowP2Cache;
            }
            else {
                pa = this.getConnectorPosition(this.parentDirection, this.globalPosition);
                pb = this.parent.getConnectorPosition(VisModelJS.reverseDirection(this.parentDirection), this.parent.globalPosition);
            }
            var pos = new VisModelJS.Point(Math.min(pa.x, pb.x), Math.min(pa.y, pb.y));
            if (pos.x > target.x + target.width || pos.y > target.y + target.height) {
                return false;
            }
            pos.x = Math.max(pa.x, pb.x);
            pos.y = Math.max(pa.y, pb.y);
            if (pos.x < target.x || pos.y < target.y) {
                return false;
            }
            return true;
        };
        /**
           @method FoldDeepSubGoals
           @param {NodeView} NodeView
        */
        TreeNodeView.prototype.foldDeepSubGoals = function (limitDepth) {
            if (limitDepth <= 0) {
                this.folded = true;
            }
            else {
                this.forEachVisibleChildren(function (SubNode) { return SubNode.foldDeepSubGoals(limitDepth - 1); });
            }
        };
        // For memorization
        TreeNodeView.globalPositionCache = null;
        return TreeNodeView;
    })();
    VisModelJS.TreeNodeView = TreeNodeView;
})(VisModelJS || (VisModelJS = {}));
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
var VisModelJS;
(function (VisModelJS) {
    var ShapeSizePreFetcher = (function () {
        function ShapeSizePreFetcher() {
            this.queue = [];
            this.timerHandle = 0;
            this.dummyDiv = document.createElement("div");
            this.dummyDiv.style.position = "absolute";
            this.dummyDiv.style.top = "1000%";
            document.body.appendChild(this.dummyDiv);
        }
        ShapeSizePreFetcher.prototype.start = function () {
            var _this = this;
            this.timerHandle = setInterval(function () {
                var StartTime = VisModelJS.Utils.getTime();
                while (_this.queue.length > 0 && VisModelJS.Utils.getTime() - StartTime < 16) {
                    var shape = _this.queue.shift();
                    if (shape.nodeView && !shape.isSizeCached) {
                        shape.prepareContent();
                        if (!shape.content.parentElement) {
                            _this.dummyDiv.appendChild(shape.content);
                        }
                        shape.nodeWidth;
                        shape.headHeight;
                        _this.dummyDiv.removeChild(shape.content);
                    }
                }
                if (_this.queue.length == 0) {
                    clearInterval(_this.timerHandle);
                    _this.timerHandle = 0;
                }
            }, 20);
        };
        ShapeSizePreFetcher.prototype.addShape = function (shape) {
            this.queue.push(shape);
            if (!this.timerHandle) {
                this.start();
            }
        };
        return ShapeSizePreFetcher;
    })();
    VisModelJS.ShapeSizePreFetcher = ShapeSizePreFetcher;
    var ShapeFactory = (function () {
        function ShapeFactory() {
        }
        ShapeFactory.setFactory = function (factory) {
            ShapeFactory.factory = factory;
        };
        ShapeFactory.createShape = function (node) {
            return ShapeFactory.factory.createShape(node);
        };
        ShapeFactory.prototype.createShape = function (node) {
            throw Error("Not impremented");
            return null;
        };
        return ShapeFactory;
    })();
    VisModelJS.ShapeFactory = ShapeFactory;
    var Shape = (function () {
        function Shape(nodeView) {
            this.nodeView = nodeView;
            this.colorStyles = [VisModelJS.ColorStyle.Default];
            this._willFadein = false;
            this._gxCache = null;
            this._gyCache = null;
            this.content = null;
            this.nodeWidthCache = Shape.defaultWidth;
            this.nodeHeightCache = 0;
            this.headBoundingBox = new VisModelJS.Rect(0, 0, 0, 0);
            this.treeBoundingBox = new VisModelJS.Rect(0, 0, 0, 0);
            if (Shape.asyncSizePrefetcher == null) {
                Shape.asyncSizePrefetcher = new ShapeSizePreFetcher();
            }
            Shape.asyncSizePrefetcher.addShape(this);
        }
        Object.defineProperty(Shape.prototype, "isSizeCached", {
            get: function () {
                return this.nodeHeightCache != 0 && this.nodeWidthCache != 0;
            },
            enumerable: true,
            configurable: true
        });
        Shape.createArrowPath = function () {
            return Shape.arrowPathMaster.cloneNode();
        };
        Shape.prototype.setTreeRect = function (localX, localY, width, height) {
            this.setTreeUpperLeft(localX, localY);
            this.setTreeSize(width, height);
        };
        Shape.prototype.setHeadRect = function (localX, localY, width, height) {
            this.setHeadUpperLeft(localX, localY);
            this.setHeadSize(width, height);
        };
        Shape.prototype.setTreeSize = function (width, height) {
            this.treeBoundingBox.width = width;
            this.treeBoundingBox.height = height;
        };
        Shape.prototype.setHeadSize = function (width, height) {
            this.headBoundingBox.width = width;
            this.headBoundingBox.height = height;
        };
        Object.defineProperty(Shape.prototype, "nodeWidth", {
            get: function () {
                return this.nodeWidthCache;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape.prototype, "nodeHeight", {
            get: function () {
                if (this.nodeHeightCache == 0) {
                    var Cached = Shape.nodeHeightCache[this.content.innerHTML];
                    if (Cached) {
                        this.nodeHeightCache = Cached;
                    }
                    else {
                        Shape.nodeHeightCache[this.content.innerHTML] = this.nodeHeightCache = this.content.clientHeight;
                    }
                }
                return this.nodeHeightCache;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape.prototype, "treeWidth", {
            get: function () {
                if (this.treeBoundingBox.width == 0) {
                    this.treeBoundingBox.width = 150; //FIXME
                }
                return this.treeBoundingBox.width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape.prototype, "treeHeight", {
            get: function () {
                if (this.treeBoundingBox.height == 0) {
                    this.treeBoundingBox.height = 100; //FIXME
                }
                return this.treeBoundingBox.height;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape.prototype, "headWidth", {
            get: function () {
                if (this.headBoundingBox.width == 0) {
                    this.headBoundingBox.width = 150; //FIXME
                }
                return this.headBoundingBox.width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape.prototype, "headHeight", {
            get: function () {
                if (this.headBoundingBox.height == 0) {
                    this.headBoundingBox.height = 100; //FIXME
                }
                return this.headBoundingBox.height;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape.prototype, "treeLeftLocalX", {
            get: function () {
                return this.treeBoundingBox.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape.prototype, "headLeftLocalX", {
            get: function () {
                return this.headBoundingBox.x;
            },
            enumerable: true,
            configurable: true
        });
        Shape.prototype.setTreeUpperLeft = function (localX, localY) {
            this.treeBoundingBox.x = localX;
            this.treeBoundingBox.y = localY;
        };
        Shape.prototype.setHeadUpperLeft = function (localX, localY) {
            this.headBoundingBox.x = localX;
            this.headBoundingBox.y = localY;
        };
        Shape.prototype.updateHtmlClass = function () {
            this.content.className = "node";
        };
        Shape.prototype.formatNewLine = function (doc) {
            return doc.replace(/\r\n|\n|\r/g, '<br>');
        };
        Shape.prototype.prepareHTMLContent = function () {
            if (this.content == null) {
                var div = document.createElement("div");
                this.content = div;
                div.id = this.nodeView.label;
                div.setAttribute("data-nodelabel", this.nodeView.label);
                if (this.nodeView.label) {
                    var h4 = document.createElement("h4");
                    h4.textContent = this.nodeView.label;
                    div.appendChild(h4);
                }
                if (this.nodeView.content) {
                    var p = document.createElement("p");
                    p.innerText = this.nodeView.content.trim();
                    div.appendChild(p);
                }
                this.updateHtmlClass();
            }
        };
        Shape.prototype.prepareContent = function () {
            this.prepareHTMLContent();
            this.prepareSVGContent();
        };
        Shape.prototype.render = function (htmlContentFragment, svgNodeFragment, svgConnectionFragment) {
            svgNodeFragment.appendChild(this.shapeGroup);
            if (this.arrowPath != null && this.nodeView.parent != null) {
                svgConnectionFragment.appendChild(this.arrowPath);
            }
            htmlContentFragment.appendChild(this.content);
        };
        Shape.prototype.fitSizeToContent = function () {
        };
        Shape.prototype.setPosition = function (x, y) {
            if (this.nodeView.visible) {
                var div = this.content;
                if (div != null) {
                    div.style.left = x + "px";
                    div.style.top = y + "px";
                }
                var mat = this.shapeGroup.transform.baseVal.getItem(0).matrix;
                mat.e = x;
                mat.f = y;
            }
            this._gxCache = x;
            this._gyCache = y;
        };
        Object.defineProperty(Shape.prototype, "opacity", {
            set: function (value) {
                this.content.style.opacity = value.toString();
                this.shapeGroup.style.opacity = value.toString();
            },
            enumerable: true,
            configurable: true
        });
        Shape.prototype.fadein = function (animationCallbacks, duration) {
            var _this = this;
            var V = 1 / duration;
            var opacity = 0;
            animationCallbacks.push(function (deltaT) {
                opacity += V * deltaT;
                _this.opacity = _this.arrowOpacity = opacity;
            });
        };
        Shape.prototype.moveTo = function (animationCallbacks, x, y, duration, screenRect) {
            var _this = this;
            if (duration <= 0) {
                this.setPosition(x, y);
                return;
            }
            if (this.willFadein) {
                if (screenRect && (y + this.nodeHeight < screenRect.y || y > screenRect.y + screenRect.height)) {
                    this.setPosition(x, y);
                    this._willFadein = false;
                    return;
                }
                this.fadein(animationCallbacks, duration);
                this._willFadein = false;
                if (this._gxCache == null || this._gyCache == null) {
                    this.setPosition(x, y);
                    return;
                }
            }
            if (screenRect) {
                Shape.__Debug_Animation_TotalNodeCount++;
                if (this._gxCache + this.nodeWidth < screenRect.x || this._gxCache > screenRect.x + screenRect.width) {
                    if (x + this.nodeWidth < screenRect.x || x > screenRect.x + screenRect.width) {
                        this.setPosition(x, y);
                        return;
                    }
                }
                if (this._gyCache + this.nodeHeight < screenRect.y || this._gyCache > screenRect.y + screenRect.height) {
                    this.setPosition(x, y);
                    return;
                }
            }
            var VX = (x - this._gxCache) / duration;
            var VY = (y - this._gyCache) / duration;
            animationCallbacks.push(function (deltaT) { return _this.setPosition(_this._gxCache + VX * deltaT, _this._gyCache + VY * deltaT); });
        };
        Shape.prototype.setFadeinBasePosition = function (startGX, startGY) {
            this._willFadein = true;
            this._gxCache = startGX;
            this._gyCache = startGY;
            this._arrowP1Cache = this._arrowP2Cache = new VisModelJS.Point(startGX + this.nodeWidth * 0.5, startGY + this.nodeHeight * 0.5);
        };
        Object.defineProperty(Shape.prototype, "gxCache", {
            get: function () {
                return this._gxCache;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape.prototype, "gyCache", {
            get: function () {
                return this._gyCache;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape.prototype, "willFadein", {
            get: function () {
                return this._willFadein || this._gxCache == null || this._gyCache == null;
            },
            enumerable: true,
            configurable: true
        });
        Shape.prototype.clearAnimationCache = function () {
            this._gxCache = null;
            this._gyCache = null;
        };
        Shape.prototype.prepareSVGContent = function () {
            this.shapeGroup = VisModelJS.Utils.createSVGElement("g");
            this.shapeGroup.setAttribute("transform", "translate(0,0)");
            this.shapeGroup.setAttribute("class", this.colorStyles.join(" "));
            this.arrowPath = Shape.createArrowPath();
            this.arrowStart = this.arrowPath.pathSegList.getItem(0);
            this.arrowCurve = this.arrowPath.pathSegList.getItem(1);
        };
        Object.defineProperty(Shape.prototype, "arrowP1Cache", {
            get: function () {
                return this._arrowP1Cache;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Shape.prototype, "arrowP2Cache", {
            get: function () {
                return this._arrowP2Cache;
            },
            enumerable: true,
            configurable: true
        });
        Shape.prototype.setArrowPosition = function (p1, p2, dir) {
            var start = this.arrowStart;
            var curve = this.arrowCurve;
            start.x = p1.x;
            start.y = p1.y;
            curve.x = p2.x;
            curve.y = p2.y;
            if (dir == 3 /* Bottom */ || dir == 1 /* Top */) {
                var dx = Math.abs(p1.x - p2.x);
                curve.x1 = (9 * p1.x + p2.x) / 10;
                curve.y1 = p2.y;
                curve.x2 = (9 * p2.x + p1.x) / 10;
                curve.y2 = p1.y;
                if (dx > 300) {
                    curve.x1 = p1.x - 10 * (p1.x - p2.x < 0 ? -1 : 1);
                    curve.x2 = p2.x + 10 * (p1.x - p2.x < 0 ? -1 : 1);
                }
                if (dx < 50) {
                    curve.y1 = curve.y2 = (p1.y + p2.y) * 0.5;
                }
            }
            else {
                curve.x1 = (p1.x + p2.x) / 2;
                curve.y1 = (9 * p1.y + p2.y) / 10;
                curve.x2 = (p1.x + p2.x) / 2;
                curve.y2 = (9 * p2.y + p1.y) / 10;
            }
            this._arrowP1Cache = p1;
            this._arrowP2Cache = p2;
        };
        Object.defineProperty(Shape.prototype, "arrowOpacity", {
            set: function (opacity) {
                this.arrowPath.style.opacity = opacity.toString();
            },
            enumerable: true,
            configurable: true
        });
        Shape.prototype.moveArrowTo = function (animationCallbacks, p1, p2, dir, duration, screenRect) {
            var _this = this;
            if (duration <= 0) {
                this.setArrowPosition(p1, p2, dir);
                return;
            }
            if (screenRect) {
                var R0 = this._arrowP1Cache.x < this._arrowP2Cache.x ? this._arrowP2Cache.x : this._arrowP1Cache.x;
                var L0 = this._arrowP1Cache.x < this._arrowP2Cache.x ? this._arrowP1Cache.x : this._arrowP2Cache.x;
                if (R0 < screenRect.x || L0 > screenRect.x + screenRect.width) {
                    var R1 = p1.x < p2.x ? p2.x : p1.x;
                    var L1 = p1.x < p2.x ? p1.x : p2.x;
                    if (R1 < screenRect.x || L1 > screenRect.x + screenRect.width) {
                        this.setArrowPosition(p1, p2, dir);
                        return;
                    }
                }
                if (this._arrowP2Cache.y < screenRect.y || this._arrowP1Cache.y > screenRect.y + screenRect.height) {
                    this.setArrowPosition(p1, p2, dir);
                    return;
                }
            }
            if (this._arrowP1Cache == this._arrowP2Cache && screenRect && (p2.y + this.nodeHeight < screenRect.y || p1.y > screenRect.y + screenRect.height)) {
                this.setArrowPosition(p1, p2, dir);
                return;
            }
            var P1VX = (p1.x - this._arrowP1Cache.x) / duration;
            var P1VY = (p1.y - this._arrowP1Cache.y) / duration;
            var P2VX = (p2.x - this._arrowP2Cache.x) / duration;
            var P2VY = (p2.y - this._arrowP2Cache.y) / duration;
            var CurrentP1 = this._arrowP1Cache.clone();
            var CurrentP2 = this._arrowP2Cache.clone();
            animationCallbacks.push(function (deltaT) {
                CurrentP1.x += P1VX * deltaT;
                CurrentP1.y += P1VY * deltaT;
                CurrentP2.x += P2VX * deltaT;
                CurrentP2.y += P2VY * deltaT;
                _this.setArrowPosition(CurrentP1, CurrentP2, dir);
            });
        };
        Shape.prototype.setArrowColorWhite = function (isWhite) {
            if (isWhite) {
                this.arrowPath.setAttribute("marker-end", "url(#Triangle-white)");
            }
            else {
                this.arrowPath.setAttribute("marker-end", "url(#Triangle-black)");
            }
        };
        Shape.prototype.getConnectorPosition = function (dir) {
            switch (dir) {
                case 2 /* Right */:
                    return new VisModelJS.Point(this.nodeWidth, this.nodeHeight / 2);
                case 0 /* Left */:
                    return new VisModelJS.Point(0, this.nodeHeight / 2);
                case 1 /* Top */:
                    return new VisModelJS.Point(this.nodeWidth / 2, 0);
                case 3 /* Bottom */:
                    return new VisModelJS.Point(this.nodeWidth / 2, this.nodeHeight);
                default:
                    return new VisModelJS.Point(0, 0);
            }
        };
        Shape.prototype.addColorStyle = function (colorStyleCode) {
            if (colorStyleCode) {
                if (this.colorStyles.indexOf(colorStyleCode) < 0) {
                    this.colorStyles.push(colorStyleCode);
                }
                if (this.shapeGroup) {
                    this.shapeGroup.setAttribute("class", this.colorStyles.join(" "));
                }
            }
        };
        Shape.prototype.removeColorStyle = function (ColorStyleCode) {
            if (ColorStyleCode && ColorStyleCode != VisModelJS.ColorStyle.Default) {
                var Index = this.colorStyles.indexOf(ColorStyleCode);
                if (Index > 0) {
                    this.colorStyles.splice(Index, 1);
                }
                if (this.shapeGroup) {
                    this.shapeGroup.setAttribute("class", this.colorStyles.join(" "));
                }
            }
        };
        Shape.prototype.getColorStyle = function () {
            return this.colorStyles;
        };
        Shape.prototype.setColorStyle = function (styles) {
            this.colorStyles = styles;
            if (this.colorStyles.indexOf(VisModelJS.ColorStyle.Default) < 0) {
                this.colorStyles.push(VisModelJS.ColorStyle.Default);
            }
        };
        Shape.prototype.clearColorStyle = function () {
            this.colorStyles = [VisModelJS.ColorStyle.Default];
            if (this.shapeGroup) {
                this.shapeGroup.setAttribute("class", this.colorStyles.join(" "));
            }
        };
        Shape.nodeHeightCache = {};
        Shape.defaultWidth = 150;
        Shape.arrowPathMaster = (function () {
            var Master = VisModelJS.Utils.createSVGElement("path");
            Master.setAttribute("marker-end", "url(#Triangle-black)");
            Master.setAttribute("fill", "none");
            Master.setAttribute("stroke", "gray");
            Master.setAttribute("d", "M0,0 C0,0 0,0 0,0");
            return Master;
        })();
        return Shape;
    })();
    VisModelJS.Shape = Shape;
})(VisModelJS || (VisModelJS = {}));
var VisModelJS;
(function (VisModelJS) {
    var Utils;
    (function (Utils) {
        function saveStringAs(content, fileName) {
            var blob = new Blob([content], { type: 'text/plain; charset=UTF-8' });
            saveAs(blob, fileName);
        }
        Utils.saveStringAs = saveStringAs;
        function getNodeLabelFromEvent(event) {
            var element = event.target || event.srcElement;
            while (element != null) {
                var label = element.getAttribute("data-nodelabel");
                if (label != null && label != "") {
                    return label;
                }
                element = element.parentElement;
            }
            return "";
        }
        Utils.getNodeLabelFromEvent = getNodeLabelFromEvent;
        function getPositionById(Label) {
            var element = document.getElementById(Label);
            var view = element.getBoundingClientRect();
            return new Point(view.left, view.top);
        }
        Utils.getPositionById = getPositionById;
        function createSVGElement(name) {
            return document.createElementNS('http://www.w3.org/2000/svg', name);
        }
        Utils.createSVGElement = createSVGElement;
        var element = document.createElement('div');
        function HTMLEncode(text) {
            element.textContent = text;
            return element.innerHTML;
        }
        Utils.HTMLEncode = HTMLEncode;
        function foreachLine(Text, LineWidth, Callback) {
            if (!Callback)
                return;
            var rest = Text;
            var maxLength = LineWidth || 20;
            maxLength = maxLength < 1 ? 1 : maxLength;
            var length = 0;
            var i = 0;
            for (var pos = 0; pos < rest.length; ++pos) {
                var code = rest.charCodeAt(pos);
                length += code < 128 ? 1 : 2;
                if (length > maxLength || rest.charAt(pos) == "\n") {
                    Callback(rest.substr(0, pos), i);
                    if (rest.charAt(pos) == "\n") {
                        pos++;
                    }
                    rest = rest.substr(pos, rest.length - pos);
                    pos = -1;
                    length = 0;
                    i++;
                }
            }
            Callback(rest, i);
        }
        Utils.foreachLine = foreachLine;
        function removeFirstLine(Text) {
            return Text.replace(/^.+$(\r\n|\r|\n)?/m, "");
        }
        Utils.removeFirstLine = removeFirstLine;
        function generateUID() {
            return Math.floor(Math.random() * 2147483647);
        }
        Utils.generateUID = generateUID;
        function generateRandomString() {
            return generateUID().toString(36);
        }
        Utils.generateRandomString = generateRandomString;
        function updateHash(hash) {
            if (!hash)
                hash = '';
            window.location.hash = hash;
        }
        Utils.updateHash = updateHash;
        var UserAgant = (function () {
            function UserAgant() {
            }
            UserAgant.isLessThanIE6 = function () {
                return !!UserAgant.ua.ltIE6;
            };
            UserAgant.isLessThanIE7 = function () {
                return !!UserAgant.ua.ltIE7;
            };
            UserAgant.isLessThanIE8 = function () {
                return !!UserAgant.ua.ltIE8;
            };
            UserAgant.isLessThanIE9 = function () {
                return !!UserAgant.ua.ltIE9;
            };
            UserAgant.isGreaterThanIE10 = function () {
                return !!UserAgant.ua.gtIE10;
            };
            UserAgant.isTrident = function () {
                return !!UserAgant.ua.Trident;
            };
            UserAgant.isGecko = function () {
                return !!UserAgant.ua.Gecko;
            };
            UserAgant.isPresto = function () {
                return !!UserAgant.ua.Presto;
            };
            UserAgant.isBlink = function () {
                return !!UserAgant.ua.Blink;
            };
            UserAgant.isWebkit = function () {
                return !!UserAgant.ua.Webkit;
            };
            UserAgant.isTouchEnabled = function () {
                return !!UserAgant.ua.Touch;
            };
            UserAgant.isPointerEnabled = function () {
                return !!UserAgant.ua.Pointer;
            };
            UserAgant.isMSPoniterEnabled = function () {
                return !!UserAgant.ua.MSPoniter;
            };
            UserAgant.isPerformanceEnabled = function () {
                return !!UserAgant.ua.Performance;
            };
            UserAgant.isAnimationFrameEnabled = function () {
                return !!UserAgant.ua.AnimationFrame;
            };
            UserAgant.isTouchDevice = function () {
                return UserAgant.ua.Touch;
            };
            UserAgant.ua = (function () {
                return {
                    ltIE6: typeof window.addEventListener == "undefined" && typeof document.documentElement.style.maxHeight == "undefined",
                    ltIE7: typeof window.addEventListener == "undefined" && typeof document.querySelectorAll == "undefined",
                    ltIE8: typeof window.addEventListener == "undefined" && typeof document.getElementsByClassName == "undefined",
                    ltIE9: document.uniqueID && !window.matchMedia,
                    gtIE10: document.uniqueID && document.documentMode >= 10,
                    Trident: document.uniqueID,
                    Gecko: 'MozAppearance' in document.documentElement.style,
                    Presto: window.opera,
                    Blink: window.chrome,
                    Webkit: !window.chrome && 'WebkitAppearance' in document.documentElement.style,
                    Touch: typeof document.ontouchstart != "undefined",
                    Mobile: typeof document.orientation != "undefined",
                    Pointer: (typeof document.navigator != "undefined") && !!document.navigator.pointerEnabled,
                    MSPoniter: (typeof document.navigator != "undefined") && !!document.navigator.msPointerEnabled,
                    Performance: typeof window.performance != "undefined",
                    AnimationFrame: typeof window.requestAnimationFrame != "undefined"
                };
            })();
            return UserAgant;
        })();
        Utils.UserAgant = UserAgant;
        Utils.requestAnimationFrame = UserAgant.isAnimationFrameEnabled() ? window.requestAnimationFrame.bind(window) : (function (c) { return setTimeout(c, 16.7); });
        Utils.cancelAnimationFrame = UserAgant.isAnimationFrameEnabled() ? window.cancelAnimationFrame.bind(window) : window.clearTimeout.bind(window);
        Utils.getTime = UserAgant.isPerformanceEnabled() ? performance.now.bind(performance) : Date.now.bind(Date);
        /**
        Define new color style.
        @param {string} StyleName Style name. The name can be used as a parameter for NodeView#Addd/RemoveColorStyle
        @param {Object} StyleDef jQuery.css style definition. ex) { fill: #FFFFFF, stroke: #000000 }
        */
        //export function defineColorStyle(StyleName: string, StyleDef: Object): void {
        //    $("<style>").html("." + StyleName + " { " + $("span").css(StyleDef).attr("style") + " }").appendTo("head");
        //}
        function generateStyleSetter(originalName) {
            var cameledName = originalName.substring(0, 1).toUpperCase() + originalName.substring(1);
            if (UserAgant.isTrident()) {
                cameledName = "ms" + cameledName;
                return function (Element, Value) {
                    Element.style[cameledName] = Value;
                };
            }
            if (UserAgant.isGecko()) {
                cameledName = "Moz" + cameledName;
                return function (Element, Value) {
                    Element.style[cameledName] = Value;
                };
            }
            if (UserAgant.isWebkit() || UserAgant.isBlink()) {
                cameledName = "webkit" + cameledName;
                return function (Element, Value) {
                    Element.style[cameledName] = Value;
                };
            }
            return function (Element, Value) {
                Element.style[originalName] = Value;
            };
        }
        Utils.setTransformOriginToElement = generateStyleSetter("transformOrigin");
        Utils.setTransformToElement = generateStyleSetter("transform");
    })(Utils = VisModelJS.Utils || (VisModelJS.Utils = {}));
    var AnimationFrameTask = (function () {
        function AnimationFrameTask() {
        }
        AnimationFrameTask.prototype.start = function (duration, callback) {
            var _this = this;
            this.cancel();
            this.lastTime = this.startTime = Utils.getTime();
            this.endTime = this.startTime + duration;
            this.callback = callback;
            var update = function () {
                var currentTime = Utils.getTime();
                var deltaT = currentTime - _this.lastTime;
                if (currentTime < _this.endTime) {
                    _this.timerHandle = Utils.requestAnimationFrame(update);
                }
                else {
                    deltaT = _this.endTime - _this.lastTime;
                    _this.timerHandle = 0;
                }
                _this.callback(deltaT, currentTime, _this.startTime);
                _this.lastTime = currentTime;
            };
            update();
        };
        AnimationFrameTask.prototype.startMany = function (Duration, Callbacks) {
            if (Callbacks && Callbacks.length > 0) {
                this.start(Duration, function (DeltaT, CurrentTime, StartTime) {
                    for (var i = 0; i < Callbacks.length; ++i) {
                        Callbacks[i](DeltaT, CurrentTime, StartTime);
                    }
                });
            }
        };
        AnimationFrameTask.prototype.isRunning = function () {
            return this.timerHandle != 0;
        };
        AnimationFrameTask.prototype.cancel = function (RunToEnd) {
            if (this.timerHandle) {
                Utils.cancelAnimationFrame(this.timerHandle);
                this.timerHandle = 0;
                if (RunToEnd) {
                    var DeltaT = this.endTime - this.lastTime;
                    this.callback(DeltaT, this.endTime, this.startTime);
                }
            }
        };
        return AnimationFrameTask;
    })();
    VisModelJS.AnimationFrameTask = AnimationFrameTask;
    var VisModelEvent = (function () {
        function VisModelEvent() {
        }
        VisModelEvent.prototype.preventDefault = function () {
            this.defaultPrevented = true;
        };
        return VisModelEvent;
    })();
    VisModelJS.VisModelEvent = VisModelEvent;
    var EventTarget = (function () {
        function EventTarget() {
            this.Listeners = {};
        }
        EventTarget.prototype.removeEventListener = function (type, listener) {
            var listeners = this.Listeners[type];
            if (listeners != null) {
                var i = listeners.indexOf(listener);
                if (i !== -1) {
                    listeners.splice(i, 1);
                }
            }
        };
        EventTarget.prototype.addEventListener = function (type, listener) {
            var listeners = this.Listeners[type];
            if (listeners == null) {
                this.Listeners[type] = [listener];
            }
            else if (listeners.indexOf(listener) === -1) {
                listeners.unshift(listener);
            }
        };
        EventTarget.prototype.dispatchEvent = function (e) {
            e.target = this;
            if (this["on" + e.type] != null) {
                this["on" + e.type](e);
            }
            if (this["On" + e.type] != null) {
                this["On" + e.type](e);
            }
            var listeners = this.Listeners[e.type];
            if (listeners != null) {
                listeners = listeners.slice(0);
                for (var i = 0, len = listeners.length; i < len; i++) {
                    listeners[i].call(this, e);
                }
            }
            return !e.defaultPrevented;
        };
        return EventTarget;
    })();
    VisModelJS.EventTarget = EventTarget;
    var ColorStyle = (function () {
        function ColorStyle() {
        }
        ColorStyle.Default = "node-default";
        ColorStyle.Highlight = "node-selected";
        return ColorStyle;
    })();
    VisModelJS.ColorStyle = ColorStyle;
    var Rect = (function () {
        function Rect(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        Rect.prototype.toString = function () {
            return "(" + [this.x, this.y, this.width, this.height].join(", ") + ")";
        };
        Rect.prototype.clone = function () {
            return new Rect(this.x, this.y, this.width, this.height);
        };
        return Rect;
    })();
    VisModelJS.Rect = Rect;
    var Point = (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        Point.prototype.clone = function () {
            return new Point(this.x, this.y);
        };
        Point.prototype.toString = function () {
            return "(" + this.x + ", " + this.y + ")";
        };
        return Point;
    })();
    VisModelJS.Point = Point;
    (function (Direction) {
        Direction[Direction["Left"] = 0] = "Left";
        Direction[Direction["Top"] = 1] = "Top";
        Direction[Direction["Right"] = 2] = "Right";
        Direction[Direction["Bottom"] = 3] = "Bottom";
    })(VisModelJS.Direction || (VisModelJS.Direction = {}));
    var Direction = VisModelJS.Direction;
    function reverseDirection(Dir) {
        return (Dir + 2) & 3;
    }
    VisModelJS.reverseDirection = reverseDirection;
})(VisModelJS || (VisModelJS = {}));
/// <reference path = "./pointer.d.ts" />
var VisModelJS;
(function (VisModelJS) {
    var Pointer = (function () {
        function Pointer(x, y, id) {
            this.x = x;
            this.y = y;
            this.id = id;
        }
        Pointer.prototype.setPosition = function (x, y) {
            this.x = x;
            this.y = y;
        };
        return Pointer;
    })();
    VisModelJS.Pointer = Pointer;
    /**
        Controll scroll by mouse, touch and pen and zoom by wheel.
        @class VisModelJS.ScrollManager
        @for VisModelJS.ViewportManager
    */
    var ScrollManager = (function () {
        function ScrollManager() {
            this.currentX = 0;
            this.currentY = 0;
            this.dx = 0;
            this.dy = 0;
            this.mainPointerID = null;
            this.pointers = [];
            this.timer = 0;
            this.ANIMATE_THRESHOLD = 5;
            this.SPEED_MAX = 100;
            this.onDragged = function (dx, dy) {
            };
        }
        ScrollManager.prototype.startDrag = function (initialX, initialY) {
            this.currentX = initialX;
            this.currentY = initialY;
        };
        ScrollManager.prototype.updateDrag = function (currentX, currentY) {
            this.dx = currentX - this.currentX;
            this.dy = currentY - this.currentY;
            var speed = this.dx * this.dx + this.dy + this.dy;
            if (speed > this.SPEED_MAX * this.SPEED_MAX) {
                this.dx *= ((this.SPEED_MAX * this.SPEED_MAX) / speed);
                this.dy *= ((this.SPEED_MAX * this.SPEED_MAX) / speed);
            }
            this.currentX = currentX;
            this.currentY = currentY;
        };
        ScrollManager.prototype.getMainPointer = function () {
            return this.pointers[this.mainPointerID];
        };
        ScrollManager.prototype.isDragging = function () {
            return this.mainPointerID != null;
        };
        ScrollManager.prototype.stopAnimation = function () {
            clearInterval(this.timer);
            this.dx = 0;
            this.dy = 0;
        };
        ScrollManager.prototype.endDrag = function () {
            this.mainPointerID = null;
        };
        ScrollManager.prototype.onPointerEvent = function (e, viewport) {
            var _this = this;
            switch (e.type) {
                case "trackstart":
                    if (!this.pointers[e.pointerId]) {
                        this.pointers[e.pointerId] = new Pointer(e.clientX, e.clientY, e.pointerId);
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    break;
                case "trackend":
                    if (!this.pointers[e.pointerId]) {
                        return;
                    }
                    delete this.pointers[e.pointerId];
                    e.preventDefault();
                    e.stopPropagation();
                    break;
                case "track":
                    if (!this.pointers[e.pointerId]) {
                        return;
                    }
                    this.pointers[e.pointerId].setPosition(e.clientX, e.clientY);
                    e.preventDefault();
                    e.stopPropagation();
                    break;
                default:
                    return;
            }
            var isTherePointer = Object.keys(this.pointers).length > 0;
            var hasDragJustStarted = isTherePointer && !this.isDragging();
            var hasDragJustEnded = !this.getMainPointer() && this.isDragging();
            if (isTherePointer) {
                if (hasDragJustStarted) {
                    this.stopAnimation();
                    this.timer = null;
                    var mainPointer = this.pointers[Object.keys(this.pointers)[0]];
                    this.mainPointerID = mainPointer.id;
                    this.startDrag(mainPointer.x, mainPointer.y);
                }
                else {
                    var mainPointer = this.getMainPointer();
                    if (mainPointer) {
                        this.updateDrag(mainPointer.x, mainPointer.y);
                        this.onDragged(this.dx, this.dy);
                    }
                    else {
                        this.endDrag();
                    }
                }
            }
            else {
                if (hasDragJustEnded) {
                    if (this.timer) {
                        this.stopAnimation();
                        this.timer = null;
                    }
                    this.timer = setInterval(function () {
                        if (Math.abs(_this.dx) < _this.ANIMATE_THRESHOLD && Math.abs(_this.dy) < _this.ANIMATE_THRESHOLD) {
                            _this.stopAnimation();
                        }
                        _this.currentX += _this.dx;
                        _this.currentY += _this.dy;
                        _this.dx *= 0.95;
                        _this.dy *= 0.95;
                        _this.onDragged(_this.dx, _this.dy);
                    }, 16);
                }
                this.endDrag();
            }
        };
        ScrollManager.prototype.onMouseWheel = function (e, screen) {
            screen.camera.scale *= 1 + e.deltaY * 0.02;
        };
        return ScrollManager;
    })();
    VisModelJS.ScrollManager = ScrollManager;
    /**
        @class VisModelJS.ViewportManager
    */
    var ViewportManager = (function (_super) {
        __extends(ViewportManager, _super);
        function ViewportManager(panel) {
            var _this = this;
            _super.call(this);
            this.panel = panel;
            this.scrollManager = new ScrollManager();
            this.cameraGx = 0;
            this.cameraGy = 0;
            this.scale = 1.0;
            this.isPointerEnabled = true;
            this.cameraMoveTask = new VisModelJS.AnimationFrameTask();
            var _viewport = this;
            var __camera = {
                get gx() {
                    return _viewport.cameraGx;
                },
                set gx(value) {
                    var camera = this;
                    camera.setPosition(value, _viewport.cameraGy);
                },
                get gy() {
                    return _viewport.cameraGy;
                },
                set gy(value) {
                    var camera = this;
                    camera.setPosition(_viewport.cameraGx, value);
                },
                get scale() {
                    return _viewport.scale;
                },
                set scale(value) {
                    var camera = this;
                    _viewport.scale = value < camera.minScale ? camera.minScale : value > camera.maxScale ? camera.maxScale : value;
                    _viewport.updateAttr();
                },
                setPosition: function (gx, gy) {
                    this.setOffset(_viewport.cameraCenterPageX - gx * _viewport.scale, _viewport.cameraCenterPageY - gy * _viewport.scale);
                },
                setPositionAndScale: function (gx, gy, scale) {
                    _viewport.scale = scale;
                    this.setOffset(_viewport.cameraCenterPageX - gx * _viewport.scale, _viewport.cameraCenterPageY - gy * _viewport.scale);
                },
                get centerPageX() {
                    return _viewport.cameraCenterPageX;
                },
                set centerPageX(value) {
                    _viewport.cameraCenterPageX = value;
                },
                get centerPageY() {
                    return _viewport.cameraCenterPageY;
                },
                set centerPageY(value) {
                    _viewport.cameraCenterPageY = value;
                },
                setCenterPagePosition: function (pageX, pageY) {
                    _viewport.cameraCenterPageX = pageX;
                    _viewport.cameraCenterPageY = pageY;
                },
                limitRect: null,
                /**
                    Move camera position relatively and change scale.
                    @method Move
                    @param {number} GX Scale-independent camera relative X difference.
                    @param {number} GY Scale-independent camera relative Y difference.
                    @param {number} Scale Scale of camera. 1.0 for 100%.
                    @param {number} Duration Time for moving in millisecond.
                    @async
                */
                move: function (gx, gy, scale, duration) {
                    this.moveTo(_viewport.cameraGx + gx, _viewport.cameraGy + gy, scale, duration);
                },
                /**
                    Move camera position and scale one time.
                    @method MoveTo
                    @param {number} GX Scale-independent camera X position in GSN. 0 for leftside of topgoal.
                    @param {number} GY Scale-independent camera Y position in GSN. 0 for top of topgoal.
                    @param {number} Scale Scale of camera. 1.0 for 100%.
                    @param {number} Duration Time for moving in millisecond.
                    @async
                */
                moveTo: function (gx, gy, scale, duration) {
                    var Task = _viewport.createMoveToTaskFunction(gx, gy, scale, duration);
                    if (!Task) {
                        this.setPositionAndScale(gx, gy, scale);
                        return;
                    }
                    this.cameraMoveTask.start(duration, Task);
                },
                // private
                setOffset: function (pageX, pageY) {
                    _viewport.cameraGx = (_viewport.cameraCenterPageX - pageX) / _viewport.scale;
                    _viewport.cameraGy = (_viewport.cameraCenterPageY - pageY) / _viewport.scale;
                    this.limitPosition();
                    _viewport.updateAttr();
                },
                maxScale: 2.0,
                minScale: 0.2,
                limitPosition: function () {
                    var R = this.limitRect;
                    if (R) {
                        if (_viewport.cameraGx < R.x)
                            _viewport.cameraGx = R.x;
                        if (_viewport.cameraGy < R.y)
                            _viewport.cameraGy = R.y;
                        if (_viewport.cameraGx > R.x + R.width)
                            _viewport.cameraGx = R.x + R.width;
                        if (_viewport.cameraGy > R.y + R.height)
                            _viewport.cameraGy = R.y + R.height;
                    }
                },
                addOffset: function (pageX, pageY) {
                    _viewport.cameraGx -= pageX / _viewport.scale;
                    _viewport.cameraGy -= pageY / _viewport.scale;
                    this.limitPosition();
                    _viewport.updateAttr();
                },
                cameraMoveTask: new VisModelJS.AnimationFrameTask(),
            };
            this._camera = __camera;
            this.scrollManager.onDragged = __camera.addOffset.bind(__camera);
            window.addEventListener("resize", function (e) {
                _this.updatePageRect();
            });
            this.updatePageSize();
            this.updatePageRect();
            this._camera.setCenterPagePosition(this.areaCenterX, this.areaCenterY);
            VisModelJS.Utils.setTransformOriginToElement(this.panel.contentLayer, "left top");
            this.updateAttr();
            var onPointer = function (e) {
                if (_this.isPointerEnabled) {
                    _this.scrollManager.onPointerEvent(e, _this);
                }
            };
            ["trackstart", "trackend", "track"].forEach(function (name) {
                PolymerGestures.addEventListener(_this.panel.rootElement, name, onPointer);
            });
            var OnWheel = function (e) {
                if (_this.isPointerEnabled) {
                    e.preventDefault();
                    _this.scrollManager.onMouseWheel(e, _this);
                }
            };
            this.panel.rootElement.addEventListener('wheel', OnWheel);
        }
        Object.defineProperty(ViewportManager.prototype, "camera", {
            get: function () {
                return this._camera;
            },
            enumerable: true,
            configurable: true
        });
        ViewportManager.prototype.limitScale = function (scale) {
            return scale < this.camera.minScale ? this.camera.minScale : scale > this.camera.maxScale ? this.camera.maxScale : scale;
        };
        Object.defineProperty(ViewportManager.prototype, "offsetPageX", {
            get: function () {
                return this.cameraCenterPageX - this.cameraGx * this.scale;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewportManager.prototype, "offsetPageY", {
            get: function () {
                return this.cameraCenterPageY - this.cameraGy * this.scale;
            },
            enumerable: true,
            configurable: true
        });
        /**
            Calcurate PageX from GX
            @method PageXFromGX
            @param {number} GX Scale-independent X position in GSN.
            @return {number} PageX for given GX. It is depend on camera's position, scale and vanishing point.
        */
        ViewportManager.prototype.pageXFromGX = function (gx) {
            return this.cameraCenterPageX + (gx - this.cameraGx) * this.scale;
        };
        /**
            Calcurate PageY from GY
            @method PageYFromGY
            @param {number} GY Scale-independent Y position in GSN.
            @return {number} PageY for given GY. It is depend on camera's position, scale and vanishing point.
        */
        ViewportManager.prototype.pageYFromGY = function (gy) {
            return this.cameraCenterPageY + (gy - this.cameraGy) * this.scale;
        };
        /**
            Calcurate GX from PageX
            @method GXFromPageX
            @param {number} PageX X position in web page.
            @return {number} GX for given PageX. It is depend on camera's position, scale and vanishing point.
        */
        ViewportManager.prototype.gxFromPageX = function (pageX) {
            return (pageX - this.cameraCenterPageX) / this.scale + this.cameraGx;
        };
        /**
            Calcurate GY from PageY
            @method GYFromPageY
            @param {number} PageY Y position in web page.
            @return {number} GY for given PageY. It is depend on camera's position, scale and vanishing point.
        */
        ViewportManager.prototype.gyFromPageY = function (pageY) {
            return (pageY - this.cameraCenterPageY) / this.scale + this.cameraGy;
        };
        ViewportManager.prototype.convertRectGlobalXYFromPageXY = function (pageRect) {
            var x1 = this.gxFromPageX(pageRect.x);
            var y1 = this.gyFromPageY(pageRect.y);
            var x2 = this.gxFromPageX(pageRect.x + pageRect.width);
            var y2 = this.gyFromPageY(pageRect.y + pageRect.height);
            return new VisModelJS.Rect(x1, y1, x2 - x1, y2 - y1);
        };
        Object.defineProperty(ViewportManager.prototype, "pageRectInGxGy", {
            get: function () {
                var x1 = this.gxFromPageX(0);
                var y1 = this.gyFromPageY(0);
                var x2 = this.gxFromPageX(this._areaWidth);
                var y2 = this.gyFromPageY(this._areaHeight);
                return new VisModelJS.Rect(x1, y1, x2 - x1, y2 - y1);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewportManager.prototype, "areaWidth", {
            get: function () {
                return this._areaWidth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewportManager.prototype, "areaHeight", {
            get: function () {
                return this._areaHeight;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewportManager.prototype, "areaCenterX", {
            get: function () {
                return this._areaWidth * 0.5;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ViewportManager.prototype, "areaCenterY", {
            get: function () {
                return this._areaHeight * 0.5;
            },
            enumerable: true,
            configurable: true
        });
        ViewportManager.prototype.moveCamera = function (gx, gy, scale) {
            this.scale += scale;
            this.cameraGx += gx;
            this.cameraGy += gy;
            this.updateAttr();
        };
        ViewportManager.prototype.createMoveTaskFunction = function (gx, gy, scale, duration) {
            return this.createMoveToTaskFunction(this.cameraGx + gx, this.cameraGy + gy, scale, duration);
        };
        ViewportManager.prototype.createMoveToTaskFunction = function (gx, gy, scale, duration) {
            var _this = this;
            scale = this.limitScale(scale);
            if (duration <= 0) {
                return null;
            }
            var VX = (gx - this.cameraGx) / duration;
            var VY = (gy - this.cameraGy) / duration;
            var S0 = this.scale;
            var ScaleRate = scale / S0;
            var DInv = 1 / duration;
            var ScaleFunction = function (t) { return S0 * Math.pow(ScaleRate, t * DInv); };
            if (VY == 0 && VX == 0 && (scale == S0)) {
                return null;
            }
            return (function (deltaT, currentTime, startTime) {
                var DeltaS = ScaleFunction(currentTime - startTime) - ScaleFunction(currentTime - deltaT - startTime);
                _this.moveCamera(VX * deltaT, VY * deltaT, DeltaS);
            });
        };
        ViewportManager.prototype.updatePageSize = function () {
            var rootRect = this.panel.rootElement.getBoundingClientRect();
            this._areaWidth = rootRect.width;
            this._areaHeight = rootRect.height;
        };
        ViewportManager.prototype.updatePageRect = function () {
            var cameraCenterXRate = this.cameraCenterPageX / this._areaWidth;
            var cameraCenterYRate = this.cameraCenterPageY / this._areaHeight;
            var cameraPX = this.pageXFromGX(this.cameraGx);
            var cameraPY = this.pageYFromGY(this.cameraGy);
            this.updatePageSize();
            this.camera.setCenterPagePosition(this._areaWidth * cameraCenterXRate, this._areaHeight * cameraCenterYRate);
            this.updateAttr();
        };
        ViewportManager.createTranformAttr = function (x, y, scale) {
            return "translate(" + x + " " + y + ") scale(" + scale + ")";
        };
        ViewportManager.createTransformStyle = function (x, y, scale) {
            return "translate(" + x + "px, " + y + "px) scale(" + scale + ") ";
        };
        ViewportManager.prototype.updateAttr = function () {
            var offsetX = this.offsetPageX;
            var offsetY = this.offsetPageY;
            if (!isNaN(offsetX) && !isNaN(offsetY)) {
                var attr = ViewportManager.createTranformAttr(offsetX, offsetY, this.scale);
                var style = ViewportManager.createTransformStyle(offsetX, offsetY, this.scale);
                this.panel.SVGLayer.setAttribute("transform", attr);
                VisModelJS.Utils.setTransformToElement(this.panel.contentLayer, style);
            }
            var event = new VisModelJS.VisModelEvent();
            event.type = "cameramove";
            event.target = this;
            this.dispatchEvent(event);
        };
        return ViewportManager;
    })(VisModelJS.EventTarget);
    VisModelJS.ViewportManager = ViewportManager;
})(VisModelJS || (VisModelJS = {}));
var VisModelJS;
(function (VisModelJS) {
    var NodeViewEvent = (function (_super) {
        __extends(NodeViewEvent, _super);
        function NodeViewEvent() {
            _super.apply(this, arguments);
        }
        return NodeViewEvent;
    })(VisModelJS.VisModelEvent);
    VisModelJS.NodeViewEvent = NodeViewEvent;
    /**
        @class VisModelJS.VisualModelPanel
    */
    var VisualModelPanel = (function (_super) {
        __extends(VisualModelPanel, _super);
        function VisualModelPanel(placeHolder) {
            var _this = this;
            _super.call(this);
            this.onScreenNodeMap = {};
            this.hiddenNodeMap = {};
            // We do not use FocusedView but FocusedLabel to make it modular.
            this.foldingAnimationTask = new VisModelJS.AnimationFrameTask();
            if (!placeHolder) {
                throw new TypeError("placeHolder cannot be null.");
            }
            // Create Inner DOM
            this.rootElement = placeHolder;
            var rootStyle = this.rootElement.style;
            if (rootStyle.position == "static") {
                rootStyle.position = "relative";
            }
            rootStyle.overflow = "hidden";
            // Create SVG Layer
            this.SVGLayerBox = VisModelJS.Utils.createSVGElement("svg");
            this.makeItLayer(this.SVGLayerBox, "100%", "100%");
            this.SVGLayer = VisModelJS.Utils.createSVGElement("g");
            this.SVGLayer.className.baseVal = "vismodel-svglayer";
            this.SVGLayerConnectorGroup = VisModelJS.Utils.createSVGElement("g");
            this.SVGLayerNodeGroup = VisModelJS.Utils.createSVGElement("g");
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
            this.viewport = new VisModelJS.ViewportManager(this);
            this.layoutEngine = new VisModelJS.VerticalTreeLayoutEngine();
            this.viewport.addEventListener("cameramove", function () {
                _this.updateHiddenNodeList();
            });
            var clickEventIsHandledInViewport = false;
            var focused = false;
            document.addEventListener("click", function (event) {
                clickEventIsHandledInViewport = false;
                setTimeout(function () {
                    if (focused && !clickEventIsHandledInViewport) {
                        focused = false;
                    }
                    else if (!focused && clickEventIsHandledInViewport) {
                        focused = true;
                    }
                }, 0);
            }, true);
            this.rootElement.addEventListener("click", function (event) {
                var label = VisModelJS.Utils.getNodeLabelFromEvent(event);
                if (_this.active) {
                    _this.changeFocusedLabel(label);
                }
                clickEventIsHandledInViewport = true;
                event.preventDefault();
                event.stopPropagation();
            });
            this.contentLayer.addEventListener("dblclick", function (event) {
                var Label = VisModelJS.Utils.getNodeLabelFromEvent(event);
                if (Label) {
                    var node = _this.viewMap[Label];
                    var nodeevent = new NodeViewEvent();
                    nodeevent.type = "dblclick";
                    nodeevent.target = _this;
                    nodeevent.node = node;
                    _this.dispatchEvent(nodeevent);
                    event.stopPropagation();
                    event.preventDefault();
                }
            });
            document.addEventListener("keydown", function (event) {
                if (focused) {
                    _this.onKeyDown(event);
                }
            }, true);
            this._active = true;
        }
        VisualModelPanel.prototype.makeItLayer = function (element, width, height) {
            var style = element.style;
            style.position = "absolute";
            style.width = width;
            style.height = height;
            style.top = "0px";
            style.left = "0px";
        };
        Object.defineProperty(VisualModelPanel.prototype, "active", {
            get: function () {
                return this._active;
            },
            enumerable: true,
            configurable: true
        });
        VisualModelPanel.prototype.onKeyDown = function (event) {
            var Label;
            var handled = true;
            switch (event.keyCode) {
                case 27:
                    event.preventDefault();
                    break;
                case 13:
                    event.preventDefault();
                    break;
                case 72:
                case 37:
                    this.navigateLeft();
                    event.preventDefault();
                    break;
                case 74:
                case 40:
                    this.navigateDown();
                    event.preventDefault();
                    break;
                case 75:
                case 38:
                    var Moved = this.navigateUp();
                    if (!Moved && this._focusedLabel) {
                        this.navigateParent();
                    }
                    event.preventDefault();
                    break;
                case 76:
                case 39:
                    this.navigateRight();
                    event.preventDefault();
                    break;
                case 36:
                    this.navigateHome();
                    event.preventDefault();
                    break;
                case 187:
                    if (event.shiftKey) {
                        this.viewport.camera.scale += 0.1;
                    }
                    event.preventDefault();
                    break;
                case 189:
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
        };
        VisualModelPanel.prototype.onActivate = function () {
            this.viewport.isPointerEnabled = true;
        };
        VisualModelPanel.prototype.onDeactivate = function () {
            this.viewport.isPointerEnabled = false;
        };
        /**
            @method MoveToNearestNode
            @param {AssureNote.Direction} Dir
        */
        VisualModelPanel.prototype.moveToNearestNode = function (dir) {
            var nextNode = this.findNearestNode(this.viewMap[this._focusedLabel], dir);
            if (nextNode) {
                this.focusAndMoveToNode(nextNode);
            }
            return !!nextNode;
        };
        VisualModelPanel.prototype.focusAndMoveToNode = function (node) {
            if (node != null) {
                var nextNode = node.constructor == String ? this.viewMap[node] : node;
                if (nextNode != null) {
                    this.changeFocusedLabel(nextNode.label);
                    this.viewport.camera.moveTo(nextNode.centerGx, nextNode.centerGy, this.viewport.camera.scale, 50);
                }
            }
        };
        /**
            @method FindNearestNode
            @param {AssureNote.NodeView} CenterNode. If null is given, Camera position is used instead of the node.
            @param {AssureNote.Direction} Dir
            @return {AssureNote.NodeView} Found node. If no node is found, null is retured.
        */
        VisualModelPanel.prototype.findNearestNode = function (centerNode, dir) {
            var rightLimitVectorX = 1;
            var rightLimitVectorY = 1;
            var leftLimitVectorX = 1;
            var leftLimitVectorY = 1;
            switch (dir) {
                case 2 /* Right */:
                    leftLimitVectorY = -1;
                    break;
                case 0 /* Left */:
                    rightLimitVectorX = -1;
                    rightLimitVectorY = -1;
                    leftLimitVectorX = -1;
                    break;
                case 1 /* Top */:
                    rightLimitVectorY = -1;
                    leftLimitVectorX = -1;
                    leftLimitVectorY = -1;
                    break;
                case 3 /* Bottom */:
                    rightLimitVectorX = -1;
                    break;
            }
            var nearestNode = null;
            var currentMinimumDistanceSquere = Infinity;
            var cx = centerNode ? centerNode.centerGx : this.viewport.camera.gx;
            var cy = centerNode ? centerNode.centerGy : this.viewport.camera.gy;
            this.topNodeView.traverseVisibleNode(function (Node) {
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
        };
        /**
           @method ChangeFocusedLabel
           @param {string} Label If label is null, there is no focused label.
        */
        VisualModelPanel.prototype.changeFocusedLabel = function (label) {
            //Utils.UpdateHash(Label);
            if (label == null) {
                var oldNodeView = this.viewMap[this._focusedLabel];
                if (oldNodeView != null) {
                    oldNodeView.shape.removeColorStyle(VisModelJS.ColorStyle.Highlight);
                }
                this._focusedLabel = null;
                return;
            }
            var nodeview = this.viewMap[label];
            if (nodeview != null) {
                var oldNodeView = this.viewMap[this._focusedLabel];
                if (oldNodeView != null) {
                    oldNodeView.shape.removeColorStyle(VisModelJS.ColorStyle.Highlight);
                }
                this._focusedLabel = label;
                nodeview.shape.addColorStyle(VisModelJS.ColorStyle.Highlight);
            }
        };
        Object.defineProperty(VisualModelPanel.prototype, "focusedLabel", {
            get: function () {
                return this._focusedLabel;
            },
            enumerable: true,
            configurable: true
        });
        VisualModelPanel.prototype.initializeView = function (nodeView) {
            this.topNodeView = nodeView;
            this.viewMap = {};
            this.topNodeView.UpdateViewMap(this.viewMap);
        };
        VisualModelPanel.prototype.draw = function (label, duration, fixedNode) {
            var _this = this;
            var t0 = VisModelJS.Utils.getTime();
            this.clear();
            var t1 = VisModelJS.Utils.getTime();
            //console.log("Clear: " + (t1 - t0));
            var target = this.viewMap[label];
            if (target == null) {
                target = this.topNodeView;
            }
            var fixedNodeGX0;
            var fixedNodeGY0;
            var fixedNodeDX;
            var fixedNodeDY;
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
            VisModelJS.TreeNodeView.setGlobalPositionCacheEnabled(true);
            var foldingAnimationCallbacks = [];
            var pageRect = this.viewport.pageRectInGxGy;
            if (fixedNode) {
                fixedNodeDX = fixedNode.gx - fixedNodeGX0;
                fixedNodeDY = fixedNode.gy - fixedNodeGY0;
                if (fixedNodeDX > 0) {
                    pageRect.width += fixedNodeDX;
                }
                else {
                    pageRect.width -= fixedNodeDX;
                    pageRect.x += fixedNodeDX;
                }
                var Scale = this.viewport.camera.scale;
                var Task = this.viewport.createMoveTaskFunction(fixedNodeDX, fixedNodeDY, Scale, duration);
                if (Task) {
                    foldingAnimationCallbacks.push(Task);
                }
                else {
                    foldingAnimationCallbacks.push(function () {
                        _this.updateHiddenNodeList();
                    });
                }
            }
            else {
                foldingAnimationCallbacks.push(function () {
                    _this.updateHiddenNodeList();
                });
            }
            var t2 = VisModelJS.Utils.getTime();
            target.updateNodePosition(foldingAnimationCallbacks, duration, pageRect);
            target.clearAnimationCache();
            var t3 = VisModelJS.Utils.getTime();
            //console.log("Update: " + (t3 - t2));
            this.foldingAnimationTask.startMany(duration, foldingAnimationCallbacks);
            var Shape = target.shape;
            this.viewport.camera.limitRect = new VisModelJS.Rect(Shape.treeLeftLocalX - 100, -100, Shape.treeWidth + 200, Shape.treeHeight + 200);
            this.topNodeView.traverseVisibleNode(function (Node) {
                if (Node.isInRect(pageRect)) {
                    _this.onScreenNodeMap[Node.label] = Node;
                }
                else {
                    _this.hiddenNodeMap[Node.label] = Node;
                    _this.hiddenNodeBuffer.appendChild(Node.shape.content);
                    _this.hiddenNodeBuffer.appendChild(Node.shape.shapeGroup);
                }
            });
            VisModelJS.TreeNodeView.setGlobalPositionCacheEnabled(false);
            this.contentLayer.style.display = "";
            this.SVGLayer.style.display = "";
            //console.log("Animation: " + GSNShape.__Debug_Animation_TotalNodeCount + " nodes moved, " +
            //    GSNShape.__Debug_Animation_SkippedNodeCount + " nodes skipped. reduce rate = " +
            //    GSNShape.__Debug_Animation_SkippedNodeCount / GSNShape.__Debug_Animation_TotalNodeCount);
        };
        VisualModelPanel.prototype.forceAppendAllOutOfScreenNode = function () {
            var _this = this;
            var UpdateArrow = function (node) {
                if (node.parent) {
                    var Arrow = node.shape.arrowPath;
                    if (Arrow.parentNode != _this.hiddenNodeBuffer) {
                        _this.hiddenNodeBuffer.appendChild(Arrow);
                    }
                }
            };
            for (var label in this.hiddenNodeMap) {
                var node = this.hiddenNodeMap[label];
                delete this.hiddenNodeMap[label];
                this.onScreenNodeMap[label] = node;
                this.contentLayer.appendChild(node.shape.content);
                this.SVGLayerNodeGroup.appendChild(node.shape.shapeGroup);
                UpdateArrow(node);
            }
        };
        VisualModelPanel.prototype.updateHiddenNodeList = function () {
            var _this = this;
            VisModelJS.TreeNodeView.setGlobalPositionCacheEnabled(true);
            var pageRect = this.viewport.pageRectInGxGy;
            var updateArrow = function (node) {
                if (node.parent) {
                    var arrow = node.shape.arrowPath;
                    if (node.isConnectorInRect(pageRect)) {
                        if (arrow.parentNode != _this.SVGLayerConnectorGroup) {
                            _this.SVGLayerConnectorGroup.appendChild(arrow);
                        }
                    }
                    else {
                        if (arrow.parentNode != _this.hiddenNodeBuffer) {
                            _this.hiddenNodeBuffer.appendChild(arrow);
                        }
                    }
                }
            };
            for (var label in this.onScreenNodeMap) {
                var node = this.onScreenNodeMap[label];
                if (!node.isInRect(pageRect)) {
                    delete this.onScreenNodeMap[label];
                    this.hiddenNodeMap[label] = node;
                    this.hiddenNodeBuffer.appendChild(node.shape.content);
                    this.hiddenNodeBuffer.appendChild(node.shape.shapeGroup);
                }
                updateArrow(node);
            }
            for (var label in this.hiddenNodeMap) {
                var node = this.hiddenNodeMap[label];
                if (node.isInRect(pageRect)) {
                    delete this.hiddenNodeMap[label];
                    this.onScreenNodeMap[label] = node;
                    this.contentLayer.appendChild(node.shape.content);
                    this.SVGLayerNodeGroup.appendChild(node.shape.shapeGroup);
                }
                updateArrow(node);
            }
            VisModelJS.TreeNodeView.setGlobalPositionCacheEnabled(false);
            ////console.log("Visible:Hidden = " + Object.keys(this.OnScreenNodeMap).length + ":" + Object.keys(this.HiddenNodeMap).length);
        };
        VisualModelPanel.prototype.clear = function () {
            this.rootElement.style.display = "none";
            this.contentLayer.innerHTML = "";
            this.SVGLayer.removeChild(this.SVGLayerConnectorGroup);
            this.SVGLayer.removeChild(this.SVGLayerNodeGroup);
            this.SVGLayerConnectorGroup = VisModelJS.Utils.createSVGElement("g");
            this.SVGLayerNodeGroup = VisModelJS.Utils.createSVGElement("g");
            this.SVGLayer.appendChild(this.SVGLayerConnectorGroup);
            this.SVGLayer.appendChild(this.SVGLayerNodeGroup);
            this.hiddenNodeMap = {};
            this.onScreenNodeMap = {};
            this.hiddenNodeBuffer = document.createDocumentFragment();
            this.rootElement.style.display = "";
        };
        Object.defineProperty(VisualModelPanel.prototype, "focusedView", {
            get: function () {
                if (this.viewMap) {
                    return this.viewMap[this._focusedLabel];
                }
                return null;
            },
            enumerable: true,
            configurable: true
        });
        VisualModelPanel.prototype.navigateUp = function () {
            return this.moveToNearestNode(1 /* Top */);
        };
        VisualModelPanel.prototype.navigateDown = function () {
            return this.moveToNearestNode(3 /* Bottom */);
        };
        VisualModelPanel.prototype.navigateLeft = function () {
            return this.moveToNearestNode(0 /* Left */);
        };
        VisualModelPanel.prototype.navigateRight = function () {
            return this.moveToNearestNode(2 /* Right */);
        };
        VisualModelPanel.prototype.navigateHome = function () {
            this.focusAndMoveToNode(this.topNodeView);
        };
        VisualModelPanel.prototype.navigateParent = function () {
            if (this._focusedLabel) {
                var Parent = this.viewMap[this._focusedLabel].parent;
                if (Parent) {
                    this.focusAndMoveToNode(this.viewMap[this._focusedLabel].parent);
                    return;
                }
            }
            this.focusAndMoveToNode(this.topNodeView);
        };
        return VisualModelPanel;
    })(VisModelJS.EventTarget);
    VisModelJS.VisualModelPanel = VisualModelPanel;
})(VisModelJS || (VisModelJS = {}));
