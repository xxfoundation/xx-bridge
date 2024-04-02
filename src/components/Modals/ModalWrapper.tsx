import { Modal, Stack, Typography } from '@mui/material'
import React from 'react'

interface ModalWrapperProps {
  title?: string
  children: React.ReactNode
  onClose: () => void
  open: boolean
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({
  title,
  children,
  onClose,
  open
}) => (
  <Modal
    open={open}
    onClose={onClose}
    aria-labelledby="modal-modal-title"
    aria-describedby="modal-modal-description"
  >
    <Stack sx={{ flexDirection: 'column' }}>
      {title && <Typography variant="h4">{title}</Typography>}
      {children}
    </Stack>
  </Modal>
)

export default ModalWrapper
