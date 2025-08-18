import { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, FileText, AlertCircle, X, Pause, Play, Loader2 } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import JSZip from 'jszip'
import { SecurityAnalyzer, SecurityIssue } from './SecurityAnalyzer'

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
  file_contents: Record<string, string>
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

  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false)
  const [isLoadingFileContent, setIsLoadingFileContent] = useState(false)
  const [fileContentError, setFileContentError] = useState<string | null>(null)
  const codeViewerRef = useRef<HTMLDivElement>(null)


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
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
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
    const allowedExtensions = ['.crx', '.xpi', '.zip'];
    const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(fileExt)) {
      alert('サポートされていないファイル形式です');
      return;
    }

    const scanId = `scan_${Date.now()}`;
    
    setUploadProgress({
      filename: file.name,
      progress: 0,
      status: 'uploading',
      isPaused: false
    });

    try {
      setUploadProgress(prev => prev ? { ...prev, progress: 25, status: 'processing' } : null);
      
      const arrayBuffer = await file.arrayBuffer();
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(arrayBuffer);
      
      setUploadProgress(prev => prev ? { ...prev, progress: 50 } : null);
      
      const analyzer = new SecurityAnalyzer();
      const issues: SecurityIssue[] = [];
      const fileContents: Record<string, string> = {};
      
      if (zipContent.files['manifest.json']) {
        const manifestContent = await zipContent.files['manifest.json'].async('text');
        fileContents['manifest.json'] = manifestContent;
        issues.push(...analyzer.analyzeManifest(manifestContent));
      }
      
      setUploadProgress(prev => prev ? { ...prev, progress: 75 } : null);
      
      const jsFiles = Object.keys(zipContent.files).filter(name => name.endsWith('.js')).slice(0, 5);
      for (const jsFile of jsFiles) {
        try {
          const jsContent = await zipContent.files[jsFile].async('text');
          fileContents[jsFile] = jsContent;
          issues.push(...analyzer.analyzeJavaScript(jsContent, jsFile));
        } catch (error) {
          console.warn(`Failed to read ${jsFile}:`, error);
        }
      }
      
      const summary = {
        total_issues: issues.length,
        critical: issues.filter(i => i.severity.toLowerCase() === 'critical').length,
        high: issues.filter(i => i.severity.toLowerCase() === 'high').length,
        medium: issues.filter(i => i.severity.toLowerCase() === 'medium').length,
        low: issues.filter(i => i.severity.toLowerCase() === 'low').length,
        info: issues.filter(i => i.severity.toLowerCase() === 'info').length,
        success: issues.filter(i => i.severity.toLowerCase() === 'success').length
      };
      
      const securityScore = Math.max(0, 100 - (summary.critical * 25 + summary.high * 15 + summary.medium * 10 + summary.low * 5));
      
      setUploadProgress(prev => prev ? { ...prev, progress: 100 } : null);
      
      const scanResult = {
        scan_id: scanId,
        filename: file.name,
        file_size: `${Math.round(file.size / 1024)}KB`,
        status: 'completed',
        progress: 100,
        timestamp: new Date().toISOString(),
        issues,
        summary,
        security_score: securityScore,
        file_contents: fileContents
      };
      
      setScanResult(scanResult);
      setUploadProgress(null);
      
    } catch (error) {
      console.error('File processing error:', error);
      setUploadProgress(prev => prev ? { ...prev, status: 'error' } : null);
    }
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
      const fileContent = scanResult.file_contents[issue.file];
      if (!fileContent) {
        throw new Error('File content not found');
      }
      
      setSelectedIssue(issue)
      setFileContent(fileContent)
      setIsCodeViewerOpen(true)
    } catch (error) {
      console.error('Failed to load file content:', error)
      setFileContentError('ファイル内容の取得に失敗しました。')
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            Browser Extension Security Checker
          </h1>
          <p className="text-gray-600">
            ブラウザ拡張機能のセキュリティ診断ツール
          </p>
        </div>

        {!uploadProgress && !scanResult && (
          <Card className="border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors">
            <CardContent className="p-8">
              <div
                className="text-center cursor-pointer"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <CardTitle className="text-xl text-blue-900 mb-2">
                  拡張機能ファイルをアップロード
                </CardTitle>
                <CardDescription className="mb-4">
                  ファイルをドラッグ&ドロップするか、下のボタンでファイルを選択してください
                </CardDescription>
                <CardDescription className="mb-6">
                  対応形式: .crx, .xpi, .zip
                </CardDescription>
                <input
                  type="file"
                  accept=".crx,.xpi,.zip"
                  onChange={handleFileSelect}
                  id="file-input"
                  className="hidden"
                />
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <label htmlFor="file-input" className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    ファイルを選択
                  </label>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {uploadProgress && (
          <Card className="border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-blue-900">Uploading Files</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePauseToggle}
                  >
                    {uploadProgress.isPaused ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <Pause className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {uploadProgress.progress}% • {uploadProgress.filename}
                  </p>
                  <Progress value={uploadProgress.progress} className="h-2" />
                </div>
                <p className="text-sm text-blue-600">
                  {uploadProgress.status === 'uploading' && 'ファイルをアップロード中...'}
                  {uploadProgress.status === 'processing' && 'セキュリティ解析中...'}
                  {uploadProgress.status === 'error' && 'エラーが発生しました'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {scanResult && (
          <div className="space-y-6">
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">診断結果サマリー</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="flex items-center text-sm">
                      <span className="font-medium mr-2">📁 ファイル名:</span>
                      {scanResult.filename}
                    </p>
                    <p className="flex items-center text-sm">
                      <span className="font-medium mr-2">📅 診断日時:</span>
                      {new Date(scanResult.timestamp).toLocaleString('ja-JP')}
                    </p>
                    <p className="flex items-center text-sm">
                      <span className="font-medium mr-2">📊 ファイルサイズ:</span>
                      {scanResult.file_size}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="destructive" className="bg-red-500">
                        🔴 Critical: {scanResult.summary.critical}件
                      </Badge>
                      <Badge variant="destructive" className="bg-orange-500">
                        🟠 High: {scanResult.summary.high}件
                      </Badge>
                      <Badge variant="secondary" className="bg-yellow-500 text-white">
                        🟡 Medium: {scanResult.summary.medium}件
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-500">
                        🔵 Low: {scanResult.summary.low}件
                      </Badge>
                    </div>
                    {scanResult.security_score !== undefined && (
                      <p className="text-sm font-medium">
                        📈 セキュリティスコア: {scanResult.security_score}/100
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {scanResult.issues.map((issue, index) => (
                <Alert
                  key={`${issue.id}-${index}`}
                  variant={issue.severity === 'critical' || issue.severity === 'high' ? 'destructive' : 'default'}
                  className={`border-l-4 ${
                    issue.severity === 'critical' ? 'border-l-red-500 bg-red-50' :
                    issue.severity === 'high' ? 'border-l-orange-500 bg-orange-50' :
                    issue.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                    'border-l-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <AlertTitle className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          issue.severity === 'critical' ? 'border-red-500 text-red-700' :
                          issue.severity === 'high' ? 'border-orange-500 text-orange-700' :
                          issue.severity === 'medium' ? 'border-yellow-500 text-yellow-700' :
                          'border-blue-500 text-blue-700'
                        }>
                          {issue.severity.toUpperCase()}
                        </Badge>
                        {issue.title}
                      </AlertTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCloseAlert(`${issue.id}-${index}`)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <AlertDescription className="mt-2">
                    {issue.description}
                  </AlertDescription>
                  
                  {issue.file && (
                    <p className="text-sm text-gray-600 mt-2">
                      ファイル: {issue.file}
                    </p>
                  )}
                  
                  {issue.recommendation && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <strong>推奨事項:</strong> {issue.recommendation}
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(issue)}
                    >
                      詳細を見る
                    </Button>
                  </div>
                </Alert>
              ))}
            </div>

            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setScanResult(null)
                }}
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                新しいファイルを診断
              </Button>
            </div>
          </div>
        )}

        {isCodeViewerOpen && selectedIssue && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-blue-900">{selectedIssue.file}</CardTitle>
                    <CardDescription>{selectedIssue.title}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCodeViewerOpen(false)
                      setFileContentError(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-auto max-h-[60vh]">
                {isLoadingFileContent && (
                  <div className="flex items-center justify-center p-8">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>ファイル内容を読み込み中...</span>
                    </div>
                  </div>
                )}
                
                {fileContentError && (
                  <Alert variant="destructive" className="m-4">
                    <AlertDescription>{fileContentError}</AlertDescription>
                  </Alert>
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
              </CardContent>
              <CardFooter className="border-t bg-gray-50">
                <Alert className="w-full">
                  <AlertCircle className="h-4 w-4" />
                  <div className="ml-2">
                    <AlertDescription>{selectedIssue.description}</AlertDescription>
                    <p className="mt-2">
                      <strong>推奨事項:</strong> {selectedIssue.recommendation}
                    </p>
                    {selectedIssue.line_number && (
                      <p className="mt-1 text-sm text-gray-600">
                        行 {selectedIssue.line_number}: {selectedIssue.code_snippet}
                      </p>
                    )}
                  </div>
                </Alert>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
