# Payphone Portal

公衆電話に3桁の番号をかけると、制作物のページへ移動するポータルサイト。
React Three Fiber で電話ボックスと公衆電話を描き、React Router で、ドメインを切り替えずに各作品ページへ遷移する。

## 世界観と決定事項

- 雰囲気は Papers, Please のようなレトロゲーム。ASCII は使わず、低解像度（高さ約360。幅は画面の縦横比に合わせる）で描いてドットのまま、画面いっぱいに拡大表示する
- 流れ: 引きの視点で電話ボックスが中央にある → ボックスをクリックでドアが開いてカメラが中へ入る → 電話機をクリックで受話器が耳元へ → ボタンで3桁をダイヤル
- 遷移はパスのみ（/works/:slug）。サブドメインは使わない
- ダイヤル: 3桁そろって1秒操作がなければ発信。1秒以内に数字を押すと破棄して新しい1桁目。\* で消去。# は未使用。番号が違えば NOT IN SERVICE
- 発信したら画面いっぱいに「Calling...」を出し、呼出音を鳴らしながら作品のコードを先読みして navigate
- 作品ページから戻ったときは inside（電話機の前）から始める
- UI の言語は英語。スマホ対応、電話帳、書類・スタンプのUIは今回の範囲外（今後の展望）
- ホスティングは Cloudflare Pages（無料プラン）

## 技術

Vite + React 19 + TypeScript、three / @react-three/fiber 9 / @react-three/drei 10、react-router（BrowserRouter）、zustand。
バージョンは package.json を正とする。

## 構成

- src/config.ts … 調整する値はすべてここ（解像度、ライト、時間、カメラ、SITE の文言）
- src/state/portalStore.ts … フェーズとダイヤルの規則（テストあり）
- src/portal/ … Scene, Payphone, Booth, CameraRig, poses, hooks, retroMaterials, pixel, hud/
- src/routes/ … PortalRoute（Canvas + HUD、lazy）, WorkRoute（作品を lazy で表示）
- src/works/registry.ts … 番号 → 作品の対応表。作品を足すときはここに1行足す
- src/audio/tones.ts … DTMF・発信音・呼出音（Web Audio で合成）

## 壊しやすい前提（理由つき）

1. 公衆電話と電話ボックスは、同じ <group scale={0.1}>・同じ座標系で置く。config の長さは「モデル単位」（×0.1 でメートル）
2. 入るときのカメラの終点は、公衆電話glb内の POV_Camera の姿勢に正確に合わせる。受話器のアニメーションは POV_Camera の耳元を基準に作られているため。カメラの動きはコード側（poses.ts / CameraRig.tsx）で行い、Blender には入れない
3. useGLTF のシーンは使い回される。表示するたびに、受話器のアニメーションを時刻0に戻し、ボタンの位置を初期位置に戻す（Payphone.tsx）。戻さないと前回の姿勢が残る
4. 公衆電話のボタンは glTF extras（userData）に key / press_dir / press_depth を持つ。アニメーションのクリップ名は Animation
5. 内部解像度は Canvas の dpr で作る。pixelDpr の +0.5 は floor の誤差で1px足りなくなるのを防ぐためなので消さない。postprocessing は使わない
6. ライトは three r155 以降の物理単位。面の明るさの倍率は、おおよそ (ambient + directional + booth) / π。1.0 を超えると白に飛ぶ（トーンマッピングなし）
7. glb のマテリアルは Lambert / Toon に置き換える（retroMaterials.ts）。発光は emissive strength が 1.001 より大きいもの（液晶）だけ残す。Blender の書き出しは発光を使っていないマテリアルにも白い発光色を付けることがあるため
8. glb は meshopt 圧縮。useGLTF(url, false) で Draco は使わない
9. フォントは Tiny5（8x8格子）。font-size は必ず 8px の倍数にする。数字は同じ幅
10. Cloudflare Pages は、トップ階層に 404.html を置かなければ SPA として動く。置かないこと
11. R3F のクリックは <primitive> にハンドラを付けて、子のメッシュからのバブリングで受ける

## 画面のUI方針

- HUD は枠（ボーダー付きの箱・パネル）を使わない。大小の文字と、1px の細い罫線だけで組む。文字の大小の差で階層を作る（タイトル 48px、時刻 32px、本文 16px、補足 8px）
- 文字は4隅に置き、画面中央は電話ボックスのために空ける。明るい電話機の上でも読めるよう、文字に 1px のドットの影（text-shadow: 1px 1px 0）を付け、上下に段になった暗い帯を重ねる
- 赤（--stamp）は NOT IN SERVICE だけに使う。画面に出る文言は英語で、サイトの文言は config.ts の SITE に集める

## 規約

- コメントは日本語（既存に合わせる）。画面に出る文字は英語
- 調整する値は config.ts に出す。マジックナンバーを散らさない
- 依存パッケージを足すときは先に相談する
- 必要な範囲だけ変更する。無関係なリファクタはしない
- glb（大きい）は勝手にコミットしない
- 完了前に必ず実行する: npm run typecheck && npm test && npm run build

## 未確認（WebGL が動く環境で人が見る）

- 内部解像度（高さ約360）でボタンの数字が読めるか
- ライトの強さ（LIGHT）と色味。電話機が白く飛んでいないか（開発中は、コンソールに retroMaterials の表が出る）
- 仮の電話ボックスの大きさと、電話機・POV カメラの位置関係
- 受話器が耳元の正しい位置に来るか、クリックの当たり
- 作品から戻ったとき、受話器とボタンが元の状態か
