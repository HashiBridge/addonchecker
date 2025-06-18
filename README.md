# Browser Extension Security Checker (AddonChecker)

ブラウザ拡張機能（アドオン）のセキュリティ脆弱性をチェックするツールです。自作の拡張機能が安全であることを確認し、一般的なセキュリティ問題を検出します。

## 概要

このツールは、ブラウザ拡張機能の開発者が自分の拡張機能にセキュリティ脆弱性が含まれていないかを確認するためのセキュリティチェッカーです。Chrome、Firefox、Edge、Safari等の主要ブラウザの拡張機能に対応し、包括的なセキュリティ監査を提供します。

## 主な機能

### 🔍 セキュリティチェック項目

#### 1. マニフェストファイル検証
- **権限の最小化チェック**: 不要な権限が要求されていないか
- **ホスト権限の検証**: 過度に広範囲なホスト権限の使用
- **外部接続可能性**: `externally_connectable`フィールドの適切な制限
- **Webアクセス可能リソース**: 不要なリソースの公開
- **コンテンツセキュリティポリシー**: CSPの適切な設定

#### 2. コード品質・セキュリティ
- **危険なAPI使用**: `eval()`, `innerHTML`, `document.write()`の使用検出
- **XSS脆弱性**: クロスサイトスクリプティング攻撃の可能性
- **インジェクション攻撃**: SQLインジェクション、コマンドインジェクション
- **安全でないHTTP通信**: HTTP接続の使用（HTTPS推奨）
- **機密情報の露出**: ハードコードされたAPIキー、パスワード等

#### 3. コンテンツスクリプト検証
- **分離環境の適切な利用**: Isolated worldの正しい使用
- **メッセージパッシング**: 安全でないメッセージ処理
- **DOM操作**: 安全でないDOM操作パターン
- **データ検証**: 外部からの入力データの適切な検証

#### 4. 通信セキュリティ
- **HTTPS強制**: すべての外部通信でHTTPSを使用
- **証明書検証**: SSL/TLS証明書の適切な検証
- **CORS設定**: Cross-Origin Resource Sharingの適切な設定
- **リクエスト検証**: 外部APIへのリクエストの安全性

#### 5. データ保護
- **個人情報の取り扱い**: ユーザーデータの適切な処理
- **ローカルストレージ**: 機密データの安全な保存
- **データ暗号化**: 必要に応じた暗号化の実装
- **データ漏洩防止**: 意図しないデータ露出の防止

#### 6. 開発者アカウントセキュリティ
- **二要素認証**: 開発者アカウントの2FA設定確認
- **グループ公開**: 信頼できる開発者のみでのグループ管理
- **アクセス制御**: 適切な権限管理

### 🎯 対応ブラウザ・プラットフォーム

#### サポート対象
- **Chrome Extensions** (Manifest V2/V3)
- **Firefox Add-ons** (WebExtensions API)
- **Microsoft Edge Extensions**
- **Safari Web Extensions**

#### 検証形式
- **Manifest.json** 解析
- **JavaScript/TypeScript** コード解析
- **HTML/CSS** ファイル検証
- **パッケージファイル** (.crx, .xpi, .zip)

## 技術仕様

### アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    AddonChecker Core                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  File Parser    │  │  Code Analyzer  │  │  Rule Engine │ │
│  │                 │  │                 │  │              │ │
│  │ • Manifest      │  │ • AST Analysis  │  │ • Security   │ │
│  │ • JavaScript    │  │ • Pattern Match │  │   Rules      │ │
│  │ • HTML/CSS      │  │ • Dependency    │  │ • Custom     │ │
│  │ • Package       │  │   Analysis      │  │   Rules      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Vulnerability  │  │  Report         │  │  Integration │ │
│  │  Database       │  │  Generator      │  │  Layer       │ │
│  │                 │  │                 │  │              │ │
│  │ • CVE Database  │  │ • HTML Report   │  │ • CLI Tool   │ │
│  │ • Custom Rules  │  │ • JSON Output   │  │ • Web UI     │ │
│  │ • Updates       │  │ • CI/CD Export  │  │ • API        │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 技術スタック

#### バックエンド
- **言語**: Python 3.9+
- **フレームワーク**: FastAPI
- **解析エンジン**: 
  - AST解析: `ast`, `esprima` (JavaScript)
  - 静的解析: `bandit`, `semgrep`
  - パターンマッチング: `regex`, `yara`
- **データベース**: SQLite (開発), PostgreSQL (本番)

#### フロントエンド (Web UI)
- **フレームワーク**: React.js + TypeScript
- **UI ライブラリ**: Material-UI
- **状態管理**: Redux Toolkit
- **ビルドツール**: Vite

#### CLI ツール
- **フレームワーク**: Click (Python)
- **出力形式**: JSON, HTML, PDF, CSV

### セキュリティルール定義

