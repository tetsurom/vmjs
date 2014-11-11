
module VisModelJS {
    export class Pointer {
        constructor(public x: number, public y: number, public id: number) { }
        setPosition(x: number, y: number) {
            this.x = x;
            this.y = y;
        }
    }

    /**
        Controll scroll by mouse, touch and pen and zoom by wheel.
        @class VisModelJS.ScrollManager
        @for VisModelJS.ViewportManager
    */
    export class ScrollManager {
        private currentX: number = 0;
        private currentY: number = 0;
        private dx: number = 0;
        private dy: number = 0;
        private mainPointerID: number = null;
        private pointers: { [index: number]: Pointer } = [];

        private timer: number = 0;
        private ANIMATE_THRESHOLD: number = 5;
        private SPEED_MAX: number = 100;

        private startDrag(initialX: number, initialY: number) {
            this.currentX = initialX;
            this.currentY = initialY;
        }

        private updateDrag(currentX: number, currentY: number) {
            this.dx = currentX - this.currentX;
            this.dy = currentY - this.currentY;
            var speed = this.dx * this.dx + this.dy + this.dy;
            if (speed > this.SPEED_MAX * this.SPEED_MAX) {
                this.dx *= ((this.SPEED_MAX * this.SPEED_MAX) / speed);
                this.dy *= ((this.SPEED_MAX * this.SPEED_MAX) / speed);
            }

            this.currentX = currentX;
            this.currentY = currentY;
        }

        private getMainPointer(): Pointer {
            return this.pointers[this.mainPointerID];
        }

        private isDragging(): boolean {
            return this.mainPointerID != null;
        }

        private stopAnimation(): void {
            clearInterval(this.timer);
            this.dx = 0;
            this.dy = 0;
        }

        private endDrag() {
            this.mainPointerID = null;
        }

        onPointerEvent(e: PointerEvent, viewport: ViewportManager) {
            //var Log = (e: PointerEvent) => {
            //    console.log("pointer#" + e.pointerId + " " + e.type);
            //    //console.log("#pointers " + Object.keys(this.pointers).length)
            //}
            switch (e.type) {
                case "trackstart":
                    if (!this.pointers[e.pointerId]) {
                        this.pointers[e.pointerId] = new Pointer(e.clientX, e.clientY, e.pointerId);
                        e.preventDefault();
                        e.stopPropagation();
                        //Log(e);
                    }
                    break;
                case "trackend":
                    if (!this.pointers[e.pointerId]) {
                        return
                    }
                    delete this.pointers[e.pointerId];
                    e.preventDefault();
                    e.stopPropagation();
                    //Log(e);
                    break;
                case "track":
                    if (!this.pointers[e.pointerId]) {
                        return
                    }
                    this.pointers[e.pointerId].setPosition(e.clientX, e.clientY);
                    e.preventDefault();
                    e.stopPropagation();
                    break;
                default:
                    return;
            }

            var isTherePointer: boolean = Object.keys(this.pointers).length > 0;
            var hasDragJustStarted: boolean = isTherePointer && !this.isDragging();
            var hasDragJustEnded: boolean = !this.getMainPointer() && this.isDragging();

            if (isTherePointer) {
                if (hasDragJustStarted) {
                    this.stopAnimation();
                    this.timer = null;
                    var mainPointer: Pointer = this.pointers[Object.keys(this.pointers)[0]];
                    this.mainPointerID = mainPointer.id;
                    this.startDrag(mainPointer.x, mainPointer.y);
                } else {
                    var mainPointer = this.getMainPointer();
                    if (mainPointer) {
                        this.updateDrag(mainPointer.x, mainPointer.y);
                        this.onDragged(this.dx, this.dy);
                    } else {
                        this.endDrag();
                    }
                }
            } else {
                if (hasDragJustEnded) {
                    if (this.timer) {
                        this.stopAnimation();
                        this.timer = null;
                    }
                    this.timer = setInterval(() => {
                        if (Math.abs(this.dx) < this.ANIMATE_THRESHOLD && Math.abs(this.dy) < this.ANIMATE_THRESHOLD) {
                            this.stopAnimation();
                        }
                        this.currentX += this.dx;
                        this.currentY += this.dy;
                        this.dx *= 0.95;
                        this.dy *= 0.95;
                        this.onDragged(this.dx, this.dy);
                    }, 16);
                }
                this.endDrag();
            }
        }

