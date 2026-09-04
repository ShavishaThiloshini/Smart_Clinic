import type { PrescriptionItem } from '../../types/prescription.types';

type Props = { index: number; item: PrescriptionItem; onChange: (index: number, field: keyof Omit<PrescriptionItem, 'itemId' | 'prescriptionId'>, value: string) => void; onRemove: (index: number) => void; canRemove: boolean };

export function PrescriptionItemRow({ index, item, onChange, onRemove, canRemove }: Props) {
  return <fieldset className="rx-item-row"><legend>Medicine {index + 1}</legend>
    <label>Medicine name<input value={item.medicineName} onChange={(event) => onChange(index, 'medicineName', event.target.value)} placeholder="e.g. Amoxicillin" required /></label>
    <label>Dosage<input value={item.dosage || ''} onChange={(event) => onChange(index, 'dosage', event.target.value)} placeholder="e.g. 500 mg" /></label>
    <label>Frequency<input value={item.frequency || ''} onChange={(event) => onChange(index, 'frequency', event.target.value)} placeholder="e.g. Twice daily" /></label>
    <label>Duration<input value={item.duration || ''} onChange={(event) => onChange(index, 'duration', event.target.value)} placeholder="e.g. 5 days" /></label>
    <button type="button" className="rx-remove" disabled={!canRemove} onClick={() => onRemove(index)}>Remove</button>
  </fieldset>;
}
