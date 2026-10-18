import React, { useState } from 'react';
import { FamilyMember, SheetConfig } from '../types/expense';
import { 
  X, 
  Users, 
  FileSpreadsheet, 
  Smartphone, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Check, 
  ExternalLink, 
  RefreshCw,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  Link2
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { User } from 'firebase/auth';

interface FamilySourcesSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: FamilyMember[];
  onUpdateMembers: (members: FamilyMember[]) => void;
  sheetConfig: SheetConfig;
  onUpdateSheetConfig: (config: SheetConfig) => void;
  googleUser: User | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isAuthLoading: boolean;
  onSyncSheets: () => void;
  isSyncing: boolean;
}

export const FamilySourcesSettingsModal: React.FC<FamilySourcesSettingsModalProps> = ({
  isOpen,
  onClose,
  members,
  onUpdateMembers,
  sheetConfig,
  onUpdateSheetConfig,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  isAuthLoading,
  onSyncSheets,
  isSyncing,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'members' | 'sources' | 'guide'>('members');

  // Local state for family members
  const [localMembers, setLocalMembers] = useState<FamilyMember[]>(members);

  // Local state for sheet config
  const [sheetUrl, setSheetUrl] = useState(sheetConfig.sheetIdOrUrl);
  const [sheetName, setSheetName] = useState(sheetConfig.sheetName);
  const [whatsappWebhook, setWhatsappWebhook] = useState(
    'https://script.google.com/macros/s/AKfycbx_family_ledger_webhook/exec'
  );

  // New member form
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'Parent' | 'Teen' | 'Child' | 'Partner'>('Parent');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const handleMemberChange = (id: string, field: keyof FamilyMember, value: any) => {
    setLocalMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    const newMember: FamilyMember = {
      id: `mem_${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole,
      avatarUrl: '/src/assets/images/avatar_parent_one_1792348297192.jpg',
      color: '#4f46e5',
      email: newMemberEmail.trim() || `${newMemberName.toLowerCase()}@family.com`,
      phone: newMemberPhone.trim() || '+1 (555) 000-0000',
      monthlyTargetSpend: 1500,
    };
    setLocalMembers([...localMembers, newMember]);
    setNewMemberName('');
    setNewMemberPhone('');
    setNewMemberEmail('');
  };

  const handleRemoveMember = (id: string) => {
    if (localMembers.length <= 1) return;
    setLocalMembers(localMembers.filter((m) => m.id !== id));
  };

  const handleSaveAll = () => {
    onUpdateMembers(localMembers);
    onUpdateSheetConfig({
      ...sheetConfig,
      sheetIdOrUrl: sheetUrl,
      sheetName,
      lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Connect Sources, Names &amp; Phone Numbers
            </h2>
            <p className="text-xs text-slate-500">
              Configure your Google Sheet/Form database, update family profiles, and link WhatsApp
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'members'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Family Members &amp; Phone Numbers ({localMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sources')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'sources'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Data Sources (Sheets, Form &amp; WhatsApp)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'guide'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Step-by-Step Connection Guide
          </button>
        </div>

        {/* Tab 1: Family Members & Numbers */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="text-xs text-slate-600">
              Customize family names and phone numbers. When receipts arrive via your Google Form or WhatsApp, FamilyLedger matches the respondent&apos;s name or phone number to these profiles:
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {localMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Profile ID: <span className="font-mono text-slate-500">{member.id}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Assigned role: {member.role}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        onChange={(e) => handleMemberChange(member.id, 'role', e.target.value)}
                        className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 text-slate-700 font-medium"
                      >
                        <option value="Parent">Parent</option>
                        <option value="Partner">Partner</option>
                        <option value="Teen">Teen</option>
                        <option value="Child">Child</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200/50"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Full Name</label>
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)}
                        className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-indigo-500"
                        placeholder="e.g. Carlos Ramirez"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>WhatsApp / Phone</span>
                      </label>
                      <input
                        type="text"
                        value={member.phone || ''}
                        onChange={(e) => handleMemberChange(member.id, 'phone', e.target.value)}
                        className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-indigo-500"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>Form Email Match</span>
                      </label>
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) => handleMemberChange(member.id, 'email', e.target.value)}
                        className="w-full text-xs font-sans bg-white border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-indigo-500"
                        placeholder="user@gmail.com"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Family Member Card */}
            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-3">
              <div className="text-xs font-bold text-slate-900">Add New Family Member</div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Member Name (e.g. Mateo)"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                />
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-700"
                >
                  <option value="Parent">Parent</option>
                  <option value="Partner">Partner</option>
                  <option value="Teen">Teen</option>
                  <option value="Child">Child</option>
                </select>
                <input
                  type="text"
                  placeholder="WhatsApp Number"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Data Sources (Sheets, Form & WhatsApp) */}
        {activeTab === 'sources' && (
          <div className="space-y-4 text-xs">
            {/* Google Sheets / Form Connection */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>1. Google Sheets &amp; Google Form Responses Database</span>
                </div>
                {googleUser ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Google Account Connected
                  </span>
                ) : (
                  <GoogleSignInButton
                    onClick={onGoogleSignIn}
                    isLoading={isAuthLoading}
                    text="Sign in with Google"
                    className="py-1 px-2.5 text-[11px]"
                  />
                )}
              </div>

              <p className="text-slate-600 text-[11px]">
                Enter the spreadsheet URL where your Google Form saves responses (or pick from Google Drive):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Google Sheet URL</label>
                  <input
                    type="text"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Tab Name</label>
                  <input
                    type="text"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    placeholder="Respuestas de formulario 1"
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Default: &quot;Respuestas de formulario 1&quot; or &quot;Family_Receipts_AI&quot;
                </span>
                <button
                  type="button"
                  onClick={onSyncSheets}
                  disabled={isSyncing}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Webhook Endpoint */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>2. WhatsApp / Telegram Webhook Gateway</span>
                </div>
                <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono font-semibold">
                  Zero Friction
                </span>
              </div>

              <p className="text-slate-600 text-[11px]">
                The Google Apps Script Web App URL deployed on your spreadsheet. When photos are sent to your family WhatsApp number, it writes directly to your sheet:
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Apps Script Web App URL</label>
                <input
                  type="text"
                  value={whatsappWebhook}
                  onChange={(e) => setWhatsappWebhook(e.target.value)}
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Step-by-Step Connection Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-4 text-xs leading-relaxed text-slate-700">
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
              <h3 className="font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>How Your Pipeline Works (Form + WhatsApp + Sheets + Dashboard)</span>
              </h3>
              <p className="text-[11px] text-indigo-800">
                You do not need to rebuild anything. FamilyLedger connects to your existing Google Form spreadsheet as its live database.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-mono">
                    1
                  </span>
                  <span>Connect your Google Form&apos;s Spreadsheet</span>
                </div>
                <p className="text-slate-600 text-[11px] pl-7">
                  Open your Google Form &gt; click the <strong>&quot;Responses&quot;</strong> tab &gt; click <strong>&quot;View in Sheets&quot;</strong>. Copy the URL from your browser address bar and paste it into the <em>Data Sources</em> tab above.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-mono">
                    2
                  </span>
                  <span>Match Family Names &amp; Phone Numbers</span>
                </div>
                <p className="text-slate-600 text-[11px] pl-7">
                  In the <em>Family Members</em> tab above, enter your family members&apos; real names (e.g. your name, partner, kids), their WhatsApp phone numbers, and Google account emails. When a response is logged, FamilyLedger automatically assigns it to the right person!
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-mono">
                    3
                  </span>
                  <span>Review, Approve &amp; Verify</span>
                </div>
                <p className="text-slate-600 text-[11px] pl-7">
                  All captured tickets appear in the <strong>Approve &amp; Verify</strong> feed. Once you review the parsed items and split, click <strong>Verify</strong> to write the status back to your Google Sheet database row.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            {localMembers.length} family profiles configured
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
            >
              Save Members &amp; Sources
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
