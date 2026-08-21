import React from 'react';
import './Stepper.css';

export default function Stepper({
  steps = [],
  currentStep = 1,
  onStepClick,
  className = ''
}) {
  return (
    <div className={`vq-stepper-container ${className}`}>
      <div className="vq-stepper-row">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isComplete = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;
          const isNotLast = index < steps.length - 1;

          return (
            <React.Fragment key={stepNumber}>
              <div
                className={`vq-step-indicator ${isActive ? 'is-active' : ''} ${isComplete ? 'is-complete' : ''}`}
                onClick={() => onStepClick && onStepClick(stepNumber)}
                role="button"
                tabIndex={0}
              >
                <div className="vq-step-circle">
                  {isComplete ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>
                <span className="vq-step-label">{step.label || `Step ${stepNumber}`}</span>
              </div>
              {isNotLast && (
                <div className={`vq-step-connector ${isComplete ? 'is-complete' : ''}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
