import { useState, useCallback } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, Info, X, Pause, Play } from 'lucide-react'
import './App.css'

interface ScanResult {
  scan_id: string
  filename: string
  file_size: string
  status: string
  progress: number
  timestamp: string
  issues: Issue[]
  summary: {
    total_issues: number
    critical: number
    high: number
    medium: number
    low: number
    info: number
    success: number
  }
  security_score?: number
}

interface Issue {
  id: string
  severity: string
  title: string
  description: string
  category: string
  file: string
  recommendation: string
}

interface UploadProgress {
  filename: string
  progress: number
  status: string
  isPaused: boolean
}

function App() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [currentScanId, setCurrentScanId] = useState<string | null>(null)

  const API_BASE = 'http://localhost:8000'

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [])

  const handleFileUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    setUploadProgress({
      filename: file.name,
      progress: 0,
      status: 'uploading',
      isPaused: false
    })

    try {
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      setCurrentScanId(result.scan_id)
      
      setUploadProgress(prev => prev ? { ...prev, progress: 100, status: 'processing' } : null)
      
      pollProgress(result.scan_id)
    } catch (error) {
      console.error('Upload error:', error)
      setUploadProgress(prev => prev ? { ...prev, status: 'error' } : null)
    }
  }

  const pollProgress = async (scanId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/api/scan/${scanId}/progress`)
        const progress = await response.json()
        
        setUploadProgress(prev => prev ? {
          ...prev,
          progress: progress.progress,
          status: progress.status
        } : null)

        if (progress.status === 'completed' || progress.status === 'error') {
          clearInterval(pollInterval)
          
          if (progress.status === 'completed') {
            const resultResponse = await fetch(`${API_BASE}/api/scan/${scanId}`)
            const scanResult = await resultResponse.json()
            setScanResult(scanResult)
            setUploadProgress(null)
          }
        }
      } catch (error) {
        console.error('Progress polling error:', error)
        clearInterval(pollInterval)
      }
    }, 1000)
  }

  const handlePauseToggle = () => {
    setUploadProgress(prev => prev ? { ...prev, isPaused: !prev.isPaused } : null)
  }

  const handleCancel = () => {
    setUploadProgress(null)
    setScanResult(null)
    setCurrentScanId(null)
  }

  const handleCloseAlert = (issueId: string) => {
    setScanResult(prev => prev ? {
      ...prev,
      issues: prev.issues.filter(issue => issue.id !== issueId)
    } : null)
  }

  const getAlertColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'info':
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getAlertIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return <X className="w-5 h-5 text-red-600" />
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'info':
      case 'low':
        return <Info className="w-5 h-5 text-blue-600" />
      default:
        return <Info className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Browser Extension Security Checker
        </h1>

        {!uploadProgress && !scanResult && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2 text-gray-700">
                拡張機能ファイルをアップロード
              </h2>
              <p className="text-gray-500 mb-4">
                ファイルをドラッグ&ドロップするか、下のボタンでファイルを選択してください
              </p>
              <p className="text-sm text-gray-400 mb-6">
                対応形式: .crx, .xpi, .zip
              </p>
              <input
                type="file"
                accept=".crx,.xpi,.zip"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <FileText className="w-5 h-5 mr-2" />
                ファイルを選択
              </label>
            </div>
          </div>
        )}

        {uploadProgress && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Uploading Files</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePauseToggle}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {uploadProgress.isPaused ? (
                      <Play className="w-5 h-5 text-gray-600" />
                    ) : (
                      <Pause className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {uploadProgress.progress}% • {uploadProgress.filename}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
              </div>
              
              <p className="text-xs text-gray-500">
                {uploadProgress.status === 'uploading' && 'ファイルをアップロード中...'}
                {uploadProgress.status === 'processing' && 'セキュリティ解析中...'}
                {uploadProgress.status === 'error' && 'エラーが発生しました'}
              </p>
            </div>
          </div>
        )}

        {scanResult && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">診断結果サマリー</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">📁 ファイル名: {scanResult.filename}</p>
                  <p className="text-sm text-gray-600">📅 診断日時: {new Date(scanResult.timestamp).toLocaleString('ja-JP')}</p>
                  <p className="text-sm text-gray-600">📊 ファイルサイズ: {scanResult.file_size}</p>
                </div>
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                      🔴 Critical: {scanResult.summary.critical}件
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                      🟠 High: {scanResult.summary.high}件
                    </span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                      🟡 Medium: {scanResult.summary.medium}件
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      🔵 Low: {scanResult.summary.low}件
                    </span>
                  </div>
                  {scanResult.security_score !== undefined && (
                    <p className="text-sm text-gray-600">
                      📈 セキュリティスコア: {scanResult.security_score}/100
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {scanResult.issues.map((issue, index) => (
                <div
                  key={`${issue.id}-${index}`}
                  className={`border rounded-lg p-4 ${getAlertColor(issue.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getAlertIcon(issue.severity)}
                      <span className="font-medium">{issue.title}</span>
                    </div>
                    <button
                      onClick={() => handleCloseAlert(`${issue.id}-${index}`)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-sm mb-2">{issue.description}</p>
                  
                  {issue.file && (
                    <p className="text-xs text-gray-600 mb-2">
                      ファイル: {issue.file}
                    </p>
                  )}
                  
                  {issue.recommendation && (
                    <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-xs">
                      <strong>推奨事項:</strong> {issue.recommendation}
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                      詳細を見る
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setScanResult(null)
                  setCurrentScanId(null)
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                新しいファイルを診断
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
