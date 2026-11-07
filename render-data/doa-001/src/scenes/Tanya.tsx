import React from 'react';
import {spring} from 'remotion';
import type {Scene} from '../script';
import {COLORS, poppins} from '../theme';
import {Camera} from '../components/Camera';
import {SceneShell, useSceneClock} from '../components/scene-ui';
import {lerp} from '../components/helpers';
import {ChildGirl, DiningStage} from '../components/stage';

/**
 * TANYA — pada tanya-1 tangan anak memberi isyarat berhenti;
 * pada tanya-2 gelembung pikir dengan tanda tanya besar "?"
 * muncul memantul (spring) dan bergoyang halus.
 */
export const TanyaScene: React.FC<{scene: Scene}> = ({scene}) => {
  const {frame, fps, lt, at} = useSceneClock(scene);
  const [c1, c2] = scene.clauses;

  const zoom = lerp(lt, [0, scene.end - scene.start], [1.02, 1.08]);
  const asking = at >= c2.start;
  const bubbleFrame = frame - Math.round((c2.start - scene.start) * fps);
  const bubbleScale = asking ? spring({frame: bubbleFrame, fps, config: {damping: 11, stiffness: 120}}) : 0;
  const bobY = Math.sin(frame * 0.05) * 6;

  return (
    <SceneShell scene={scene}>
      <Camera scale={zoom}>
        <DiningStage figure={<ChildGirl pose={asking ? 'rest' : 'stop'} />} />
        {asking ? (
          <>
            <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
              <circle cx={1158} cy={322} r={14} fill="#FFFFFF" />
              <circle cx={1222} cy={274} r={24} fill="#FFFFFF" />
            </svg>
            <div
              style={{
                position: 'absolute',
                left: 1268,
                top: 92 + bobY,
                width: 304,
                height: 196,
                backgroundColor: '#FFFFFF',
                borderRadius: '50%',
                boxShadow: '0 10px 30px rgba(38,50,56,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${bubbleScale})`,
                fontFamily: poppins,
                fontWeight: 700,
                fontSize: 118,
                color: COLORS.green,
              }}
            >
              ?
            </div>
          </>
        ) : null}
      </Camera>
    </SceneShell>
  );
};
