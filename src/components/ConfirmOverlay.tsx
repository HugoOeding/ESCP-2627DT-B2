import { Button, type ButtonVariant } from './Button';
import { Overlay } from './Overlay';

export interface ConfirmOverlayProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmVariant?: ButtonVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A small confirmation sheet; the safe choice comes last so it is easy to reach. */
export function ConfirmOverlay({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmOverlayProps) {
  return (
    <Overlay open={open} title={title} onClose={onCancel}>
      <p className="text-body text-text-muted">{body}</p>
      <div className="mt-4 flex flex-col gap-2">
        <Button variant={confirmVariant} fullWidth onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" fullWidth onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </Overlay>
  );
}
