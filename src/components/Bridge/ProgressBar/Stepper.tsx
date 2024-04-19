import * as React from 'react'
import { Box, Stepper, Step, StepLabel, Typography } from '@mui/material'
import Loading from '@/components/Utils/Loading'
import { CustomStep } from '@/plugins/redux/types'

interface CustomStepperProps {
  steps: CustomStep[]
  activeStep: number
  width?: string
  alignment?: string
}

const CustomStepper: React.FC<CustomStepperProps> = ({
  steps,
  activeStep = 0,
  width = '100%',
  alignment = 'center'
}) => {
  const isStepFailed = (step: number) => step === -1

  return (
    <Box sx={{ width, alignContent: alignment }}>
      <Stepper activeStep={activeStep - 1} alternativeLabel>
        {steps.map((step, index) => {
          const labelProps: {
            optional?: React.ReactNode
            error?: boolean
          } = {}
          if (isStepFailed(index)) {
            labelProps.optional = (
              <Typography variant="caption" color="error">
                Alert message
              </Typography>
            )
            labelProps.error = true
          }

          return (
            <Step key={step.message}>
              <StepLabel
                {...labelProps}
                StepIconProps={
                  step.step === activeStep
                    ? { icon: <Loading size="xs" /> }
                    : undefined
                }
              >
                {step.message}
              </StepLabel>
            </Step>
          )
        })}
      </Stepper>
    </Box>
  )
}

export default CustomStepper
