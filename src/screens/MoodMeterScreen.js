import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolateColor } from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';
import { RootLayout } from '../navigation/RootLayout';

const { width, height } = Dimensions.get('window');
const GRID_SIZE = 10;
const DOT_SIZE = Math.min(width, height) / (GRID_SIZE * 1.5);
const GAP_SIZE = 1;
const MAGNIFICATION_FACTOR = 1.5;
const GRID_WIDTH = GRID_SIZE * (DOT_SIZE + GAP_SIZE) - GAP_SIZE;

const colorPalette = {
  highEnergyLowPleasant: { base: '#CC3300', highlight: '#FF6347' },
  highEnergyHighPleasant: { base: '#CC9900', highlight: '#FFD700' },
  lowEnergyLowPleasant: { base: '#006699', highlight: '#4682B4' },
  lowEnergyHighPleasant: { base: '#006600', highlight: '#32CD32' }
};

const moodData = {
  highEnergyLowPleasant: [
    'Enraged', 'Panicked', 'Stressed', 'Jittery', 'Shocked',
    'Livid', 'Furious', 'Frustrated', 'Tensed', 'Stunned',
    'Fuming', 'Frightened', 'Angry', 'Nervous', 'Restless',
    'Anxious', 'Apprehensive', 'Worried', 'Irritated', 'Annoyed',
    'Repulsed', 'Troubled', 'Concerned', 'Uneasy', 'Peeved'
  ],
  highEnergyHighPleasant: [
    'Surprised', 'Upbeat', 'Festive', 'Exhilarated', 'Estatic',
    'Hyper', 'Cheerful', 'Motivated', 'Inspired', 'Elated',
    'Energized', 'Lively', 'Excited', 'Optimistic', 'Enthusiastic',
    'Pleased', 'Focused', 'Happy', 'Proud', 'Thrilled', 
    'Pleasant', 'Joyful', 'Hopeful', 'Playful', 'Blissful'
  ],
  lowEnergyLowPleasant: [
    'Disgusted', 'Glum', 'Disappointed', 'Down', 'Apathetic',
    'Pessimistic', 'Morose', 'Discouraged', 'Sad', 'Bored',
    'Allenated', 'Miserable', 'Lonely', 'Disheartened', 'Tired',
    'Despondent', 'Depressed', 'Sullen', 'Exhausted', 'Fatigued',
    'Despairing', 'Hopeless', 'Desolate', 'Spent', 'Drained'
  ],
  lowEnergyHighPleasant: [
    'At ease', 'Easygoing', 'Content', 'Loving', 'Fulfilled',
    'Calm', 'Secure', 'Satisfied', 'Grateful', 'Touched',
    'Relaxed', 'Chill', 'Restful', 'Blessed', 'Balanced',
    'Mellow', 'Thoughtful', 'Peaceful', 'Comfortable', 'Carefree',
    'Sleepy', 'Complacent', 'Tranquil', 'Dozy', 'Serene'
  ]
};