        onDragged: (dx: number, dy: number) => void = function (dx, dy) { };

        onMouseWheel(e: WheelEvent, screen: ViewportManager) {
            screen.camera.scale *= 1 + e.deltaY * 0.02;
        }
    }

    export interface Camera {
        /**
            @property gx
            Scale-independent camera X-position in visual model.
        */
        gx: number;
        /**
            @property gy
            Scale-independent camera Y-position in visual model.
        */
        gy: number;
        /**
            @method setPosition
            @param {number} gx Scale-independent camera X position in visual model.
            @param {number} gy Scale-independent camera Y position in visual model.
        */
        setPosition(gx: number, gy: number);
        /**
            Set camera's position and scale one time.
            @method setPositionAndScale
            @param {number} gx Scale-independent camera X position in visual model.
            @param {number} gy Scale-independent camera Y position in visual model.
            @param {number} scale Scale of camera. 1.0 for 100%.
        */
        setPositionAndScale(gx: number, gy: number, scale: number);
        /**
            @property scale
            Scale of camera. 1.0 for 100%.
        */
        scale: number;
        /**
            @property centerPageX
            X-position of camera's vanishing point in page.
        */
        centerPageX: number;
        /**
            @property centerPageY
            Y-position of camera's vanishing point in page.
        */
        centerPageY: number;
        /**
            Set camera's vanishing point in web page.
            @method setCenterPagePosition
            @param {number} pageX X of camera's vanishing point in page.
            @param {number} pageY Y of camera's vanishing point in page.
        */
        setCenterPagePosition(pageX: number, pageY: number);
        limitRect: Rect;
        maxScale: number;
        minScale: number;
        move(GX: number, GY: number, Scale: number, Duration: number): void;
        moveTo(GX: number, GY: number, Scale: number, Duration: number): void;
    }


    /**
        @class VisModelJS.ViewportManager
    */
    export class ViewportManager extends EventTarget {
        scrollManager = new ScrollManager();
        private cameraGx: number = 0;
        private cameraGy: number = 0;
        private scale: number = 1.0;
        private _areaWidth: number;
        private _areaHeight: number;
        private cameraCenterPageX: number;
        private cameraCenterPageY: number;
        public isPointerEnabled: boolean = true;
        private _camera: Camera;

