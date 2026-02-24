import { AbstractControl, FormGroup } from '@angular/forms';

export function trimControl(
  control: AbstractControl | null | undefined,
): void {
  if (!control) return;

  const value: unknown = control.value;
  if (typeof value !== 'string') return;

  const trimmedValue: string = value.trim();
  if (trimmedValue === value) return;

  control.setValue(trimmedValue, {
    emitEvent: false,
  });
}

export function trimControls(
  formGroup: FormGroup,
  controlKeys: readonly string[],
): void {
  for (const controlKey of controlKeys) {
    trimControl(formGroup.get(controlKey));
  }
}

export function hasNonWhitespace(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' && value.trim().length > 0
  );
}
