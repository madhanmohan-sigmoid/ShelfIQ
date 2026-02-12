import { createTheme } from '@mui/material/styles';

const primaryColor = '#cccccc';

const theme = createTheme({
  typography: {
    fontFamily: [
      'Kenvue Sans',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  palette: {
    primary: {
      main: primaryColor,
    },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: primaryColor, 
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: primaryColor,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: primaryColor, 
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: primaryColor,
          '&.Mui-checked': {
            color: primaryColor,
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        popupIndicator: {
          color: primaryColor,
          '&:hover': {
            color: primaryColor,
          },
        },
      },
    },
   MuiSlider: {
    styleOverrides: {
      root: {
        color: '#05AF97',
      },
      thumb: {
        '&:hover, &.Mui-focusVisible, &.Mui-active': {
          boxShadow: '0 0 0 8px rgba(5, 175, 151, 0.16)',
        },
      },
      track: {
        backgroundColor: '#05AF97',
      },
      rail: {
        backgroundColor: '#cceee9',
      },
      mark: {
        backgroundColor: '#05AF97',
      },
      markLabel: {
        color: '#333',
      },
    },
  },
  },
});

export default theme;
