import React from 'react';
import {spring} from 'remotion';
import type {Scene} from '../script';
import {COLORS} from '../theme';
import {Camera} from '../components/Camera';
import {BigText, SceneShell, useSceneClock} from '../components/scene-ui';
import {lerp, prog} from '../components/helpers';
import {ChildGirl, DiningStage} from '../components/stage';

/**
 * SAPA — anak perempuan berhijab melambaikan tangan di meja makan,
 * cahaya jendela hangat. Judul kecil "Doa Sebelum Makan" tampil
 * singkat selama klausa pertama.
 */
export const SapaScene: React.FC<{scene: Scene}> = ({scene}) => {
  const {frame, fps, lt, at} = useSceneClock(scene);
  const [c1, c2] = scene.clauses;

  const zoom = lerp(lt, [0, scene.end - scene.start], [1.0, 1.06]);
  const titleIn = spring({frame: frame - 6, fps, config: {damping: 13, stiffness: 110}});
  const titleOut = prog(at, c2.start + 0.3, c2.end - 0.35);
  const titleOpacity = Math.max(0, Math.min(1, titleIn) - titleOut);

  return (
    <SceneShell scene={scene}>
      <Camera scale={zoom}>
        <DiningStage figure={<ChildGirl pose="wave" />} />
        <div style={{opacity: titleOpacity}}>
          <BigText x={360} y={64} width={1200} align="center" size={66} color={COLORS.green} appear={titleIn}>
            Doa Sebelum Makan
          </BigText>
        </div>
      </Camera>
    </SceneShell>
  );
};
