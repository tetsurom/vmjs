
var VisModelJS;
(function (VisModelJS) {
    (function (Utils) {
        function saveStringAs(content, fileName) {
            var blob = new Blob([content], { type: 'text/plain; charset=UTF-8' });
            saveAs(blob, fileName);
        }
        Utils.saveStringAs = saveStringAs;

        function getNodeLabelFromEvent(event) {
            var element = event.target || event.srcElement;
            while (element != null) {
                if (element.id != "") {
                    return element.id;
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

        function RemoveFirstLine(Text) {
            return Text.replace(/^.+$(\r\n|\r|\n)?/m, "");
        }
        Utils.RemoveFirstLine = RemoveFirstLine;

        function GenerateUID() {
            return Math.floor(Math.random() * 2147483647);
        }
        Utils.GenerateUID = GenerateUID;

        function GenerateRandomString() {
            return GenerateUID().toString(36);
        }
        Utils.GenerateRandomString = GenerateRandomString;

        function UpdateHash(hash) {
            if (!hash)
                hash = '';
            window.location.hash = hash;
        }
        Utils.UpdateHash = UpdateHash;

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

        Utils.requestAnimationFrame = UserAgant.isAnimationFrameEnabled() ? Utils.requestAnimationFrame : (function (c) {
            return setTimeout(c, 16.7);
        });

        Utils.cancelAnimationFrame = UserAgant.isAnimationFrameEnabled() ? Utils.cancelAnimationFrame : clearTimeout;

        Utils.getTime = UserAgant.isPerformanceEnabled() ? performance.now.bind(performance) : Date.now.bind(Date);

        /**
        Define new color style.
        @param {string} StyleName Style name. The name can be used as a parameter for NodeView#Addd/RemoveColorStyle
        @param {Object} StyleDef jQuery.css style definition. ex) { fill: #FFFFFF, stroke: #000000 }
        */
        function defineColorStyle(StyleName, StyleDef) {
            $("<style>").html("." + StyleName + " { " + $("span").css(StyleDef).attr("style") + " }").appendTo("head");
        }
        Utils.defineColorStyle = defineColorStyle;

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
    })(VisModelJS.Utils || (VisModelJS.Utils = {}));
    var Utils = VisModelJS.Utils;

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
                } else {
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
            } else if (listeners.indexOf(listener) === -1) {
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

    function ReverseDirection(Dir) {
        return (Dir + 2) & 3;
    }
    VisModelJS.ReverseDirection = ReverseDirection;
})(VisModelJS || (VisModelJS = {}));
//# sourceMappingURL=Utils.js.map
