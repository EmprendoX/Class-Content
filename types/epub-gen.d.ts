declare module 'epub-gen' {
  export interface EbookOptions {
    title: string;
    author?: string;
    publisher?: string;
    output: string;
    content: Array<{
      title: string;
      data: string;
    }>;
  }

  export class EPUB {
    constructor(options: EbookOptions);
    promise: Promise<void>;
  }

  export default EPUB;
}

