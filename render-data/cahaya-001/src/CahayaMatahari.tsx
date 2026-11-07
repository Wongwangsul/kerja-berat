import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile} from 'remotion';
import {SCENES, type Scene} from './script';
import {COLORS, waitForPoppins} from './theme';
import {Stars} from './components/primitives';
import {Subtitle} from './components/Subtitle';
import {HookScene} from './scenes/Hook';
import {CepatScene} from './scenes/Cepat';
import {JarakScene} from './scenes/Jarak';
import {JedaScene} from './scenes/Jeda';
import {DalamScene} from './scenes/Dalam';
import {TutupScene} from './scenes/Tutup';

const SCENE_COMPONENTS: Record<string, React.FC<{scene: Scene}>> = {
  hook: HookScene,
  cepat: CepatScene,
  jarak: JarakScene,
  jeda: JedaScene,
  dalam: DalamScene,
  tutup: TutupScene,
};

/**
 * Gerbang kesiapan:
 * 1) Font Poppins selesai dimuat.
 * 2) Keberadaan public/narasi.mp3 diperiksa (HEAD). Bila file BELUM ada,
 *    <Audio> tidak dirender sama sekali sehingga render TETAP JALAN
 *    tanpa error; bila nanti file ditambahkan, audio otomatis ikut.
 */
const useReadiness = () => {
  const [audioExists, setAudioExists] = useState(false);
  const [handle] = useState(() => delayRender('Memuat font & memeriksa narasi.mp3'));
  useEffect(() => {
    let cancelled = false;
    const audioCheck: Promise<boolean> = Promise.race([
      fetch(staticFile('narasi.mp3'), {method: 'HEAD'})
        .then((r) => r.ok)
        .catch(() => false),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 2500)),
    ]);
    Promise.all([waitForPoppins().catch(() => undefined), audioCheck]).then(([, ok]) => {
      if (cancelled) return;
      setAudioExists(ok);
      continueRender(handle);
    });
    return () => {
      cancelled = true;
    };
  }, [handle]);
  return audioExists;
};

export const CahayaMatahari: React.FC = () => {
  const audioExists = useReadiness();

  return (
    <AbsoluteFill style={{backgroundColor: COLORS.navy}}>
      {/* Audio narasi — hanya dirender bila public/narasi.mp3 ada. */}
      {audioExists ? <Audio src={staticFile('narasi.mp3')} /> : null}

      <Stars />

      {/* Setiap adegan adalah Sequence yang from/duration-nya
          DITURUNKAN dari script.ts — tidak ada angka durasi di sini. */}
      {SCENES.map((scene) => {
        const Comp = SCENE_COMPONENTS[scene.id];
        return (
          <Sequence
            key={scene.id}
            name={scene.title}
            from={Math.round(scene.start * 30)}
            durationInFrames={Math.round((scene.end - scene.start) * 30)}
            premountFor={30}
          >
            <Comp scene={scene} />
          </Sequence>
        );
      })}

      <Subtitle />
    </AbsoluteFill>
  );
};
