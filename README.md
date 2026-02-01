# メンターアンケート - セットアップガイド

## ファイル構成

```
mentorpoll/
├── index.html        # 本番HTML
├── style.css         # スタイル
├── script.js         # 開発用JS（コメント付き）
├── script.min.js     # 本番用JS（圧縮版）
├── gas_code.js       # GAS用コード（サーバーには置かない）
├── .htaccess         # セキュリティヘッダー
└── README.md         # このファイル
```

---

## URL構成

| 用途       | URL                      |
| ---------- | ------------------------ |
| **本番**   | `/mentorpoll/`           |
| **テスト** | `/mentorpoll/?mode=test` |

- テストモードでは何度でも送信可能（localStorage制限なし）
- 本番/テストでGoogle Sheetsの保存先シートが分離される

---

## セットアップ手順

### ① Google Sheets 作成

1. [Google Sheets](https://sheets.google.com) で新規スプレッドシートを作成
2. **シートを2つ作成**:
   - `responses` （本番用）
   - `responses_test` （テスト用）
3. **両シートの1行目**（ヘッダー）に以下を入力:

| A          | B    | C           | D         | E       | F           | G        | H          |
| ---------- | ---- | ----------- | --------- | ------- | ----------- | -------- | ---------- |
| created_at | mode | mentor_name | q1_choice | q2_text | duration_ms | timezone | user_agent |

---

### ② Google Apps Script 設定

1. スプレッドシートで `拡張機能` > `Apps Script` を開く
2. `gas_code.js` の内容をすべてコピーして貼り付け
3. `SECRET_KEY` を **推測されにくい文字列** に変更

```javascript
const SECRET_KEY = 'your-random-secret-123';
```

4. `デプロイ` > `新しいデプロイ` をクリック
5. 設定:
   - 種類: `ウェブアプリ`
   - 実行ユーザー: `自分`
   - アクセス: `全員`
6. `デプロイ` をクリック
7. 表示された **URL をコピー**

---

### ③ フロントエンド設定

`script.min.js` を開き、**冒頭の2箇所**を編集:

```javascript
const G='YOUR_GAS_WEB_APP_URL_HERE';  // ← ②でコピーしたURL
const S='YOUR_SECRET_KEY_HERE';       // ← ②で設定したキー
```

---

### ④ さくらサーバーにアップロード

**アップロードするファイル:**
- `index.html`
- `style.css`
- `script.min.js`
- `.htaccess`

**アップロードしないファイル:**
- `gas_code.js`
- `script.js`
- `README.md`

---

## 保存されるデータ

| 列            | 内容                  |
| ------------- | --------------------- |
| `created_at`  | 送信日時（JST）       |
| `mode`        | `prod` or `test`      |
| `mentor_name` | 選択されたメンター名  |
| `q1_choice`   | A / B / C             |
| `q2_text`     | Q2の自由記述（Aのみ） |
| `duration_ms` | 所要時間（ミリ秒）    |
| `timezone`    | 回答者のタイムゾーン  |
| `user_agent`  | ブラウザ情報          |

---

## セキュリティ対策

| 対策               | 実装                               |
| ------------------ | ---------------------------------- |
| CSP ヘッダー       | `.htaccess`                        |
| XSS 対策           | GAS側でHTMLエスケープ              |
| シークレットキー   | GAS + フロント両方で検証           |
| 入力バリデーション | メンター名・Q1をホワイトリスト検証 |
| 長さ制限           | Q2は300文字まで                    |

---

## 動作確認

1. **テストモード**: `http://localhost/mentorpoll/?mode=test`
   - 黄色いバナーが表示される
   - 何度でも送信可能
   - `responses_test` シートに保存
2. **本番モード**: `http://localhost/mentorpoll/`
   - バナーなし
   - 1回のみ送信可能（localStorage制限）
   - `responses` シートに保存
