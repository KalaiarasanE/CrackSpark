declare module "docx-preview" {
  export interface RenderOptions {
    inWrapper?: boolean;
    ignoreWidth?: boolean;
    ignoreHeight?: boolean;
    ignoreFonts?: boolean;
    breakPages?: boolean;
    debug?: boolean;
    experimental?: boolean;
    className?: string;
  }
  export function renderAsync(
    data: Blob | ArrayBuffer,
    bodyContainer: HTMLElement,
    styleContainer?: HTMLElement,
    options?: Partial<RenderOptions>,
  ): Promise<any>;
}

declare module "mammoth" {
  export interface Options {
    arrayBuffer: ArrayBuffer;
  }
  export interface Result {
    value: string;
    messages: any[];
  }
  export function extractRawText(options: Options): Promise<Result>;
  export function convertToHtml(options: Options, options2?: any): Promise<Result>;
}
