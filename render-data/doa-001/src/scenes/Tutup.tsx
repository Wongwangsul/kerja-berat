import React from 'react';
import {spring} from 'remotion';
import type {Scene} from '../script';
import {COLORS, poppins} from '../theme';
import {Camera} from '../components/Camera';
import {SceneShell, useSceneClock} from '../components/scene-ui';
import {lerp} from '../components/helpers';
import {ChildGirl, DiningStage, SmallSun} from '../components/stage';

/**
 * TUTUP — spanduk pengingat lembut di atas, matahari kecil cerah
 * di kanan atas. Anak beristirahat pada tutup-1 dan melambai
 * lagi pada tutup-2 ("Dadah!").
 */
export const TutupScene: React.FC<{scene: Scene}> = ({scene}) => {
  const {frame, fps, lt, at} = useSceneClock(scene);
  const [c1, c2] = scene.clauses;

  const zoom = lerp(lt, [0, scene.end - scene.start], [1.03, 1.0]);
  const bannerIn = spring({frame: frame - 3, fps, config: {damping: 14, stiffness: 110}});

  return (
    <SceneShell scene={scene}>
      <Camera scale={zoom}>
        <DiningStage figure={<ChildGirl pose={at >= c2.start ? 'wave' : 'rest'} />} />
        <SmallSun cx={1706} cy={150} r={52} />
        <div
          style={{
            position: 'absolute',
            left: 430,
            top: 58,
            width: 1060,
            height: 92,
            borderRadius: 46,
            backgroundColor: COLORS.green,
            boxShadow: '0 10px 26px rgba(31,122,77,0.30)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `translateY(${-130 * (1 - bannerIn)}px)`,
            opacity: Math.min(1, bannerIn * 1.5),
            fontFamily: poppins,
            fontWeight: 700,
            fontSize: 42,
            color: COLORS.cream,
            whiteSpace: 'nowrap',
          }}
        >
          Jangan lupa baca doa sebelum makan!
        </div>
      </Camera>
    </SceneShell>
  );
};
