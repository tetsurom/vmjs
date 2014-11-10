
module VisModelJS {
    export class Pointer {
        constructor(public x: number, public y: number, public id: number) { }
        SetPosition(x: number, y: number) {
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


        constructor(private viewport: ViewportManager) {
        }

        private startDrag(initialX: number, initialY: number) {
            this.currentX = initialX;
            this.currentY = initialY;
            try {
                if (this.onStartDrag) {
                    this.onStartDrag(this.viewport);
                }
            } catch (e) {
            }
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
            if (this.onDragged) {
                this.onDragged(this.viewport);
            }
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
            this.viewport.SetEventMapLayerPosition(false);
            try {
                if (this.onEndDrag) {
                    this.onEndDrag(this.viewport);
                }
            } catch (e) {
            }
        }

        onDragged: (viewport: ViewportManager) => void;
        onStartDrag: (viewport: ViewportManager) => void;
        onEndDrag: (viewport: ViewportManager) => void;

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
                    this.pointers[e.pointerId].SetPosition(e.clientX, e.clientY);
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
                    this.viewport.SetEventMapLayerPosition(true);
                    this.startDrag(mainPointer.x, mainPointer.y);
                } else {
                    var mainPointer = this.getMainPointer();
                    if (mainPointer) {
                        this.updateDrag(mainPointer.x, mainPointer.y);
                        viewport.AddOffset(this.dx, this.dy);
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
                        viewport.AddOffset(this.dx, this.dy);
                    }, 16);
                }
                this.endDrag();
            }
        }

        onMouseWheel(e: WheelEvent, screen: ViewportManager) {
            screen.SetCameraScale(screen.GetCameraScale() * (1 + e.deltaY * 0.02));
        }
    }

    /**
        @class VisModelJS.ViewportManager
    */
    export class ViewportManager extends EventTarget {
        ScrollManager: ScrollManager = new ScrollManager(this);
        private CameraGX: number = 0;
        private CameraGY: number = 0;
        private Scale: number = 1.0;
        private PageWidth: number;
        private PageHeight: number;
        private CameraCenterPageX: number;
        private CameraCenterPageY: number;
        public IsPointerEnabled: boolean = true;
        public OnScroll: (Viewport: ViewportManager) => void;
        public CameraLimitRect: Rect;

        constructor(private Panel: VisualModelPanel) {
            super();

            window.addEventListener("resize", (e) => { this.UpdatePageRect(); });
            this.UpdatePageSize();
            this.UpdatePageRect();
            this.SetCameraPageCenter(this.GetPageCenterX(), this.GetPageCenterY());
            Utils.setTransformOriginToElement(this.Panel.ContentLayer, "left top");
            this.UpdateAttr();
            var onPointer = (e: PointerEvent) => { if (this.IsPointerEnabled) { this.ScrollManager.onPointerEvent(e, this); } };

            ["trackstart", "trackend", "track"].forEach((name) => {
                PolymerGestures.addEventListener(this.Panel.RootElement, name, onPointer);
            });

            var OnWheel = (e: WheelEvent) => {
                if (this.IsPointerEnabled) {
                    e.preventDefault();
                    this.ScrollManager.onMouseWheel(e, this);
                }
            };
            this.Panel.RootElement.addEventListener('mousewheel', OnWheel);
        }

        /**
            @method GetCameraScale
            @return {number} Scale of camera. 1.0 for 100%.
        */
        GetCameraScale(): number {
            return this.Scale;
        }

        public MaxScale = 2.0;
        public MinScale = 0.2;

        private LimitScale(Scale: number): number {
            return Scale < this.MinScale ? this.MinScale :
                   Scale > this.MaxScale ? this.MaxScale :
                                           Scale;
        }

        /**
            @method SetCameraScale
            @param {number} Scale Scale of camera. 1.0 for 100%.
        */
        SetCameraScale(Scale: number): void {
            this.Scale = this.LimitScale(Scale);
            this.UpdateAttr();
        }

        private GetOffsetPageX() {
            return this.CameraCenterPageX - this.CameraGX * this.Scale;
        }

        private GetOffsetPageY() {
            return this.CameraCenterPageY - this.CameraGY * this.Scale;
        }

        private LimitCameraPosition(): void {
            var R = this.CameraLimitRect;
            if (R) {
                if (this.CameraGX < R.x) this.CameraGX = R.x;
                if (this.CameraGY < R.y) this.CameraGY = R.y;
                if (this.CameraGX > R.x + R.width) this.CameraGX = R.x + R.width;
                if (this.CameraGY > R.y + R.height) this.CameraGY = R.y + R.height;
            }
        }

        private SetOffset(PageX: number, PageY: number): void {
            this.CameraGX = (this.CameraCenterPageX - PageX) / this.Scale;
            this.CameraGY = (this.CameraCenterPageY - PageY) / this.Scale;
            this.LimitCameraPosition();
            this.UpdateAttr();
        }

        AddOffset(PageX: number, PageY: number): void {
            this.CameraGX -= PageX / this.Scale;
            this.CameraGY -= PageY / this.Scale;
            this.LimitCameraPosition();
            this.UpdateAttr();
        }

        /**
            @method GetCameraGX
            @return {number} Scale-independent camera X position in GSN. 0 for leftside of topgoal.
        */
        GetCameraGX(): number {
            return this.CameraGX;
        }

        /**
            @method GetCameraGY
            @return {number} Scale-independent camera Y position in GSN. 0 for top of topgoal.
        */
        GetCameraGY(): number {
            return this.CameraGY;
        }

        /**
            @method SetCameraPosition
            @param {number} GX Scale-independent camera X position in GSN. 0 for leftside of topgoal.
            @param {number} GY Scale-independent camera Y position in GSN. 0 for top of topgoal.
        */
        SetCameraPosition(GX: number, GY: number): void {
            this.SetOffset(this.CameraCenterPageX - GX * this.Scale, this.CameraCenterPageY - GY * this.Scale);
        }

        /**
            Set camera's position and scale one time.
            @method SetCamera
            @param {number} GX Scale-independent camera X position in GSN. 0 for leftside of topgoal.
            @param {number} GY Scale-independent camera Y position in GSN. 0 for top of topgoal.
            @param {number} Scale Scale of camera. 1.0 for 100%.
        */
        SetCamera(GX: number, GY: number, Scale: number): void {
            this.Scale = Scale;
            this.SetOffset(this.CameraCenterPageX - GX * this.Scale, this.CameraCenterPageY - GY * this.Scale);
        }

        private MoveCamera(GX: number, GY: number, Scale: number): void {
            this.Scale += Scale;
            this.CameraGX += GX;
            this.CameraGY += GY;
            this.UpdateAttr();
        }

        /**
            @method GetCameraPageCenterX
            @return {number} X of camera's vanishing point in web page.
        */
        GetCameraPageCenterX(): number {
            return this.CameraCenterPageX;
        }

        /**
            @method GetCameraPageCenterY
            @return {number} Y of camera's vanishing point in web page.
        */
        GetCameraPageCenterY(): number {
            return this.CameraCenterPageY;
        }

        /**
            Set camera's vanishing point in web page.
            @method SetCameraPageCenter
            @param {number} PageX X of camera's vanishing point in web page.
            @param {number} PageY Y of camera's vanishing point in web page.
        */
        SetCameraPageCenter(PageX: number, PageY: number): void {
            this.CameraCenterPageX = PageX;
            this.CameraCenterPageY = PageY;
        }

        /**
            Calcurate PageX from GX 
            @method PageXFromGX
            @param {number} GX Scale-independent X position in GSN.
            @return {number} PageX for given GX. It is depend on camera's position, scale and vanishing point.
        */
        PageXFromGX(GX: number): number {
            return this.CameraCenterPageX + (GX - this.CameraGX) * this.Scale;
        }

        /**
            Calcurate PageY from GY 
            @method PageYFromGY
            @param {number} GY Scale-independent Y position in GSN.
            @return {number} PageY for given GY. It is depend on camera's position, scale and vanishing point.
        */
        PageYFromGY(GY: number): number {
            return this.CameraCenterPageY + (GY - this.CameraGY) * this.Scale;
        }

        /**
            Calcurate GX from PageX 
            @method GXFromPageX
            @param {number} PageX X position in web page.
            @return {number} GX for given PageX. It is depend on camera's position, scale and vanishing point.
        */
        GXFromPageX(PageX: number): number {
            return (PageX - this.CameraCenterPageX) / this.Scale + this.CameraGX;
        }

        /**
            Calcurate GY from PageY 
            @method GYFromPageY
            @param {number} PageY Y position in web page.
            @return {number} GY for given PageY. It is depend on camera's position, scale and vanishing point.
        */
        GYFromPageY(PageY: number): number {
            return (PageY - this.CameraCenterPageY) / this.Scale + this.CameraGY;
        }

        ConvertRectGlobalXYFromPageXY(PageRect: Rect): Rect {
            var x1 = this.GXFromPageX(PageRect.x);
            var y1 = this.GYFromPageY(PageRect.y);
            var x2 = this.GXFromPageX(PageRect.x + PageRect.width);
            var y2 = this.GYFromPageY(PageRect.y + PageRect.height);
            return new Rect(x1, y1, x2 - x1, y2 - y1); 
        }

        GetPageRectInGxGy(): Rect {
            var x1 = this.GXFromPageX(0);
            var y1 = this.GYFromPageY(0);
            var x2 = this.GXFromPageX(this.PageWidth);
            var y2 = this.GYFromPageY(this.PageHeight);
            return new Rect(x1, y1, x2 - x1, y2 - y1); 
        }

        GetPageWidth(): number {
            return this.PageWidth;
        }

        GetPageHeight(): number {
            return this.PageHeight;
        }

        GetPageCenterX(): number {
            return this.GetPageWidth() * 0.5;
        }

        GetPageCenterY(): number {
            return this.GetPageHeight() * 0.5;
        }

        private CameraMoveTask = new VisModelJS.AnimationFrameTask();

        /**
            Move camera position relatively and change scale.
            @method Move
            @param {number} GX Scale-independent camera relative X difference.
            @param {number} GY Scale-independent camera relative Y difference.
            @param {number} Scale Scale of camera. 1.0 for 100%.
            @param {number} Duration Time for moving in millisecond.
            @async
        */
        Move(GX: number, GY: number, Scale: number, Duration: number): void {
            this.MoveTo(this.GetCameraGX() + GX, this.GetCameraGY() + GY, Scale, Duration);
        }

        /**
            Move camera position and scale one time.
            @method MoveTo
            @param {number} GX Scale-independent camera X position in GSN. 0 for leftside of topgoal.
            @param {number} GY Scale-independent camera Y position in GSN. 0 for top of topgoal.
            @param {number} Scale Scale of camera. 1.0 for 100%.
            @param {number} Duration Time for moving in millisecond.
            @async
        */
        MoveTo(GX: number, GY: number, Scale: number, Duration: number): void {
            var Task = this.CreateMoveToTaskFunction(GX, GY, Scale, Duration);
            if (!Task) {
                this.SetCamera(GX, GY, Scale);
                return;
            }
            this.CameraMoveTask.start(Duration, Task);
        }

        CreateMoveTaskFunction(GX: number, GY: number, Scale: number, Duration: number): (a: number, b: number, c: number) => void {
            return this.CreateMoveToTaskFunction(this.GetCameraGX() + GX, this.GetCameraGY() + GY, Scale, Duration);
        }

        CreateMoveToTaskFunction(GX: number, GY: number, Scale: number, Duration: number): (a: number, b:number, c:number) => void {
            Scale = this.LimitScale(Scale);
            if (Duration <= 0) {
                return null;
            }

            var VX = (GX - this.GetCameraGX()) / Duration;
            var VY = (GY - this.GetCameraGY()) / Duration;

            var S0 = this.GetCameraScale();
            var ScaleRate = Scale / S0;
            var DInv = 1 / Duration;
            var ScaleFunction = (t: number) => S0 * Math.pow(ScaleRate, t * DInv);

            if (VY == 0 && VX == 0 && (Scale == S0)) {
                return null;
            }

            return ((deltaT: number, currentTime: number, startTime: number) => {
                var DeltaS = ScaleFunction(currentTime - startTime) - ScaleFunction(currentTime - deltaT - startTime);
                this.MoveCamera(VX * deltaT, VY * deltaT, DeltaS);
            });
        }

        private UpdatePageSize() {
            var rootRect = this.Panel.RootElement.getBoundingClientRect();
            this.PageWidth = rootRect.width;
            this.PageHeight = rootRect.height;
        }

        private UpdatePageRect(): void {
            var CameraCenterXRate = this.CameraCenterPageX / this.PageWidth;
            var CameraCenterYRate = this.CameraCenterPageY / this.PageHeight;
            var CameraPX = this.PageXFromGX(this.CameraGX);
            var CameraPY = this.PageYFromGY(this.CameraGY);
            this.UpdatePageSize();
            this.SetCameraPageCenter(this.PageWidth * CameraCenterXRate, this.PageHeight * CameraCenterYRate);
            this.UpdateAttr();
        }

        private IsEventMapUpper: boolean = false;
        public SetEventMapLayerPosition(IsUpper: boolean) {
            //if (IsUpper && !this.IsEventMapUpper) {
            //    $(this.ControlLayer).after(this.EventMapLayer);
            //} else if (!IsUpper && this.IsEventMapUpper) {
            //    $(this.ContentLayer).before(this.EventMapLayer);
            //}
            //this.IsEventMapUpper = IsUpper;
        }

        private static CreateTranformAttr(x: number, y: number, scale: number): string {
            return "translate(" + x + " " + y + ") scale(" + scale + ")";
        }

        private static CreateTransformStyle(x: number, y: number, scale: number): string {
            return "translate(" + x + "px, " + y + "px) scale(" + scale + ") ";
        }

        private UpdateAttr(): void {
            var OffsetPageX = this.GetOffsetPageX();
            var OffsetPageY = this.GetOffsetPageY();
            if (!isNaN(OffsetPageX) && !isNaN(OffsetPageY)) {
                var attr: string = ViewportManager.CreateTranformAttr(OffsetPageX, OffsetPageY, this.Scale);
                var style: string = ViewportManager.CreateTransformStyle(OffsetPageX, OffsetPageY, this.Scale);
                this.Panel.SVGLayer.setAttribute("transform", attr);
                Utils.setTransformToElement(this.Panel.ContentLayer, style);
            }
            if (this.OnScroll) {
                this.OnScroll(this);
            }
            var Event = new VisModelJS.VisModelEvent();
            Event.type = "cameramove";
            Event.target = this;
            this.dispatchEvent(Event);
        }

    }
}
