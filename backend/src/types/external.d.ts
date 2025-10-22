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

  export interface MessageId {
    id: string;
  }

  export interface MessageMedia {
    data: string;
    mimetype?: string;
    filename?: string;
  }

  export interface ClientOptions {
    puppeteer?: {
      headless?: boolean | "new";
      executablePath?: string;
      args?: string[];
    };
    authStrategy?: LocalAuth;
    webVersionCache?: {
      type: "local" | "remote" | "none";
      path?: string;
      strict?: boolean;
      remotePath?: string;
    };
    webVersion?: string;
  }

  export interface WhatsappConsoleMessage {
    type(): string;
    text(): string;
  }

  export interface WhatsappBrowserPage {
    on(event: "pageerror", listener: (error: unknown) => void): void;
    on(event: "error", listener: (error: unknown) => void): void;
    on(
      event: "console",
      listener: (message: WhatsappConsoleMessage) => void
    ): void;
  }

  export class Client {
    constructor(options?: ClientOptions);
    on(event: "qr", listener: (qr: string) => void): this;
    on(event: "ready", listener: () => void): this;
    on(event: "authenticated", listener: () => void): this;
    on(event: "auth_failure", listener: (message: string) => void): this;
    on(event: "disconnected", listener: (reason: string) => void): this;
    on(event: "message", listener: (message: Message) => void): this;
    on(event: "change_state", listener: (state: string) => void): this;
    on(
      event: "loading_screen",
      listener: (percent: number, message: string) => void
    ): this;
    on(event: "error", listener: (error: unknown) => void): this;
    on(event: "browserPage", listener: (page: WhatsappBrowserPage) => void): this;
    on(event: "remote_session_saved", listener: () => void): this;
    initialize(): Promise<void>;
  }

  export interface Message {
    body: string;
    from: string;
    fromMe: boolean;
    hasMedia: boolean;
    type?: string;
    id: MessageId;
    reply(content: string): Promise<void>;
    getContact(): Promise<Contact>;
    downloadMedia(): Promise<MessageMedia | null>;
  }
}