#### ルール分類
1. **Critical** - 即座に修正が必要な重大な脆弱性
2. **High** - セキュリティリスクが高い問題
3. **Medium** - 潜在的なセキュリティ問題
4. **Low** - ベストプラクティス違反
5. **Info** - 情報提供・推奨事項

#### カスタムルール
```yaml
rules:
  - id: "ADDON_001"
    name: "Excessive Permissions"
    severity: "HIGH"
    description: "拡張機能が不要な権限を要求しています"
    pattern: |
      manifest.permissions contains ["<all_urls>", "tabs", "history"]
    
  - id: "ADDON_002"
    name: "Unsafe innerHTML Usage"
    severity: "CRITICAL"
    description: "innerHTML使用によるXSS脆弱性の可能性"
    pattern: |
      *.innerHTML = *
```

## インストール・使用方法

### 前提条件
- Python 3.9以上
- Node.js 16以上 (Web UI使用時)
- Git

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/HashiBridge/addonchecker.git
cd addonchecker

# Python依存関係のインストール
pip install -r requirements.txt

# Web UI依存関係のインストール (オプション)
cd frontend
npm install
cd ..
```

### 基本的な使用方法

#### CLI使用
```bash
# 拡張機能ディレクトリの検証
addonchecker scan /path/to/extension

# パッケージファイルの検証
addonchecker scan extension.crx

# 詳細レポート生成
addonchecker scan /path/to/extension --output-format html --output report.html

# 特定のルールのみ実行
addonchecker scan /path/to/extension --rules ADDON_001,ADDON_002
```

#### Web UI使用
```bash
# 開発サーバー起動
python -m addonchecker.server

# ブラウザで http://localhost:8000 にアクセス
```

#### API使用
```python
from addonchecker import SecurityChecker

checker = SecurityChecker()
results = checker.scan_directory("/path/to/extension")

for issue in results.issues:
    print(f"{issue.severity}: {issue.message}")
```

## 出力形式

### レポート例
```json
{
  "scan_id": "scan_20250618_144800",
  "timestamp": "2025-06-18T14:48:00Z",
  "target": "/path/to/extension",
  "summary": {
    "total_issues": 5,
    "critical": 1,
    "high": 2,
    "medium": 1,
    "low": 1,
    "info": 0
  },
  "issues": [
    {
      "id": "ADDON_001",
      "severity": "CRITICAL",
      "title": "Unsafe innerHTML Usage",
      "description": "innerHTML使用によるXSS脆弱性の可能性があります",
      "file": "content.js",
      "line": 42,
      "code_snippet": "element.innerHTML = userInput;",
      "recommendation": "textContentまたはcreateElementを使用してください"
    }
  ],
  "recommendations": [
    "Content Security Policyを設定してください",
    "不要な権限を削除してください"
  ]
}
```

## 開発ロードマップ

### Phase 1: 基盤構築 (4週間)
- [ ] プロジェクト構造の設定
- [ ] 基本的なマニフェスト解析機能
- [ ] コアセキュリティルールの実装
- [ ] CLI インターフェースの開発

### Phase 2: 解析エンジン強化 (6週間)
- [ ] JavaScript/TypeScript AST解析
- [ ] 高度なパターンマッチング
- [ ] 脆弱性データベース統合
- [ ] カスタムルール機能

### Phase 3: UI・統合 (4週間)
- [ ] Web UI開発
- [ ] レポート生成機能
- [ ] CI/CD統合
- [ ] API開発

### Phase 4: 拡張・最適化 (継続)
- [ ] 新しいブラウザ対応
- [ ] パフォーマンス最適化
- [ ] 機械学習による検出精度向上
- [ ] コミュニティルール共有

## 貢献方法

### 開発環境セットアップ
```bash
# 開発用依存関係のインストール
pip install -r requirements-dev.txt

# pre-commitフックの設定
pre-commit install

# テスト実行
pytest tests/

# コードフォーマット
black addonchecker/
flake8 addonchecker/
```

### ルール追加
新しいセキュリティルールを追加する場合:
1. `rules/` ディレクトリに YAML ファイルを作成
2. テストケースを `tests/rules/` に追加
3. ドキュメントを更新

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## サポート・お問い合わせ

- **Issues**: [GitHub Issues](https://github.com/HashiBridge/addonchecker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/HashiBridge/addonchecker/discussions)
- **Email**: support@hashibridge.com

## 参考資料

- [Chrome Extension Security Best Practices](https://developer.chrome.com/docs/extensions/develop/security-privacy/stay-secure)
- [Firefox Extension Security Guidelines](https://extensionworkshop.com/documentation/develop/build-a-secure-extension/)
- [OWASP Web Application Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Common Weakness Enumeration (CWE)](https://cwe.mitre.org/)

---

**注意**: このツールは開発中です。本番環境での使用前に十分なテストを行ってください。
