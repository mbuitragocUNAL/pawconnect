import type { SVGProps } from "react"
import { cn } from "cn"

/*
 * PawConnect's own icon set: 24px grid, 1.75 stroke, round caps.
 * Same drawings as the design language page and the canvas.
 */
const paths = {
  paw: (
    <>
      <circle cx="7" cy="8.5" r="1.8" />
      <circle cx="17" cy="8.5" r="1.8" />
      <circle cx="4.6" cy="13.2" r="1.5" />
      <circle cx="19.4" cy="13.2" r="1.5" />
      <path d="M12 11.2c-2.9 0-5.2 2.9-5.2 5 0 1.9 1.5 3.1 3.2 2.5a6 6 0 0 1 4 0c1.7.6 3.2-.6 3.2-2.5 0-2.1-2.3-5-5.2-5Z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  zone: (
    <>
      <circle cx="12" cy="12" r="8.5" strokeDasharray="2.4 2.6" />
      <circle cx="12" cy="12" r="2.2" />
    </>
  ),
  check: <path d="m5 12.5 4.2 4.2L19 7" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  chev: <path d="m9 6 6 6-6 6" />,
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  bell: <path d="M18 9.5a6 6 0 0 0-12 0c0 6.5-2.5 7.5-2.5 7.5h17S18 16 18 9.5ZM10 20.5h4" />,
  home: <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1Z" />,
  list: <path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />,
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.4-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.6 12 20 12 20Z" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.2M12 16.3h.01" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  seal: (
    <>
      <path d="M12 2.8l2.2 1.6 2.7-.2.9 2.6 2.3 1.4-.6 2.7 1.1 2.5-2 1.9-.3 2.7-2.7.6-1.7 2.1-2.6-1-2.6 1-1.7-2.1-2.7-.6-.3-2.7-2-1.9 1.1-2.5-.6-2.7 2.3-1.4.9-2.6 2.7.2Z" />
      <path d="m8.8 12.2 2.2 2.2 4.3-4.4" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v17H6.5A2.5 2.5 0 0 0 4 22.5Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v17h5.5a2.5 2.5 0 0 1 2.5 2.5Z" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="3.5" />
      <path d="m10.5 12.5 8-8M16 7l2.5 2.5M14 9l1.8 1.8" />
    </>
  ),
  eye: (
    <>
      <path d="M2.8 12S6 5.8 12 5.8 21.2 12 21.2 12 18 18.2 12 18.2 2.8 12 2.8 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  upload: <path d="M12 16V4.5M7 9.5l5-5 5 5M4.5 15v3.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V15" />,
  dots: <path d="M5.5 12h.01M12 12h.01M18.5 12h.01" strokeWidth={3} />,
} as const

export type IconName = keyof typeof paths
export const iconNames = Object.keys(paths) as IconName[]

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName
  /** Accessible name. Without it the icon is decorative (aria-hidden). */
  label?: string
}

export function Icon({ name, label, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5 shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
