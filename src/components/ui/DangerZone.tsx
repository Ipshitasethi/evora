import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, MessageSquareX, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { ConfirmModal } from '../ui/ConfirmModal';

// ─── Two-step confirmation state ──────────────────────────────────────────────
type ModalState =
  | { kind: 'none' }
  | { kind: 'chat-step1' }
  | { kind: 'chat-step2' }
  | { kind: 'all-step1' }
  | { kind: 'all-step2' };

export function DangerZone() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [modal, setModal] = useState<ModalState>({ kind: 'none' });
  const [loading, setLoading] = useState(false);

  // ── Clear chat history ─────────────────────────────────────────────────────
  const clearChat = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', user.id);

    setLoading(false);
    setModal({ kind: 'none' });

    if (error) {
      showToast('Something went wrong. Please try again.', 'error');
    } else {
      showToast('Chat history cleared successfully.', 'success');
    }
  };

  // ── Delete all data ────────────────────────────────────────────────────────
  const deleteAllData = async () => {
    if (!user) return;
    setLoading(true);

    // Delete in dependency order — children before parents
    const tables = ['chat_messages', 'period_logs', 'symptom_logs', 'reminders', 'cycle_settings'] as const;
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('user_id', user.id);
      if (error) {
        setLoading(false);
        setModal({ kind: 'none' });
        showToast(`Failed to delete ${table}. Please try again.`, 'error');
        return;
      }
    }

    setLoading(false);
    setModal({ kind: 'none' });
    showToast('All your data has been cleared. Starting fresh!', 'success');

    // Redirect to onboarding so they can re-enter cycle info
    setTimeout(() => navigate('/onboarding'), 1500);
  };

  return (
    <>
      {/* ── Danger Zone card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="rounded-3xl border-2 border-terracotta/20 bg-terracotta/5 p-6 md:p-8"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-terracotta/15 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={18} className="text-terracotta" />
          </div>
          <div>
            <h2 className="font-serif text-lg text-plum">Danger Zone</h2>
            <p className="text-xs text-plum/45">
              These actions are permanent and cannot be undone.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* 1 — Clear chat */}
          <DangerRow
            icon={<MessageSquareX size={18} className="text-terracotta" />}
            title="Clear Chat History"
            description="Permanently deletes all your AI companion conversation history. Your cycle data, logs, and reminders are untouched."
            buttonLabel="Clear chat"
            onClick={() => setModal({ kind: 'chat-step1' })}
          />

          {/* Divider */}
          <div className="border-t border-terracotta/10" />

          {/* 2 — Delete all */}
          <DangerRow
            icon={<Trash2 size={18} className="text-terracotta" />}
            title="Delete All My Data"
            description="Permanently deletes your cycle settings, period logs, symptom logs, reminders, and chat history. Your login is kept. You'll go through onboarding again next time."
            buttonLabel="Delete all data"
            onClick={() => setModal({ kind: 'all-step1' })}
            severe
          />
        </div>
      </motion.div>

      {/* ── Chat modals (two-step) ── */}
      <ConfirmModal
        open={modal.kind === 'chat-step1'}
        title="Clear your chat history?"
        description="This will permanently delete all messages between you and the Evora AI companion. Your cycle data and logs will not be affected. This cannot be undone."
        confirmLabel="Yes, clear chat history"
        onCancel={() => setModal({ kind: 'none' })}
        onConfirm={() => setModal({ kind: 'chat-step2' })}
      />
      <ConfirmModal
        open={modal.kind === 'chat-step2'}
        title="Are you absolutely sure?"
        description="Final confirmation: all chat messages will be permanently deleted right now. There is no way to recover them."
        confirmLabel="Delete permanently"
        isLoading={loading}
        onCancel={() => setModal({ kind: 'none' })}
        onConfirm={clearChat}
      />

      {/* ── Delete-all modals (two-step) ── */}
      <ConfirmModal
        open={modal.kind === 'all-step1'}
        title="Delete all your data?"
        description="This will permanently erase your cycle settings, period logs, symptom logs, reminders, and AI chat history. Your account login will remain. You will need to complete onboarding again."
        confirmLabel="Yes, delete everything"
        onCancel={() => setModal({ kind: 'none' })}
        onConfirm={() => setModal({ kind: 'all-step2' })}
      />
      <ConfirmModal
        open={modal.kind === 'all-step2'}
        title="Last chance — this is permanent."
        description='Type "I understand" in your head, then click the button. Every cycle log, symptom entry, chat message, and setting will be gone forever. No recovery is possible.'
        confirmLabel="Delete all my data forever"
        isLoading={loading}
        onCancel={() => setModal({ kind: 'none' })}
        onConfirm={deleteAllData}
      />
    </>
  );
}

// ─── Row sub-component ────────────────────────────────────────────────────────
function DangerRow({
  icon,
  title,
  description,
  buttonLabel,
  onClick,
  severe = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  severe?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
      <div className="flex gap-3 items-start">
        <div className="w-8 h-8 rounded-xl bg-white/70 border border-terracotta/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          {icon}
        </div>
        <div>
          <p className="font-medium text-plum text-sm">{title}</p>
          <p className="text-xs text-plum/50 leading-relaxed mt-0.5 max-w-md">{description}</p>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={[
          'flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200',
          severe
            ? 'bg-terracotta text-white border-terracotta hover:bg-terracotta/85 shadow-sm shadow-terracotta/20'
            : 'bg-white text-terracotta border-terracotta/30 hover:bg-terracotta/10',
        ].join(' ')}
      >
        {buttonLabel}
      </motion.button>
    </div>
  );
}
