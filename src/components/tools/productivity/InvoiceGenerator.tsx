"use client";

import * as React from "react";
import { ToolHeader } from "@/components/shared/ToolHeader";
import { toast } from "sonner";
import {
  Receipt,
  Plus,
  Trash2,
  Printer,
  Download,
  DollarSign,
  FileCheck,
} from "lucide-react";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  senderName: string;
  senderEmail: string;
  senderAddress: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  notes: string;
  logoUrl: string;
  taxRate: number;
  discount: number;
  items: LineItem[];
}

const DEFAULT_INVOICE: InvoiceData = {
  invoiceNumber: "INV-2026-001",
  issueDate: "2026-09-15",
  dueDate: "2026-09-30",
  currency: "$",
  senderName: "John Doe Design Studio",
  senderEmail: "john.doe@example.com",
  senderAddress: "123 Main Street, Austin, TX 78701",
  clientName: "Acme Corporation",
  clientEmail: "billing@acme.com",
  clientAddress: "500 Market Street, San Francisco, CA 94105",
  notes: "Payment is due within 15 days via bank wire or Stripe. Thank you for your business!",
  logoUrl: "",
  taxRate: 8.5,
  discount: 0,
  items: [
    {
      id: "1",
      description: "Fullstack Web Application Architecture & Client-Side Suite",
      quantity: 40,
      rate: 150,
    },
    {
      id: "2",
      description: "Performance Optimization & Privacy Sandbox Implementation",
      quantity: 15,
      rate: 150,
    },
  ],
};

