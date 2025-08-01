import React from 'react'

import IconComponent, { type IconProps } from './IconComponent'

const BasketIcon: React.FC<IconProps> = (props): React.ReactNode => (
  <IconComponent size={24} viewBox="0 0 24 24" fill="none" {...props}>
    <g id="Icons">
      <path
        id="Vector"
        d="M4 7H20M10 11V17M14 11V17M5 7L6 19C6 19.5304 6.21071 20.0391 6.58579 20.4142C6.96086 20.7893 7.46957 21 8 21H16C16.5304 21 17.0391 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19L19 7M9 7V4C9 3.73478 9.10536 3.48043 9.29289 3.29289C9.48043 3.10536 9.73478 3 10 3H14C14.2652 3 14.5196 3.10536 14.7071 3.29289C14.8946 3.48043 15 3.73478 15 4V7"
        stroke="#66707F"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </IconComponent>
)

export default BasketIcon
