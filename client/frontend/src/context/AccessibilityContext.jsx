import React, { createContext, useContext, useEffect, useState } from 'react'

const AccessibilityContext = createContext()

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

export const AccessibilityProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('accessibility-language') || 'en'
  })
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('accessibility-fontSize') || 'medium'
  })
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('accessibility-highContrast') === 'true'
  })
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    return localStorage.getItem('accessibility-ttsEnabled') === 'true'
  })
  const [speechRate, setSpeechRate] = useState(() => {
    const stored = localStorage.getItem('accessibility-speechRate')
    const num = stored ? parseFloat(stored) : 1.0
    return Number.isFinite(num) ? num : 1.0
  })

  useEffect(() => {
    localStorage.setItem('accessibility-language', language)
    document.documentElement.setAttribute('lang', language)
  }, [language])

  useEffect(() => {
    localStorage.setItem('accessibility-fontSize', fontSize)
    document.documentElement.setAttribute('data-font-size', fontSize)
  }, [fontSize])

  useEffect(() => {
    localStorage.setItem('accessibility-highContrast', highContrast.toString())
    if (highContrast) document.documentElement.classList.add('high-contrast')
    else document.documentElement.classList.remove('high-contrast')
  }, [highContrast])

  useEffect(() => {
    localStorage.setItem('accessibility-ttsEnabled', ttsEnabled.toString())
  }, [ttsEnabled])

  useEffect(() => {
    localStorage.setItem('accessibility-speechRate', speechRate.toString())
  }, [speechRate])

  const speak = (text, options = {}) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options.rate || speechRate
    utterance.pitch = options.pitch || 1.0
    utterance.volume = options.volume || 1.0
    const langMap = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', zh: 'zh-CN', hi: 'hi-IN', ar: 'ar-SA', pt: 'pt-BR', ja: 'ja-JP', ru: 'ru-RU', it: 'it-IT', ko: 'ko-KR', nl: 'nl-NL' }
    utterance.lang = langMap[language] || 'en-US'

    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }

  const value = {
    language,
    setLanguage,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    ttsEnabled,
    setTtsEnabled,
    speechRate,
    setSpeechRate,
    speak,
    stopSpeaking,
  }

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>
}