const MoodDot = React.memo(({ x, y, colorInfo, panX, panY, moodIndex, isInteracting }) => {
  const animatedScale = useSharedValue(1);
  const animatedTranslateX = useSharedValue(0);
  const animatedTranslateY = useSharedValue(0);
  const animatedOpacity = useSharedValue(0);
  const animatedZIndex = useSharedValue(0);
  const animatedColorProgress = useSharedValue(0);

  React.useEffect(() => {
    animatedOpacity.value = withTiming(1, { duration: 300 });
    return () => {
      // Cleanup function
      animatedOpacity.value = 0;
    };
  }, [animatedOpacity]);

  const animatedStyle = useAnimatedStyle(() => {
    const dotCenterX = x * (DOT_SIZE + GAP_SIZE) + DOT_SIZE / 2;
    const dotCenterY = y * (DOT_SIZE + GAP_SIZE) + DOT_SIZE / 2;
    const dx = dotCenterX - panX.value;
    const dy = dotCenterY - panY.value;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let scaleFactor = 1;
    let repulsionDistance = 0;

    if (isInteracting.value && distance < DOT_SIZE / 2) {
      scaleFactor = MAGNIFICATION_FACTOR;
      animatedColorProgress.value = withTiming(1, { duration: 150 });
    } else {
      animatedColorProgress.value = withTiming(0, { duration: 150 });
    }

    const angle = Math.atan2(dy, dx);
    const translateX = Math.cos(angle) * repulsionDistance;
    const translateY = Math.sin(angle) * repulsionDistance;

    animatedScale.value = withTiming(scaleFactor, { duration: 150, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    animatedTranslateX.value = withTiming(translateX, { duration: 150, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    animatedTranslateY.value = withTiming(translateY, { duration: 150, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
    animatedZIndex.value = isInteracting.value && distance < DOT_SIZE ? 10 : 0;

    return {
      width: DOT_SIZE,
      height: DOT_SIZE,
      opacity: animatedOpacity.value,
      left: x * (DOT_SIZE + GAP_SIZE),
      top: y * (DOT_SIZE + GAP_SIZE),
      zIndex: animatedZIndex.value,
      borderRadius: DOT_SIZE / 2,
      overflow: 'hidden',
      transform: [
        { translateX: animatedTranslateX.value },
        { translateY: animatedTranslateY.value },
        { scale: animatedScale.value }
      ],
    };
  });

  const animatedColor = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animatedColorProgress.value,
      [0, 1],
      [colorInfo.base, colorInfo.highlight]
    );

    return { backgroundColor };
  });

  const moodLabel = moodData[moodIndex] ? moodData[moodIndex].join(', ') : 'Unknown mood';

  return (
    <Animated.View style={[styles.moodDot, animatedStyle, animatedColor]} accessibilityLabel={`Mood dot for ${moodLabel}`}>
      <LinearGradient
        colors={[colorInfo.highlight, colorInfo.base]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
});

MoodDot.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  colorInfo: PropTypes.shape({
    base: PropTypes.string,
    highlight: PropTypes.string,
  }).isRequired,
  panX: PropTypes.object.isRequired,
  panY: PropTypes.object.isRequired,
  moodIndex: PropTypes.string.isRequired,
  isInteracting: PropTypes.object.isRequired,
};

const MoodGrid = React.memo(({ panX, panY, isInteracting }) => {
  return (
    <>
      {Object.entries(moodData).map(([quadrant, moods], quadrantIndex) => {
        const colorInfo = Object.values(colorPalette)[quadrantIndex];
        const startX = (quadrantIndex % 2) * (GRID_SIZE / 2);
        const startY = Math.floor(quadrantIndex / 2) * (GRID_SIZE / 2);

        return Array.from({ length: GRID_SIZE / 2 }, (_, i) =>
          Array.from({ length: GRID_SIZE / 2 }, (_, j) => (
            <MoodDot
              key={`${startX + i}-${startY + j}`}
              x={startX + i}
              y={startY + j}
              colorInfo={colorInfo}
              panX={panX}
              panY={panY}
              moodIndex={quadrant}
              isInteracting={isInteracting}
            />
          ))
        ).flat();
      })}
    </>
  );
});

MoodGrid.propTypes = {
  panX: PropTypes.object.isRequired,
  panY: PropTypes.object.isRequired,
  isInteracting: PropTypes.object.isRequired,
};

export const MoodMeterScreen = ({ navigation }) => {
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const isInteracting = useSharedValue(false);

  const handleGestureStart = useCallback(() => {
    isInteracting.value = true;
  }, [isInteracting]);

  const handleGestureEnd = useCallback(() => {
    isInteracting.value = false;
    panX.value = -1; // Set to a value outside the grid
    panY.value = -1;
  }, [isInteracting, panX, panY]);

  const handleGesture = useCallback(({ nativeEvent }) => {
    const x = nativeEvent.x;
    const y = nativeEvent.y;
    panX.value = x;
    panY.value = y;

    updateSelectedMood(x, y);
  }, []);

  const updateSelectedMood = useCallback((x, y) => {
    const gridX = Math.floor(x / (DOT_SIZE + GAP_SIZE));
    const gridY = Math.floor(y / (DOT_SIZE + GAP_SIZE));
    
    if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
      const quadrantIndex = (gridX >= GRID_SIZE / 2 ? 1 : 0) + (gridY >= GRID_SIZE / 2 ? 2 : 0);
      const quadrant = Object.keys(moodData)[quadrantIndex];
      const index = ((gridY % (GRID_SIZE / 2)) * (GRID_SIZE / 2) + (gridX % (GRID_SIZE / 2))) % moodData[quadrant].length;
      setSelectedMood(moodData[quadrant][index]);

      // Calculate the distance from the touch point to the center of the dot
      const dotCenterX = gridX * (DOT_SIZE + GAP_SIZE) + DOT_SIZE / 2;
      const dotCenterY = gridY * (DOT_SIZE + GAP_SIZE) + DOT_SIZE / 2;
      const dx = dotCenterX - x;
      const dy = dotCenterY - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Interpolate the color based on the distance
      const colorProgress = Math.max(0, Math.min(1, 1 - (distance / (DOT_SIZE / 2))));
      const interpolatedColor = interpolateColor(
        colorProgress,
        [0, 1],
        [colorPalette[quadrant].base, colorPalette[quadrant].highlight]
      );

      setSelectedColor(interpolatedColor);
    }
  }, []);

  return (
   <RootLayout  screenName = {'MoodMeter'} navigation={navigation}>
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling right now?</Text>

      <View style={styles.leftLabelContainer}>
        <Text style={styles.energyLabel}>High Energy</Text>
        <Text style={styles.energyLabel}>Low Energy</Text>
      </View>

      <PanGestureHandler 
        onGestureEvent={handleGesture}
        onBegan={handleGestureStart}
        onEnded={handleGestureEnd}
        onFailed={handleGestureEnd}
        onCancelled={handleGestureEnd}
      >
        <Animated.View 
          style={styles.gridContainer}
          accessible={true}
          accessibilityLabel="Mood selection grid"
          accessibilityHint="Drag your finger across the grid to select your mood"
        >
          <MoodGrid panX={panX} panY={panY} isInteracting={isInteracting} />
        </Animated.View>
      </PanGestureHandler>

      <View style={styles.bottomLabelContainer}>
        <Text style={styles.pleasantnessLabel}>Low Pleasantness</Text>
        <Text style={styles.pleasantnessLabel}>High Pleasantness</Text>
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
        style={styles.button} 
        onPress={() => navigation.navigate('Mood2')}
        accessible={true}
        accessibilityLabel="Next"
        accessibilityHint="Navigate to the next screen"
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </View>
  </RootLayout>   
  );
};

MoodMeterScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F7F9FC',
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: '#333',
  },
  gridContainer: {
    width: GRID_WIDTH,
    height: GRID_WIDTH,
    backgroundColor: '#fff',
    justifyContent: "center",
    shadowColor: "#000",
    borderRadius: 20,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginVertical: 20,
  },
  leftLabelContainer: {
    position: 'absolute',
    top: '40%',
    left: '2%',
    justifyContent: 'space-between',
    height: '20%',
  },
  bottomLabelContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    bottom: '32%',
    width: '70%',
  },
  energyLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    transform: [{ rotate: '-90deg' }],
  },
  pleasantnessLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  moodDot: {
    position: 'absolute',
    width: DOT_SIZE,
    shadowOffset: { width: 0, height: 2 },
  },
  moodTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    bottom: -20,
  },
  moodText: {
    fontSize: 20,
    textAlign: "center",
    color: '#555',
  },
  highlightedMood: {
    fontWeight: 'bold',
    marginLeft: 4,
  },
  button: {
    marginTop: 20,
    backgroundColor: "#4682B4",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    bottom: -50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});

export default MoodMeterScreen;