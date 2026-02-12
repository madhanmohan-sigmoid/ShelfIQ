import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Popover,
  Avatar,
  Typography,
  Box,
  Divider,
  IconButton,
  Paper
} from "@mui/material";
import { Logout as LogoutIcon, Email as EmailIcon, Person as PersonIcon } from "@mui/icons-material";
import { logout } from "../../../redux/reducers/authSlice";
import { stringToInitials, formatUserName } from "../utils/stringUtils";
import ContextSection from "../components/ContextSection";
import {
  selectSelectedRegion,
  selectSelectedRetailer,
  selectSelectedCategory,
} from "../../../redux/reducers/regionRetailerSlice";
import { useMsal } from "@azure/msal-react";
import { getUserProfileImage, logoutUser } from "../../../api/api";

function UserSection() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { instance, accounts } = useMsal();
  const user = useSelector((state) => state.auth.user);
  const selectedRegion = useSelector(selectSelectedRegion);
  const selectedRetailer = useSelector(selectSelectedRetailer);
  const selectedCategory = useSelector(selectSelectedCategory);

  const userInfo = user || { name: "User", email: "user@kenvue.com" };
  const displayName = formatUserName(userInfo.name);
  const initials = stringToInitials(displayName);

  const [anchorEl, setAnchorEl] = useState(null);
  const [userImage, setUserImage] = useState(null);


  // Fetch Microsoft 365 profile image
  useEffect(() => {
    const fetchUserImage = async () => {
      try {
        const response = await getUserProfileImage();
        const blob = new Blob([response.data], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setUserImage(url);
      } catch (err) {
        console.error("Error fetching user image:", err);
        setUserImage(null);
      }
    };

    fetchUserImage();
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const handleSignOut = () => {
    instance.logoutRedirect({
      account: accounts[0],
      postLogoutRedirectUri: "/",
    });
    localStorage.clear();
    logoutUser()
    dispatch(logout());
    navigate("/");
  };


  return (
    <div className="flex items-center gap-4 relative">
      {/* Context section */}
      <ContextSection
        selectedRegion={selectedRegion}
        selectedRetailer={selectedRetailer?.name}
        category={selectedCategory?.name}
        clickable={true}
      />

      {/* Avatar - clickable */}
      <IconButton
        onClick={handleClick}
        sx={{
          padding: 0,
          '&:hover': {
            backgroundColor: 'transparent',
          }
        }}
      >
        <Avatar
          src={userImage}
          alt={displayName}
          sx={{
            width: 40,
            height: 40,
            bgcolor: '#000',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }
          }}
        >
          {initials}
        </Avatar>
      </IconButton>

      {/* Modern Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          mt: 1.5,
          '& .MuiPaper-root': {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            minWidth: 280,
            overflow: 'visible',
          }
        }}
      >
        <Box sx={{ p: 2.5 }}>
          {/* User Info Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              src={userImage}
              alt={displayName}
              sx={{
                width: 56,
                height: 56,
                bgcolor: '#000',
                fontSize: '1.25rem',
                fontWeight: 600,
              }}
            >
              {initials}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: '#000',
                  lineHeight: 1.3,
                  mb: 0.5,
                }}
              >
                {displayName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EmailIcon sx={{ fontSize: 14, color: '#757575' }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: '#757575',
                    fontSize: '0.813rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {userInfo.email}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Logout Button */}
          <Box
            onClick={handleSignOut}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 1.5,
              py: 1.25,
              borderRadius: 1.5,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: '#000',
                '& .logout-text': {
                  color: '#fff',
                },
                '& .MuiSvgIcon-root': {
                  color: '#fff',
                }
              }
            }}
          >
            <LogoutIcon sx={{ fontSize: 20, color: '#757575', transition: 'color 0.2s' }} />
            <Typography
              className="logout-text"
              sx={{
                fontSize: '0.938rem',
                fontWeight: 500,
                color: '#000',
                transition: 'color 0.2s',
              }}
            >
              Logout
            </Typography>
          </Box>
        </Box>
      </Popover>
    </div>
  );
}

export default UserSection;