"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/context/I18nContext";

export function ContactModal({
  open,
  onOpenChange,
  proprietaireNom,
  materielNom,
  message,
  onMessageChange,
  sending = false,
  error = null,
  onCancel,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proprietaireNom: string;
  materielNom: string;
  message: string;
  onMessageChange: (value: string) => void;
  sending?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSend: () => void;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("catalogue.contact_title_prefix")} {proprietaireNom || t("auth.role_proprietaire")}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label className="mb-2 block">{t("catalogue.your_message")}</Label>
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder={t("catalogue.contact_placeholder").replace("{materiel}", materielNom)}
            disabled={sending}
            className="min-h-[120px] w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-60"
          />
          {error && (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={sending}>{t("common.cancel")}</Button>
          <Button onClick={onSend} disabled={sending} className="bg-slate-900 hover:bg-slate-800">
            {sending ? t("auth.sending") : t("catalogue.send_message")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
