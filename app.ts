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
        if (this.Content == null) {
            var div = document.createElement("div");
            this.Content = div;

            div.id = this.NodeView.Label;
            div.setAttribute("data-nodelabel", this.NodeView.Label);

            if (this.NodeView.Label) {
                var h4 = document.createElement("h4");
                h4.textContent = "#" + this.NodeView.Label.split("#")[1];
                div.appendChild(h4);
            }
            if (this.NodeView.Content) {
                var p = document.createElement("p");
                p.innerText = this.NodeView.Content.trim();
                div.appendChild(p);
            }
            this.UpdateHtmlClass();
        }
    }

    PrepareSVGContent(): void {
        super.PrepareSVGContent();
        this.BodyRect = VisModelJS.Utils.createSVGElement("rect");
        this.ShapeGroup.appendChild(this.BodyRect);
        if (this.NodeView.IsFolded()) {
            this.ShapeGroup.appendChild(PegNodeShape.ModuleSymbolMaster.cloneNode());
        }
    }

    FitSizeToContent(): void {
        this.BodyRect.setAttribute("width", this.GetNodeWidth().toString());
        this.BodyRect.setAttribute("height", this.GetNodeHeight().toString());
        if (this.NodeView.Children == null && !this.NodeView.IsFolded()) {
            var x = (this.GetNodeWidth() / 2).toString();
            var y = (this.GetNodeHeight() + 20).toString();
        }
    }

    UpdateHtmlClass() {
        this.Content.className = "node node-peg";
    }
}

class PegShapeFactory extends VisModelJS.ShapeFactory {
    CreateShape(Node: VisModelJS.NodeView): VisModelJS.Shape {
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
        var node = new VisModelJS.NodeView();
        node.Label = (i++).toString() + "#" + json.tag;
        if (json.value) {
            if ((<any>json.value.constructor).name == "Array") {
                (<P4DNode[]>json.value).forEach(json => {
                    node.AppendChild(createNodeViewFromP4DJson(json));
                });
            } else {
                node.Content = json.value.toString();
            }
        }
        return node;
    };
} ();

$(() => {

    //Browser detection
    var UA = VisModelJS.Utils.UserAgant;
    if (!UA.isBlink() && !UA.isWebkit() && !UA.isGecko()) {
        alert('Not supported browser. Use Chrome/Safari/FireFox.');
        return;
    }

    VisModelJS.ShapeFactory.SetFactory(new PegShapeFactory());

    var root = <HTMLDivElement>document.getElementById("content");
    var panel = new VisModelJS.VisualModelPanel(root);

    var TopNode = createNodeViewFromP4DJson(<P4DNode>sampleData);

    panel.InitializeView(TopNode);
    panel.Draw();
    panel.Viewport.SetCamera(TopNode.GetCenterGX(), TopNode.GetCenterGY() + panel.Viewport.GetPageHeight() / 3, 1);
    panel.addEventListener("dblclick", event => {
        var node = (<VisModelJS.NodeViewEvent>event).node;
        node.SetIsFolded(!node.IsFolded());
        panel.Draw(panel.TopNodeView.Label, 300, node);
    });
});
