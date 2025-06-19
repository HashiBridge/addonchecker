from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import psycopg
import json
import zipfile
import tempfile
import os
import re
import asyncio
from typing import List, Dict, Any
from datetime import datetime
import uuid

app = FastAPI(title="AddonChecker API", description="Browser Extension Security Checker")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

scan_results = {}

class SecurityAnalyzer:
    def __init__(self):
        self.rules = {
            "ADDON_001": {
                "name": "Excessive Permissions",
                "severity": "HIGH",
                "description": "拡張機能が不要な権限を要求しています",
                "category": "Manifest Security"
            },
            "ADDON_002": {
                "name": "Unsafe innerHTML Usage",
                "severity": "CRITICAL", 
                "description": "innerHTML使用によるXSS脆弱性の可能性",
                "category": "Code Security"
            },
            "ADDON_003": {
                "name": "HTTP Communication",
                "severity": "MEDIUM",
                "description": "HTTP通信が検出されました。HTTPS使用を推奨します",
                "category": "Communication Security"
            },
            "ADDON_004": {
                "name": "Proper CSP Configuration",
                "severity": "SUCCESS",
                "description": "Content Security Policyが適切に設定されています",
                "category": "Security Configuration"
            },
            "ADDON_005": {
                "name": "Minimal Permissions",
                "severity": "INFO",
                "description": "権限設定を確認してください",
                "category": "Best Practices"
            }
        }
    
    def analyze_manifest(self, manifest_content: str) -> List[Dict[str, Any]]:
        issues = []
        try:
            manifest = json.loads(manifest_content)
            
            permissions = manifest.get("permissions", [])
            if "<all_urls>" in permissions or "tabs" in permissions:
                issues.append({
                    "id": "ADDON_001",
                    "severity": "HIGH",
                    "title": self.rules["ADDON_001"]["name"],
                    "description": self.rules["ADDON_001"]["description"],
                    "category": self.rules["ADDON_001"]["category"],
                    "file": "manifest.json",
                    "recommendation": "必要最小限の権限のみを要求してください"
                })
            
            if "content_security_policy" in manifest:
                issues.append({
                    "id": "ADDON_004",
                    "severity": "SUCCESS",
                    "title": self.rules["ADDON_004"]["name"],
                    "description": self.rules["ADDON_004"]["description"],
                    "category": self.rules["ADDON_004"]["category"],
                    "file": "manifest.json",
                    "recommendation": "CSPが適切に設定されています"
                })
            else:
                issues.append({
                    "id": "ADDON_005",
                    "severity": "INFO",
                    "title": self.rules["ADDON_005"]["name"],
                    "description": "Content Security Policyの設定を検討してください",
                    "category": self.rules["ADDON_005"]["category"],
                    "file": "manifest.json",
                    "recommendation": "CSPを設定してセキュリティを向上させてください"
                })
                
        except json.JSONDecodeError:
            issues.append({
                "id": "ADDON_001",
                "severity": "CRITICAL",
                "title": "Invalid Manifest",
                "description": "manifest.jsonの形式が正しくありません",
                "category": "Manifest Security",
                "file": "manifest.json",
                "recommendation": "manifest.jsonの構文を確認してください"
            })
        
        return issues
    
    def analyze_javascript(self, js_content: str, filename: str) -> List[Dict[str, Any]]:
        issues = []
        lines = js_content.split('\n')
        
        for line_num, line in enumerate(lines, 1):
            if re.search(r'\.innerHTML\s*=', line):
                issues.append({
                    "id": "ADDON_002",
                    "severity": "CRITICAL",
                    "title": self.rules["ADDON_002"]["name"],
                    "description": self.rules["ADDON_002"]["description"],
                    "category": self.rules["ADDON_002"]["category"],
                    "file": filename,
                    "line_number": line_num,
                    "code_snippet": line.strip(),
                    "recommendation": "textContentまたはcreateElementを使用してください"
                })
        
        for line_num, line in enumerate(lines, 1):
            if re.search(r'http://[^/]', line):
                issues.append({
                    "id": "ADDON_003",
                    "severity": "MEDIUM",
                    "title": self.rules["ADDON_003"]["name"],
                    "description": self.rules["ADDON_003"]["description"],
                    "category": self.rules["ADDON_003"]["category"],
                    "file": filename,
                    "line_number": line_num,
                    "code_snippet": line.strip(),
                    "recommendation": "HTTPSを使用してください"
                })
        
        return issues