export function InvoiceGenerator() {
  const [invoice, setInvoice] = React.useState<InvoiceData>(DEFAULT_INVOICE);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(preview);
      if (image.width < 200 || image.height < 60 || image.width / image.height < 1.5) {
        toast.warning("Use a horizontal logo at least 200 × 60 px for a clean invoice header.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setInvoice((previous) => ({ ...previous, logoUrl: String(reader.result) }));
      reader.readAsDataURL(file);
      toast.success(`Logo added (${image.width} × ${image.height} px).`);
    };
    image.onerror = () => {
      URL.revokeObjectURL(preview);
      toast.error("That logo could not be read.");
    };
    image.src = preview;
  };

  const addItem = () => {
    setInvoice((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Math.random().toString(36).substring(7),
          description: "Consulting / Engineering Service",
          quantity: 1,
          rate: 100,
        },
      ],
    }));
  };

  const updateItem = (id: string, field: keyof LineItem, val: any) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, [field]: val } : it)),
    }));
  };

  const removeItem = (id: string) => {
    if (invoice.items.length <= 1) {
      toast.warning("An invoice must contain at least one line item.");
      return;
    }
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));
  };

  // Computations
  const subtotal = React.useMemo(() => {
    return invoice.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  }, [invoice.items]);

  const discountAmount = React.useMemo(() => {
    return (subtotal * invoice.discount) / 100;
  }, [subtotal, invoice.discount]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * invoice.taxRate) / 100;
  const total = taxableAmount + taxAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      <div className="print:hidden">
        <ToolHeader
          category="Productivity & Text"
          title="Freelance Rate & Invoice Generator"
          description="Form-based layout that automatically calculates subtotals, taxes, and exports client-ready PDF invoices."
          onReset={() => setInvoice(DEFAULT_INVOICE)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Editor Controls (hidden when printing) */}
        <div className="lg:col-span-5 space-y-6 print:hidden">
          <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground">Invoice Metadata</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoice.invoiceNumber}
                  onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Currency Symbol
                </label>
                <select
                  value={invoice.currency}
                  onChange={(e) => setInvoice({ ...invoice, currency: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
                >
                  <option value="$">$ USD / CAD / AUD</option>
                  <option value="€">€ EUR</option>
                  <option value="£">£ GBP</option>
                  <option value="¥">¥ JPY</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={invoice.issueDate}
                  onChange={(e) => setInvoice({ ...invoice, issueDate: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={invoice.dueDate}
                  onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Parties Info */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-foreground">Sender & Client</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Your Business Name
                </label>
                <input
                  type="text"
                  value={invoice.senderName}
                  onChange={(e) => setInvoice({ ...invoice, senderName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Your Email</label>
                  <input type="email" value={invoice.senderEmail} onChange={(e) => setInvoice({ ...invoice, senderEmail: e.target.value })} className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Your Address</label>
                  <input type="text" value={invoice.senderAddress} onChange={(e) => setInvoice({ ...invoice, senderAddress: e.target.value })} className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Client Name / Company
                </label>
                <input
                  type="text"
                  value={invoice.clientName}
                  onChange={(e) => setInvoice({ ...invoice, clientName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Client Email</label>
                  <input type="email" value={invoice.clientEmail} onChange={(e) => setInvoice({ ...invoice, clientEmail: e.target.value })} className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Client Address</label>
                  <input type="text" value={invoice.clientAddress} onChange={(e) => setInvoice({ ...invoice, clientAddress: e.target.value })} className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Business Logo</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center px-3 py-2 rounded-lg border border-border bg-muted hover:bg-muted/80 text-xs font-semibold cursor-pointer">
                    Upload logo
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  <span className="text-[11px] text-muted-foreground">Recommended: horizontal, at least 200 × 60 px</span>
                </div>
                {invoice.logoUrl && <div className="mt-2 flex items-center gap-2"><img src={invoice.logoUrl} alt="Uploaded business logo" className="h-10 max-w-[180px] object-contain border border-border rounded bg-white p-1" /><button type="button" onClick={() => setInvoice({ ...invoice, logoUrl: "" })} className="text-xs text-destructive hover:underline">Remove</button></div>}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Payment Notes / Bank Wire
                </label>
                <textarea
                  value={invoice.notes}
                  onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </div>

          {/* Tax & Discount */}
          <div className="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-foreground">Tax & Discounts</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={invoice.taxRate}
                  onChange={(e) => setInvoice({ ...invoice, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={invoice.discount}
                  onChange={(e) => setInvoice({ ...invoice, discount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Print / Export Button */}
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Save as PDF</span>
          </button>
        </div>

        {/* Right Column: Printable Invoice Layout (Formatted for Print & Screen) */}
        <div className="lg:col-span-7">
          <div className="bg-white text-slate-900 dark:bg-white dark:text-slate-900 rounded-2xl border border-border p-8 sm:p-10 shadow-lg space-y-8 print:p-0 print:border-none print:shadow-none">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-6">
              <div>
                {invoice.logoUrl && <img src={invoice.logoUrl} alt="Business logo" className="h-12 max-w-[180px] object-contain object-left mb-3" />}
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">INVOICE</h2>
                <p className="text-xs font-mono text-slate-500 mt-1">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <h4 className="font-bold text-sm text-slate-800">{invoice.senderName}</h4>
                <p className="text-xs text-slate-500">{invoice.senderEmail}</p>
                <p className="text-xs text-slate-500">{invoice.senderAddress}</p>
              </div>
            </div>

            {/* Bill To and Dates */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <span className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Billed To
                </span>
                <p className="font-bold text-slate-800 text-sm">{invoice.clientName}</p>
                <p className="text-slate-500">{invoice.clientEmail}</p>
                <p className="text-slate-500">{invoice.clientAddress}</p>
              </div>

              <div className="space-y-1 text-right">
                <div>
                  <span className="text-slate-400">Date: </span>
                  <span className="font-semibold text-slate-700">{invoice.issueDate}</span>
                </div>
                <div>
                  <span className="text-slate-400">Due Date: </span>
                  <span className="font-semibold text-slate-700">{invoice.dueDate}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-3">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-center w-16">Qty/Hrs</th>
                    <th className="py-2 text-right w-24">Rate</th>
                    <th className="py-2 text-right w-24">Amount</th>
                    <th className="py-2 w-8 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                          className="w-full bg-transparent font-medium text-slate-800 focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                          }
                          className="w-14 text-center bg-transparent focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 text-right font-mono">
                        <input
                          type="number"
                          min="0"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                          className="w-20 text-right bg-transparent focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-800">
                        {invoice.currency}
                        {(item.quantity * item.rate).toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right print:hidden">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-300 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={addItem}
                className="print:hidden flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline pt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line Item
              </button>
            </div>

            {/* Calculations Summary */}
            <div className="border-t border-slate-200 pt-4 flex justify-end">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono">
                    {invoice.currency}
                    {subtotal.toFixed(2)}
                  </span>
                </div>

                {invoice.discount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Discount ({invoice.discount}%)</span>
                    <span className="font-mono text-emerald-600">
                      -{invoice.currency}
                      {discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                {invoice.taxRate > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax ({invoice.taxRate}%)</span>
                    <span className="font-mono">
                      {invoice.currency}
                      {taxAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-300 pt-2">
                  <span>Total Due</span>
                  <span className="font-mono text-primary">
                    {invoice.currency}
                    {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="border-t border-slate-100 pt-4 text-xs text-slate-500">
                <span className="font-semibold text-slate-700 block mb-1">Notes & Terms</span>
                <p>{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

