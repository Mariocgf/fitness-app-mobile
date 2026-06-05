import { getBarcodeLookupCandidates } from '../barcode.utils';

describe('barcode.utils', () => {
  it('debe mantener el código original y limpiar espacios', () => {
    expect(getBarcodeLookupCandidates(' 7791234567890 ')).toEqual(['7791234567890']);
  });

  it('debe agregar variante UPC cuando EAN-13 viene con cero inicial', () => {
    expect(getBarcodeLookupCandidates('012345678905')).toContain('12345678905');
  });

  it('debe agregar variantes sin ceros de padding al inicio y al final', () => {
    const candidates = getBarcodeLookupCandidates('000779123456789000');

    expect(candidates).toContain('779123456789000');
    expect(candidates).toContain('000779123456789');
    expect(candidates).toContain('779123456789');
  });
});
