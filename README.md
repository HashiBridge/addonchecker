# Browser Extension Security Checker (AddonChecker)

ブラウザ拡張機能（アドオン）のセキュリティ脆弱性をチェックするWebアプリケーションです。作成した拡張機能ファイルをアップロードするだけで、自動的にセキュリティ診断を実行し、結果をブラウザ上で確認できます。

## 概要

このWebアプリケーションは、ブラウザ拡張機能の開発者が自分の拡張機能にセキュリティ脆弱性が含まれていないかを簡単に確認できるオンライン診断ツールです。ファイルをドラッグ&ドロップまたはアップロードするだけで、Chrome、Firefox、Edge、Safari等の主要ブラウザの拡張機能を包括的にセキュリティ監査します。

## 主な機能

### 📤 簡単ファイルアップロード
- **ドラッグ&ドロップ対応**: ブラウザに直接ファイルをドロップ
- **複数形式サポート**: .crx, .xpi, .zip, フォルダアップロード
- **リアルタイム進捗表示**: アップロード状況とスキャン進捗をリアルタイム表示
- **バッチ処理**: 複数の拡張機能を一度に診断

### 🔍 自動セキュリティ診断

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
- **ファイル処理**: 
  - アップロード: `python-multipart`, `aiofiles`
  - 解凍・展開: `zipfile`, `py7zr`
  - 一時ファイル管理: `tempfile`, `shutil`
- **解析エンジン**: 
  - AST解析: `ast`, `esprima` (JavaScript)
  - 静的解析: `bandit`, `semgrep`
  - パターンマッチング: `regex`, `yara`
- **データベース**: SQLite (開発), PostgreSQL (本番)
- **キューシステム**: Redis + Celery (バックグラウンド処理)

#### フロントエンド (Web UI)
- **フレームワーク**: React.js + TypeScript
- **UI ライブラリ**: Material-UI + React Dropzone
- **状態管理**: Redux Toolkit
- **リアルタイム通信**: WebSocket (診断進捗表示)
- **ファイル処理**: File API, Drag & Drop API
- **ビルドツール**: Vite

#### インフラ・デプロイ
- **コンテナ**: Docker + Docker Compose
- **Webサーバー**: Nginx (リバースプロキシ)
- **ファイルストレージ**: AWS S3 / MinIO (アップロードファイル保存)

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

## 使用方法

### 🌐 Webアプリケーション使用

#### 1. ファイルアップロード
1. ブラウザで AddonChecker にアクセス
2. 拡張機能ファイルをドラッグ&ドロップまたは「ファイル選択」ボタンでアップロード
3. 対応形式: `.crx` (Chrome), `.xpi` (Firefox), `.zip` (汎用), フォルダ

#### 2. 自動診断開始
- アップロード完了後、自動的にセキュリティスキャンが開始
- リアルタイムで進捗状況を表示
- 診断項目ごとの進行状況を可視化

#### 3. 結果表示・ダウンロード
- ブラウザ上で診断結果を詳細表示
- 重要度別（Critical/High/Medium/Low）で問題を分類
- 修正推奨事項と具体的なコード例を提供
- レポートをPDF/HTML/JSON形式でダウンロード可能

### 🚀 ローカル環境セットアップ

#### Docker使用（推奨）
```bash
# リポジトリのクローン
git clone https://github.com/HashiBridge/addonchecker.git
cd addonchecker

# Docker Composeで起動
docker-compose up -d

# ブラウザで http://localhost:3000 にアクセス
```

#### 手動セットアップ
```bash
# バックエンド起動
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000

# フロントエンド起動（別ターミナル）
cd frontend
npm install
npm run dev

# ブラウザで http://localhost:3000 にアクセス
```

### 📱 使用フロー

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  ファイル選択    │ -> │  アップロード    │ -> │  自動解析開始    │
│                │    │                │    │                │
│ • ドラッグ&ドロップ │    │ • 進捗表示      │    │ • リアルタイム   │
│ • ファイル選択   │    │ • ファイル検証   │    │   進捗表示      │
│ • 複数ファイル   │    │ • 形式チェック   │    │ • 診断項目表示   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
           |                       |                       |
           v                       v                       v
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  結果表示       │ <- │  レポート生成    │ <- │  セキュリティ    │
│                │    │                │    │  スキャン完了    │
│ • 問題一覧      │    │ • HTML/PDF生成  │    │                │
│ • 修正推奨      │    │ • JSON出力     │    │ • 脆弱性検出     │
│ • コード例      │    │ • ダウンロード   │    │ • 推奨事項生成   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 診断結果・レポート形式

### 📊 Web画面での結果表示

