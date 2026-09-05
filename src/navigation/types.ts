import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ParsedReceipt } from '../types/receipt';

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList>;
  Scanner: undefined;
  /** capturedImageUri is kept alongside the already-parsed result so Review
   * can show a thumbnail or offer to retry OCR without a trip back to the
   * camera. */
  ScanResult: { capturedImageUri: string; parsedReceipt: ParsedReceipt };
  ReceiptDetails: { receiptId: string };
};

declare global {
  namespace ReactNavigation {
    // Intentionally empty — this merges with React Navigation's own
    // ambient interface (the library-documented way to type useNavigation()
    // globally). A type alias wouldn't merge the same way, so the lint
    // rule against empty interfaces is disabled for this one declaration.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
