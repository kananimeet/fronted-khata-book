import { StatementEntry, StatementSummary } from "@/types/statement";
import { formatINR } from "./format";
import { formatDate } from "./utils";

export interface StatementPdfOptions {
  items: StatementEntry[];
  summary: StatementSummary;
  periodLabel: string;
  generatedBy?: string;
  activeFilters?: {
    type?: string;
    roommate?: string;
    search?: string;
    dateRange?: string;
  };
}

/**
 * Generate and open a styled printable A4 PDF statement view
 * featuring the Bachelors-Book logo, summary metrics, and full transaction ledger.
 */
export function exportStatementToPdf(options: StatementPdfOptions): void {
  const {
    items,
    summary,
    periodLabel,
    generatedBy = "Super Admin",
    activeFilters = {},
  } = options;

  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "";

  const logoUrl = `${origin}/icons/logo.png`;
  const generatedAt = formatDate(new Date().toISOString(), true);
  const totalTxCount = items.length;

  const rowsHtml = items
    .map((tx, idx) => {
      const isCredit = tx.type === "CREDIT";
      const formattedDate = formatDate(tx.date, true);
      const amountStr = isCredit
        ? `+${formatINR(tx.amount)}`
        : `-${formatINR(tx.amount)}`;
      const amountColor = isCredit ? "#059669" : "#dc2626";
      const typeBadge = isCredit
        ? `<span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:700;background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;">CREDIT (+)</span>`
        : `<span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:700;background:#ffe4e6;color:#9f1239;border:1px solid #fecdd3;">DEBIT (-)</span>`;

      const balanceColor = tx.balance >= 0 ? "#0f172a" : "#dc2626";

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? "background-color: #f8fafc;" : ""}">
          <td style="padding: 9px 10px; font-size: 11px; color: #64748b; text-align: center;">${idx + 1}</td>
          <td style="padding: 9px 12px; font-size: 11px; font-weight: 600; color: #1e293b; white-space: nowrap;">${formattedDate}</td>
          <td style="padding: 9px 12px; white-space: nowrap;">${typeBadge}</td>
          <td style="padding: 9px 12px; font-size: 12px; color: #0f172a;">
            <div style="font-weight: 600;">${tx.note || "—"}</div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">${tx.category || "General"}</div>
          </td>
          <td style="padding: 9px 12px; font-size: 11px; font-weight: 500; color: #334155; white-space: nowrap;">
            ${tx.user?.name || "Roommate"}
          </td>
          <td style="padding: 9px 12px; font-size: 12px; font-weight: 700; font-family: monospace; text-align: right; color: ${amountColor}; white-space: nowrap;">
            ${amountStr}
          </td>
          <td style="padding: 9px 12px; font-size: 12px; font-weight: 800; font-family: monospace; text-align: right; color: ${balanceColor}; white-space: nowrap;">
            ${formatINR(tx.balance)}
          </td>
        </tr>
      `;
    })
    .join("");

  const printDocumentHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bachelors-Book_Statement_${periodLabel.replace(/\s+/g, "_")}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 10mm 12mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .no-print-btns {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #7c3aed;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #6d28d9;
    }
    .btn-secondary {
      background: #334155;
      color: #ffffff;
    }
    .btn-secondary:hover {
      background: #475569;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    thead {
      display: table-header-group;
    }
    tfoot {
      display: table-footer-group;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      .container {
        max-width: 100% !important;
        padding: 0 !important;
      }
    }
  </style>
</head>
<body>
  <!-- Print Control Bar (Hidden when printing/saving to PDF) -->
  <div class="no-print">
    <div style="font-size: 13px;">
      <span style="font-weight: 700;">📄 Export Statement to PDF:</span>
      <span style="color: #94a3b8; margin-left: 6px;">Select <b>"Save as PDF"</b> in your browser print destination.</span>
    </div>
    <div class="no-print-btns">
      <button class="btn btn-primary" onclick="window.print()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Save as PDF
      </button>
      <button class="btn btn-secondary" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="container">
    <!-- Header Section with Official Website Logo -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
      <!-- Logo + Brand wordmark -->
      <div style="display: flex; align-items: center; gap: 14px;">
        <img
          src="${logoUrl}"
          alt="Bachelors Book Logo"
          onerror="this.style.display='none'"
          style="width: 56px; height: 56px; border-radius: 14px; object-fit: contain; box-shadow: 0 4px 10px rgba(16,185,129,0.25);"
        />
        <div>
          <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a;">
            Bachelors<span style="color: #059669;">-Book</span>
            <span style="display: inline-block; width: 6px; height: 6px; background: #059669; border-radius: 50%; margin-left: 4px; vertical-align: middle;"></span>
          </div>
          <div style="font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 2px;">
            Track • Manage • Share
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #7c3aed; margin-top: 3px;">
            Official Room Account Statement & Passbook
          </div>
        </div>
      </div>

      <!-- Statement Meta Data -->
      <div style="text-align: right; font-size: 11px; color: #475569; line-height: 1.6;">
        <div style="font-size: 14px; font-weight: 800; color: #0f172a;">
          Period: <span style="color: #7c3aed;">${periodLabel}</span>
        </div>
        <div><b>Date Generated:</b> ${generatedAt} (IST)</div>
        <div><b>Generated By:</b> ${generatedBy}</div>
        <div><b>Total Transactions:</b> ${totalTxCount} entries</div>
        <div style="margin-top: 4px;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; background: #f1f5f9; font-weight: 700; color: #334155; font-size: 10px;">
            REF: BB-${Date.now().toString(36).toUpperCase()}
          </span>
        </div>
      </div>
    </div>

    <!-- KPI Summary Grid (4 Cards) -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0;">
      <!-- Closing Available Room Balance -->
      <div style="padding: 12px 14px; border-radius: 12px; background: #f0fdf4; border: 1.5px solid #bbf7d0;">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #166534;">
          Available Room Balance
        </div>
        <div style="font-size: 18px; font-weight: 900; font-family: monospace; color: #14532d; margin-top: 4px;">
          ${formatINR(summary.closingBalance)}
        </div>
        <div style="font-size: 10px; color: #15803d; margin-top: 2px; font-weight: 600;">
          Opening: ${formatINR(summary.openingBalance)}
        </div>
      </div>

      <!-- Total Credits (+) -->
      <div style="padding: 12px 14px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">
          Total Credits (+)
        </div>
        <div style="font-size: 18px; font-weight: 900; font-family: monospace; color: #059669; margin-top: 4px;">
          +${formatINR(summary.totalCredit)}
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
          Rent & Room collections
        </div>
      </div>

      <!-- Total Debits (-) -->
      <div style="padding: 12px 14px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">
          Total Debits (-)
        </div>
        <div style="font-size: 18px; font-weight: 900; font-family: monospace; color: #dc2626; margin-top: 4px;">
          -${formatINR(summary.totalDebit)}
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
          Daily grocery expenses
        </div>
      </div>

      <!-- Net Cashflow -->
      <div style="padding: 12px 14px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">
          Net Cashflow
        </div>
        <div style="font-size: 18px; font-weight: 900; font-family: monospace; color: ${summary.netChange >= 0 ? "#7c3aed" : "#d97706"}; margin-top: 4px;">
          ${summary.netChange >= 0 ? "+" : ""}${formatINR(summary.netChange)}
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
          ${totalTxCount} transactions
        </div>
      </div>
    </div>

    <!-- Statement Ledger Table -->
    <div style="border: 1px solid #cbd5e1; border-radius: 10px; overflow: hidden; margin-top: 10px;">
      <table>
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #475569; letter-spacing: 0.5px;">
            <th style="padding: 10px 10px; text-align: center; width: 36px;">#</th>
            <th style="padding: 10px 12px; text-align: left; width: 140px;">Date & Time (IST)</th>
            <th style="padding: 10px 12px; text-align: left; width: 95px;">Type</th>
            <th style="padding: 10px 12px; text-align: left;">Particulars / Note</th>
            <th style="padding: 10px 12px; text-align: left; width: 110px;">Roommate</th>
            <th style="padding: 10px 12px; text-align: right; width: 105px;">Amount</th>
            <th style="padding: 10px 12px; text-align: right; width: 120px;">Available Balance</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="7" style="padding: 24px; text-align: center; color: #94a3b8; font-size: 13px;">No transactions recorded for this period.</td></tr>`}
        </tbody>
      </table>
    </div>

    <!-- Official Statement Document Footer -->
    <div style="margin-top: 30px; padding-top: 16px; border-top: 1.5px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; line-height: 1.5;">
      <div style="max-width: 65%;">
        <div style="font-weight: 700; color: #334155; margin-bottom: 2px;">Digital Ledger Verification Notice</div>
        <div>This is a computer-generated account statement from Bachelors-Book. It represents verified ledger entries of room collections and expenses. No physical signature is required.</div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 700; color: #059669;">Bachelors-Book • Verified Statement</div>
        <div>Page 1 of 1</div>
      </div>
    </div>
  </div>

  <script>
    // Automatically trigger print dialog when loaded
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>
  `;

  // Open in a clean new window/tab and write HTML
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printDocumentHtml);
    printWindow.document.close();
  } else {
    // If popup blocked, use an invisible iframe or current window print
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printDocumentHtml);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 3000);
      }, 500);
    }
  }
}

