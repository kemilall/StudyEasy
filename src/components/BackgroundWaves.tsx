import React from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface BackgroundWavesProps {
  opacity?: number;
  color?: string;
}

export const BackgroundWaves: React.FC<BackgroundWavesProps> = ({
  opacity = 0.08,
  color = '#C9B6E4',
}) => {
  // Create soft wave paths
  const wavePath1 = `
    M0,${height * 0.3}
    C${width * 0.2},${height * 0.25} ${width * 0.4},${height * 0.35} ${width * 0.6},${height * 0.3}
    C${width * 0.8},${height * 0.25} ${width},${height * 0.3} ${width},${height * 0.4}
    L${width},${height}
    L0,${height}
    Z
  `;

  const wavePath2 = `
    M0,${height * 0.6}
    C${width * 0.3},${height * 0.5} ${width * 0.5},${height * 0.65} ${width * 0.7},${height * 0.6}
    C${width * 0.9},${height * 0.55} ${width},${height * 0.6} ${width},${height * 0.7}
    L${width},${height}
    L0,${height}
    Z
  `;

  const wavePath3 = `
    M0,${height * 0.8}
    C${width * 0.25},${height * 0.75} ${width * 0.45},${height * 0.85} ${width * 0.65},${height * 0.8}
    C${width * 0.85},${height * 0.75} ${width},${height * 0.8} ${width},${height * 0.9}
    L${width},${height}
    L0,${height}
    Z
  `;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ opacity }}
      >
        <Defs>
          <LinearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.03} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.01} />
          </LinearGradient>
          <LinearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.02} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.005} />
          </LinearGradient>
          <LinearGradient id="waveGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.015} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.003} />
          </LinearGradient>
        </Defs>

        {/* Wave layer 1 */}
        <Path
          d={wavePath1}
          fill="url(#waveGradient1)"
          opacity={0.8}
        />

        {/* Wave layer 2 */}
        <Path
          d={wavePath2}
          fill="url(#waveGradient2)"
          opacity={0.6}
        />

        {/* Wave layer 3 */}
        <Path
          d={wavePath3}
          fill="url(#waveGradient3)"
          opacity={0.4}
        />
      </Svg>
    </View>
  );
};

