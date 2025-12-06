import jsPDF from "jspdf";
import { formatNepaliCurrency, formatNepaliNumber } from "@/lib/formatters";
import { numberToWords } from "@/lib/numberToWords";
import type { BOQFormData } from "@/components/BOQForm";

export async function generateBOQPdfFromFormData(formData: BOQFormData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const marginLeft = 25;
  const marginRight = 25;
  const marginTop = 25;
 // const marginBottom = 25;

  let yPosition = marginTop;
  let pageNum = 1;

  const checkNewPage = (requiredSpace: number) => {
    const footerSpace = 30;
    if (yPosition + requiredSpace > pageHeight - footerSpace) {
      doc.addPage();
      pageNum++;
      yPosition = 35;
      return true;
    }
    return false;
  };

  try {
    let logoData: string | null = null;
    try {
      const response = await fetch("/belalogo.png");
      if (response.ok) {
        const blob = await response.blob();
        logoData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new Error("logo convert failed"));
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch {}

    if (logoData) {
      try { doc.addImage(logoData, "PNG", marginLeft, 8, 28, 22); } catch {}
    }

    doc.setFontSize(14);
    doc.setTextColor(30, 45, 77);
    doc.setFont("helvetica", "bold");
    doc.text("BELA NEPAL INDUSTRIES PVT. LTD.", pageWidth / 2, 17, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Chhauni, Kathmandu-15, Nepal, Contact: 01-5922974", pageWidth / 2, 22, { align: "center" });
    doc.text("Factory: Hetauda Industrial Estate, Hetauda-8, Contact: 057-591888", pageWidth / 2, 26, { align: "center" });
    doc.setDrawColor(239, 126, 30);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, 30, pageWidth - marginRight, 30);

    yPosition = 35;
    doc.setFontSize(14);
    doc.setTextColor(239, 126, 30);
    doc.setFont("helvetica", "bold");
    doc.text("BILL OF QUANTITIES", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    doc.setFillColor(245, 245, 250);
    doc.roundedRect(marginLeft, yPosition - 4, pageWidth - marginLeft - marginRight, 38, 2, 2, "F");
    doc.setFontSize(12);
    doc.setTextColor(30, 45, 77);
    doc.setFont("helvetica", "bold");
    doc.text("Project Information", marginLeft + 5, yPosition);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(8);
    const leftX = marginLeft + 5;
    const rightX = pageWidth / 2 + 5;
    const spacing = 5;
    const currentY = yPosition + 6;
    const drawLabelValue = (label: string, value: string, x: number, y: number) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, x, y);
      doc.setFont("helvetica", "normal");
      doc.text(value || "-", x + 40, y);
    };
    drawLabelValue("Project:", formData.projectInfo.projectName || "-", leftX, currentY);
    drawLabelValue("Client:", formData.projectInfo.clientName || "-", leftX, currentY + spacing);
    if (formData.projectInfo.siteLocation)
      drawLabelValue("Site Location:", formData.projectInfo.siteLocation, leftX, currentY + 2 * spacing);
    if (formData.projectInfo.builtUpArea)
      drawLabelValue("Built-Up Area:", String(formData.projectInfo.builtUpArea), leftX, currentY + 3 * spacing);
    if (formData.projectInfo.startDate)
      drawLabelValue("Starting Date:", String(formData.projectInfo.startDate), rightX, currentY);
    if (formData.projectInfo.completionDate)
      drawLabelValue("Completion Date:", String(formData.projectInfo.completionDate), rightX, currentY + spacing);
    yPosition += 38;

    const sum = (arr?: any[]) => (arr || []).reduce((s, i) => s + (Number(i?.amount) || 0), 0);
    const subtotal = sum(formData.civilMetalWork) + sum(formData.civilPCCWork) + sum(formData.civilOtherWork) +
      sum(formData.panelFloorWork) + sum(formData.panelRoofWork) + sum(formData.panelWallWork) +
      sum(formData.upvcDoorsWindows) + sum(formData.toiletBathPlumbing) + sum(formData.wallPuttyWork) +
      sum(formData.electricWork) + sum(formData.roofingWork) + sum(formData.ecoPanelOtherWork) +
      sum((formData as any).customFieldWork);
    const ac = formData.additionalCosts as any;
    const discountPercent = ac?.discount_percent || 0;
    const overheadPercent = ac?.overhead_percent || 0;
    const vatPercent = ac?.vat_percent || 0;
    const transportationCost = ac?.transportation_cost || 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    const afterDiscount = subtotal - discountAmount;
    const overheadAmount = (afterDiscount * overheadPercent) / 100;
    const beforeVAT = afterDiscount + overheadAmount + (transportationCost || 0);
    const vatAmount = (beforeVAT * vatPercent) / 100;
    const grandTotal = beforeVAT + vatAmount;

    

    const drawTableRow = (cols: string[], isHeader: boolean = false, isBold: boolean = false) => {
      const colWidths = [10, 48, 35, 12, 15, 18, 22];
      let xPos = marginLeft;
      if (isHeader) {
        doc.setFillColor(30, 45, 77);
        doc.rect(marginLeft, yPosition - 4, pageWidth - marginLeft - marginRight, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
      } else if (isBold) {
        doc.setFillColor(250, 240, 230);
        doc.rect(marginLeft, yPosition - 4, pageWidth - marginLeft - marginRight, 6, "F");
        doc.setTextColor(30, 45, 77);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
      } else {
        doc.setTextColor(50, 50, 50);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
      }
      const wrappedCols = cols.map((col, index) => {
        if (index === 1 || index === 2) {
          return doc.splitTextToSize(String(col || ""), colWidths[index] - 2);
        } else {
          return [String(col || "")];
        }
      });
      const lineHeight = 4;
      const maxLines = Math.max(...wrappedCols.map((c) => c.length));
      wrappedCols.forEach((textArr, index) => {
        let textY = yPosition;
        textArr.forEach((line) => {
          const textX = index >= 3 ? xPos + colWidths[index] - 2 : xPos + 2;
          const align = index >= 3 ? "right" : "left";
          doc.text(line, textX, textY, { align });
          textY += lineHeight;
        });
        xPos += colWidths[index];
      });
      if (!isHeader) {
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        xPos = marginLeft;
        colWidths.forEach((width) => {
          doc.line(xPos, yPosition - 5, xPos, yPosition + maxLines * lineHeight - 2);
          xPos += width;
        });
        doc.line(marginLeft, yPosition + maxLines * lineHeight - 2, pageWidth - marginRight, yPosition + maxLines * lineHeight - 2);
      }
      yPosition += isHeader ? 8 : maxLines * lineHeight + 2;
    };

    const parseNumber = (val: unknown) => {
      if (typeof val === "number") return val;
      if (val == null) return 0;
      const cleaned = String(val).replace(/[^0-9.\-]/g, "");
      const n = parseFloat(cleaned);
      return Number.isFinite(n) ? n : 0;
    };

    const sections = [
      {
        title: "SECTION 1: CIVIL WORK",
        items: [
          { title: "A. Metal Work", data: formData.civilMetalWork },
          { title: "B. PCC Work", data: formData.civilPCCWork },
          { title: "C. Other Civil Work", data: formData.civilOtherWork },
        ],
      },
      {
        title: "SECTION 2: ECO-PANEL WORK",
        items: [
          { title: "A. Panel Floor Work", data: formData.panelFloorWork },
          { title: "B. Panel Roof Work", data: formData.panelRoofWork },
          { title: "C. Panel Wall Work", data: formData.panelWallWork },
          { title: "D. UPVC Doors & Windows", data: formData.upvcDoorsWindows },
          { title: "E. Toilet, Bath & Plumbing", data: formData.toiletBathPlumbing },
          { title: "F. Wall Putty Work", data: formData.wallPuttyWork },
          { title: "G. Electric Work", data: formData.electricWork },
          { title: "H. Roofing Work", data: formData.roofingWork },
          { title: "I. Other Eco-Panel Work", data: formData.ecoPanelOtherWork },
        ],
      },
    ];

    for (const sec of sections) {
      checkNewPage(12);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 45, 77);
      doc.text(sec.title, 15, yPosition);
      yPosition += 5;
      let sectionGrandTotal = 0;
      for (const sub of sec.items) {
        if (!sub.data || sub.data.length === 0) continue;
        checkNewPage(10);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(239, 126, 30);
        doc.text(sub.title, 15, yPosition);
        yPosition += 7;
        drawTableRow(["S.N.", "Item Description", "Specification", "Unit", "Qty", "Rate", "Amount"], true);
        const sectionTotal = sub.data.reduce((sum, item) => sum + parseNumber((item as any).amount), 0);
        sectionGrandTotal += sectionTotal;
        const titleMatch = String(sub.title).trim().match(/^([A-Za-z])/);
        const sectionSuffix = titleMatch ? titleMatch[1].toLowerCase() : "a";
        for (let i = 0; i < sub.data.length; i++) {
          const item = sub.data[sub.data.length - 1 - i];
          checkNewPage(10);
          const itemAmount = parseNumber((item as any).amount);
          const itemRate = parseNumber((item as any).rate);
          const itemQty = parseNumber((item as any).quantity);
          const snLabel = `${i + 1}.${sectionSuffix}`;
          drawTableRow([
            snLabel,
            (item as any).itemName || (item as any).item_name || "-",
            (item as any).specification || "-",
            (item as any).unit || "-",
            formatNepaliNumber(itemQty),
            formatNepaliNumber(itemRate),
            formatNepaliNumber(itemAmount),
          ]);
        }
        checkNewPage(10);
        const formattedTotal = formatNepaliNumber(Number.isFinite(sectionTotal) ? sectionTotal : 0);
        drawTableRow(["", "", "", "", "", "", `Subtotal: NRS ${formattedTotal}`], false, true);
        yPosition += 5;
      }
      checkNewPage(10);
      yPosition += 2;
      doc.setFillColor(250, 240, 230);
      doc.rect(15, yPosition - 4, pageWidth - 30, 8, "F");
      doc.setTextColor(30, 45, 77);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      const sectionTitle = sec.title.replace("SECTION ", "").replace(": ", " - ");
      doc.text(`${sectionTitle} TOTAL`, 20, yPosition);
      doc.text(`NRS ${formatNepaliNumber(sectionGrandTotal)}`, pageWidth - 40, yPosition, { align: "right" });
      yPosition += 10;
    }

    // SECTION 3: ADDITIONAL COSTS & TAXES AFTER ALL TABLES
    checkNewPage(40);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 45, 77);
    doc.text("SECTION 3: ADDITIONAL COSTS & TAXES", 15, yPosition);
    yPosition += 8;
    const colRight = pageWidth - marginRight - 5;
    doc.setFillColor(250, 240, 230);
    doc.rect(marginLeft, yPosition - 4, pageWidth - marginLeft - marginRight, 6, "F");
    doc.setTextColor(30, 45, 77);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("Subtotal", marginLeft + 5, yPosition);
    doc.text(`NRS ${formatNepaliNumber(subtotal)}`, colRight, yPosition, { align: "right" });
    yPosition += 6;

    if (discountPercent > 0) {
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(`Discount (${discountPercent}%)`, marginLeft + 5, yPosition);
      doc.text(`-${formatNepaliNumber(discountAmount)}`, colRight, yPosition, { align: "right" });
      yPosition += 5;
    }
    if (overheadPercent > 0) {
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(`Overhead (${overheadPercent}%)`, marginLeft + 5, yPosition);
      doc.text(`${formatNepaliNumber(overheadAmount)}`, colRight, yPosition, { align: "right" });
      yPosition += 5;
    }
    if (transportationCost > 0) {
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text("Transportation Cost", marginLeft + 5, yPosition);
      doc.text(`${formatNepaliNumber(transportationCost)}`, colRight, yPosition, { align: "right" });
      yPosition += 5;
    }

    if (vatPercent > 0) {
      doc.setFillColor(245, 245, 250);
      doc.rect(marginLeft, yPosition - 4, pageWidth - marginLeft - marginRight, 6, "F");
      doc.setTextColor(30, 45, 77);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("Before VAT", marginLeft + 5, yPosition);
      doc.text(`NRS ${formatNepaliNumber(beforeVAT)}`, colRight, yPosition, { align: "right" });
      yPosition += 6;

      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(`VAT (${vatPercent}%)`, marginLeft + 5, yPosition);
      doc.text(`${formatNepaliNumber(vatAmount)}`, colRight, yPosition, { align: "right" });
      yPosition += 5;
    }
//-----------------------------------------------------------
   // Calculate dynamic height based on content
    const words = numberToWords(grandTotal);
    const wordsQuoted = `${words}`;
    const wordsLabelled = `Amount in Words: (${wordsQuoted})`;

    const lineHeight = 4.5;
    const rectHeight = 12; // slimmer grand total bar

    // Full-width orange bar across A4
    doc.setFillColor(239, 126, 30);
    doc.rect(0, yPosition - 4, pageWidth, rectHeight, "F"); // start at 0, use full pageWidth

    // "GRAND TOTAL" (left)
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("GRAND TOTAL", marginLeft + 5, yPosition + 3);

    // Amount (right)
    doc.text(`NRS ${formatNepaliNumber(grandTotal)}`, colRight, yPosition + 3, { align: "right" });

    // "(including VAT)" below amount — bold
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("(including VAT)", colRight, yPosition + 7, { align: "right" });

    // Move yPosition for next content
    yPosition += rectHeight;

    // Amount in words below the orange bar in small font, right-aligned
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const wordsWrappedBelow = doc.splitTextToSize(wordsLabelled, pageWidth - marginLeft - marginRight);
    doc.text(wordsWrappedBelow, colRight, yPosition + 1, { align: "right" });
    yPosition += wordsWrappedBelow.length * 3.5 + 5; // 5px gap before Client's Scope
//-------------------------------------------------------------------
   checkNewPage(60);
   yPosition += 5;

    // background box
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(
      marginLeft,
      yPosition - 4,
      pageWidth - marginLeft - marginRight,
      32,
      2,
      2,
      "F"
    );

    // text alignment
    const textLeft = marginLeft + 5; // keep padding consistent

    doc.setFontSize(9);
    doc.setTextColor(30, 45, 77);
    doc.setFont("helvetica", "bold");
    doc.text("Client's Scope", textLeft, yPosition);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(6.5);

    const clientScopeText = [
      "1. Warranty: 2 Yrs Maintenance with material and wage due to construction and material defect. It does not cover the warranty due to negligence of client and due to natural disasters.",
      "2. All materials will be delivered to the site; however, if they need to be transported to another location, additional handling charges will apply and must be borne by the client.",
      "3. The estimated cost is based on the specific scope of work. Any additional work beyond what has been provided will incur extra charges.",
    ];

let scopeY = yPosition + 5;
clientScopeText.forEach((line) => {
  const wrappedLine = doc.splitTextToSize(line, pageWidth - marginLeft - marginRight - 10); 
  doc.text(wrappedLine, textLeft, scopeY);
  scopeY += wrappedLine.length * 3.5 + 2;
});

yPosition = scopeY + 10;

    const termsSectionHeight = 28;
    checkNewPage(termsSectionHeight + 5);
    yPosition += 5;
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(marginLeft, yPosition - 4, pageWidth - marginLeft - marginRight, 24, 2, 2, "F");
    doc.setFontSize(9);
    doc.setTextColor(30, 45, 77);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", 20, yPosition);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(80, 80, 80);
    doc.text("• All prices are subject to change without notice.", marginLeft + 5, yPosition + 5);
    doc.text("• Validity: 30 days from date of quotation.", marginLeft + 5, yPosition + 9);
    doc.text("• Payment terms as per agreement.", marginLeft + 5, yPosition + 13);
    doc.text("• For any queries, please contact: 01-5922974 | 057-591888", marginLeft + 5, yPosition + 17);
    yPosition += 24;

    const preparedY = pageHeight - 28;
      if (preparedY - yPosition < 5) {
        doc.addPage();
        pageNum++;
        yPosition = 35;
      }
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  doc.text("Prepared by: ........................................", marginLeft, preparedY);
  
  const createFadedLogoDataUrl = async (
  dataUrl: string,
  alpha = 0.03,
  scale = 1 // Increase if height looks small
): Promise<string> => {
  try {
    const img = new Image();
    img.src = dataUrl;

    await new Promise((res, rej) => {
      img.onload = res as any;
      img.onerror = rej;
    });

    const cw = img.width * scale;
    const ch = img.height * scale;

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;

    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;

    ctx.clearRect(0, 0, cw, ch);
    ctx.globalAlpha = alpha;

    ctx.drawImage(img, 0, 0, cw, ch);

    return canvas.toDataURL("image/png");
  } catch {
    return dataUrl;
  }
};


    if (logoData) {
      try {
        const faded = await createFadedLogoDataUrl(logoData, 0.03);
        const wmW = 90;
        const wmH = 80;
        const pageCount = doc.getNumberOfPages();
        for (let p = 1; p <= pageCount; p++) {
          doc.setPage(p);
          try {
            doc.addImage(faded, "PNG", pageWidth / 2 - wmW / 2, pageHeight / 2 - wmH / 2, wmW, wmH);
          } catch {
            doc.setFontSize(50);
            doc.setTextColor(200, 200, 200);
            doc.text("BELA NEPAL", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 });
          }
        }
      } catch {
        const pageCount = doc.getNumberOfPages();
        for (let p = 1; p <= pageCount; p++) {
          doc.setPage(p);
          doc.setFontSize(50);
          doc.setTextColor(200, 200, 200);
          doc.text("BELA NEPAL", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 });
        }
      }
    } else {
      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFontSize(50);
        doc.setTextColor(200, 200, 200);
        doc.text("BELA NEPAL", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 });
      }
    }

    const addFooter = () => {
      doc.setDrawColor(239, 126, 30);
      doc.setLineWidth(0.5);
      doc.line(marginLeft, pageHeight - 20, pageWidth - marginRight, pageHeight - 20);
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.text("Visit us at www.belanepal.com.np", marginLeft, pageHeight - 14);
      doc.text("Email us: info@belanepal.com.np", pageWidth / 2, pageHeight - 14, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setTextColor(239, 126, 30);
      doc.text(`Page ${pageNum}`, pageWidth - marginRight, pageHeight - 10, { align: "right" });
    };
    const finalPageCount = doc.getNumberOfPages();
    for (let p = 1; p <= finalPageCount; p++) {
      doc.setPage(p);
      pageNum = p;
      addFooter();
    }

    const projectName = (formData.projectInfo.projectName || "").replace(/[^a-z0-9]/gi, "_");
    const dateStr = new Date().toISOString().split("T")[0];
    doc.save(`BOQ_${projectName}_${dateStr}.pdf`);
  } catch (e) {
    throw e;
  }
}
