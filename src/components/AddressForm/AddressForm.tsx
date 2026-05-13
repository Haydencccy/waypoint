import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';

import type { AddressFormValues } from '../../types';
import styles from './AddressForm.module.css';

interface AddressFormProps {
  onSubmit: (values: AddressFormValues) => void;
  isSubmitting: boolean;
}

interface ValidationErrors {
  origin?: string;
  destination?: string;
}

const INITIAL_VALUES: AddressFormValues = {
  origin: '',
  destination: '',
};

function validate(values: AddressFormValues): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!values.origin.trim()) {
    errors.origin = 'Origin is required.';
  }

  if (!values.destination.trim()) {
    errors.destination = 'Destination is required.';
  }

  return errors;
}

export function AddressForm({ onSubmit, isSubmitting }: AddressFormProps) {
  const [values, setValues] = useState<AddressFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const handleChange = (field: keyof AddressFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;

    setValues((current) => ({
      ...current,
      [field]: nextValue,
    }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextValues = {
      origin: values.origin.trim(),
      destination: values.destination.trim(),
    };
    const nextErrors = validate(nextValues);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit(nextValues);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.grid}>
        <label className={styles.field} htmlFor="origin">
          <span className={styles.label}>Origin</span>
          <input
            id="origin"
            name="origin"
            className={styles.input}
            type="text"
            placeholder="Pickup address"
            value={values.origin}
            onChange={handleChange('origin')}
            aria-invalid={Boolean(errors.origin)}
            aria-describedby={errors.origin ? 'origin-error' : undefined}
            autoComplete="street-address"
            disabled={isSubmitting}
          />
          <span id="origin-error" className={styles.error} hidden={!errors.origin}>
            {errors.origin}
          </span>
        </label>

        <label className={styles.field} htmlFor="destination">
          <span className={styles.label}>Destination</span>
          <input
            id="destination"
            name="destination"
            className={styles.input}
            type="text"
            placeholder="Drop-off address"
            value={values.destination}
            onChange={handleChange('destination')}
            aria-invalid={Boolean(errors.destination)}
            aria-describedby={errors.destination ? 'destination-error' : undefined}
            autoComplete="off"
            disabled={isSubmitting}
          />
          <span id="destination-error" className={styles.error} hidden={!errors.destination}>
            {errors.destination}
          </span>
        </label>
      </div>

      <button className={styles.submit} type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? 'Finding route...' : 'Find route'}
      </button>
    </form>
  );
}
