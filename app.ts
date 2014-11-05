


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

///<reference path='d.ts/jquery.d.ts'/>
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

    var panel = new VisModelJS.VisualModelPanel(document.getElementById("content"));

    var TopNode = new VisModelJS.NodeView();
    TopNode.Label = "#JSON";
    var SecondNode = new VisModelJS.NodeView();
    SecondNode.Label = "#Array";
    TopNode.AppendChild(SecondNode);
    ["#KeyValue", "#KeyValue"].forEach((name) => {
        var KVNode = new VisModelJS.NodeView();
        KVNode.Label = name;
        SecondNode.AppendChild(KVNode);
        ["#Key", "#Value"].forEach((name) => {
            var Node = new VisModelJS.NodeView();
            Node.Label = name;
            Node.Content = "hoge";
            KVNode.AppendChild(Node);
        });
    });

    panel.InitializeView(TopNode);
    panel.Draw();

});
