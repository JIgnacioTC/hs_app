declare global {
  interface HTMLInputElement {
    value: string;
  }

  interface HTMLTextAreaElement {
    value: string;
  }

  interface HTMLSelectElement {
    value: string;
  }

  interface NotificationOptions {
    vibrate?: number | number[];
  }
}

export {};
