import { useThemeContext } from '../contexts/ThemeContext';
import { metrics } from '../theme/metrics';
import { typography } from '../theme/typography';

export function useTheme() {
  const theme = useThemeContext();

  return {
    ...theme,
    metrics,
    typography,
  };
}
