"use client";

import React, { useState, useEffect } from "react";
import DashboardDesktopView from '../../Components/Dashboard/DashboardDesktopView'
import DashboardMobileView from '../../Components/Dashboard/DashboardMobileView'

export default function Page() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window !== "undefined") {
      const checkScreenSize = () => {
        setIsMobile(window.innerWidth < 768);
      };

      // Initial check
      checkScreenSize();

      // Add event listener for window resize
      window.addEventListener("resize", checkScreenSize);

      // Cleanup
      return () => window.removeEventListener("resize", checkScreenSize);
    }
  }, []);

  // Render appropriate component based on screen size
  return isMobile ?  <DashboardMobileView/> : <DashboardDesktopView />;
}