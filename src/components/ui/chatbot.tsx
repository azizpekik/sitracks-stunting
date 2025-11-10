'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  Maximize2,
  Bot,
  User,
  Loader2,
  Sparkles,
  FileText
} from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

interface ChatBotProps {
  jobId: string
  jobName: string
  reportContent: string
  isOpen: boolean
  onToggle: () => void
  size?: 'normal' | 'wide'
  onSizeChange?: (size: 'normal' | 'wide') => void
}

export default function ChatBot({ jobId, jobName, reportContent, isOpen, onToggle, size = 'normal', onSizeChange }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: `Halo! Saya bisa membantu Anda menemukan informasi spesifik dari data analisis "${jobName}".

Data apa yang ingin Anda ketahui? Contoh:
- Jumlah anak dengan masalah tertentu
- Anak yang perlu perhatian khusus
- Data pertumbuhan per bulan

Apa yang Anda cari?`,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, isMinimized])

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const generateResponse = async (userMessage: string): Promise<string> => {
    try {
      // Get Gemini API key from environment or localStorage
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || localStorage.getItem('gemini_api_key')

      if (!apiKey) {
        return "⚠️ API Key Gemini belum dikonfigurasi. Silakan tambahkan NEXT_PUBLIC_GEMINI_API_KEY di environment variables atau set 'gemini_api_key' di localStorage."
      }

      // Build conversation history for context (last 10 messages to avoid token limit)
      const conversationHistory = messages
        .slice(-10) // Take last 10 messages for context
        .map(msg => `${msg.type === 'user' ? 'User' : 'AI'}: ${msg.content}`)
        .join('\n')

      const contextPrompt = `
Anda adalah asisten AI yang membantu user menganalisis data pertumbuhan anak.

Data Analisis yang Tersedia:
${reportContent}

Riwayat Percakapan Sebelumnya:
${conversationHistory}

Peran Anda:
- Membantu user menemukan informasi data yang spesifik
- Menjawab pertanyaan tentang data dengan ringkas dan jelas
- Ingat percakapan sebelumnya untuk memberikan konteks yang berkelanjutan
- Bertanya kembali jika user tidak spesifik dalam permintaannya

Aturan Penting:
1. JANGAN pernah memberikan rekomendasi medis atau saran kesehatan
2. HANYA berikan informasi data yang ada di laporan
3. JANGAN mengeluarkan semua data sekaligus, hanya yang relevan
4. Jika permintaan tidak jelas, TANYA klarifikasi
5. Berikan jawaban yang singkat dan to-the-point
6. Fokus pada fakta data, bukan opini atau rekomendasi
7. JANGAN gunakan formatting bold (**), gunakan teks biasa saja
8. Ingat pertanyaan dan jawaban sebelumnya untuk konteks percakapan

Contoh pendekatan yang benar:
- User: "Bagaimana data anak-anak?"
- AI: "Data anak-anak spesifik yang ingin Anda ketahui apa? Contoh: jumlah anak bermasalah, anak dengan berat badan terendah, dll."
- User: "Ada anak bermasalah?"
- AI: "Berdasarkan data, ada X anak yang teridentifikasi memiliki masalah pertumbuhan. Ingin tahu detail anak mana saja?"

Pertanyaan user terbaru: "${userMessage}"

Berikan jawaban yang FOKUS pada data dan SINGKAT. Jika perlu, tanya balik untuk klarifikasi. JANGAN gunakan formatting bold (**). Gunakan konteks percakapan sebelumnya jika relevan.
      `

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: contextPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        let responseText = data.candidates[0].content.parts[0].text

        // Remove bold formatting (**text**) and clean up the response
        responseText = responseText.replace(/\*\*(.*?)\*\*/g, '$1')
        responseText = responseText.replace(/\*(.*?)\*/g, '$1')

        return responseText.trim()
      } else {
        throw new Error('Invalid response format from Gemini API')
      }

    } catch (error: any) {
      console.error('Gemini API Error:', error)

      if (error.message?.includes('API key')) {
        return "❌ API Key Gemini tidak valid. Silakan periksa konfigurasi API key Anda."
      } else if (error.message?.includes('quota')) {
        return "⚠️ Kuota API Gemini terlampaui. Silakan coba lagi nanti atau gunakan API key lain."
      } else if (error.message?.includes('network')) {
        return "🔴 Terjadi kesalahan koneksi. Silakan periksa internet Anda dan coba lagi."
      } else {
        return `❌ Terjadi kesalahan: ${error.message || 'Error tidak diketahui'}`
      }
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const botResponse = await generateResponse(inputValue)

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      }

      setTimeout(() => {
        setMessages(prev => [...prev, botMessage])
        setIsTyping(false)
        // Refocus input after bot responds
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      }, 1000)

    } catch (error) {
      setTimeout(() => {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: "Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi.",
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
        setIsTyping(false)
        // Refocus input after error
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      }, 1000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        size="sm"
        variant="outline"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white border-blue-700 z-50"
        title="AI Assistant - Analisis Data"
      >
        <MessageCircle className="h-6 w-6" />
        <Sparkles className="h-3 w-3 absolute top-1 right-1" />
      </Button>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      size === 'wide' ? 'w-[80vw] max-w-[80vw]' : 'w-96 max-w-[90vw]'
    }`}>
      <Card className="shadow-2xl border bg-white">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className="h-6 w-6" />
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">AI Assistant</CardTitle>
                <p className="text-xs text-blue-100">Analisis Data: {jobName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onSizeChange && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSizeChange(size === 'normal' ? 'wide' : 'normal')}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                  title={size === 'normal' ? 'Perlebar' : 'Perkecil'}
                >
                  {size === 'normal' ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggle}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-none text-xs">
            <FileText className="h-3 w-3 mr-1" />
            Context: Laporan Analisis {jobId.substring(0, 8)}...
          </Badge>
        </CardHeader>

        {/* Chat Content */}
        {!isMinimized && (
          <CardContent className="p-0">
            <div className="h-[500px] flex flex-col">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.type === 'bot' && (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}

                      <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white ml-auto'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 px-1 ${
                          message.type === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          {formatTimestamp(message.timestamp)}
                        </p>
                      </div>

                      {message.type === 'user' && (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-gray-100 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                          <span className="text-sm text-gray-600">Sedang berpikir...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t bg-gray-50 p-4">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Cari data spesifik (contoh: anak stunting, berat badan terendah)..."
                    className="flex-1 border-gray-300 focus:border-blue-500"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  💡 Contoh pertanyaan: "Ada berapa anak stunting?", "Siapa yang berat badannya terendah?", "Data bulan Februari"
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}