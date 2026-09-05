import TextRecognition from '@react-native-ml-kit/text-recognition';

export interface OcrBlock {
  text: string;
}

export interface OcrResult {
  text: string;
  blocks: OcrBlock[];
}

export class OcrError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'OcrError';
  }
}

/**
 * Runs on-device text recognition (Google ML Kit) against a captured photo
 * and returns the raw recognized text plus its blocks. This never leaves
 * the device — no image or text is sent anywhere.
 *
 * Requires a custom development build (ML Kit ships native code); it will
 * throw in Expo Go. See README → "Running the OCR build".
 */
export async function recognizeText(imageUri: string): Promise<OcrResult> {
  try {
    const result = await TextRecognition.recognize(imageUri);
    return {
      text: result.text,
      blocks: result.blocks.map((block) => ({ text: block.text })),
    };
  } catch (error) {
    throw new OcrError('Text recognition failed on this image.', error);
  }
}
