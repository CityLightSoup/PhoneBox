/**
 * 調整したくなりそうな値をここに集める。
 * 長さの単位は、特に書いてなければ「モデル単位」（実物の約10倍）。
 */

// ---------------------------------------------------------------- モデル
/** モデル単位 → ワールド（メートル）の倍率。実物大にするため 0.1 */
export const MODEL_SCALE = 0.1;

export const PHONE_URL = "/models/phone.glb";
export const BOOTH_URL = "/models/booth.glb";

/** true: BOOTH_URL のglbを使う / false: コードで作った仮の電話ボックスを使う */
export const USE_BOOTH_GLB = false;

/**
 * ボタンの位置（モデル単位）。glbの軽量化でボタンが本体と1つのメッシュに結合されていると、
 * ボタンごとのノードが使えないので、クリックした位置からどのボタンかを判定する。
 * 値は、ボタンが別ノードだった phone_test.glb の各ボタンの中心。
 */
export const KEYPAD = {
  /** ボタンの半径（キーパッド面の x,y 方向） */
  radius: 0.14,
  /** 中心からの奥行き方向の許容差（手前に来た受話器などを除く） */
  depthTolerance: 0.1,
  keys: {
    "1": [-4.68, 1.161, 0.988],
    "2": [-4.365, 1.161, 0.988],
    "3": [-4.054, 1.161, 0.988],
    "4": [-4.68, 0.887, 1.063],
    "5": [-4.365, 0.887, 1.063],
    "6": [-4.054, 0.887, 1.063],
    "7": [-4.68, 0.61, 1.139],
    "8": [-4.365, 0.61, 1.139],
    "9": [-4.054, 0.61, 1.139],
    "*": [-4.68, 0.333, 1.215],
    "0": [-4.365, 0.333, 1.215],
    "#": [-4.054, 0.333, 1.215],
  } as Record<string, readonly [number, number, number]>,
} as const;

/** 公衆電話のクリップ名（受話器を取る） */
export const PHONE_CLIP = "Animation";
/** 電話ボックスのクリップ名（ドアを開ける） */
export const BOOTH_DOOR_CLIP = "DoorOpen";
/** 公衆電話glbの一人称カメラのノード名 */
export const POV_NODE = "POV_Camera";

// ---------------------------------------------------------------- 描画
/**
 * 内部解像度の高さ（ドットの数）の目安。画面全体をこの高さに近づけて、拡大して表示する。
 * 幅は画面の縦横比に合わせて決まる。小さくするほどドットが粗く、文字も大きくなる。
 */
export const RES_H = 360;
/** true: 拡大率を整数にする（ドットがきれい。端が少し切れる） / false: 画面の高さにぴったり合わせる */
export const INTEGER_SCALE = true;

export type MaterialMode = "lambert" | "toon";
/** glbのマテリアルの置き換え先。toonは3段階の陰影になる */
export const MATERIAL_MODE: MaterialMode = "toon";
/** 発光の強さの上限（液晶の emissive strength 約25はそのままだと白く飛ぶ） */
export const EMISSIVE_MAX = 3;

export const BG_COLOR = "#14160f";
/**
 * ライトの強さ。three r155 以降は物理単位で、Lambert の面は「合計 / π」の明るさになる。
 * 正面を向いた面の明るさの倍率 ≒ (ambient + directional + booth) / 3.14 。
 * これが 1.0 を超えると、色が白に飛ぶ（トーンマッピングを使っていないため）。
 */
export const LIGHT = {
  ambient: 0.5,
  directional: 0.5,
  /** ボックス内の蛍光灯の明かり */
  booth: 0.5,
} as const;
/** 切れかけの蛍光灯の点滅（時間は秒） */
export const FLICKER = {
  /** 点滅が起きる間隔（バーストの終わりから次のバーストまで） */
  gapMin: 0.8,
  gapMax: 4,
  /** 1回のバーストで「消える→点く」を繰り返す回数 */
  togglesMin: 1,
  togglesMax: 4,
  /** バーストの最後に、長めに消える確率 */
  longOffChance: 0.3,
  /** 消えているとき、環境光をどれだけ落とすか（0〜1。ボックス内以外も少し暗くなる） */
  ambientDip: 0.8,
} as const;
/** ワールド（メートル）単位。全体を0.1倍しているのでnearは小さくする */
export const CAMERA_NEAR = 0.01;
export const CAMERA_FAR = 50;

// ---------------------------------------------------------------- ダイヤル
export const DIAL_LENGTH = 3;
/** 3桁そろってから発信するまでの待ち時間 */
export const DIAL_COMMIT_MS = 1000;
/** 「NOT IN SERVICE」を出しておく時間 */
export const INVALID_MS = 1600;
/** 「Calling...」を最低限出しておく時間（呼出音1回分） */
export const RING_MIN_MS = 1000;

// ---------------------------------------------------------------- カメラ演出
/** 最初の引きの視点（位置と注視点） */
export const EXTERIOR_CAMERA = {
  position: [-50, 2, 100],
  target: [-4.94, -1, 0],
} as const;
/** ドアの手前の通過点。POVカメラの位置から、手前（+Z）へこの距離だけ離す */
export const DOOR_WAYPOINT_BACK = 13;
/** 引きの視点 → ドアの手前（ドアが開く間） */
export const APPROACH_SEC = 1.4;
/** ドアの手前 → POV（ドアが開ききってから） */
export const MOVE_IN_SEC = 1.2;
/** 仮の電話ボックスのドアが開く時間 */
export const DOOR_OPEN_SEC = 1.0;

// ---------------------------------------------------------------- 仮の電話ボックス
// 公衆電話の座標系（原点は電話機の中心ではない。本体は x:-6.28〜-3.60, z:-1.34〜1.39 付近）に合わせてある
export const BOOTH = {
  cx: -4.94,
  floorY: -12.5,
  height: 23,
  backZ: -1.6,
  depth: 10,
  width: 10,
  opening: 8,
  doorHeight: 21,
} as const;

// ---------------------------------------------------------------- サイト情報
export const SITE: {
  /** 画面左上のタイトルと、タブのタイトル */
  title: string;
  /** タイトルの下の補助文 */
  tagline: string;
  /** tagline の下の小さな説明 */
  intro: string;
  /** 画面左下の手順（遊び方）。フェーズに応じて今の手順が明るくなる */
  steps: readonly string[];
  /** 時計のタイムゾーン（例: "Asia/Tokyo"）。undefined なら端末の時刻 */
  clockTimeZone: string | undefined;
} = {
  title: "Payphone",
  tagline: "A line to my works.",
  intro: "Three digits connect you to one piece.",
  steps: ["Step inside the booth.", "Lift the receiver.", "Dial a three-digit number."],
  clockTimeZone: undefined,
};
