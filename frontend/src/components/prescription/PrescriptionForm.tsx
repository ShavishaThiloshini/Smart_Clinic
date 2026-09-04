import { FormEvent, useEffect, useState } from 'react';
import type { CreatePrescriptionRequest, PrescriptionItem } from '../../types/prescription.types';
import { PrescriptionItemRow } from './PrescriptionItemRow';

type Props = { patientId: number | null; appointmentId: number | null; saving: boolean; onSubmit: (payload: CreatePrescriptionRequest) => Promise<void> };
const blankItem = (): PrescriptionItem => ({ medicineName: '', dosage: null, frequency: null, duration: null });

export function PrescriptionForm({ patientId, appointmentId, saving, onSubmit }: Props) {
  const [items, setItems] = useState<PrescriptionItem[]>([blankItem()]); const [notes, setNotes] = useState(''); const [message, setMessage] = useState('');
  useEffect(() => { setItems([blankItem()]); setNotes(''); setMessage(''); }, [patientId, appointmentId]);
  function updateItem(index: number, field: keyof Omit<PrescriptionItem, 'itemId' | 'prescriptionId'>, value: string) { setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: field === 'medicineName' ? value : value || null } : item)); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!patientId) return setMessage('Select a patient before creating a prescription.'); if (items.some((item) => !item.medicineName.trim())) return setMessage('Enter a medicine name for every medicine row.'); setMessage(''); await onSubmit({ patientId, appointmentId, notes: notes.trim() || null, items: items.map((item) => ({ ...item, medicineName: item.medicineName.trim() })) }); }
  return <form className="rx-form" onSubmit={submit}>{message && <p className="rx-notice error" role="alert">{message}</p>}<div className="rx-form-heading"><div><h2>Medicines</h2><p>Add each medicine with clear dosage instructions.</p></div><button type="button" className="rx-add" onClick={() => setItems((current) => [...current, blankItem()])}>+ Add medicine</button></div><div className="rx-items">{items.map((item, index) => <PrescriptionItemRow key={index} index={index} item={item} onChange={updateItem} onRemove={(itemIndex) => setItems((current) => current.filter((_, currentIndex) => currentIndex !== itemIndex))} canRemove={items.length > 1} />)}</div><label className="rx-notes">Additional notes <span>Optional</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} rows={4} placeholder="Advice, instructions, or follow-up information" /></label><div className="rx-actions"><button className="rx-submit" type="submit" disabled={!patientId || saving}>{saving ? 'Saving prescription...' : 'Issue prescription'}</button></div></form>;
}
