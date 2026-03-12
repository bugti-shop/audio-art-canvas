import { BottomNavigation } from '@/components/BottomNavigation';
import { ChevronRight, Crown } from 'lucide-react';
import appLogo from '@/assets/app-logo.png';
import { useSettingsPageState } from '@/hooks/useSettingsPageState';
import { SettingsDialogs } from '@/components/settings/SettingsDialogs';
import { SettingsSheets } from '@/components/settings/SettingsSheets';

const Settings = () => {
  const state = useSettingsPageState();
  const { t, navigate, isProSub, requireFeature, isBackingUp } = state;

  // Unified row style component
  const SettingsRow = ({ label, onClick }: { label: React.ReactNode; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 border-b border-border hover:bg-muted transition-colors"
    >
      <span className="text-foreground text-sm">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );

  // Section heading component
  const SectionHeading = ({ title }: { title: string }) => (
    <div className="px-4 py-2 bg-muted/50">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</span>
    </div>
  );

  return (
    <div className="min-h-screen min-h-screen-dynamic bg-background pb-16 sm:pb-20">
      <header className="border-b sticky top-0 bg-card z-10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="container mx-auto px-2 xs:px-3 sm:px-4 py-2 xs:py-3 sm:py-4">
          <div className="flex items-center gap-1.5 xs:gap-2 min-w-0">
            <img src={appLogo} alt="Npd" className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 flex-shrink-0" />
            <h1 className="text-base xs:text-lg sm:text-xl font-bold truncate">{t('settings.title')}</h1>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-2 xs:px-3 sm:px-4 py-3 xs:py-4 sm:py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Preferences Section */}
          <div className="border border-border rounded-lg overflow-hidden" data-tour="settings-preferences">
            <SectionHeading title={t('settings.preferences', 'Preferences')} />
            <SettingsRow label={t('settings.appearance')} onClick={() => state.setShowThemeDialog(true)} />
            <SettingsRow label={t('settings.language')} onClick={() => state.setShowLanguageDialog(true)} />
            <SettingsRow label={<>{t('settings.noteTypeVisibility', 'Note Type Visibility')} {!isProSub && <Crown className="h-3.5 w-3.5 inline ml-1" style={{ color: '#3c78f0' }} />}</>} onClick={() => { if (requireFeature('notes_type_visibility')) state.setShowNoteTypeVisibilitySheet(true); }} />
            <SettingsRow label={<>{t('settings.notesSettings', 'Notes Settings')} {!isProSub && <Crown className="h-3.5 w-3.5 inline ml-1" style={{ color: '#3c78f0' }} />}</>} onClick={() => { if (requireFeature('notes_settings')) state.setShowNotesSettingsSheet(true); }} />
            <SettingsRow label={<>{t('settings.tasksSettings', 'Tasks Settings')} {!isProSub && <Crown className="h-3.5 w-3.5 inline ml-1" style={{ color: '#3c78f0' }} />}</>} onClick={() => { if (requireFeature('tasks_settings')) state.setShowTasksSettingsSheet(true); }} />
            <SettingsRow label={<>{t('settings.customizeNavigation', 'Customize Navigation')} {!isProSub && <Crown className="h-3.5 w-3.5 inline ml-1" style={{ color: '#3c78f0' }} />}</>} onClick={() => { if (requireFeature('customize_navigation')) state.setShowCustomizeNavigationSheet(true); }} />
          </div>

          {/* Security Section */}
          <div className="border border-border rounded-lg overflow-hidden" data-tour="settings-security">
            <SectionHeading title={t('settings.security', 'Security')} />
            <SettingsRow label={<>{t('settings.appLock', 'App Lock')} {!isProSub && <Crown className="h-3.5 w-3.5 inline ml-1" style={{ color: '#3c78f0' }} />}</>} onClick={() => { if (requireFeature('app_lock')) state.setShowAppLockSettingsSheet(true); }} />
          </div>

          {/* Data Management Section */}
          <div className="border border-border rounded-lg overflow-hidden" data-tour="settings-data">
            <SectionHeading title={t('settings.dataManagement', 'Data Management')} />
            <button
              onClick={() => { if (requireFeature('backup')) state.handleBackupData(); }}
              disabled={isBackingUp}
              className="w-full flex items-center justify-between px-4 py-3 border-b border-border hover:bg-muted transition-colors disabled:opacity-50"
            >
              <span className="text-foreground text-sm flex items-center gap-1">
                {isBackingUp ? t('settings.backingUp', 'Backing up...') : t('settings.backupData')}
                {!isProSub && <Crown className="h-3.5 w-3.5" style={{ color: '#3c78f0' }} />}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <SettingsRow label={t('settings.restoreData')} onClick={state.handleRestoreData} />
            <SettingsRow label={t('settings.downloadData')} onClick={state.handleDownloadData} />
            <div className="border-b-0">
              <SettingsRow label={t('settings.deleteData')} onClick={state.handleDeleteData} />
            </div>
          </div>

          {/* Account Section */}
          <div className="border border-border rounded-lg overflow-hidden">
            <SectionHeading title={t('settings.account', 'Account')} />
            <button
              onClick={() => { state.setDeleteAccountConfirmText(''); state.setShowDeleteAccountDialog(true); }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-destructive/10 transition-colors"
            >
              <span className="text-destructive text-sm font-medium">{t('settings.deleteAccount', 'Delete Account')}</span>
              <ChevronRight className="h-4 w-4 text-destructive/60" />
            </button>
          </div>

          {/* About & Support Section */}
          <div className="border border-border rounded-lg overflow-hidden">
            <SectionHeading title={t('settings.aboutSupport', 'About & Support')} />
            <SettingsRow label={t('settings.shareWithFriends')} onClick={state.handleShareApp} />
            <SettingsRow label={t('settings.termsOfService')} onClick={() => state.setShowTermsDialog(true)} />
            <SettingsRow label={t('settings.helpFeedback')} onClick={() => state.setShowHelpDialog(true)} />
            <SettingsRow label={t('settings.privacy')} onClick={() => window.open('https://docs.google.com/document/d/1YY5k6mXOKJtiZjEb9ws6Aq7UQbStGy-I/edit?usp=drivesdk&ouid=105643538765333343845&rtpof=true&sd=true', '_blank')} />
            <SettingsRow label={t('settings.rateApp')} onClick={state.handleRateAndShare} />
            <SettingsRow label={t('settings.whatsNew', "What's New")} onClick={() => window.dispatchEvent(new CustomEvent('showWhatsNew'))} />
            <div className="border-b-0">
              <SettingsRow label={t('settings.featureTour', 'Feature Tour')} onClick={() => {
                window.dispatchEvent(new CustomEvent('replayFeatureTour'));
                navigate('/');
              }} />
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation />

      {/* All dialogs */}
      <SettingsDialogs
        showDeleteDialog={state.showDeleteDialog}
        setShowDeleteDialog={state.setShowDeleteDialog}
        confirmDeleteData={state.confirmDeleteData}
        showDeleteAccountDialog={state.showDeleteAccountDialog}
        setShowDeleteAccountDialog={state.setShowDeleteAccountDialog}
        deleteAccountConfirmText={state.deleteAccountConfirmText}
        setDeleteAccountConfirmText={state.setDeleteAccountConfirmText}
        handleDeleteAccount={state.handleDeleteAccount}
        showRestoreDialog={state.showRestoreDialog}
        setShowRestoreDialog={state.setShowRestoreDialog}
        confirmRestoreData={state.confirmRestoreData}
        showTermsDialog={state.showTermsDialog}
        setShowTermsDialog={state.setShowTermsDialog}
        showPrivacyDialog={state.showPrivacyDialog}
        setShowPrivacyDialog={state.setShowPrivacyDialog}
        showHelpDialog={state.showHelpDialog}
        setShowHelpDialog={state.setShowHelpDialog}
        showThemeDialog={state.showThemeDialog}
        setShowThemeDialog={state.setShowThemeDialog}
        currentTheme={state.currentTheme}
        setTheme={state.setTheme}
        isProSub={state.isProSub}
        requireFeature={state.requireFeature}
        onOpenCustomTheme={() => { state.setShowThemeDialog(false); state.setShowCustomThemeSheet(true); }}
        showLanguageDialog={state.showLanguageDialog}
        setShowLanguageDialog={state.setShowLanguageDialog}
        handleLanguageChange={state.handleLanguageChange}
      />

      {/* All sheets */}
      <SettingsSheets
        showNoteTypeVisibilitySheet={state.showNoteTypeVisibilitySheet}
        setShowNoteTypeVisibilitySheet={state.setShowNoteTypeVisibilitySheet}
        showNotesSettingsSheet={state.showNotesSettingsSheet}
        setShowNotesSettingsSheet={state.setShowNotesSettingsSheet}
        showTasksSettingsSheet={state.showTasksSettingsSheet}
        setShowTasksSettingsSheet={state.setShowTasksSettingsSheet}
        showCustomizeNavigationSheet={state.showCustomizeNavigationSheet}
        setShowCustomizeNavigationSheet={state.setShowCustomizeNavigationSheet}
        showWidgetSettingsSheet={state.showWidgetSettingsSheet}
        setShowWidgetSettingsSheet={state.setShowWidgetSettingsSheet}
        showAppLockSettingsSheet={state.showAppLockSettingsSheet}
        setShowAppLockSettingsSheet={state.setShowAppLockSettingsSheet}
        showAppLockSetup={state.showAppLockSetup}
        setShowAppLockSetup={state.setShowAppLockSetup}
        toolbarOrder={state.toolbarOrder}
        showBackupSuccessDialog={state.showBackupSuccessDialog}
        setShowBackupSuccessDialog={state.setShowBackupSuccessDialog}
        backupFilePath={state.backupFilePath}
        showImportSheet={state.showImportSheet}
        setShowImportSheet={state.setShowImportSheet}
        showCustomThemeSheet={state.showCustomThemeSheet}
        setShowCustomThemeSheet={state.setShowCustomThemeSheet}
        activeCustomThemeId={state.activeCustomThemeId}
        onCustomThemeSelect={state.handleCustomThemeSelect}
      />
    </div>
  );
};

export default Settings;
