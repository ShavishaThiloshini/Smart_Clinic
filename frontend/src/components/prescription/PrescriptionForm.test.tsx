import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrescriptionForm } from './PrescriptionForm';

describe('PrescriptionForm', () => {
  it('submits a valid multi-medicine prescription with trimmed values', async () => {
    const user = userEvent.setup(); const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PrescriptionForm patientId={7} appointmentId={12} saving={false} onSubmit={onSubmit} />);
    await user.type(screen.getAllByLabelText('Medicine name')[0], '  Paracetamol  ');
    await user.type(screen.getByLabelText('Dosage'), '500 mg');
    await user.click(screen.getByRole('button', { name: '+ Add medicine' }));
    await user.type(screen.getAllByLabelText('Medicine name')[1], 'Cetirizine');
    fireEvent.submit(screen.getByRole('button', { name: 'Issue prescription' }).closest('form')!);
    expect(onSubmit).toHaveBeenCalledWith({ patientId: 7, appointmentId: 12, notes: null, items: [{ medicineName: 'Paracetamol', dosage: '500 mg', frequency: null, duration: null }, { medicineName: 'Cetirizine', dosage: null, frequency: null, duration: null }] });
  });

  it('shows a validation message for an empty medicine row', async () => {
    const user = userEvent.setup(); const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PrescriptionForm patientId={7} appointmentId={12} saving={false} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: '+ Add medicine' }));
    await user.type(screen.getAllByLabelText('Medicine name')[0], 'Paracetamol');
    fireEvent.submit(screen.getByRole('button', { name: 'Issue prescription' }).closest('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a medicine name for every medicine row.'); expect(onSubmit).not.toHaveBeenCalled();
  });
});
