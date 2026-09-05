export type AppErrorCode =
  | 'camera_permission_denied'
  | 'camera_unavailable'
  | 'capture_failed'
  | 'ocr_failed'
  | 'no_text_detected'
  | 'storage_failed'
  | 'unknown';

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

const FRIENDLY_MESSAGES: Record<AppErrorCode, string> = {
  camera_permission_denied:
    'Camera access is off for this app. Enable it in your device settings to scan a receipt.',
  camera_unavailable: "This device's camera isn't available right now.",
  capture_failed: "Couldn't capture the photo. Try again with steadier hands and good lighting.",
  ocr_failed: "Couldn't read this receipt. Try a flatter surface and more even light.",
  no_text_detected: 'No text was found in that photo. Make sure the receipt fills the frame.',
  storage_failed: "Couldn't save the receipt on this device. Free up some space and try again.",
  unknown: 'Something went wrong. Please try again.',
};

/** Maps any thrown value to a message safe to show a user — never a raw
 * stack trace or a vendor error string. */
export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof AppError) return FRIENDLY_MESSAGES[error.code];
  return FRIENDLY_MESSAGES.unknown;
}
