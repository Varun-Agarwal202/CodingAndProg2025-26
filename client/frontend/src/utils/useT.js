import { useAccessibility } from '../context/AccessibilityContext'
import { t } from './translations'

export function useT() {
  const { language } = useAccessibility()
  return (key, vars) => t(key, language, vars)
}

