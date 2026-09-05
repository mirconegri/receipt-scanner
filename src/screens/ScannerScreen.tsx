import React, { useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing, typography } from '../theme/tokens';
import { ScannerFrame, type ScanFrameState } from '../components/scanner/ScannerFrame';
import { ScannerStatus } from '../components/scanner/ScannerStatus';
import { Button } from '../components/ui/Button';
import { recognizeText } from '../services/ocr/textRecognition';
import { parseReceiptText } from '../services/parser/receiptParser';
import { AppError, getFriendlyErrorMessage } from '../utils/errors';
import { generateId } from '../utils/id';
import type { RootStackParamList } from '../navigation/types';

type ScannerNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Scanner'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const FRAME_WIDTH = screenWidth * 0.82;
const FRAME_HEIGHT = Math.min(FRAME_WIDTH * 1.35, screenHeight * 0.55);

type ScreenState = 'idle' | 'capturing' | 'processing' | 'error';

const STATUS_MESSAGE: Record<ScreenState, string> = {
  idle: 'Position the receipt inside the frame',
  capturing: 'Scanning receipt...',
  processing: 'Processing locally...',
  error: "Couldn't read that receipt",
};

export function ScannerScreen() {
  const navigation = useNavigation<ScannerNavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const isCapturingRef = useRef(false);

  const frameState: ScanFrameState =
    screenState === 'capturing' || screenState === 'processing' ? 'processing' : 'searching';

  async function handleCapture() {
    if (isCapturingRef.current || !cameraRef.current || !cameraReady) return;
    isCapturingRef.current = true;
    setErrorMessage(null);
    setScreenState('capturing');

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) throw new AppError('capture_failed', 'No photo URI returned');

      setScreenState('processing');
      const ocrResult = await recognizeText(photo.uri);
      if (!ocrResult.text || ocrResult.text.trim().length === 0) {
        throw new AppError('no_text_detected', 'OCR returned no text');
      }

      const parsedReceipt = parseReceiptText(ocrResult.text, () => generateId('item'));
      navigation.replace('ScanResult', { capturedImageUri: photo.uri, parsedReceipt });
    } catch (error) {
      const appError =
        error instanceof AppError
          ? error
          : new AppError(
              error instanceof Error && error.name === 'OcrError' ? 'ocr_failed' : 'capture_failed',
              'Capture or OCR failed',
              error,
            );
      setErrorMessage(getFriendlyErrorMessage(appError));
      setScreenState('error');
    } finally {
      isCapturingRef.current = false;
    }
  }

  if (!permission) {
    return <View style={styles.blackFill} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionMessage}>
          Receipt Scanner needs your camera to scan receipts. Nothing is recorded or sent anywhere — the photo
          never leaves this screen.
        </Text>
        {permission.canAskAgain ? (
          <Button label="Allow camera access" onPress={requestPermission} style={styles.permissionButton} />
        ) : (
          <Text style={styles.permissionHint}>
            Camera access was denied. Enable it for Receipt Scanner in your device Settings app.
          </Text>
        )}
        <Button label="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.blackFill}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
        onMountError={() => {
          setErrorMessage(getFriendlyErrorMessage(new AppError('camera_unavailable', 'Camera mount error')));
          setScreenState('error');
        }}
      />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Cancel scanning"
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.frameArea}>
          <ScannerFrame state={frameState} width={FRAME_WIDTH} height={FRAME_HEIGHT} />
        </View>

        <View style={styles.bottomArea}>
          <ScannerStatus message={errorMessage ?? STATUS_MESSAGE[screenState]} />
          {screenState === 'error' ? (
            <Button
              label="Try again"
              onPress={() => {
                setScreenState('idle');
                setErrorMessage(null);
              }}
              style={styles.retryButton}
            />
          ) : (
            <Pressable
              onPress={handleCapture}
              disabled={!cameraReady || screenState !== 'idle'}
              accessibilityRole="button"
              accessibilityLabel="Capture receipt"
              accessibilityState={{ disabled: !cameraReady || screenState !== 'idle' }}
              style={({ pressed }) => [
                styles.captureButton,
                pressed && styles.captureButtonPressed,
                (!cameraReady || screenState !== 'idle') && styles.captureButtonDisabled,
              ]}
            >
              <View style={styles.captureButtonInner} />
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  blackFill: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomArea: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.textPrimary,
  },
  captureButtonPressed: {
    opacity: 0.8,
  },
  captureButtonDisabled: {
    opacity: 0.4,
  },
  retryButton: {
    minWidth: 160,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  permissionTitle: {
    color: colors.textPrimary,
    fontSize: typography.heading.fontSize,
    fontWeight: typography.heading.fontWeight,
    marginTop: spacing.xs,
  },
  permissionMessage: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    lineHeight: typography.body.lineHeight,
    marginBottom: spacing.sm,
  },
  permissionButton: {
    minWidth: 220,
  },
  permissionHint: {
    color: colors.textTertiary,
    fontSize: typography.caption.fontSize,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
