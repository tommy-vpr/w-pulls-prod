"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CsvImportModal } from "@/components/products/csv-import-modal";

export function CsvImportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-10 border-zinc-700 bg-zinc-900 px-5 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100"
      >
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Import CSV
      </Button>

      <CsvImportModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
