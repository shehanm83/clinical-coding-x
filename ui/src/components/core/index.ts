/**
 * Core Components Index
 *
 * Exports all core UI components for the Clinical Coding application.
 */

// Button
export { TxButton } from './tx-button.js';
export type { ButtonVariant, ButtonSize, ButtonType } from './tx-button.js';

// Input
export { TxInput } from './tx-input.js';
export type { InputType } from './tx-input.js';

// Textarea
export { TxTextarea } from './tx-textarea.js';

// Select
export { TxSelect } from './tx-select.js';
export type { SelectOption } from './tx-select.js';

// Toast
export { TxToast } from './tx-toast.js';
export type { ToastVariant, ToastPosition } from './tx-toast.js';

// Toast Container
export { TxToastContainer, toast } from './tx-toast-container.js';
export type { ToastOptions } from './tx-toast-container.js';

// Alert
export { TxAlert } from './tx-alert.js';
export type { AlertVariant } from './tx-alert.js';

// Modal
export { TxModal } from './tx-modal.js';
export type { ModalSize } from './tx-modal.js';

// Live Region (Screen Reader Announcer)
export {
  TxLiveRegion,
  getAnnouncer,
  announce,
  announceError,
  announceStatus,
} from './tx-live-region.js';
export type { AnnouncementPriority } from './tx-live-region.js';
