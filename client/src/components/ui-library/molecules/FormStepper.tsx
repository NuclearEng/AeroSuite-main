import React from 'react';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

export interface FormStep {
  label: string;
  content: React.ReactNode;
}

export interface FormStepperProps {
  steps: FormStep[];
  activeStep: number;
  onStepChange: (step: number) => void;
  onNext: () => void;
  onBack: () => void;
  isLastStep?: boolean;
  isFirstStep?: boolean;
  nextLabel?: string;
  backLabel?: string;
}

const FormStepper: React.FC<FormStepperProps> = ({
  steps,
  activeStep,
  onStepChange,
  onNext,
  onBack,
  isLastStep = false,
  isFirstStep = false,
  nextLabel = 'Next',
  backLabel = 'Back',
}) => {
  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {steps.map((step, idx: any) => (
          <Step key={step.label} onClick={() => onStepChange(idx)}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Box sx={{ mb: 3 }}>{steps[activeStep]?.content}</Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={onBack} disabled={isFirstStep}>{backLabel}</Button>
        <Button onClick={onNext} variant="contained" color="primary" disabled={isLastStep}>{nextLabel}</Button>
      </Box>
    </Box>
  );
};

export default FormStepper; 