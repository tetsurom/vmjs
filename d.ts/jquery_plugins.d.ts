///<reference path='./jquery.d.ts'/>

interface JQueryCookieOptions {
    expires?: any;
    path?: string;
    domain?: string;
    secure?: boolean;
}

interface JQueryCookieStatic {
    raw?: boolean;
    json?: boolean;

    (name: string): any;
    (name: string, value: string): void;
    (name: string, value: string, options: JQueryCookieOptions): void;
    (name: string, value: any): void;
    (name: string, value: any, options: JQueryCookieOptions): void;
}

interface JQuery
{
    tmpl(data?:any,options?:any): JQuery;
    tmplItem(): JQueryTmplItem;
    template(name?:string): ()=>any;
    tooltip(options: any): void;
}

interface JQueryStatic
{
    tmpl(template:string,data?:any,options?:any): JQuery;
    tmpl(template:(data:any)=>string,data?:any,options?:any): JQuery;
    tmplItem(element:JQuery): JQueryTmplItem;
    tmplItem(element:HTMLElement): JQueryTmplItem;
    template(name:string,template:any): (data:any)=>string[];
    template(template:any): JQueryTemplateDelegate;
}

interface JQueryTemplateDelegate {
    (jQuery: JQueryStatic, data: any):string[];
}

interface JQueryTmplItem {
    data:any;
    nodes:HTMLElement[];
    key:number;
    parent:JQueryTmplItem;
}

interface JQuery {
    bootstrapSwitch(type: "state"): boolean;
    bootstrapSwitch(type: "state", value: boolean, skip?: boolean): JQuery;
    bootstrapSwitch(type: "size"): string;
    bootstrapSwitch(type: "size", value: string): JQuery;
    bootstrapSwitch(type: "animate"): boolean;
    bootstrapSwitch(type: "onColor", value: boolean): JQuery;
    bootstrapSwitch(type: "animate", value: boolean): JQuery;
    bootstrapSwitch(type: "disabled"): boolean;
    bootstrapSwitch(type: "disabled", value: boolean): JQuery;
    bootstrapSwitch(type: "readonly"): boolean;
    bootstrapSwitch(type: "readonly", value: boolean): JQuery;
    bootstrapSwitch(type: "indeterminate"): boolean;
    bootstrapSwitch(type: "indeterminate", value: boolean): JQuery;
    bootstrapSwitch(type: "onColor"): string;
    bootstrapSwitch(type: "onColor", value: string): JQuery;
    bootstrapSwitch(type: "offColor"): string;
    bootstrapSwitch(type: "offColor", value: string): JQuery;
    bootstrapSwitch(type: "onText"): string;
    bootstrapSwitch(type: "onText", value: string): JQuery;
    bootstrapSwitch(type: "offText"): string;
    bootstrapSwitch(type: "offText", value: string): JQuery;
    bootstrapSwitch(type: "labelText"): string;
    bootstrapSwitch(type: "labelText", value: string): JQuery;
    bootstrapSwitch(type: "baseClass"): string;
    bootstrapSwitch(type: "baseClass", value: string): JQuery;
    bootstrapSwitch(type: "wrapperClass"): any;
    bootstrapSwitch(type: "wrapperClass", value: string): JQuery;
    bootstrapSwitch(type: "onInit"): (e: JQueryEventObject, state: boolean) => void;
    bootstrapSwitch(type: "onInit", value: (e: JQueryEventObject, state: boolean) => void): JQuery;
    bootstrapSwitch(type: "onSwitchChange"): (e: JQueryEventObject, state: boolean) => void;
    bootstrapSwitch(type: "onSwitchChange", value: (e: JQueryEventObject, state: boolean) => void): JQuery;
    bootstrapSwitch(type: "radioAllOff"): boolean;
    bootstrapSwitch(type: "radioAllOff", value: boolean): JQuery;
    bootstrapSwitch(type: "toggleState", skip?: boolean): JQuery;
    bootstrapSwitch(type: "toggleDisabled"): JQuery;
    bootstrapSwitch(type: "toggleReadonly"): JQuery;
    bootstrapSwitch(type: "destroy"): JQuery;
    bootstrapSwitch(type: string, value: any): JQuery;
    bootstrapSwitch(type: string, value: any, option: any): JQuery;
    bootstrapSwitch(type: string): any;
    bootstrapSwitch(): JQuery;
}
