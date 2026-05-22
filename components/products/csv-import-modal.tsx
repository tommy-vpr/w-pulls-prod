"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Sparkles,
  Tag,
} from "lucide-react";
import { ProductCategory, ProductTier } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  importProductsFromCsvAction,
  previewTiersAction,
  type CsvRow,
  type ImportResult,
} from "@/app/actions/product-import.actions";

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/);
  const rows: CsvRow[] = [];

  let headerSeen = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!headerSeen) {
      headerSeen = true;
      continue;
    }

    const parts = line.split(",").map((p) => p.trim());
    const [title, sku, price, cost] = parts;

    if (!title || !sku || !price) continue;

    rows.push({ title, sku, price, cost: cost || "" });
  }

  return rows;
}

const CATEGORIES: ProductCategory[] = [
  "BASEBALL",
  "BASKETBALL",
  "FOOTBALL",
  "HOCKEY",
  "SOCCER",
  "POKEMON",
  "YUGIOH",
  "MAGIC_THE_GATHERING",
  "ONE_PIECE",
  "DRAGON_BALL",
  "OTHER",
];

const TIERS: ProductTier[] = [
  "COMMON",
  "UNCOMMON",
  "RARE",
  "ULTRA_RARE",
  "SECRET_RARE",
  "BANGER",
  "GRAIL",
];

const TIER_COLORS: Record<ProductTier, string> = {
  COMMON: "text-zinc-400",
  UNCOMMON: "text-emerald-400",
  RARE: "text-blue-400",
  ULTRA_RARE: "text-purple-400",
  SECRET_RARE: "text-amber-400",
  BANGER: "text-rose-400",
  GRAIL: "text-fuchsia-400",
};

const UNTAGGED_COLOR = "text-zinc-500";

interface TierPreview {
  sku: string;
  price: number;
  tier: ProductTier | null;
  fitsInPacks: string[];
}

