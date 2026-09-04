const assert = require('assert');
const { validateItems } = require('../src/controllers/prescription.controller');

assert.equal(validateItems([{ medicineName: 'Paracetamol', dosage: '500 mg', frequency: 'Twice daily', duration: '3 days' }]), null);
assert.match(validateItems([]), /non-empty/);
assert.match(validateItems([{ medicineName: '  ' }]), /medicineName/);
assert.match(validateItems([{ medicineName: 'A'.repeat(256) }]), /255/);
assert.match(validateItems([{ medicineName: 'Valid', dosage: 'A'.repeat(101) }]), /100/);
assert.match(validateItems(Array.from({ length: 51 }, () => ({ medicineName: 'Valid' }))), /50/);
console.log('Prescription validation checks passed.');
