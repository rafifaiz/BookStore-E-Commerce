import { ValueTransformer } from 'typeorm';

/**
 * PostgreSQL mengembalikan kolom DECIMAL sebagai string ("150000.00").
 * Transformer ini mengubahnya menjadi number agar aritmetika di service
 * (perhitungan total, diskon) tidak gagal secara diam-diam.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null): number | null => value ?? null,
  from: (value?: string | number | null): number | null => {
    if (value === null || value === undefined) {
      return null;
    }

    return typeof value === 'number' ? value : Number(value);
  },
};