        constructor(private panel: VisualModelPanel) {
            super();

            var _viewport = this;
            var __camera = {
                get gx() { return _viewport.cameraGx; },
                set gx(value) { var camera = <any>this; camera.setPosition(value, _viewport.cameraGy); },
                get gy() { return _viewport.cameraGy; },
                set gy(value) { var camera = <any>this; camera.setPosition(_viewport.cameraGx, value); },
                get scale() { return _viewport.scale; },
                set scale(value) {
                    var camera = <any>this;
                    _viewport.scale = value < camera.minScale ? camera.minScale :
                    value > camera.maxScale ? camera.maxScale :
                    value;
                    _viewport.updateAttr();
                },
                setPosition: function (gx: number, gy: number): void {
                    this.setOffset(_viewport.cameraCenterPageX - gx * _viewport.scale, _viewport.cameraCenterPageY - gy * _viewport.scale);
                },

                setPositionAndScale: function (gx: number, gy: number, scale: number): void {
                    _viewport.scale = scale;
                    this.setOffset(_viewport.cameraCenterPageX - gx * _viewport.scale, _viewport.cameraCenterPageY - gy * _viewport.scale);
                },
                get centerPageX() { return _viewport.cameraCenterPageX; },
                set centerPageX(value) { _viewport.cameraCenterPageX = value },
                get centerPageY() { return _viewport.cameraCenterPageY; },
                set centerPageY(value) { _viewport.cameraCenterPageY = value },
                setCenterPagePosition: function (pageX: number, pageY: number): void {
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
                move: function (gx: number, gy: number, scale: number, duration: number) {
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
                moveTo: function (gx: number, gy: number, scale: number, duration: number): void {
                    var Task = _viewport.createMoveToTaskFunction(gx, gy, scale, duration);
                    if (!Task) {
                        this.setPositionAndScale(gx, gy, scale);
                        return;
                    }
                    this.cameraMoveTask.start(duration, Task);
                },
                // private
                setOffset: function (pageX: number, pageY: number) {
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
                        if (_viewport.cameraGx < R.x) _viewport.cameraGx = R.x;
                        if (_viewport.cameraGy < R.y) _viewport.cameraGy = R.y;
                        if (_viewport.cameraGx > R.x + R.width) _viewport.cameraGx = R.x + R.width;
                        if (_viewport.cameraGy > R.y + R.height) _viewport.cameraGy = R.y + R.height;
                    }
                },
                addOffset: function (pageX: number, pageY: number): void {
                    _viewport.cameraGx -= pageX / _viewport.scale;
                    _viewport.cameraGy -= pageY / _viewport.scale;
                    this.limitPosition();
                    _viewport.updateAttr();
                },
                cameraMoveTask: new VisModelJS.AnimationFrameTask(),
            };
            this._camera = __camera;

            this.scrollManager.onDragged = __camera.addOffset.bind(__camera);

            window.addEventListener("resize", (e) => { this.updatePageRect(); });
            this.updatePageSize();
            this.updatePageRect();
            this._camera.setCenterPagePosition(this.areaCenterX, this.areaCenterY);
            Utils.setTransformOriginToElement(this.panel.ContentLayer, "left top");
            this.updateAttr();
            var onPointer = (e: PointerEvent) => { if (this.isPointerEnabled) { this.scrollManager.onPointerEvent(e, this); } };

            ["trackstart", "trackend", "track"].forEach((name) => {
                PolymerGestures.addEventListener(this.panel.RootElement, name, onPointer);
            });

            var OnWheel = (e: WheelEvent) => {
                if (this.isPointerEnabled) {
                    e.preventDefault();
                    this.scrollManager.onMouseWheel(e, this);
                }
            };
            this.panel.RootElement.addEventListener('wheel', OnWheel);
        }

        get camera() {
            return this._camera;
        }

        private limitScale(scale: number): number {
            return scale < this.camera.minScale ? this.camera.minScale :
                scale > this.camera.maxScale ? this.camera.maxScale :
                scale;
        }

        private get offsetPageX() {
            return this.cameraCenterPageX - this.cameraGx * this.scale;
        }

        private get offsetPageY() {
            return this.cameraCenterPageY - this.cameraGy * this.scale;
        }

        /**
            Calcurate PageX from GX 
            @method PageXFromGX
            @param {number} GX Scale-independent X position in GSN.
            @return {number} PageX for given GX. It is depend on camera's position, scale and vanishing point.
        */
        pageXFromGX(gx: number): number {
            return this.cameraCenterPageX + (gx - this.cameraGx) * this.scale;
        }

        /**
            Calcurate PageY from GY 
            @method PageYFromGY
            @param {number} GY Scale-independent Y position in GSN.
            @return {number} PageY for given GY. It is depend on camera's position, scale and vanishing point.
        */
        pageYFromGY(gy: number): number {
            return this.cameraCenterPageY + (gy - this.cameraGy) * this.scale;
        }

        /**
            Calcurate GX from PageX 
            @method GXFromPageX
            @param {number} PageX X position in web page.
            @return {number} GX for given PageX. It is depend on camera's position, scale and vanishing point.
        */
        gxFromPageX(pageX: number): number {
            return (pageX - this.cameraCenterPageX) / this.scale + this.cameraGx;
        }

        /**
            Calcurate GY from PageY 
            @method GYFromPageY
            @param {number} PageY Y position in web page.
            @return {number} GY for given PageY. It is depend on camera's position, scale and vanishing point.
        */
        gyFromPageY(pageY: number): number {
            return (pageY - this.cameraCenterPageY) / this.scale + this.cameraGy;
        }

        convertRectGlobalXYFromPageXY(pageRect: Rect): Rect {
            var x1 = this.gxFromPageX(pageRect.x);
            var y1 = this.gyFromPageY(pageRect.y);
            var x2 = this.gxFromPageX(pageRect.x + pageRect.width);
            var y2 = this.gyFromPageY(pageRect.y + pageRect.height);
            return new Rect(x1, y1, x2 - x1, y2 - y1); 
        }

        get pageRectInGxGy(): Rect {
            var x1 = this.gxFromPageX(0);
            var y1 = this.gyFromPageY(0);
            var x2 = this.gxFromPageX(this._areaWidth);
            var y2 = this.gyFromPageY(this._areaHeight);
            return new Rect(x1, y1, x2 - x1, y2 - y1); 
        }

        get areaWidth() {
            return this._areaWidth;
        }

        get areaHeight() {
            return this._areaHeight;
        }

        get areaCenterX() {
            return this._areaWidth * 0.5;
        }

        get areaCenterY() {
            return this._areaHeight * 0.5;
        }

        private cameraMoveTask = new VisModelJS.AnimationFrameTask();

        private moveCamera(gx: number, gy: number, scale: number): void {
            this.scale += scale;
            this.cameraGx += gx;
            this.cameraGy += gy;
            this.updateAttr();
        }

        createMoveTaskFunction(gx: number, gy: number, scale: number, duration: number): (a: number, b: number, c: number) => void {
            return this.createMoveToTaskFunction(this.cameraGx + gx, this.cameraGy + gy, scale, duration);
        }

        createMoveToTaskFunction(gx: number, gy: number, scale: number, duration: number): (a: number, b:number, c:number) => void {
            scale = this.limitScale(scale);
            if (duration <= 0) {
                return null;
            }

            var VX = (gx - this.cameraGx) / duration;
            var VY = (gy - this.cameraGy) / duration;

            var S0 = this.scale;
            var ScaleRate = scale / S0;
            var DInv = 1 / duration;
            var ScaleFunction = (t: number) => S0 * Math.pow(ScaleRate, t * DInv);

            if (VY == 0 && VX == 0 && (scale == S0)) {
                return null;
            }

            return ((deltaT: number, currentTime: number, startTime: number) => {
                var DeltaS = ScaleFunction(currentTime - startTime) - ScaleFunction(currentTime - deltaT - startTime);
                this.moveCamera(VX * deltaT, VY * deltaT, DeltaS);
            });
        }

        private updatePageSize() {
            var rootRect = this.panel.RootElement.getBoundingClientRect();
            this._areaWidth = rootRect.width;
            this._areaHeight = rootRect.height;
        }

        private updatePageRect(): void {
            var cameraCenterXRate = this.cameraCenterPageX / this._areaWidth;
            var cameraCenterYRate = this.cameraCenterPageY / this._areaHeight;
            var cameraPX = this.pageXFromGX(this.cameraGx);
            var cameraPY = this.pageYFromGY(this.cameraGy);
            this.updatePageSize();
            this.camera.setCenterPagePosition(this._areaWidth * cameraCenterXRate, this._areaHeight * cameraCenterYRate);
            this.updateAttr();
        }

        private static createTranformAttr(x: number, y: number, scale: number): string {
            return "translate(" + x + " " + y + ") scale(" + scale + ")";
        }

        private static createTransformStyle(x: number, y: number, scale: number): string {
            return "translate(" + x + "px, " + y + "px) scale(" + scale + ") ";
        }

        private updateAttr(): void {
            var offsetX = this.offsetPageX
            var offsetY = this.offsetPageY;
            if (!isNaN(offsetX) && !isNaN(offsetY)) {
                var attr: string = ViewportManager.createTranformAttr(offsetX, offsetY, this.scale);
                var style: string = ViewportManager.createTransformStyle(offsetX, offsetY, this.scale);
                this.panel.SVGLayer.setAttribute("transform", attr);
                Utils.setTransformToElement(this.panel.ContentLayer, style);
            }
            var event = new VisModelJS.VisModelEvent();
            event.type = "cameramove";
            event.target = this;
            this.dispatchEvent(event);
        }

    }
}
