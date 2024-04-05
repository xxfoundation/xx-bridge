import * as React from 'react'
import { Box, Stepper, Step, StepLabel, Typography } from '@mui/material'
import Loading from '@/components/Utils/Loading'

export type CustomStep = {
  step: number
  message: string
}

interface CustomStepperProps {
  steps: CustomStep[]
  activeStep: number
  width?: string
  alignment?: string
  approve?: boolean
}

const CustomStepper: React.FC<CustomStepperProps> = ({
  steps,
  activeStep = 0,
  width = '100%',
  alignment = 'center'
  // approve = false
}) => {
  const isStepFailed = (step: number) => step === -1

  // Remove the first step if we don't need to approve
  // let i = 0
  // const newSteps = steps
  //   .map(step => {
  //     if (!approve && step.step === 1) {
  //       return undefined
  //     }
  //     return {
  //       step: i++,
  //       message: step.message
  //     }
  //   })
  //   .filter(step => step !== undefined) as CustomStep[]

  return (
    <Box sx={{ width, alignContent: alignment }}>
      <Stepper activeStep={activeStep} alternativeLabel>
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
