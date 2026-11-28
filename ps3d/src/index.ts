import React from "react";
import { Composition, registerRoot } from "remotion";
import { LebahPelikan, LEBAH_FRAMES } from "./videos/lebah/LebahPelikan";
import { KelinciSinga, KELINCI_FRAMES } from "./videos/kelinci/KelinciSinga";
import { KudaLautPaus, KUDALAUT_FRAMES } from "./videos/kudalaut/KudaLautPaus";
import { BadakJawa, BADAK_FRAMES } from "./videos/badak/BadakJawa";
import { KucingJerapah, KUCING_FRAMES } from "./videos/kucing/KucingJerapah";
import { UburUburHiu, UBURUBUR_FRAMES } from "./videos/uburubur/UburUburHiu";
import { BangauCamar, BANGAU_FRAMES } from "./videos/bangau/BangauCamar";
import { PenguinUdang, PENGUIN_FRAMES } from "./videos/penguin/PenguinUdang";
import { AnjingPanda, ANJING_FRAMES } from "./videos/anjing/AnjingPanda";
import { FlamingoPipit, FLAMINGO_FRAMES } from "./videos/flamingo/FlamingoPipit";
import { PelikanGagak, PELIKAN_FRAMES } from "./videos/pelikan/PelikanGagak";
import { SingaMonyet, SINGA_FRAMES } from "./videos/singa/SingaMonyet";
import { PausKepiting, PAUS_FRAMES } from "./videos/paus/PausKepiting";
import { CamarAngsa, CAMAR_FRAMES } from "./videos/camar/CamarAngsa";
import { HiuBintangLaut, HIU_FRAMES } from "./videos/hiu/HiuBintangLaut";
import { JerapahKanguru, JERAPAH_FRAMES } from "./videos/jerapah/JerapahKanguru";

const COMPS = [
  { id: "LebahPelikan", component: LebahPelikan, durationInFrames: LEBAH_FRAMES },
  { id: "KelinciSinga", component: KelinciSinga, durationInFrames: KELINCI_FRAMES },
  { id: "KudaLautPaus", component: KudaLautPaus, durationInFrames: KUDALAUT_FRAMES },
  { id: "BadakJawa", component: BadakJawa, durationInFrames: BADAK_FRAMES },
  { id: "KucingJerapah", component: KucingJerapah, durationInFrames: KUCING_FRAMES },
  { id: "UburUburHiu", component: UburUburHiu, durationInFrames: UBURUBUR_FRAMES },
  { id: "BangauCamar", component: BangauCamar, durationInFrames: BANGAU_FRAMES },
  { id: "PenguinUdang", component: PenguinUdang, durationInFrames: PENGUIN_FRAMES },
  { id: "AnjingPanda", component: AnjingPanda, durationInFrames: ANJING_FRAMES },
  { id: "FlamingoPipit", component: FlamingoPipit, durationInFrames: FLAMINGO_FRAMES },
  { id: "PelikanGagak", component: PelikanGagak, durationInFrames: PELIKAN_FRAMES },
  { id: "SingaMonyet", component: SingaMonyet, durationInFrames: SINGA_FRAMES },
  { id: "PausKepiting", component: PausKepiting, durationInFrames: PAUS_FRAMES },
  { id: "CamarAngsa", component: CamarAngsa, durationInFrames: CAMAR_FRAMES },
  { id: "HiuBintangLaut", component: HiuBintangLaut, durationInFrames: HIU_FRAMES },
  { id: "JerapahKanguru", component: JerapahKanguru, durationInFrames: JERAPAH_FRAMES },
] as const;

const Root: React.FC = () => React.createElement(React.Fragment, null,
  ...COMPS.map((c) => React.createElement(Composition, {
    id: c.id,
    component: c.component,
    durationInFrames: c.durationInFrames,
    fps: 30,
    width: 1080,
    height: 1920,
  })),
);
registerRoot(Root);
