import React from 'react';
import PropTypes from 'prop-types';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button,
  Typography
} from '@mui/material';
import { Plus } from 'lucide-react';

const SubmitConfirmationModal = ({ 
  open, 
  onClose, 
  onConfirm,
  planogramName = "this planogram"
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="submit-confirmation-dialog-title"
      aria-describedby="submit-confirmation-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: 6,
          fontFamily: 'Kenvue Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          '& *': {
            fontFamily: 'Kenvue Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }
        }
      }}
    >
      <DialogTitle 
        id="submit-confirmation-dialog-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          color: '#FF782C',
          fontWeight: 600,
          fontSize: '1.25rem',
          pb: 2
        }}
      >
        <Plus size={24} />
        Submit Planogram
      </DialogTitle>
      
      <DialogContent>
        <DialogContentText 
          id="submit-confirmation-dialog-description"
          sx={{ 
            textAlign: 'left',
            color: '#374151',
            fontSize: '1rem',
            lineHeight: 1.5
          }}
        >
          Are you sure you want to submit <Typography component="span" sx={{ fontWeight: 600, color: '#FF782C' }}>
            {planogramName}
          </Typography> for publication?
          <br /><br />
          This will publish your planogram and make it available for review. This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: '#000000',
            color: '#000000',
            fontWeight: 600,
            fontSize: '0.75rem',
            px: 2,
            py: 1,
            borderRadius: '50px',
            minWidth: 'auto',
            '&:hover': {
              borderColor: '#000000',
              backgroundColor: '#f0f0f0',
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm}
          variant="outlined"
          autoFocus
          startIcon={<Plus size={16} />}
          sx={{
            borderColor: '#FF782C',
            color: '#FF782C',
            fontWeight: 600,
            fontSize: '0.75rem',
            px: 2,
            py: 1,
            borderRadius: '50px',
            minWidth: 'auto',
            '&:hover': {
              borderColor: '#FF782C',
              backgroundColor: 'rgba(255, 120, 44, 0.04)',
            }
          }}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubmitConfirmationModal;

SubmitConfirmationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  planogramName: PropTypes.string,
};
