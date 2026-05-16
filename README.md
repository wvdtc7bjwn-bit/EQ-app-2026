# EQ-app-2026

リアルタイム地震・津波・緊急地震速報表示Webアプリ。

## 主な機能

- dmdata WebSocket 接続
- 地震情報表示
- 震源表示
- SVGベース日本地図
- ズーム / ドラッグ移動
- 地図軽量化対応
- 今後:
  - 震度観測点
  - EEW表示
  - 津波情報
  - 強震モニタ風表示

---

# 開発環境

- Node.js
- npm
- JavaScript (ES Modules)

---

# インストール

```bash
npm install
```

---

# .env

`.env` を作成。

```env
DMDATA_API_KEY=YOUR_API_KEY
```

---

# 地図データ生成

## 元GeoJSON

以下を `local-data/` に配置。

```text
local-data/earthquakeArea.geojson
```

---

## GeoJSON軽量化

```bash
npx mapshaper local-data/earthquakeArea.geojson -simplify 3% keep-shapes -o format=geojson local-data/earthquakeArea_light.geojson
```

---

## japanGeoJson.js 生成

```bash
node tools/mapConverter.mjs
```

生成先:

```text
src/map/data/japanGeoJson.js
```

---

# 起動

```bash
npm start
```

---

# GitHubへ含めないファイル

`.gitignore`

```gitignore
node_modules
.env
local-data/
public/mapdata/
src/map/data/japanGeoJson.js
```

---

# 注意

地図データは容量が非常に大きいため、
GitHubには含めていません。

各自で生成してください。
