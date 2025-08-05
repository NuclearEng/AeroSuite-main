import React from 'react';
import { useThemeContext } from '../../contexts/ThemeContext';

interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: {
    email: boolean;
    browser: boolean;
    mobile: boolean;
  };
  emailNotifications: {
    newInspections: boolean;
    inspectionUpdates: boolean;
    newFindings: boolean;
    weeklyDigest: boolean;
  };
  privacy: {
    shareData: boolean;
    allowAnalytics: boolean;
  };
  display: {
    dashboardLayout: string;
    compactView: boolean;
    showAnimations: boolean;
    highContrastMode: boolean;
  };
}

interface UserSettingsProps {
  user: {
    preferences?: UserPreferences;
  };
}

export const UserSettings: React.FC<UserSettingsProps> = ({ user }) => {
  const { mode, toggleColorMode } = useThemeContext();
  const [settings, setSettings] = React.useState<UserPreferences>({
    theme: 'light',
    language: 'en',
    notifications: {
      email: true,
      browser: true,
      mobile: false,
    },
    emailNotifications: {
      newInspections: true,
      inspectionUpdates: true,
      newFindings: true,
      weeklyDigest: false,
    },
    privacy: {
      shareData: false,
      allowAnalytics: true,
    },
    display: {
      dashboardLayout: 'grid',
      compactView: false,
      showAnimations: true,
      highContrastMode: false,
    },
  });

  React.useEffect(() => {
    if (user.preferences) {
      setSettings(prevSettings => ({
        ...prevSettings,
        theme: user.preferences?.theme || prevSettings.theme,
        language: user.preferences?.language || prevSettings.language,
        notifications: {
          ...prevSettings.notifications,
          email: user.preferences?.notifications?.email ?? prevSettings.notifications.email,
          browser: user.preferences?.notifications?.browser ?? prevSettings.notifications.browser,
          mobile: user.preferences?.notifications?.mobile ?? prevSettings.notifications.mobile,
        },
        display: {
          ...prevSettings.display,
          dashboardLayout: user.preferences?.display?.dashboardLayout || prevSettings.display.dashboardLayout,
          compactView: user.preferences?.display?.compactView ?? prevSettings.display.compactView,
          showAnimations: user.preferences?.display?.showAnimations ?? prevSettings.display.showAnimations,
          highContrastMode: user.preferences?.display?.highContrastMode ?? prevSettings.display.highContrastMode,
        },
      }));
    }
  }, [user.preferences]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setSettings(prev => ({
      ...prev,
      theme: newTheme,
    }));
    toggleColorMode();
  };

  return (
    <div>
      <h1>User Settings</h1>
      <section>
        <h2>Theme</h2>
        <button onClick={() => handleThemeChange(mode === 'light' ? 'dark' : 'light')}>
          Toggle Theme
        </button>
      </section>
      {/* Add other settings sections */}
    </div>
  );
};