export function CsvImportModal({ open, onClose }: CsvImportModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [tierPreviews, setTierPreviews] = useState<TierPreview[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [defaultCategory, setDefaultCategory] =
    useState<ProductCategory>("POKEMON");
  const [defaultInventory, setDefaultInventory] = useState<number>(1);
  const [autoTier, setAutoTier] = useState<boolean>(true);
  // Manual tier supports null (untagged) when autoTier is off
  const [manualTier, setManualTier] = useState<ProductTier | null>("COMMON");
  const [importing, startImport] = useTransition();
  const [previewing, startPreview] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (rows.length === 0) {
      setTierPreviews([]);
      return;
    }
    startPreview(async () => {
      const previews = await previewTiersAction(rows);
      setTierPreviews(previews);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const handleFile = (file: File) => {
    setParseError(null);
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const parsed = parseCsv(text);
        if (parsed.length === 0) {
          setParseError(
            "No valid rows found. Expected columns: Title, Sku, Price, Cost",
          );
          setRows([]);
          return;
        }
        setRows(parsed);
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : "Failed to parse CSV",
        );
        setRows([]);
      }
    };
    reader.onerror = () => setParseError("Failed to read file");
    reader.readAsText(file);
  };

  const handleImport = () => {
    setResult(null);
    startImport(async () => {
      const res = await importProductsFromCsvAction({
        rows,
        defaultCategory,
        defaultInventory,
        autoTier,
        manualTier,
      });
      if (res.success && res.result) {
        setResult(res.result);
        if (res.result.created > 0) {
          router.refresh();
        }
      } else {
        setParseError(res.error || "Import failed");
      }
    });
  };

  const handleReset = () => {
    setRows([]);
    setTierPreviews([]);
    setFileName(null);
    setParseError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleDownloadTemplate = () => {
    const sample = "Title,Sku,Price,Cost\nExample Card,EXAMPLE-001,9.99,5.00\n";
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wpulls-products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pre-import stats from preview
  const tierStats = tierPreviews.reduce(
    (acc, p) => {
      if (p.tier === null) acc.untagged++;
      else acc.byTier[p.tier] = (acc.byTier[p.tier] || 0) + 1;
      return acc;
    },
    { untagged: 0, byTier: {} as Record<string, number> },
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-violet-600/20 p-2">
                  <FileSpreadsheet className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-100">
                    Import products from CSV
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Auto-tier from V3 bands · untagged for out-of-band prices
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                disabled={importing}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
              {/* Result */}
              {result && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
                      <div className="flex-1">
                        <p className="font-medium text-emerald-200">
                          Import complete
                        </p>
                        <p className="text-sm text-emerald-300/80">
                          Created {result.created} of {result.total} products
                          {result.skipped > 0 &&
                            ` · ${result.skipped} blank rows skipped`}
                          {result.untagged > 0 &&
                            ` · ${result.untagged} imported as untagged`}
                        </p>

                        {/* Breakdown badges */}
                        {(result.untagged > 0 ||
                          Object.entries(result.byTier).some(
                            ([, count]) => count > 0,
                          )) && (
                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            {TIERS.filter((t) => result.byTier[t] > 0).map(
                              (t) => (
                                <span
                                  key={t}
                                  className={`rounded-md border border-zinc-700 bg-zinc-900/60 px-2 py-1 font-mono ${TIER_COLORS[t]}`}
                                >
                                  {t.replace(/_/g, " ")}: {result.byTier[t]}
                                </span>
                              ),
                            )}
                            {result.untagged > 0 && (
                              <span
                                className={`rounded-md border border-zinc-700 bg-zinc-900/60 px-2 py-1 font-mono ${UNTAGGED_COLOR}`}
                              >
                                Untagged: {result.untagged}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {result.untagged > 0 && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                      <div className="flex items-start gap-3">
                        <Tag className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                        <div className="flex-1 text-xs text-zinc-400">
                          <p className="mb-1 font-medium text-zinc-200">
                            {result.untagged} product
                            {result.untagged === 1 ? " was" : "s were"} imported
                            as untagged.
                          </p>
                          <p>
                            Their prices didn&apos;t fit any V3 pack band. You
                            can find them with the{" "}
                            <span className="rounded bg-zinc-800 px-1 font-mono">
                              Untagged
                            </span>{" "}
                            filter on the products page and tier them manually
                            (or reprice them to fit a band).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {result.errors.length > 0 && (
                    <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                        <p className="text-sm font-medium text-amber-200">
                          {result.errors.length} row
                          {result.errors.length === 1 ? "" : "s"} with errors
                        </p>
                      </div>
                      <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-amber-300/80">
                        {result.errors.map((e, i) => (
                          <li key={i}>
                            <span className="font-mono">Row {e.row}</span>{" "}
                            <span className="text-zinc-500">·</span>{" "}
                            <span className="font-mono">{e.sku}</span>{" "}
                            <span className="text-zinc-500">·</span> {e.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                    >
                      Import another file
                    </Button>
                    <Button
                      onClick={handleClose}
                      className="bg-violet-600 text-white hover:bg-violet-500"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload screen */}
              {!result && rows.length === 0 && (
                <div className="space-y-3">
                  <div
                    className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/40 p-12 text-center transition hover:border-violet-500/50"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleFile(file);
                    }}
                  >
                    <Upload className="h-8 w-8 text-zinc-500" />
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        Drop your CSV here or click to upload
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Columns required: Title, Sku, Price, Cost
                      </p>
                    </div>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-violet-600 text-white hover:bg-violet-500"
                    >
                      Choose file
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                      }}
                    />
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-zinc-200"
                    >
                      <Download className="h-3 w-3" />
                      Download CSV template
                    </button>
                  </div>
                </div>
              )}

              {parseError && !rows.length && (
                <div className="flex items-start gap-3 rounded-xl border border-rose-900/50 bg-rose-950/30 p-4">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <div className="text-sm text-rose-200">{parseError}</div>
                </div>
              )}

              {/* Preview screen */}
              {!result && rows.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-zinc-300">
                      <span className="font-mono text-zinc-100">
                        {fileName}
                      </span>{" "}
                      <span className="text-zinc-500">·</span>{" "}
                      <span className="text-zinc-400">
                        {rows.length} row{rows.length === 1 ? "" : "s"} ready
                      </span>
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-xs text-zinc-400 underline-offset-2 transition hover:text-zinc-200 hover:underline"
                    >
                      Choose different file
                    </button>
                  </div>

                  {/* Defaults */}
                  <div className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">
                        Category (applied to all)
                      </Label>
                      <select
                        value={defaultCategory}
                        onChange={(e) =>
                          setDefaultCategory(e.target.value as ProductCategory)
                        }
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">
                        Inventory per product
                      </Label>
                      <input
                        type="number"
                        min={0}
                        value={defaultInventory}
                        onChange={(e) =>
                          setDefaultInventory(parseInt(e.target.value) || 0)
                        }
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Auto-tier toggle */}
                  <div className="flex items-start gap-3 rounded-xl border border-violet-900/40 bg-violet-950/20 p-4">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-violet-200">
                            Auto-infer tier from price
                          </p>
                          <p className="text-xs text-violet-300/70">
                            Match each card to the lowest tier band across V3
                            packs. Out-of-band rows import as{" "}
                            <span className="font-medium">untagged</span> for
                            manual tiering later.
                          </p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={autoTier}
                            onChange={(e) => setAutoTier(e.target.checked)}
                            className="peer sr-only"
                          />
                          <div className="peer h-6 w-11 rounded-full bg-zinc-700 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-zinc-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-violet-600 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                        </label>
                      </div>

                      {!autoTier && (
                        <div className="mt-3 flex items-center gap-3">
                          <Label className="text-xs text-violet-300/70">
                            Manual tier (applied to ALL rows):
                          </Label>
                          <select
                            value={manualTier ?? ""}
                            onChange={(e) =>
                              setManualTier(
                                e.target.value === ""
                                  ? null
                                  : (e.target.value as ProductTier),
                              )
                            }
                            className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                          >
                            <option value="">— Untagged —</option>
                            {TIERS.map((t) => (
                              <option key={t} value={t}>
                                {t.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Distribution preview */}
                      {autoTier && tierPreviews.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {previewing ? (
                            <span className="text-xs text-zinc-500">
                              Calculating…
                            </span>
                          ) : (
                            <>
                              {TIERS.filter(
                                (t) => (tierStats.byTier[t] || 0) > 0,
                              ).map((t) => (
                                <span
                                  key={t}
                                  className={`rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-0.5 text-[10px] font-mono ${TIER_COLORS[t]}`}
                                >
                                  {t.replace(/_/g, " ")} · {tierStats.byTier[t]}
                                </span>
                              ))}
                              {tierStats.untagged > 0 && (
                                <span
                                  className={`rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-0.5 text-[10px] font-mono ${UNTAGGED_COLOR}`}
                                >
                                  Untagged · {tierStats.untagged}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview table */}
                  <div className="overflow-hidden rounded-xl border border-zinc-800">
                    <div className="max-h-72 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-zinc-900">
                          <tr className="text-xs uppercase tracking-wider text-zinc-500">
                            <th className="px-3 py-2 text-left">#</th>
                            <th className="px-3 py-2 text-left">Title</th>
                            <th className="px-3 py-2 text-left">SKU</th>
                            <th className="px-3 py-2 text-right">Price</th>
                            <th className="px-3 py-2 text-right">Cost</th>
                            <th className="px-3 py-2 text-right">Margin</th>
                            <th className="px-3 py-2 text-left">
                              {autoTier ? "Auto-Tier" : "Tier"}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {rows.slice(0, 50).map((r, i) => {
                            const p = parseFloat(r.price);
                            const c = r.cost ? parseFloat(r.cost) : null;
                            const margin =
                              c !== null && p > 0 ? ((p - c) / p) * 100 : null;
                            const preview = tierPreviews[i];
                            const tier = autoTier
                              ? (preview?.tier ?? null)
                              : manualTier;

                            return (
                              <tr
                                key={i}
                                className="text-zinc-300 hover:bg-zinc-900/50"
                              >
                                <td className="px-3 py-2 text-xs text-zinc-600">
                                  {i + 1}
                                </td>
                                <td className="max-w-xs truncate px-3 py-2">
                                  {r.title}
                                </td>
                                <td className="px-3 py-2 font-mono text-xs text-zinc-400">
                                  {r.sku}
                                </td>
                                <td className="px-3 py-2 text-right font-mono">
                                  ${r.price}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-zinc-400">
                                  {r.cost ? `$${r.cost}` : "—"}
                                </td>
                                <td
                                  className={`px-3 py-2 text-right font-mono text-xs ${
                                    margin === null
                                      ? "text-zinc-600"
                                      : margin < 20
                                        ? "text-rose-400"
                                        : margin < 40
                                          ? "text-amber-400"
                                          : "text-emerald-400"
                                  }`}
                                >
                                  {margin === null
                                    ? "—"
                                    : `${margin.toFixed(0)}%`}
                                </td>
                                <td className="px-3 py-2">
                                  {tier ? (
                                    <span
                                      className={`font-mono text-xs ${TIER_COLORS[tier]}`}
                                    >
                                      {tier.replace(/_/g, " ")}
                                    </span>
                                  ) : (
                                    <span
                                      className={`flex items-center gap-1 font-mono text-xs ${UNTAGGED_COLOR}`}
                                    >
                                      <Tag className="h-3 w-3" />
                                      untagged
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {rows.length > 50 && (
                        <div className="border-t border-zinc-800 px-3 py-2 text-center text-xs text-zinc-500">
                          + {rows.length - 50} more row
                          {rows.length - 50 === 1 ? "" : "s"} (all will be
                          imported)
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!result && rows.length > 0 && (
              <div className="flex items-center justify-between gap-2 border-t border-zinc-800 px-6 py-4">
                <div className="text-xs text-zinc-500">
                  {autoTier && tierStats.untagged > 0 && (
                    <span>
                      {tierStats.untagged} row
                      {tierStats.untagged === 1 ? "" : "s"} will be untagged
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={importing}
                    className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={importing || rows.length === 0}
                    className="bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing {rows.length}…
                      </>
                    ) : (
                      `Import ${rows.length} product${rows.length === 1 ? "" : "s"}`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
