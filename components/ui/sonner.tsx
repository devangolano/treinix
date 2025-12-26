'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': '#1e3a8a',
          '--normal-text': '#dbeafe',
          '--normal-border': '#1e40af',
          '--success-bg': '#065f46',
          '--success-text': '#d1fae5',
          '--success-border': '#059669',
          '--error-bg': '#7f1d1d',
          '--error-text': '#fee2e2',
          '--error-border': '#dc2626',
          '--warning-bg': '#78350f',
          '--warning-text': '#fef3c7',
          '--warning-border': '#f59e0b',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
