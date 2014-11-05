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

    var i = 0;
    var TopNode = new VisModelJS.NodeView();
    TopNode.Label = (i++).toString() + "#JSON";
    var SecondNode = new VisModelJS.NodeView();
    SecondNode.Label = (i++).toString() + "#Array";
    TopNode.AppendChild(SecondNode);
    [(i++).toString() + "#KeyValue", (i++).toString() + "#KeyValue"].forEach((name) => {
        var KVNode = new VisModelJS.NodeView();
        KVNode.Label = name;
        SecondNode.AppendChild(KVNode);
        [(i++).toString() + "#Key", (i++).toString() + "#Value"].forEach((name) => {
            var Node = new VisModelJS.NodeView();
            Node.Label = name;
            Node.Content = "hoge";
            KVNode.AppendChild(Node);
        });
    });

    panel.InitializeView(TopNode);
    panel.Draw();
    panel.Viewport.SetCamera(TopNode.GetCenterGX(), TopNode.GetCenterGY() + panel.Viewport.GetPageHeight() / 3, 1);
    panel.addEventListener("dblclick", event => {
        var node = (<VisModelJS.NodeViewEvent>event).node;
        node.SetIsFolded(!node.IsFolded());
        panel.Draw(panel.TopNodeView.Label, 300, node);
    });
});
