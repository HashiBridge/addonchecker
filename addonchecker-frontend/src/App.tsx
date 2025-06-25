import { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, FileText, AlertCircle, X, Pause, Play, Loader2 } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs'

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
  line_number?: number
  code_snippet?: string
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
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false)
  const [isLoadingFileContent, setIsLoadingFileContent] = useState(false)
  const [fileContentError, setFileContentError] = useState<string | null>(null)
  const codeViewerRef = useRef<HTMLDivElement>(null)

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  useEffect(() => {
    if (isCodeViewerOpen && selectedIssue && fileContent && !isLoadingFileContent && selectedIssue.line_number) {
      console.log('Auto-scroll effect triggered:', {
        isCodeViewerOpen,
        selectedIssue: selectedIssue?.title,
        hasFileContent: !!fileContent,
        isLoadingFileContent,
        lineNumber: selectedIssue.line_number
      })
      
      const timer = setTimeout(() => {
        const codeContainer = codeViewerRef.current
        console.log('Code container ref:', codeContainer)
        
        if (codeContainer) {
          const highlightedLine = codeContainer.querySelector(`[data-line-number="${selectedIssue.line_number}"]`)
          console.log('Found highlighted line:', highlightedLine, 'for line number:', selectedIssue.line_number)
          
          if (highlightedLine) {
            highlightedLine.scrollIntoView({ behavior: 'smooth', block: 'center' })
            console.log('Scrolled to highlighted line')
          } else {
            console.log('No element found with data-line-number:', selectedIssue.line_number)
          }
        }
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [isCodeViewerOpen, selectedIssue, fileContent, isLoadingFileContent])

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
  }

  const handleCloseAlert = (issueId: string) => {
    setScanResult(prev => prev ? {
      ...prev,
      issues: prev.issues.filter(issue => issue.id !== issueId)
    } : null)
  }

  const handleViewDetails = async (issue: Issue) => {
    if (!scanResult) return
    
    setIsLoadingFileContent(true)
    setFileContentError(null)
    
    try {
      const response = await fetch(`${API_BASE}/api/scan/${scanResult.scan_id}/file/${encodeURIComponent(issue.file)}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.status}`)
      }
      const fileData = await response.json()
      
      setSelectedIssue(issue)
      setFileContent(fileData.content)
      setIsCodeViewerOpen(true)
    } catch (error) {
      console.error('Failed to load file content:', error)
      setFileContentError('ファイル内容の取得に失敗しました。バックエンドサーバーが起動していることを確認してください。')
    } finally {
      setIsLoadingFileContent(false)
    }
  }





  const handleLineNumberClick = (lineNumber: number) => {
    console.log('Line number clicked:', lineNumber)
    const codeContainer = codeViewerRef.current
    console.log('Code container for line click:', codeContainer)
    
    if (codeContainer) {
      const targetLine = codeContainer.querySelector(`[data-line-number="${lineNumber}"]`)
      console.log('Target line found:', targetLine)
      
      if (targetLine) {
        targetLine.scrollIntoView({ behavior: 'smooth', block: 'center' })
        console.log('Scrolled to line:', lineNumber)
      }
    }
  }

  return (
    <div>
      <div>
        <h1>
          Browser Extension Security Checker
        </h1>

        {!uploadProgress && !scanResult && (
          <div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload />
              <h2>
                拡張機能ファイルをアップロード
              </h2>
              <p>
                ファイルをドラッグ&ドロップするか、下のボタンでファイルを選択してください
              </p>
              <p>
                対応形式: .crx, .xpi, .zip
              </p>
              <input
                type="file"
                accept=".crx,.xpi,.zip"
                onChange={handleFileSelect}
                id="file-input"
              />
              <label
                htmlFor="file-input"
              >
                <FileText />
                ファイルを選択
              </label>
            </div>
          </div>
        )}

        {uploadProgress && (
          <div>
            <div>
              <div>
                <h3>Uploading Files</h3>
                <div>
                  <button
                    onClick={handlePauseToggle}
                  >
                    {uploadProgress.isPaused ? (
                      <Play />
                    ) : (
                      <Pause />
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                  >
                    <X />
                  </button>
                </div>
              </div>
              
              <div>
                <p>
                  {uploadProgress.progress}% • {uploadProgress.filename}
                </p>
                <div>
                  <div
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
              </div>
              
              <p>
                {uploadProgress.status === 'uploading' && 'ファイルをアップロード中...'}
                {uploadProgress.status === 'processing' && 'セキュリティ解析中...'}
                {uploadProgress.status === 'error' && 'エラーが発生しました'}
              </p>
            </div>
          </div>
        )}

        {scanResult && (
          <div>
            <div>
              <h2>診断結果サマリー</h2>
              <div>
                <div>
                  <p>📁 ファイル名: {scanResult.filename}</p>
                  <p>📅 診断日時: {new Date(scanResult.timestamp).toLocaleString('ja-JP')}</p>
                  <p>📊 ファイルサイズ: {scanResult.file_size}</p>
                </div>
                <div>
                  <div>
                    <span>
                      🔴 Critical: {scanResult.summary.critical}件
                    </span>
                    <span>
                      🟠 High: {scanResult.summary.high}件
                    </span>
                    <span>
                      🟡 Medium: {scanResult.summary.medium}件
                    </span>
                    <span>
                      🔵 Low: {scanResult.summary.low}件
                    </span>
                  </div>
                  {scanResult.security_score !== undefined && (
                    <p>
                      📈 セキュリティスコア: {scanResult.security_score}/100
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              {scanResult.issues.map((issue, index) => (
                <div
                  key={`${issue.id}-${index}`}
                >
                  <div>
                    <div>
                      <span>{issue.title}</span>
                    </div>
                    <button
                      onClick={() => handleCloseAlert(`${issue.id}-${index}`)}
                    >
                      <X />
                    </button>
                  </div>
                  
                  <p>{issue.description}</p>
                  
                  {issue.file && (
                    <p>
                      ファイル: {issue.file}
                    </p>
                  )}
                  
                  {issue.recommendation && (
                    <div>
                      <strong>推奨事項:</strong> {issue.recommendation}
                    </div>
                  )}
                  
                  <div>
                    <button 
                      onClick={() => handleViewDetails(issue)}
                    >
                      詳細を見る
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <button
                onClick={() => {
                  setScanResult(null)
                }}
              >
                新しいファイルを診断
              </button>
            </div>
          </div>
        )}

        {isCodeViewerOpen && selectedIssue && (
          <div>
            <div>
              <div>
                <div>
                  <h3>{selectedIssue.file}</h3>
                  <p>{selectedIssue.title}</p>
                </div>
                <button
                  onClick={() => {
                    setIsCodeViewerOpen(false)
                    setFileContentError(null)
                  }}
                >
                  <X />
                </button>
              </div>
              <div>
                {isLoadingFileContent && (
                  <div>
                    <div>
                      <Loader2 />
                      <span>ファイル内容を読み込み中...</span>
                    </div>
                  </div>
                )}
                
                {fileContentError && (
                  <div>
                    <div>
                      <div>{fileContentError}</div>
                    </div>
                  </div>
                )}
                
                {!isLoadingFileContent && !fileContentError && fileContent && (
                  <div ref={codeViewerRef}>
                    <SyntaxHighlighter
                      language={selectedIssue.file.endsWith('.js') ? 'javascript' : 'json'}
                      style={github}
                      showLineNumbers={true}
                      wrapLines={true}
                      lineProps={(lineNumber) => ({
                        'data-line-number': lineNumber,
                        style: {
                          backgroundColor: lineNumber === selectedIssue.line_number ? '#fff5f5' : 'transparent',
                          borderLeft: lineNumber === selectedIssue.line_number ? '3px solid #ef4444' : 'none',
                          paddingLeft: lineNumber === selectedIssue.line_number ? '8px' : '11px',
                          cursor: 'default'
                        },
                        onClick: () => handleLineNumberClick(lineNumber)
                      })}
                    >
                      {fileContent}
                    </SyntaxHighlighter>
                  </div>
                )}
              </div>
              <div>
                <div>
                  <AlertCircle />
                  <div>
                    <p>{selectedIssue.description}</p>
                    <p>
                      <strong>推奨事項:</strong> {selectedIssue.recommendation}
                    </p>
                    {selectedIssue.line_number && (
                      <p>
                        行 {selectedIssue.line_number}: {selectedIssue.code_snippet}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
