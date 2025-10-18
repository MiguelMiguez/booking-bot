declare module "qrcode-terminal" {
  interface GenerateOptions {
    small?: boolean;
  }

  export function generate(text: string, options?: GenerateOptions): void;

  const qrcode: {
    generate: typeof generate;
  };

  export default qrcode;
}

declare module "whatsapp-web.js" {
  export interface LocalAuthOptions {
    dataPath?: string;
    clientId?: string;
  }

  export class LocalAuth {
    constructor(options?: LocalAuthOptions);
  }

  export interface Contact {
    number?: string;
    pushname?: string;
    name?: string;
  }

  export interface ClientOptions {
    puppeteer?: {
      headless?: boolean | "new";
      executablePath?: string;
      args?: string[];
    };
    authStrategy?: LocalAuth;
  }

  export class Client {
    constructor(options?: ClientOptions);
    on(event: "qr", listener: (qr: string) => void): this;
    on(event: "ready", listener: () => void): this;
    on(event: "authenticated", listener: () => void): this;
    on(event: "auth_failure", listener: (message: string) => void): this;
    on(event: "disconnected", listener: (reason: string) => void): this;
    on(event: "message", listener: (message: Message) => void): this;
    initialize(): Promise<void>;
  }

  export interface Message {
    body: string;
    from: string;
    fromMe: boolean;
    reply(content: string): Promise<void>;
    getContact(): Promise<Contact>;
  }
}
