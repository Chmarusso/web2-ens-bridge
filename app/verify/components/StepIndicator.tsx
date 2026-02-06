'use client';

import { STEPS } from '@/app/lib/constants';
import type { VerificationStep } from '@/app/lib/types';
import styles from '../page.module.css';

interface StepIndicatorProps {
  currentStep: VerificationStep;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div>
      <div className={styles.stepLabels}>
        {STEPS.map((s, i) => (
          <span
            key={s.key}
            className={`${styles.stepLabel} ${i === currentIndex ? styles.active : ''} ${i < currentIndex ? styles.done : ''}`}
          >
            {s.label}
          </span>
        ))}
      </div>
      <div className={styles.steps}>
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`${styles.stepDot} ${i === currentIndex ? styles.active : ''} ${i < currentIndex ? styles.done : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
