// ─── OCR Service ──────────────────────────────────────────────────────────────
//
// This service handles text extraction from images of German worksheets.
//
// TO CONNECT A REAL OCR API:
//   1. Google Cloud Vision:
//      - Enable Vision API in Google Cloud Console
//      - npm install @google-cloud/vision
//      - Replace extractTextFromImageMock() with a call to the Vision API
//      - Example: POST https://vision.googleapis.com/v1/images:annotate
//        with { requests: [{ image: { content: base64 }, features: [{ type: "TEXT_DETECTION" }] }] }
//
//   2. AWS Textract:
//      - Use AWS SDK: npm install @aws-sdk/client-textract
//      - Call textractClient.send(new DetectDocumentTextCommand(...))
//
//   3. Azure Computer Vision:
//      - POST to /vision/v3.2/read/analyze with the image
//
//   4. Tesseract.js (offline, no API key needed):
//      - npm install tesseract.js
//      - import Tesseract from 'tesseract.js'
//      - await Tesseract.recognize(imageUri, 'deu+eng')

export interface OCRResult {
  success: boolean;
  text: string;
  confidence?: number; // 0–1
  error?: string;
  isManualEntry: boolean;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function extractTextFromImage(imageUri: string): Promise<OCRResult> {
  // TODO: Replace this mock with a real OCR API call.
  // The function receives a local file URI from expo-image-picker or expo-camera.
  // For real APIs, you'll typically need to convert the image to base64 first.

  try {
    // Simulate network latency for the mock
    await delay(2000);

    // In production, this would call your OCR API.
    // For now, return a mock result indicating manual entry is needed.
    return {
      success: false,
      text: '',
      error: 'OCR API not connected yet.',
      isManualEntry: true,
    };
  } catch (error) {
    return {
      success: false,
      text: '',
      error: 'Failed to extract text. Please type or paste the text manually.',
      isManualEntry: true,
    };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function convertImageToBase64(imageUri: string): Promise<string> {
  // TODO: Use expo-file-system to read the image as base64
  // import * as FileSystem from 'expo-file-system';
  // const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
  // return base64;
  throw new Error('convertImageToBase64 not implemented – install expo-file-system');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Google Vision Example (commented out) ────────────────────────────────────
//
// async function extractWithGoogleVision(imageUri: string): Promise<OCRResult> {
//   const base64 = await convertImageToBase64(imageUri);
//   const response = await fetch(
//     `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
//     {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         requests: [{
//           image: { content: base64 },
//           features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
//         }],
//       }),
//     }
//   );
//   const data = await response.json();
//   const text = data.responses?.[0]?.fullTextAnnotation?.text ?? '';
//   return { success: !!text, text, isManualEntry: false };
// }
