import { Globe, User, Mail, ShieldCheck, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <div className="dash settings-page-view">
      <div className="page-header"><h1>Settings</h1><p className="card-sub">Your account and workspace appearance.</p></div>
      <div className="settings-content-wrapper">
        <section className="settings-group-block" aria-labelledby="appearance-heading">
          <div className="settings-group-header"><h2 id="appearance-heading" className="settings-group-title">Appearance</h2><p className="settings-group-sub">Choose a look for every workspace, including the admin console.</p></div>
          <div className="card settings-box-card"><div className="card-bd settings-appearance-options" role="group" aria-label="Theme">
            {[{ value:'light', label:'Light', icon:Sun }, { value:'dark', label:'Dark', icon:Moon }].map(({ value, label, icon:Icon }) => <button key={value} className={`btn ${theme === value ? 'btn-primary' : 'btn-ghost'}`} aria-pressed={theme === value} onClick={() => setTheme(value)}><Icon size={18} />{label}</button>)}
          </div></div>
        </section>
        <section className="settings-group-block" aria-labelledby="account-heading">
          <div className="settings-group-header"><h2 id="account-heading" className="settings-group-title">Account</h2><p className="settings-group-sub">Details for your signed-in account.</p></div>
          <div className="card settings-box-card"><dl className="settings-account-details">
            <div><dt><User size={17} />Username</dt><dd>{user?.username || 'Not available'}</dd></div>
            <div><dt><Mail size={17} />Email</dt><dd>{user?.email || 'Not available'}</dd></div>
            <div><dt><ShieldCheck size={17} />Account role</dt><dd>{user?.role === 'ADMIN' ? 'Administrator' : 'Member'}</dd></div>
          </dl></div>
          <p className="settings-service-note">Email changes, password changes, and account deletion are not available here yet.</p>
        </section>
        <section className="settings-group-block" aria-labelledby="device-heading">
          <div className="settings-group-header"><h2 id="device-heading" className="settings-group-title">This device</h2><p className="settings-group-sub">Appearance is saved in this browser.</p></div>
          <div className="card settings-box-card"><dl className="settings-account-details">
            <div><dt><Globe size={17} />Device timezone</dt><dd>{timezone}</dd></div>
            <div><dt><Monitor size={17} />Display preference</dt><dd>{theme === 'dark' ? 'Dark' : 'Light'}</dd></div>
          </dl></div>
        </section>
      </div>
    </div>
  );
}
