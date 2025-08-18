export interface SecurityRule {
  name: string;
  severity: string;
  description: string;
  category: string;
}

export interface SecurityIssue {
  id: string;
  severity: string;
  title: string;
  description: string;
  category: string;
  file: string;
  line_number?: number;
  code_snippet?: string;
  recommendation: string;
}

export class SecurityAnalyzer {
  private rules: Record<string, SecurityRule> = {
    "ADDON_001": {
      name: "Excessive Permissions",
      severity: "HIGH",
      description: "拡張機能が不要な権限を要求しています",
      category: "Manifest Security"
    },
    "ADDON_002": {
      name: "Unsafe innerHTML Usage",
      severity: "CRITICAL",
      description: "innerHTML使用によるXSS脆弱性の可能性",
      category: "Code Security"
    },
    "ADDON_003": {
      name: "HTTP Communication",
      severity: "MEDIUM",
      description: "HTTP通信が検出されました。HTTPS使用を推奨します",
      category: "Communication Security"
    },
    "ADDON_004": {
      name: "Proper CSP Configuration",
      severity: "SUCCESS",
      description: "Content Security Policyが適切に設定されています",
      category: "Security Configuration"
    },
    "ADDON_005": {
      name: "Minimal Permissions",
      severity: "INFO",
      description: "権限設定を確認してください",
      category: "Best Practices"
    }
  };

  analyzeManifest(manifestContent: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    
    try {
      const manifest = JSON.parse(manifestContent);
      const permissions = manifest.permissions || [];
      
      if (permissions.includes("<all_urls>") || permissions.includes("tabs")) {
        issues.push({
          id: "ADDON_001",
          severity: "HIGH",
          title: this.rules["ADDON_001"].name,
          description: this.rules["ADDON_001"].description,
          category: this.rules["ADDON_001"].category,
          file: "manifest.json",
          recommendation: "必要最小限の権限のみを要求してください"
        });
      }
      
      if (manifest.content_security_policy) {
        issues.push({
          id: "ADDON_004",
          severity: "SUCCESS",
          title: this.rules["ADDON_004"].name,
          description: this.rules["ADDON_004"].description,
          category: this.rules["ADDON_004"].category,
          file: "manifest.json",
          recommendation: "CSPが適切に設定されています"
        });
      } else {
        issues.push({
          id: "ADDON_005",
          severity: "INFO",
          title: this.rules["ADDON_005"].name,
          description: "Content Security Policyの設定を検討してください",
          category: this.rules["ADDON_005"].category,
          file: "manifest.json",
          recommendation: "CSPを設定してセキュリティを向上させてください"
        });
      }
    } catch {
      issues.push({
        id: "ADDON_001",
        severity: "CRITICAL",
        title: "Invalid Manifest",
        description: "manifest.jsonの形式が正しくありません",
        category: "Manifest Security",
        file: "manifest.json",
        recommendation: "manifest.jsonの構文を確認してください"
      });
    }
    
    return issues;
  }

  analyzeJavaScript(jsContent: string, filename: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = jsContent.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      if (/\.innerHTML\s*=/.test(line)) {
        issues.push({
          id: "ADDON_002",
          severity: "CRITICAL",
          title: this.rules["ADDON_002"].name,
          description: this.rules["ADDON_002"].description,
          category: this.rules["ADDON_002"].category,
          file: filename,
          line_number: lineNumber,
          code_snippet: line.trim(),
          recommendation: "textContentまたはcreateElementを使用してください"
        });
      }
      
      if (/http:\/\/[^/]/.test(line)) {
        issues.push({
          id: "ADDON_003",
          severity: "MEDIUM",
          title: this.rules["ADDON_003"].name,
          description: this.rules["ADDON_003"].description,
          category: this.rules["ADDON_003"].category,
          file: filename,
          line_number: lineNumber,
          code_snippet: line.trim(),
          recommendation: "HTTPSを使用してください"
        });
      }
    });
    
    return issues;
  }
}