#### ダッシュボード概要
```
┌─────────────────────────────────────────────────────────────┐
│                    診断結果サマリー                          │
├─────────────────────────────────────────────────────────────┤
│  📁 ファイル名: my-extension.crx                            │
│  📅 診断日時: 2025-06-18 14:48:00                          │
│  ⏱️  診断時間: 2.3秒                                        │
│                                                            │
│  🔴 Critical: 1件    🟠 High: 2件                          │
│  🟡 Medium: 1件      🔵 Low: 1件                           │
│                                                            │
│  📈 セキュリティスコア: 65/100 (要改善)                      │
└─────────────────────────────────────────────────────────────┘
```

#### 詳細問題一覧
```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 CRITICAL: Unsafe innerHTML Usage                        │
├─────────────────────────────────────────────────────────────┤
│ ファイル: content.js (42行目)                               │
│ 問題: innerHTML使用によるXSS脆弱性の可能性                   │
│                                                            │
│ 問題のコード:                                               │
│ > element.innerHTML = userInput;                           │
│                                                            │
│ 修正推奨:                                                   │
│ > element.textContent = userInput;                         │
│ > // または                                                │
│ > const newElement = document.createElement('div');        │
│ > newElement.textContent = userInput;                      │
│                                                            │
│ 📚 参考資料: [XSS Prevention Guide]                        │
└─────────────────────────────────────────────────────────────┘
```

### 📄 ダウンロード可能レポート

#### JSON形式（API連携用）
```json
{
  "scan_id": "scan_20250618_144800",
  "timestamp": "2025-06-18T14:48:00Z",
  "filename": "my-extension.crx",
  "file_size": "245KB",
  "scan_duration": 2.3,
  "security_score": 65,
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
      "category": "Code Security",
      "title": "Unsafe innerHTML Usage",
      "description": "innerHTML使用によるXSS脆弱性の可能性があります",
      "file": "content.js",
      "line": 42,
      "column": 15,
      "code_snippet": "element.innerHTML = userInput;",
      "recommendation": "textContentまたはcreateElementを使用してください",
      "fix_example": "element.textContent = userInput;",
      "references": [
        "https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML#security_considerations"
      ],
      "cwe_id": "CWE-79"
    }
  ],
  "file_analysis": {
    "manifest_version": 3,
    "permissions": ["activeTab", "storage"],
    "files_scanned": 12,
    "lines_of_code": 1247
  },
  "recommendations": [
    "Content Security Policyを設定してください",
    "不要な権限を削除してください",
    "HTTPS通信を強制してください"
  ]
}
```

#### HTML形式（詳細レポート）
- 視覚的に見やすいHTML形式
- 問題箇所のシンタックスハイライト
- 修正前後のコード比較
- セキュリティスコアのグラフ表示
- 印刷対応レイアウト

#### PDF形式（共有・保存用）
- 正式なセキュリティ監査レポート形式
- 会社ロゴ・日付入り
- エグゼクティブサマリー付き
- 技術的詳細とビジネス影響度を併記

## 開発ロードマップ

### Phase 1: Webアプリ基盤構築 (3週間)
- [ ] React + FastAPI プロジェクト構造設定
- [ ] ファイルアップロード機能（ドラッグ&ドロップ対応）
- [ ] 基本的なマニフェスト解析機能
- [ ] シンプルなWeb UI（アップロード→結果表示）

### Phase 2: セキュリティ解析エンジン (4週間)
- [ ] JavaScript/TypeScript AST解析
- [ ] コアセキュリティルールの実装
- [ ] リアルタイム進捗表示（WebSocket）
- [ ] 結果表示画面の詳細化

### Phase 3: レポート・UX強化 (3週間)
- [ ] HTML/PDF/JSON レポート生成
- [ ] セキュリティスコア算出
- [ ] 修正推奨事項とコード例表示
- [ ] バッチ処理（複数ファイル対応）

### Phase 4: 高度機能・運用 (継続)
- [ ] 高度なパターンマッチング
- [ ] 脆弱性データベース統合
- [ ] パフォーマンス最適化
- [ ] Docker化・本番デプロイ対応

## 貢献方法

### 開発環境セットアップ

#### Docker使用（推奨）
```bash
# 開発環境起動
docker-compose -f docker-compose.dev.yml up -d

# ログ確認
docker-compose logs -f

# 開発用データベース初期化
docker-compose exec backend python -m alembic upgrade head
```

#### 手動セットアップ
```bash
# バックエンド開発環境
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt

# フロントエンド開発環境
cd frontend
npm install
npm run dev

# テスト実行
pytest tests/
npm test

# コードフォーマット
black backend/
flake8 backend/
npm run lint
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
