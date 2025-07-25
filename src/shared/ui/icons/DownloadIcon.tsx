import React from "react";

import IconComponent, { type IconProps } from "./IconComponent";

const DownloadIcon: React.FC<IconProps> = (props): React.ReactNode => (
  <IconComponent size={30} viewBox="0 0 30 30" fill="none" {...props}>
    <path
      d="M19.6875 10.3125H22.0312C22.6529 10.3125 23.249 10.5594 23.6885 10.999C24.1281 11.4385 24.375 12.0346 24.375 12.6562V24.8438C24.375 25.4654 24.1281 26.0615 23.6885 26.501C23.249 26.9406 22.6529 27.1875 22.0312 27.1875H7.96875C7.34715 27.1875 6.75101 26.9406 6.31147 26.501C5.87193 26.0615 5.625 25.4654 5.625 24.8438V12.6562C5.625 12.0346 5.87193 11.4385 6.31147 10.999C6.75101 10.5594 7.34715 10.3125 7.96875 10.3125H10.3125"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.3125 15.9375L15 20.625L19.6875 15.9375M15 2.8125V19.6875"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconComponent>
);

export default DownloadIcon;
