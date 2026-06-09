/**
 * Telebirr SuperApp Global Type Declarations
 */

declare global {
  interface Window {
    consumerapp?: {
      evaluate: (command: string) => void;
    };
  }
}

export {};
