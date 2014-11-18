var Debug = <any>{};

class PegNodeShape extends VisModelJS.Shape {
    BodyRect: SVGRectElement;
    ModuleRect: SVGRectElement;

    private static ModuleSymbolMaster: SVGRectElement = (() => {
        var Master = VisModelJS.Utils.createSVGElement("rect");
        Master.setAttribute("width", "80px");
        Master.setAttribute("height", "13px");
        Master.setAttribute("y", "-13px");
        return Master;
    })();

    PrepareHTMLContent(): void {
        if (this.content == null) {
            var div = document.createElement("div");
            this.content = div;

            div.id = this.nodeView.label;
            div.setAttribute("data-nodelabel", this.nodeView.label);

            if (this.nodeView.label) {
                var h4 = document.createElement("h4");
                h4.textContent = "#" + this.nodeView.label.split("#")[1];
                div.appendChild(h4);
            }
            if (this.nodeView.content) {
                var p = document.createElement("p");
                p.textContent = this.nodeView.content.trim();
                div.appendChild(p);
            }
            this.UpdateHtmlClass();
        }
    }

    PrepareSVGContent(): void {
        super.prepareSVGContent();
        this.BodyRect = VisModelJS.Utils.createSVGElement("rect");
        this.shapeGroup.appendChild(this.BodyRect);
        if (this.nodeView.folded) {
            this.shapeGroup.appendChild(PegNodeShape.ModuleSymbolMaster.cloneNode());
        }
    }

    FitSizeToContent(): void {
        this.BodyRect.setAttribute("width", this.nodeWidth.toString());
        this.BodyRect.setAttribute("height", this.nodeHeight.toString());
        if (this.nodeView.childNodes == null && !this.nodeView.folded) {
            var x = (this.nodeWidth / 2).toString();
            var y = (this.nodeHeight + 20).toString();
        }
    }

    UpdateHtmlClass() {
        this.content.className = "node node-peg";
    }
}

class PegShapeFactory extends VisModelJS.ShapeFactory {
    CreateShape(Node: VisModelJS.TreeNodeView): VisModelJS.Shape {
        return new PegNodeShape(Node);
    }
}

var sampleData = {
    tag: "JSON",
    value: [
        {
            tag: "KeyValue",
            value: [
                {
                    tag: "String",
                    value: "name"
                },
                {
                    tag: "String",
                    value: "taro"
                }
            ]
        },
        {
            tag: "KeyValue",
            value: [
                {
                    tag: "String",
                    value: "id"
                },
                {
                    tag: "Integer",
                    value: "1"
                }
            ]
        },
        {
            tag: "KeyValue",
            value: [
                {
                    tag: "String",
                    value: "friends"
                },
                {
                    tag: "List",
                    value: [
                        {
                            tag: "String",
                            value: "yamada"
                        },
                        {
                            tag: "String",
                            value: "kondo"
                        }
                    ]
                }
            ]
        }
    ]
};

interface P4DNode {
    tag: string;
    value: Object;
}



var createNodeViewFromP4DJson = function () {
    var i = 0;
    return function (json: P4DNode) {
        var node = new VisModelJS.TreeNodeView();
        node.label = (i++).toString() + "#" + json.tag;
        if (json.value) {
            if ((<any>json.value.constructor).name == "Array") {
                (<P4DNode[]>json.value).forEach(json => {
                    node.appendChild(createNodeViewFromP4DJson(json));
                });
            } else {
                node.content = json.value.toString();
            }
        }
        return node;
    };
} ();



window.onload = function(){

    // IE dose not have Function#name. but it is needed for imprement 'instanceof'
    if (!("name" in Function.prototype)) {
        Object.defineProperty(Function.prototype, "name", {
            get: function () {
                return this.toString().replace(/^\s*function\s*([^\(]*)[\S\s]+$/im, '$1');
            }
        });
    }

    //Browser detection
    var UA = VisModelJS.Utils.UserAgant;
    //if (!UA.isBlink() && !UA.isWebkit() && !UA.isGecko()) {
    //    alert('Not supported browser. Use Chrome/Safari/FireFox.');
    //    return;
    //}

    VisModelJS.ShapeFactory.setFactory(new PegShapeFactory());

    var root = <HTMLDivElement>document.getElementById("content");
    var panel = new VisModelJS.VisualModelPanel(root);

    var TopNode = createNodeViewFromP4DJson(<P4DNode>sampleData);

    panel.InitializeView(TopNode);
    panel.Draw();
    panel.Viewport.camera.setPositionAndScale(TopNode.centerGx, TopNode.centerGy + panel.Viewport.areaHeight / 3, 1);
    panel.addEventListener("dblclick", event => {
        var node = (<VisModelJS.NodeViewEvent>event).node;
        node.folded = !node.folded;
        if (UA.isTrident()) {
            for (var k in panel.ViewMap) {
                panel.ViewMap[k].shape.content = null;
            }
            panel.Draw(panel.TopNodeView.label, 0, node);
        } else {
            panel.Draw(panel.TopNodeView.label, 300, node);
        }
    });
};
