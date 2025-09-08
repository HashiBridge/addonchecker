# Browser Extension Security Checker (AddonChecker)

ブラウザ拡張機能（アドオン）のセキュリティ脆弱性をチェックするWebアプリケーションです。作成した拡張機能ファイルをアップロードするだけで、自動的にセキュリティ診断を実行し、結果をブラウザ上で確認できます。

## 概要

このWebアプリケーションは、ブラウザ拡張機能の開発者が自分の拡張機能にセキュリティ脆弱性が含まれていないかを簡単に確認できるオンライン診断ツールです。ファイルをドラッグ&ドロップまたはアップロードするだけで、Chrome、Firefox、Edge、Safari等の主要ブラウザの拡張機能を包括的にセキュリティ監査します。

## 主な機能

### 📤 簡単ファイルアップロード
- **ドラッグ&ドロップ対応**: ブラウザに直接ファイルをドロップ
- **複数形式サポート**: .xpi, .zip, フォルダアップロード
- **リアルタイム進捗表示**: アップロード状況とスキャン進捗をリアルタイム表示
- **バッチ処理**: 複数の拡張機能を一度に診断

#### ファイルアップロードUI仕様
```
┌─────────────────────────────────────────────────────────────┐
│                    Uploading Files                    ⏸️ ❌  │
├─────────────────────────────────────────────────────────────┤
│  74% • my-extension.crx                                     │
│                                                            │
│  ████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                            │
└─────────────────────────────────────────────────────────────┘
```

**UI要素:**
- **モーダルウィンドウ**: 白背景、角丸、ドロップシャドウ
- **タイトル**: "Uploading Files" (左上)
- **コントロールボタン**: 一時停止(⏸️)、キャンセル(❌) (右上)
- **進捗表示**: パーセンテージ + ファイル名
- **レスポンシブ対応**: モバイル・デスクトップ両対応

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

### 技術スタック
HTML,CSS+Tailwind,JS

#### インフラ・デプロイ
 - gitHub Pages

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
3. 対応形式: `.xpi` (Firefox), `.zip` (汎用), フォルダ

#### 2. 自動診断開始
- アップロード完了後、自動的にセキュリティスキャンが開始
- リアルタイムで進捗状況を表示
- 診断項目ごとの進行状況を可視化

#### 3. 結果表示・ダウンロード
- ブラウザ上で診断結果を詳細表示
- 重要度別（Critical/High/Medium/Low）で問題を分類

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
