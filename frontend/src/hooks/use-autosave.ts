import { useEffect, useRef, useState } from 'react';

interface AutosaveOptions {
  data: any;
  onSave: (data: any) => Promise<void> | void;
  delay?: number;
  enabled?: boolean;
  maxRetries?: number;
}

export function useAutosave({ data, onSave, delay = 2000, enabled = true, maxRetries = 2 }: AutosaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<any>(data);
  const retryCountRef = useRef(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check if data has changed
    const hasChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);

    if (hasChanged) {
      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        setSaveError(null);

        let retryAttempt = 0;
        let lastError: Error | null = null;

        while (retryAttempt <= maxRetries) {
          try {
            await onSave(data);
            previousDataRef.current = JSON.parse(JSON.stringify(data));
            retryCountRef.current = 0;
            lastError = null;
            break;
          } catch (error) {
            lastError = error as Error;
            retryAttempt++;
            if (retryAttempt <= maxRetries) {
              // Exponential backoff: 1s, 2s, 4s
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryAttempt - 1)));
            }
          }
        }

        setIsSaving(false);
        if (lastError) {
          setSaveError(lastError.message || 'Autosave failed');
        }
      }, delay);
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, onSave, delay, enabled, maxRetries]);

  const saveNow = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsSaving(true);
    setSaveError(null);

    try {
      await onSave(data);
      previousDataRef.current = JSON.parse(JSON.stringify(data));
      retryCountRef.current = 0;
    } catch (error) {
      setSaveError((error as Error).message || 'Manual save failed');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveNow, isSaving, saveError };
}
