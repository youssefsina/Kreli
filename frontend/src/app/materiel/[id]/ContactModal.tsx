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
  onCancel,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proprietaireNom: string;
  materielNom: string;
  message: string;
  onMessageChange: (value: string) => void;
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
            className="min-h-[120px] w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>{t("common.cancel")}</Button>
          <Button onClick={onSend} className="bg-slate-900 hover:bg-slate-800">
            {t("catalogue.send_message")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
