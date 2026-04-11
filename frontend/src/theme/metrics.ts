/**
 * Layout metrics and spacing
 */

import { Dimensions, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');

export const metrics = {
  // Screen dimensions
  screenWidth: width,
  screenHeight: height,
  
  // Status bar
  statusBarHeight: StatusBar.currentHeight || 44,
  
  // Spacing
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  
  // Border radius
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  // Icon sizes
  icon: {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
  
  // Avatar sizes
  avatar: {
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  },
  
  // Button sizes
  button: {
    sm: { height: 32, paddingHorizontal: 12 },
    md: { height: 44, paddingHorizontal: 16 },
    lg: { height: 56, paddingHorizontal: 24 },
  },
  
  // Common layout values
  safeArea: {
    top: StatusBar.currentHeight || 44,
    bottom: 34, // Common safe area for iPhone X+
  },
  
  // Container padding
  containerPadding: 16,
  
  // Card dimensions
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  
  // Header height
  headerHeight: 56,
  
  // Tab bar
  tabBarHeight: 56,
  
  // Input height
  inputHeight: 50,
};

export default metrics;
