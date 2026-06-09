/**
 * Telebirr H5 Integration Utilities
 * Handles communication with the Telebirr SuperApp JavaScript Bridge
 */

export interface TelebirrPaymentOptions {
  rawRequest: string;
  callbackMethodName?: string;
}

/**
 * Triggers the native Telebirr SuperApp checkout sheet.
 * @param rawRequest - The signed query string provided by the backend.
 * @param callbackMethodName - The name of the global window callback function.
 */
export function triggerTelebirrPayment(
  rawRequest: string,
  callbackMethodName = 'handleTelebirrPaymentCallback',
): boolean {
  if (!rawRequest) {
    console.error('Telebirr Error: rawRequest string is empty.');
    return false;
  }

  // Verify the web view is running inside the Ethio Telecom SuperApp wrapper
  if (typeof window === 'undefined' || !window.consumerapp) {
    console.warn(
      'Telebirr Error: window.consumerapp not detected. This page must run inside the SuperApp container.',
    );
    return false;
  }

  // Construct the command object precisely as telebirr's native code engine expects it
  const bridgePayload = {
    functionName: 'js_fun_start_pay',
    params: {
      rawRequest: rawRequest.trim(),
      functionCallBackName: callbackMethodName,
    },
  };

  try {
    // Stringify and evaluate the hook directly into the native runtime layer
    window.consumerapp.evaluate(JSON.stringify(bridgePayload));
    return true;
  } catch (error) {
    console.error('Failed to execute native window.consumerapp evaluation:', error);
    return false;
  }
}

/**
 * Check if the app is running inside the Telebirr SuperApp
 */
export function isTelebirrSuperApp(): boolean {
  return typeof window !== 'undefined' && window.consumerapp !== undefined;
}
