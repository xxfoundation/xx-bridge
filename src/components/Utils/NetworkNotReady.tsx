import { Box, Modal, Typography } from '@mui/material'

interface NetworkNotReadyProps {
  open: boolean
  handleClose: () => void
}

const NetworkNotReady: React.FC<NetworkNotReadyProps> = ({
  open,
  handleClose
}) => (
  <Modal
    open={open}
    onClose={handleClose}
    aria-labelledby="modal-network-not-ready"
    aria-describedby="modal-open-network-not-ready"
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        margin: '10px',
        bgcolor: 'background.paper',
        border: 'none',
        borderColor: 'primary.main',
        borderRadius: 6,
        boxShadow: 24,
        p: 4
      }}
    >
      <Typography
        variant="h6"
        sx={{
          textAlign: 'center',
          color: 'primary.main',
          marginBottom: '10px'
        }}
      >
        Can not send the message over cMixx, please try again shortly.
      </Typography>
    </Box>
  </Modal>
)

export default NetworkNotReady
