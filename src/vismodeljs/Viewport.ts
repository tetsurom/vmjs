
module VisModelJS {
    export class Pointer {
        constructor(public X: number, public Y: number, public ID: number) { }
        SetPosition(X: number, Y: number) {
            this.X = X;
            this.Y = Y;
        }
    }

    /**
        Controll scroll by mouse, touch and pen and zoom by wheel.
        @class AssureNote.ScrollManager
        @for AssureNote.ViewportManager
    */
    export class ScrollManager {
        private CurrentX: number = 0;
        private CurrentY: number = 0;
        private Dx: number = 0;
        private Dy: number = 0;
        private MainPointerID: number = null;
        private Pointers: { [index: number]: Pointer } = [];

        private timer: number = 0;
        private ANIMATE_THRESHOLD: number = 5;
        private SPEED_MAX: number = 100;


        constructor(private Viewport: ViewportManager) {
        }

        private StartDrag(InitialX: number, InitialY: number) {
            this.CurrentX = InitialX;
            this.CurrentY = InitialY;
            try {
                if (this.OnStartDrag) {
                    this.OnStartDrag(this.Viewport);
                }
            } catch (e) {
            }
        }

        private UpdateDrag(CurrentX: number, CurrentY: number) {
            this.Dx = CurrentX - this.CurrentX;
            this.Dy = CurrentY - this.CurrentY;
            var speed = this.Dx * this.Dx + this.Dy + this.Dy;
            if (speed > this.SPEED_MAX * this.SPEED_MAX) {
                this.Dx *= ((this.SPEED_MAX * this.SPEED_MAX) / speed);
                this.Dy *= ((this.SPEED_MAX * this.SPEED_MAX) / speed);
            }

            this.CurrentX = CurrentX;
            this.CurrentY = CurrentY;
            if (this.OnDragged) {
                this.OnDragged(this.Viewport);
            }
        }

        private GetMainPointer(): Pointer {
            return this.Pointers[this.MainPointerID];
        }

        private IsDragging(): boolean {
            return this.MainPointerID != null;
        }

        private StopAnimation(): void {
            clearInterval(this.timer);
            this.Dx = 0;
            this.Dy = 0;
        }

        private EndDrag() {
            this.MainPointerID = null;
            this.Viewport.SetEventMapLayerPosition(false);
            try {
                if (this.OnEndDrag) {
                    this.OnEndDrag(this.Viewport);
                }
            } catch (e) {
            }
        }

        OnDragged: (Viewport: ViewportManager) => void;
        OnStartDrag: (Viewport: ViewportManager) => void;
        OnEndDrag: (Viewport: ViewportManager) => void;

        OnPointerEvent(e: PointerEvent, Screen: ViewportManager) {
            //var Log = (e: PointerEvent) => {
            //    console.log("pointer#" + e.pointerId + " " + e.type.substr(7));
            //    console.log("#pointers " + Object.keys(this.Pointers).length)
            //}
            switch (e.type) {
                case "pointerdown":
                    if (e.pointerType == "mouse" && e.button != 0) {
                        return;
                    }
                    if (!this.Pointers[e.pointerId]) {
                        this.Pointers[e.pointerId] = new Pointer(e.clientX, e.clientY, e.pointerId);
                        e.preventDefault();
                        e.stopPropagation();
                        //Log(e);
                    }
                    break;
                case "pointerout":
                case "pointerleave":
                case "pointercancel":
                case "pointerup":
                    if (!this.Pointers[e.pointerId]) {
                        return
                    }
                    delete this.Pointers[e.pointerId];
                    e.preventDefault();
                    e.stopPropagation();
                    //Log(e);
                    break;
                case "pointermove":
                    if (!this.Pointers[e.pointerId]) {
                        return
                    }
                    this.Pointers[e.pointerId].SetPosition(e.clientX, e.clientY);
                    e.preventDefault();
                    e.stopPropagation();
                    break;
                default:
                    return;
            }

            var IsTherePointer: boolean = Object.keys(this.Pointers).length > 0;
            var HasDragJustStarted: boolean = IsTherePointer && !this.IsDragging();
            var HasDragJustEnded: boolean = !this.GetMainPointer() && this.IsDragging();

            if (IsTherePointer) {
                if (HasDragJustStarted) {
                    this.StopAnimation();
                    this.timer = null;
                    var mainPointer: Pointer = this.Pointers[Object.keys(this.Pointers)[0]];
                    this.MainPointerID = mainPointer.ID;
                    this.Viewport.SetEventMapLayerPosition(true);
                    this.StartDrag(mainPointer.X, mainPointer.Y);
                } else {
                    var mainPointer = this.GetMainPointer();
                    if (mainPointer) {
                        this.UpdateDrag(mainPointer.X, mainPointer.Y);
                        Screen.AddOffset(this.Dx, this.Dy);
                    } else {
                        this.EndDrag();
                    }
                }
            } else {
                if (HasDragJustEnded) {
                    if (this.timer) {
                        this.StopAnimation();
                        this.timer = null;
                    }
                    this.timer = setInterval(() => {
                        if (Math.abs(this.Dx) < this.ANIMATE_THRESHOLD && Math.abs(this.Dy) < this.ANIMATE_THRESHOLD) {
                            this.StopAnimation();
                        }
                        this.CurrentX += this.Dx;
                        this.CurrentY += this.Dy;
                        this.Dx *= 0.95;
                        this.Dy *= 0.95;
                        Screen.AddOffset(this.Dx, this.Dy);
                    }, 16);
                }
                this.EndDrag();
            }
        }

        OnDoubleTap(e: PointerEvent, Screen: ViewportManager) {
            //var width: number = Screen.ContentLayer.clientWidth;
            //var height: number = Screen.ContentLayer.clientHeight;
            //var pointer = this.Pointers[0];
        }

        OnMouseWheel(e: { deltaX: number; deltaY: number }, Screen: ViewportManager) {
            Screen.SetCameraScale(Screen.GetCameraScale() * (1 + e.deltaY * 0.02));
        }
    }

    /**
        @class AssureNote.ViewportManager
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
            var OnPointer = (e: PointerEvent) => { if (this.IsPointerEnabled) { this.ScrollManager.OnPointerEvent(e, this); } };
            ["down", "move", "up", "out", "leave", "cancel"].forEach((Name) => {
                this.Panel.RootElement.addEventListener("pointer" + Name, OnPointer, false);
            });
            var OnWheel = (e: any) => {
                if (this.IsPointerEnabled) {
                    this.ScrollManager.OnMouseWheel(e, this);
                }
            };
            this.Panel.EventMapLayer.addEventListener('mousewheel', OnWheel);
        }

        /**
            @method GetCameraScale
            @return {number} Scale of camera. 1.0 for 100%.
        */
        GetCameraScale(): number {
            return this.Scale;
        }

        private static LimitScale(Scale: number): number {
            return Math.max(0.2, Math.min(20.0, Scale));
        }

        /**
            @method SetCameraScale
            @param {number} Scale Scale of camera. 1.0 for 100%.
        */
        SetCameraScale(Scale: number): void {
            this.Scale = ViewportManager.LimitScale(Scale);
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
            Scale = ViewportManager.LimitScale(Scale);
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
