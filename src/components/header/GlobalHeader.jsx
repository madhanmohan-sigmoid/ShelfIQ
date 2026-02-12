import LogoSection from "./components/LogoSection";
import UserSection from "./components/UserSection";
import { useHeaderData } from "./hooks/useHeaderData";
import {
  LayoutDashboard,
  SquareMenu,
  Package,
  ChartBar,
  LineChart,
  FileEdit,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useLayoutEffect } from "react";
import { useSelector } from "react-redux";
import { selectCategoryAccessType } from "../../redux/reducers/regionRetailerSlice";

// Tab color codes
const TAB_CONFIG = {
  "/dashboard": {
    color: "#FFB000",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  "/product-details": {
    color: "#FF6B6B",
    label: "Products",
    icon: Package,
  },
  "/scorecard": {
    color: "#3774B1",
    label: "Scorecard",
    icon: ChartBar,
  },
  "/analysis": {
    color: "#00B097",
    label: "Analysis",
    icon: LineChart,
  },
  "/my-planogram": {
    color: "#FF782C",
    label: "My Planogram",
    icon: SquareMenu,
  },
  "/mass-update": {
    color: "#BCD530",
    label: "Mass Update",
    icon: FileEdit,
  },
};

function GlobalHeader() {
  const { user } = useHeaderData();
  const location = useLocation();
  const categoryAccessType = useSelector(selectCategoryAccessType);
  const [hoveredTab, setHoveredTab] = useState(null);
  const navRef = useRef(null);
  const [underlineStyle, setUnderlineStyle] = useState({});

  const isActive = (path) => location.pathname.startsWith(path);

  const getActivePath = () => {
    const pathname = location.pathname;
    if (pathname.startsWith("/compare") || pathname.startsWith("/planogram")) {
      return "/dashboard";
    }
    return Object.keys(TAB_CONFIG).find((path) => isActive(path)) || hoveredTab;
  };

  const activePath = getActivePath();

  useLayoutEffect(() => {
    const updateUnderline = () => {
      if (!activePath || !navRef.current) {
        setUnderlineStyle({});
        return;
      }

      const navItems = Array.from(navRef.current.children);
      const activeIndex = Object.keys(TAB_CONFIG).indexOf(activePath);
      const activeNavItem = navItems[activeIndex];

      if (!activeNavItem) {
        setUnderlineStyle({});
        return;
      }

      const { left, width } = activeNavItem.getBoundingClientRect();
      const parentLeft = navRef.current.getBoundingClientRect().left;

      setUnderlineStyle({
        left: left - parentLeft,
        width,
        backgroundColor: TAB_CONFIG[activePath].color,
      });
    };

    updateUnderline();
    const rafId = window.requestAnimationFrame(updateUnderline);
    window.addEventListener("resize", updateUnderline);

    return () => {
      window.removeEventListener("resize", updateUnderline);
      window.cancelAnimationFrame(rafId);
    };
  }, [activePath]);

  return (
    <header className="px-6 py-4 flex items-center justify-between text-lg font-bold bg-white z-50 sticky top-0 w-full h-[70px] border-b-2 border-black">
      <div className="flex items-center gap-8">
        {/* Left: Logo and Navigation */}
        <LogoSection />

        {/* Center navigation */}
        {!isActive("/region") && (
          <div
            className="flex items-center gap-8 relative h-full"
            style={{ height: "100%" }}
          >
            {/* Navigation items */}
            <div ref={navRef} className="flex items-center gap-8">
              {Object.keys(TAB_CONFIG)
                .filter((path) => {
                  // Only show "My Planogram" and "Mass Update" tabs if categoryAccessType is "CONTRIBUTORS"
                  if (path === "/my-planogram" || path === "/mass-update") {
                    return categoryAccessType === "CONTRIBUTORS";
                  }
                  return true;
                })
                .map((path) => {
                  const cfg = TAB_CONFIG[path];
                  // Special handling for dashboard: also active on /compare and /planogram
                  const active =
                    path === "/dashboard"
                      ? isActive(path) ||
                        location.pathname.startsWith("/compare") ||
                        location.pathname.startsWith("/planogram")
                      : isActive(path);
                  const hovered = hoveredTab === path;
                  const color = active || hovered ? cfg.color : "#757575";

                  return (
                    <div
                      key={path}
                      className="flex flex-col items-center h-full justify-center relative"
                      style={{ height: "100%" }}
                    >
                      <Link
                        to={path}
                        className="flex flex-col items-center gap-y-1 cursor-pointer"
                        style={{
                          color,
                          transition: "color 0.2s cubic-bezier(0.4,0,0.2,1)",
                        }}
                        onMouseEnter={() => setHoveredTab(path)}
                        onMouseLeave={() => setHoveredTab(null)}
                        onFocus={() => setHoveredTab(path)}
                        onBlur={() => setHoveredTab(null)}
                      >
                        <cfg.icon
                          size={20}
                          color={color}
                          style={{
                            transition: "color 0.2s cubic-bezier(0.4,0,0.2,1)",
                          }}
                        />
                        <span
                          className="text-xs"
                          style={{
                            transition: "color 0.2s cubic-bezier(0.4,0,0.2,1)",
                          }}
                        >
                          {cfg.label}
                        </span>
                      </Link>
                    </div>
                  );
                })}
            </div>

            {/* Underline bar */}
            <div
              style={{
                position: "absolute",
                ...underlineStyle,
                bottom: -14,
                height: 4,
                borderRadius: 2,
                transition:
                  "left 0.2s cubic-bezier(0.4,0,0.2,1), width 0.2s cubic-bezier(0.4,0,0.2,1), background-color 0.2s",
                zIndex: 2,
              }}
            />
          </div>
        )}
      </div>

      {/* Right: User */}
      <div className="flex items-center gap-6 text-base font-medium">
        <UserSection user={user} />
      </div>
    </header>
  );
}

export default GlobalHeader;
