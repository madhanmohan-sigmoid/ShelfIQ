import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Outlet } from "react-router-dom";
import { GlobalHeader } from "../components/header";

// Define the sidebar width
const DRAWER_WIDTH = 240;

// Root container
const Root = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
}));

// Container for sidebar and main content
const ContentContainer = styled(Box)(() => ({
  display: "flex",
  flexGrow: 1,
  height: `calc(100vh - 70px)`, // Subtract header height (70px from GlobalHeader)
}));

// Main content wrapper that excludes the sidebar
const MainWrapper = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.palette.background.default,
}));



const MainLayout = () => {
  return (
    <Root>
      <GlobalHeader />
      <ContentContainer>
        <MainWrapper>
          <Outlet />
        </MainWrapper>
      </ContentContainer>
    </Root>
  );
};

export default MainLayout;