analyzer = SecurityAnalyzer()

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="ファイル名が必要です")
    
    allowed_extensions = ['.crx', '.xpi', '.zip']
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="サポートされていないファイル形式です")
    
    scan_id = str(uuid.uuid4())
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name
    
    try:
        scan_results[scan_id] = {
            "scan_id": scan_id,
            "filename": file.filename,
            "file_size": f"{len(content) // 1024}KB",
            "status": "processing",
            "progress": 0,
            "timestamp": datetime.now().isoformat(),
            "issues": [],
            "summary": {"total_issues": 0, "critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0, "success": 0},
            "file_contents": {}
        }
        
        asyncio.create_task(analyze_extension(scan_id, temp_file_path))
        
        return {"scan_id": scan_id, "status": "uploaded", "message": "ファイルがアップロードされました。解析を開始します。"}
    
    except Exception as e:
        os.unlink(temp_file_path)
        raise HTTPException(status_code=500, detail=f"ファイル処理エラー: {str(e)}")

async def analyze_extension(scan_id: str, file_path: str):
    try:
        scan_results[scan_id]["progress"] = 25
        await asyncio.sleep(0.5)  # Simulate processing time
        
        issues = []
        
        with zipfile.ZipFile(file_path, 'r') as zip_ref:
            file_list = zip_ref.namelist()
            
            if 'manifest.json' in file_list:
                manifest_content = zip_ref.read('manifest.json').decode('utf-8')
                scan_results[scan_id]["file_contents"]["manifest.json"] = manifest_content
                issues.extend(analyzer.analyze_manifest(manifest_content))
            
            scan_results[scan_id]["progress"] = 50
            await asyncio.sleep(0.5)
            
            js_files = [f for f in file_list if f.endswith('.js')]
            for js_file in js_files[:5]:  # Limit to first 5 JS files
                try:
                    js_content = zip_ref.read(js_file).decode('utf-8')
                    scan_results[scan_id]["file_contents"][js_file] = js_content
                    issues.extend(analyzer.analyze_javascript(js_content, js_file))
                except:
                    continue
            
            scan_results[scan_id]["progress"] = 75
            await asyncio.sleep(0.5)
        
        summary = {"total_issues": len(issues), "critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0, "success": 0}
        for issue in issues:
            severity = issue["severity"].lower()
            if severity in summary:
                summary[severity] += 1
        
        scan_results[scan_id].update({
            "status": "completed",
            "progress": 100,
            "issues": issues,
            "summary": summary,
            "security_score": max(0, 100 - (summary["critical"] * 25 + summary["high"] * 15 + summary["medium"] * 10 + summary["low"] * 5))
        })
        
    except Exception as e:
        scan_results[scan_id].update({
            "status": "error",
            "progress": 100,
            "error": str(e)
        })
    finally:
        if os.path.exists(file_path):
            os.unlink(file_path)

@app.get("/api/scan/{scan_id}")
async def get_scan_result(scan_id: str):
    if scan_id not in scan_results:
        raise HTTPException(status_code=404, detail="スキャン結果が見つかりません")
    
    return scan_results[scan_id]

@app.get("/api/scan/{scan_id}/progress")
async def get_scan_progress(scan_id: str):
    if scan_id not in scan_results:
        raise HTTPException(status_code=404, detail="スキャン結果が見つかりません")
    
    result = scan_results[scan_id]
    return {
        "scan_id": scan_id,
        "filename": result["filename"],
        "progress": result["progress"],
        "status": result["status"]
    }

@app.get("/api/scan/{scan_id}/file/{filename:path}")
async def get_file_content(scan_id: str, filename: str):
    if scan_id not in scan_results:
        raise HTTPException(status_code=404, detail="スキャン結果が見つかりません")
    
    result = scan_results[scan_id]
    if filename not in result.get("file_contents", {}):
        raise HTTPException(status_code=404, detail="ファイルが見つかりません")
    
    file_content = result["file_contents"][filename]
    
    file_issues = [issue for issue in result["issues"] if issue["file"] == filename]
    
    return {
        "filename": filename,
        "content": file_content,
        "issues": file_issues,
        "language": "javascript" if filename.endswith('.js') else "json"
    }
