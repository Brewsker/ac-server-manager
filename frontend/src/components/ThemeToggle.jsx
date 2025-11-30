import { useTheme } from '../contexts/ThemeContext';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', icon: '☀️', label: 'Light' },
    { value: 'dark', icon: '🌙', label: 'Dark' },
    { value: 'system', icon: '💻', label: 'System' }
  ];

  const currentIndex = themes.findIndex(t => t.value === theme);
  const currentTheme = themes[currentIndex];

  const cycleTheme = () => {
    const nextIndex = (currentIndex + 1) % themes.length;
    console.log('[ThemeToggle] Cycling from', theme, 'to', themes[nextIndex].value);
    setTheme(themes[nextIndex].value);
  };

  return (
    <button
      onClick={cycleTheme}
      className="w-full p-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 text-gray-300"
      title={`Theme: ${currentTheme.label} (click to cycle)`}
    >
      <span className="text-2xl">{currentTheme.icon}</span>
      <span className="text-sm font-medium">{currentTheme.label}</span>
    </button>
  );
}

export default ThemeToggle;
