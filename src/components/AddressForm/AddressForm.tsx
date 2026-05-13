import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { searchAddressSuggestions } from '../../api/geocodeApi';
import type { AddressFormValues } from '../../types';
import styles from './AddressForm.module.css';

interface AddressFormProps {
  onActiveFieldChange?: (field: keyof AddressFormValues | null) => void;
  onSubmit: (values: AddressFormValues) => void;
  onValuesChange?: (values: AddressFormValues) => void;
  onSuggestionSelect?: (field: keyof AddressFormValues, suggestion: { displayName: string; lat: number; lng: number }) => void;
  isSubmitting: boolean;
  selectedOrigin?: string | null;
  selectedDestination?: string | null;
}

interface ValidationErrors {
  origin?: string;
  destination?: string;
}

interface SuggestionOption {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

const INITIAL_VALUES: AddressFormValues = {
  origin: '',
  destination: '',
};

const QUICK_PICK_SUGGESTIONS: string[] = [
  '19W, Hong Kong Science Park',
  'Chai Wan MTR Station',
  'Hong Kong International Airport Terminal 1',
  'Tsim Sha Tsui Star Ferry Pier',
];

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

export function AddressForm({
  onActiveFieldChange,
  onSubmit,
  onValuesChange,
  onSuggestionSelect,
  isSubmitting,
  selectedOrigin,
  selectedDestination,
}: AddressFormProps) {
  const [values, setValues] = useState<AddressFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [activeField, setActiveField] = useState<keyof AddressFormValues | null>(null);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const blurTimeoutRef = useRef<number | null>(null);

  const activeQuery = useMemo(() => {
    if (!activeField) {
      return '';
    }

    return values[activeField].trim();
  }, [activeField, values]);

  useEffect(() => {
    if (!activeField || activeQuery.length < 1 || import.meta.env.MODE === 'test') {
      setSuggestions([]);
      setIsSearching(false);
      setSearchError(null);
      setHighlightIndex(0);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      setSearchError(null);

      void searchAddressSuggestions(activeQuery, controller.signal)
        .then((items) => {
          setSuggestions(
            items.map((item) => ({
              id: item.id,
              name: item.name,
              displayName: item.displayName,
              latitude: item.latitude,
              longitude: item.longitude,
            })),
          );
          setHighlightIndex(0);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }

          setSearchError('Could not load suggestions right now.');
          setSuggestions([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [activeField, activeQuery]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current !== null) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof selectedOrigin === 'string') {
      setValues((current) => ({
        ...current,
        origin: selectedOrigin,
      }));
      setErrors((current) => {
        if (!current.origin) {
          return current;
        }

        const nextErrors = { ...current };
        delete nextErrors.origin;
        return nextErrors;
      });
    }
  }, [selectedOrigin]);

  useEffect(() => {
    if (typeof selectedDestination === 'string') {
      setValues((current) => ({
        ...current,
        destination: selectedDestination,
      }));
      setErrors((current) => {
        if (!current.destination) {
          return current;
        }

        const nextErrors = { ...current };
        delete nextErrors.destination;
        return nextErrors;
      });
    }
  }, [selectedDestination]);

  const handleChange = (field: keyof AddressFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    const nextValues = {
      ...values,
      [field]: nextValue,
    };

    setActiveField(field);
    if (onActiveFieldChange) { onActiveFieldChange(field); }
    setIsAutocompleteOpen(true);

    setValues(nextValues);
    onValuesChange?.(nextValues);

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const applySuggestion = (field: keyof AddressFormValues, suggestion: SuggestionOption) => {
    const nextValues = {
      ...values,
      [field]: suggestion.displayName,
    };
    setValues(nextValues);
    onValuesChange?.(nextValues);
    onSuggestionSelect?.(field, {
      displayName: suggestion.displayName,
      lat: suggestion.latitude,
      lng: suggestion.longitude,
    });
    setActiveField(field);
    if (onActiveFieldChange) { onActiveFieldChange(field); }
    setIsAutocompleteOpen(false);
    setSuggestions([]);
    setSearchError(null);
  };

  const applyQuickPick = (text: string) => {
    const targetField = activeField ?? (values.origin.trim() ? 'destination' : 'origin');
    const nextValues = {
      ...values,
      [targetField]: text,
    };

    setValues(nextValues);
    onValuesChange?.(nextValues);

    setActiveField(targetField);
    if (onActiveFieldChange) { onActiveFieldChange(targetField); }
    setIsAutocompleteOpen(false);
  };

  const swapRouteEnds = () => {
    const nextValues = {
      origin: values.destination,
      destination: values.origin,
    };
    setValues(nextValues);
    onValuesChange?.(nextValues);
    setErrors({});
    setIsAutocompleteOpen(false);
  };

  const handleFocus = (field: keyof AddressFormValues) => () => {
    if (blurTimeoutRef.current !== null) {
      window.clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }

    setActiveField(field);
    if (onActiveFieldChange) { onActiveFieldChange(field); }
    setIsAutocompleteOpen(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => {
      setIsAutocompleteOpen(false);
    }, 120);
  };

  const handleKeyDown = (field: keyof AddressFormValues) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isAutocompleteOpen || activeField !== field || suggestions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      applySuggestion(field, suggestions[highlightIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setIsAutocompleteOpen(false);
    }
  };

  const hasDropdown = isAutocompleteOpen && activeField !== null;

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
          <div className={styles.inputWrap}>
            <input
              id="origin"
              name="origin"
              className={styles.input}
              type="text"
              placeholder="Search pickup by building, mall, or station"
              value={values.origin}
              onChange={handleChange('origin')}
              onFocus={handleFocus('origin')}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown('origin')}
              aria-invalid={Boolean(errors.origin)}
              aria-describedby={errors.origin ? 'origin-error' : undefined}
              autoComplete="off"
              disabled={isSubmitting}
            />
            <button
              type="button"
              className={styles.swapIcon}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={swapRouteEnds}
              disabled={isSubmitting}
              aria-label="Swap origin and destination"
              title="Swap origin and destination"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3-3m-3 3 3 3" />
              </svg>
            </button>
            {hasDropdown && activeField === 'origin' ? (
              <div className={styles.dropdown} role="listbox" aria-label="Origin suggestions">
                {isSearching ? <p className={styles.dropdownHint}>Searching nearby places...</p> : null}
                {searchError ? <p className={styles.dropdownHint}>{searchError}</p> : null}
                {!isSearching && !searchError && suggestions.length === 0 ? (
                  <p className={styles.dropdownHint}>Type to search for locations...</p>
                ) : null}
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    className={styles.suggestion}
                    data-active={index === highlightIndex}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      applySuggestion('origin', suggestion);
                    }}
                  >
                    <span className={styles.suggestionTitle}>{suggestion.name}</span>
                    <span className={styles.suggestionSubtitle}>{suggestion.displayName}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <span id="origin-error" className={styles.error} hidden={!errors.origin}>
            {errors.origin}
          </span>
        </label>

        <label className={styles.field} htmlFor="destination">
          <span className={styles.label}>Destination</span>
          <div className={styles.inputWrap}>
            <input
              id="destination"
              name="destination"
              className={styles.input}
              type="text"
              placeholder="Search destination by landmark or street"
              value={values.destination}
              onChange={handleChange('destination')}
              onFocus={handleFocus('destination')}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown('destination')}
              aria-invalid={Boolean(errors.destination)}
              aria-describedby={errors.destination ? 'destination-error' : undefined}
              autoComplete="off"
              disabled={isSubmitting}
            />
            {hasDropdown && activeField === 'destination' ? (
              <div className={styles.dropdown} role="listbox" aria-label="Destination suggestions">
                {isSearching ? <p className={styles.dropdownHint}>Searching nearby places...</p> : null}
                {searchError ? <p className={styles.dropdownHint}>{searchError}</p> : null}
                {!isSearching && !searchError && suggestions.length === 0 ? (
                  <p className={styles.dropdownHint}>Type to search for locations...</p>
                ) : null}
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    className={styles.suggestion}
                    data-active={index === highlightIndex}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      applySuggestion('destination', suggestion);
                    }}
                  >
                    <span className={styles.suggestionTitle}>{suggestion.name}</span>
                    <span className={styles.suggestionSubtitle}>{suggestion.displayName}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
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
