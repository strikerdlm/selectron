import { useEffect, useState } from "react";
import { attachFile, detachFile } from "@/db/repository";
import { db } from "@/db/schema";
import type { Attachment, CriterionEntry } from "@/db/schema";
import { notify } from "@/ui/components/Toast";
import { useWizard } from "@/contexts/WizardContext";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ["application/pdf", "image/png", "image/jpeg"];

export function AttachmentList({ entry }: { entry: CriterionEntry }) {
  const { reloadFromDb } = useWizard();
  const [items, setItems] = useState<Attachment[]>([]);

  useEffect(() => {
    (async () => {
      if (entry.attachmentKeys.length === 0) {
        setItems([]);
        return;
      }
      const rows = await db.attachments.where("id").anyOf(entry.attachmentKeys).toArray();
      setItems(rows);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.attachmentKeys.join(",")]);

  async function handleFiles(files: FileList) {
    for (const f of Array.from(files)) {
      if (f.size > MAX_BYTES) {
        notify(`${f.name} >5MB; rejected`, "error");
        continue;
      }
      if (!ALLOWED_MIME.includes(f.type)) {
        notify(`${f.name} mime ${f.type} not allowed`, "error");
        continue;
      }
      await attachFile(f, entry.id);
    }
    await reloadFromDb();
  }

  return (
    <div>
      <label className="label">attachments</label>
      <input
        type="file"
        multiple
        accept="application/pdf,image/png,image/jpeg"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="mt-1 mono block w-full text-[13px] text-ink-2 file:mr-3 file:rounded-md file:border file:border-line file:bg-bg-1 file:px-3 file:py-1.5 file:text-[13px] file:text-ink-1 file:hover:bg-bg-2"
      />
      <p className="mono mt-1 text-[12px] text-ink-3">
        max 5MB · PDF / PNG / JPG only
      </p>
      <ul className="mono mt-3 space-y-1 text-[13px]">
        {items.map((a) => (
          <li key={a.id} className="flex items-baseline justify-between">
            <span className="text-ink-1">
              📄 {a.filename}{" "}
              <span className="text-ink-3">{(a.sizeBytes / 1024).toFixed(0)} KB</span>
            </span>
            <button
              onClick={async () => {
                await detachFile(a.id, entry.id);
                await reloadFromDb();
              }}
              className="text-ink-3 hover:text-red-300"
              aria-label={`remove ${a.filename}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
