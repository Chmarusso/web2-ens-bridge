'use client';

import { STEPS } from '@/app/lib/constants';
import type { VerificationStep } from '@/app/lib/types';
import styles from '../page.module.css';

interface StepIndicatorProps {
  currentStep: VerificationStep;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
  const nextStep = STEPS[currentIndex + 1];
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  return (
    <div className={styles.stepper}>
      <div className={styles.stepperBar}>
        <div
          className={styles.stepperFill}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className={styles.stepperLabels}>
        <span className={styles.stepperCurrent}>
          {STEPS[currentIndex].label} ({currentIndex + 1}/{STEPS.length})
        </span>
        {nextStep && (
          <span className={styles.stepperNext}>
            Next: {nextStep.label}
          </span>
        )}
      </div>
    </div>
  );
}
