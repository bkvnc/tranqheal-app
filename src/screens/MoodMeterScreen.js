import React, { useState, useCallback, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { AuthenticatedUserContext } from '../providers';
import { RootLayout } from 'src/navigation/RootLayout';
import { LoadingIndicator } from '../components';
import { colorPalette, moodData } from '../utils/moodConstants';
import { Colors } from '../config';

const { width } = Dimensions.get('window');
const GRID_SIZE = 10;
const DOT_SIZE = width / (GRID_SIZE * 1.3);
const GAP_SIZE = 1;
const MAGNIFICATION_FACTOR = 1.2;

const MoodDot = React.memo(({ x, y, color, isSelected }) => {
  const animatedScale = useSharedValue(1);
  const animatedOpacity = useSharedValue(0);

  useEffect(() => {
    animatedOpacity.value = withTiming(1, { duration: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: color,
    opacity: animatedOpacity.value,
    transform: [{ scale: withTiming(isSelected ? MAGNIFICATION_FACTOR : 1, { duration: 80 }) }],
    position: 'absolute',
    left: x * (DOT_SIZE + GAP_SIZE),
    top: y * (DOT_SIZE + GAP_SIZE),
  }));

  return <Animated.View style={animatedStyle} />;
});

export const MoodMeterScreen = ({ navigation }) => {
  const { userType } = useContext(AuthenticatedUserContext);
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [loading, setLoading] = useState(true);

  const panX = useSharedValue(-1);
  const panY = useSharedValue(-1);
  
  const [selectedDot, setSelectedDot] = useState({ x: -1, y: -1 });

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, []);

  const handleGesture = useCallback(({ nativeEvent }) => {
    panX.value = nativeEvent.x;
    panY.value = nativeEvent.y;
    updateSelectedMood(nativeEvent.x, nativeEvent.y);
  }, []);

  const updateSelectedMood = (x, y) => {
    const gridX = Math.floor(x / (DOT_SIZE + GAP_SIZE));
    const gridY = Math.floor(y / (DOT_SIZE + GAP_SIZE));
    
    if (gridX !== selectedDot.x || gridY !== selectedDot.y) {
      setSelectedDot({ x: gridX, y: gridY });
  
      const isRight = gridX >= GRID_SIZE / 2;
      const isBottom = gridY >= GRID_SIZE / 2;
      let quadrant, color;

      if (isRight && isBottom) {
        quadrant = 'lowEnergyHighPleasant';
        color = colorPalette.lowEnergyHighPleasant.base;
      } else if (!isRight && isBottom) {
        quadrant = 'lowEnergyLowPleasant';
        color = colorPalette.lowEnergyLowPleasant.base;
      } else if (isRight && !isBottom) {
        quadrant = 'highEnergyHighPleasant';
        color = colorPalette.highEnergyHighPleasant.base;
      } else {
        quadrant = 'highEnergyLowPleasant';
        color = colorPalette.highEnergyLowPleasant.base;
      }

      const moodOptions = moodData[quadrant] || [];
      if (moodOptions.length === 0) {
        console.log('No moods found for this quadrant');
      }
  

      const moodIndex = (gridY % (GRID_SIZE / 2)) * (GRID_SIZE / 2) + (gridX % (GRID_SIZE / 2));
      const mood = moodOptions[moodIndex % moodOptions.length];
      setSelectedMood(mood);
      setSelectedColor(color);
    }
  };
  
  
  

  const renderMoodGrid = () => {
    const dots = [];
    Object.entries(moodData).forEach(([quadrant, moods], quadrantIndex) => {
      const color = colorPalette[quadrant].base;
      const startX = (quadrantIndex % 2) * (GRID_SIZE / 2);
      const startY = Math.floor(quadrantIndex / 2) * (GRID_SIZE / 2);

      for (let i = 0; i < GRID_SIZE / 2; i++) {
        for (let j = 0; j < GRID_SIZE / 2; j++) {
          const dotX = startX + i;
          const dotY = startY + j;
          const isSelected = dotX === selectedDot.x && dotY === selectedDot.y;

          dots.push(
            <MoodDot
              key={`${dotX}-${dotY}`}
              x={dotX}
              y={dotY}
              color={color}
              isSelected={isSelected}
            />
          );
        }
      }
    });
    return dots;
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <RootLayout screenName={'Mood'} navigation={navigation} userType={userType}>
      <View style={styles.container}>
        <Text style={styles.title}>How are you feeling right now?</Text>

        <View style={styles.gridContainer}>
          <PanGestureHandler onGestureEvent={handleGesture}>
            <View style={styles.grid}>{renderMoodGrid()}</View>
          </PanGestureHandler>
        </View>

        <View style={styles.moodTextContainer}>
          <Text style={styles.moodText}>
            {selectedMood ? "You are feeling " : "Select a mood"}
          </Text>
          {selectedMood && (
            <Text style={[styles.moodText, styles.highlightedMood, { color: selectedColor }]}>
              {selectedMood}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: selectedColor || Colors.purple }]}
          onPress={() => navigation.navigate('MoodProcess', { selectedMood })}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </RootLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  gridContainer: {
    width: '90%',
    height: '55%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  grid: {
    flex: 1,
    position: 'relative',
    padding: 10,
  },
  moodTextContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  moodText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
