import jsPDF from "jspdf";
import { formatNepaliCurrency, formatNepaliNumber } from "@/lib/formatters";
import { numberToWords } from "@/lib/numberToWords";
import type { BOQFormData } from "@/components/BOQForm";

export interface QuotationData {
    quotationNumber: string;
    quotationDate: string;
    validityDays: number;
    recipientName: string;
    recipientAddress: string;
    fobTerms: string;
    deliveryNumber: string;
    inquiryDate: string;
}

export async function generateQuotationPdfFromFormData(formData: BOQFormData, quoteData: QuotationData) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const marginLeft = 15;
    const marginRight = 15;
    const marginTop = 15;

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

    // --- Helper: Parse Number ---
    const parseNumber = (val: unknown) => {
        if (typeof val === "number") return val;
        if (val == null) return 0;
        const cleaned = String(val).replace(/[^0-9.\-]/g, "");
        const n = parseFloat(cleaned);
        return Number.isFinite(n) ? n : 0;
    };

    try {
        // --- 1. HEADER (Same as BOQ) ---
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
        } catch { }

        if (logoData) {
            try { doc.addImage(logoData, "PNG", marginLeft, 8, 28, 22); } catch { }
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
        // Add more space before QUOTATION title
        yPosition += 5;
        doc.setFontSize(16);
        doc.setTextColor(239, 126, 30);
        doc.setFont("helvetica", "bold");
        doc.text("QUOTATION", pageWidth - marginRight, yPosition, { align: "right" });
        yPosition += 5; // Reduced spacing to info boxes

        // --- 2. QUOTE TOP SECTION (TO / INFO) ---
        const boxHeight = 25;
        const boxWidth = (pageWidth - marginLeft - marginRight - 5) / 2;

        // Left Box: TO
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.roundedRect(marginLeft, yPosition, boxWidth, boxHeight, 1, 1);

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("TO:", marginLeft + 2, yPosition + 4);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(quoteData.recipientName || "", marginLeft + 2, yPosition + 9);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const addressLines = doc.splitTextToSize(quoteData.recipientAddress || "", boxWidth - 4);
        doc.text(addressLines, marginLeft + 2, yPosition + 14);

        // Right Box: Info (Quote No, Date, etc)
        const rightBoxX = marginLeft + boxWidth + 5;
        doc.roundedRect(rightBoxX, yPosition, boxWidth, boxHeight, 1, 1);

        const infoX = rightBoxX + 2;
        let infoY = yPosition + 5;
        const lineH = 5;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("Quotation No:", infoX, infoY);
        doc.setTextColor(0, 0, 0);
        doc.text(quoteData.quotationNumber || "-", infoX + 25, infoY);

        infoY += lineH;
        doc.setTextColor(100, 100, 100);
        doc.text("Date:", infoX, infoY);
        doc.setTextColor(0, 0, 0);
        doc.text(quoteData.quotationDate || "-", infoX + 25, infoY);

        infoY += lineH;
        doc.setTextColor(100, 100, 100);
        doc.text("F.O.B. / Terms:", infoX, infoY);
        doc.setTextColor(0, 0, 0);
        doc.text(quoteData.fobTerms || "-", infoX + 25, infoY);

        infoY += lineH;
        doc.setTextColor(100, 100, 100);
        doc.text("Delivery No:", infoX, infoY);
        doc.setTextColor(0, 0, 0);
        doc.text(quoteData.deliveryNumber || "-", infoX + 25, infoY);

        yPosition += boxHeight + 5;

        // Inquiry Date text
        if (quoteData.inquiryDate) {
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text(`Thank you for your inquiry dated: ${quoteData.inquiryDate}`, marginLeft, yPosition);
            yPosition += 6;
        }

        // --- 3. CONSOLIDATED TABLE ---
        // Headers: Item (SN) | Description | Unit | Quantity | Rate | Amount
        // Adjusted widths to fit 180mm content area
        const colWidths = [10, 80, 15, 20, 25, 30];
        const tableStartX = marginLeft;

        // Light Gray Header Background
        doc.setFillColor(180, 180, 180);
        doc.rect(tableStartX, yPosition, pageWidth - marginLeft - marginRight, 7, "F");

        // Black Text
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);


        let headerX = tableStartX;
        doc.text("Item", headerX + 2, yPosition + 5);
        headerX += colWidths[0];
        doc.text("Description", headerX + 2, yPosition + 5);
        headerX += colWidths[1];
        doc.text("Unit", headerX + 2, yPosition + 5);
        headerX += colWidths[2];
        doc.text("Quantity", headerX + 18, yPosition + 5, { align: "right" });
        headerX += colWidths[3];
        doc.text("Rate", headerX + 23, yPosition + 5, { align: "right" });
        headerX += colWidths[4];
        doc.text("Amount", headerX + 28, yPosition + 5, { align: "right" });

        yPosition += 7;

        // --- PREPARE DATA ---
        // We will flatten all sections into a single list
        // Items will be: { type: 'section' | 'item' | 'subtotal', ...data }

        const sections = [
            { title: "SECTION 1: CIVIL WORK", items: [...formData.civilMetalWork, ...formData.civilPCCWork, ...formData.civilOtherWork] },
            {
                title: "SECTION 2: ECO-PANEL WORK", items: [
                    ...formData.panelFloorWork, ...formData.panelRoofWork, ...formData.panelWallWork,
                    ...formData.upvcDoorsWindows, ...formData.toiletBathPlumbing, ...formData.wallPuttyWork,
                    ...formData.electricWork, ...formData.roofingWork, ...formData.ecoPanelOtherWork
                ]
            },
            // Custom Items? They are usually mixed in or handled separately. 
            // In current logic they are part of formData.
        ];

        let serialNo = 1;
        let grandTotal = 0;

        const drawRow = (cols: string[], isBold = false, isSectionHeader = false, isSubtotal = false) => {
            checkNewPage(10);
            const rowHeight = isSectionHeader ? 5 : (isSubtotal ? 5 : 4); // Further reduced height

            if (isSectionHeader) {
                doc.setFillColor(240, 240, 240);
                doc.rect(tableStartX, yPosition, pageWidth - marginLeft - marginRight, rowHeight, "F");
                doc.setTextColor(30, 45, 77);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.text(cols[1], tableStartX + 2, yPosition + 4.5); // Adjusted Y for header
            } else if (isSubtotal) {
                // Background only for Subtotal and Amount (Right aligned)
                const bgWidth = 60;
                doc.setFillColor(245, 245, 245);
                doc.rect(pageWidth - marginRight - bgWidth, yPosition, bgWidth, rowHeight, "F");

                doc.setTextColor(0, 0, 0);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                // Subtotal Label right aligned near amount
                const amountX = tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] - 2;
                // Align using columns: Unit(2), Qty(3), Rate(4), Amount(5)
                // We want it near Rate/Amount
                doc.text(cols[5], amountX, yPosition + 5.5, { align: "right" });
                doc.text("Subtotal:", amountX - 40, yPosition + 5.5, { align: "right" });
            } else {
                // Normal Item
                doc.setTextColor(0, 0, 0);
                doc.setFont("helvetica", isBold ? "bold" : "normal");
                doc.setFontSize(9);

                // Col 0: SN
                doc.text(cols[0], tableStartX + 2, yPosition + 4.5);

                const descX = tableStartX + colWidths[0] + 2;
                const descWidth = colWidths[1] - 4;

                // Check for delimiter
                const fullDesc = cols[1];
                let name = fullDesc;
                let specs = "";

                if (fullDesc.includes("|||")) {
                    const parts = fullDesc.split("|||");
                    name = parts[0];
                    specs = parts[1];
                }

                // 1. Draw Name
                doc.setFont("helvetica", isBold ? "bold" : "normal");
                doc.setTextColor(0, 0, 0);
                const splitName = doc.splitTextToSize(name, descWidth);
                doc.text(splitName, descX, yPosition + 4.5);

                let currentY = yPosition + 4.5;
                const nameHeight = (splitName.length - 1) * 4; // Height added by name wrapping
                currentY += nameHeight;

                // 2. Inline Specs (Italic, Small)
                let extraSpecHeight = 0;
                if (specs) {
                    const lastLineText = splitName[splitName.length - 1];
                    const lastLineWidth = doc.getTextWidth(lastLineText);
                    const remainingWidth = descWidth - lastLineWidth;

                    doc.setFont("helvetica", "italic");
                    doc.setFontSize(8); // Small
                    doc.setTextColor(80, 80, 80); // Gray

                    const specPrefix = " - (";
                    const specSuffix = ")";
                    const fullSpecText = specPrefix + specs + specSuffix;

                    // If fit on same line (or reasonable part of it)
                    if (remainingWidth > 15) {
                        const splitSpecs = doc.splitTextToSize(fullSpecText, remainingWidth);
                        // Draw at end of name
                        doc.text(splitSpecs, descX + lastLineWidth, currentY);

                        // Handle height increase if specs wrapped
                        if (splitSpecs.length > 1) {
                            extraSpecHeight = (splitSpecs.length - 1) * 3;
                        }
                    } else {
                        // Force next line if practically no space
                        doc.text(fullSpecText, descX, currentY + 3);
                        extraSpecHeight = 3;
                    }
                }

                // Reset Font for other columns
                doc.setFont("helvetica", isBold ? "bold" : "normal");
                doc.setFontSize(9);
                doc.setTextColor(0, 0, 0);

                // Col 2: Unit
                const unitX = tableStartX + colWidths[0] + colWidths[1] + 2;
                doc.text(cols[2], unitX, yPosition + 4.5);

                // Col 3: Quantity
                const qtyX = tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] - 2;
                doc.text(cols[3], qtyX, yPosition + 4.5, { align: "right" });

                // Col 4: Rate
                const rateX = tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] - 2;
                doc.text(cols[4], rateX, yPosition + 4.5, { align: "right" });

                // Col 5: Amount
                const amtX = tableStartX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5] - 2;
                doc.text(cols[5], amtX, yPosition + 4.5, { align: "right" });


                // Total Extra Height needed for row
                const totalTextHeight = nameHeight + (specs ? 4 + extraSpecHeight : 0);

                // Lowest Y
                const textBottomY = specs
                    ? currentY + (doc.getTextDimensions(specs).h || 0) // rough approx logic or just use lines
                    : yPosition + 4.5 + nameHeight;

                // Better calculation based on lines:
                const nameLines = splitName.length;
                const specLines = specs ? doc.splitTextToSize(`(${specs})`, descWidth).length : 0;

                let addedHeight = (nameLines - 1) * 4;
                if (specLines > 0) {
                    addedHeight += 1.5; // Gap
                    addedHeight += specLines * 3; // Spec lines height
                }

                const finalRowH = Math.max(rowHeight, 6 + addedHeight);

                // Draw bottom border
                doc.setDrawColor(230, 230, 230);
                doc.setLineWidth(0.1);
                doc.line(tableStartX, yPosition + finalRowH, pageWidth - marginRight, yPosition + finalRowH);

                yPosition += (finalRowH - rowHeight); // Add the extra expansion to yPosition logic
            }
            yPosition += rowHeight;
        };

        for (const section of sections) {
            if (section.items.length === 0) continue;

            // Draw Section Header
            drawRow(["", section.title, "", "", "", ""], true, true);

            let sectionTotal = 0;

            for (const item of section.items) {
                const qty = parseNumber(item.quantity);
                const rate = parseNumber(item.rate);
                const amount = parseNumber(item.amount);

                sectionTotal += amount;

                let desc = item.itemName || "";
                if (item.specification) desc += `|||${item.specification}`;

                drawRow([
                    String(serialNo++),
                    desc,
                    item.unit || "-",
                    formatNepaliNumber(qty),
                    formatNepaliNumber(rate),
                    formatNepaliNumber(amount)
                ]);
            }

            // Draw Subtotal
            grandTotal += sectionTotal; // Accumulate for Grand Total (though we calc it separately strictly speaking)
            drawRow(["", "", "", "", "", formatNepaliNumber(sectionTotal)], true, false, true);
            yPosition += 2; // Spacer
        }

        // --- 4. GRAND TOTAL SECTION ---
        checkNewPage(40);
        yPosition += 5;

        const subtotal = grandTotal + parseNumber((formData as any).customFieldWork?.reduce((s: number, i: any) => s + parseNumber(i.amount), 0) || 0);
        // Note: formData doesn't hold customFieldWork typed correctly in some interfaces, assumes handled above or empty.
        // Actually, let's use the logic from existing pdf for total calc to be safe

        const sum = (arr?: any[]) => (arr || []).reduce((s, i) => s + (Number(i?.amount) || 0), 0);
        const calcSubtotal = sum(formData.civilMetalWork) + sum(formData.civilPCCWork) + sum(formData.civilOtherWork) +
            sum(formData.panelFloorWork) + sum(formData.panelRoofWork) + sum(formData.panelWallWork) +
            sum(formData.upvcDoorsWindows) + sum(formData.toiletBathPlumbing) + sum(formData.wallPuttyWork) +
            sum(formData.electricWork) + sum(formData.roofingWork) + sum(formData.ecoPanelOtherWork) +
            sum((formData as any).customFieldWork);

        // Re-calculate Additional
        const ac = formData.additionalCosts as any;
        const discountPercent = ac?.discount_percent || 0;
        const overheadPercent = ac?.overhead_percent || 0;
        const vatPercent = ac?.vat_percent || 0;
        const transportationCost = ac?.transportation_cost || 0;

        const discountAmount = (calcSubtotal * discountPercent) / 100;
        const afterDiscount = calcSubtotal - discountAmount;
        const overheadAmount = (afterDiscount * overheadPercent) / 100;
        const beforeVAT = afterDiscount + overheadAmount + (transportationCost || 0);
        const vatAmount = (beforeVAT * vatPercent) / 100;
        const finalGrandTotal = beforeVAT + vatAmount;

        // Draw Summary Box (Right Aligned)
        const summaryWidth = 80;
        const summaryX = pageWidth - marginRight - summaryWidth;

        const drawSummaryRow = (label: string, value: string, isTotal = false) => {
            const rowH = 6;
            if (isTotal) {
                doc.setFillColor(240, 240, 240);
                doc.rect(summaryX, yPosition, summaryWidth, rowH + 2, "F");
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.text(label, summaryX + 2, yPosition + 5);
                doc.text(value, pageWidth - marginRight - 2, yPosition + 5, { align: "right" });
                yPosition += rowH + 4;
            } else {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(9);
                doc.text(label, summaryX + 2, yPosition + 4);
                doc.text(value, pageWidth - marginRight - 2, yPosition + 4, { align: "right" });
                yPosition += rowH;
            }
        };

        // Draw summary lines
        // If discount/overhead exist, show details. If not, maybe just show final?
        // Let's show standard breakdown for clarity

        drawSummaryRow("Subtotal", formatNepaliNumber(calcSubtotal));

        if (discountPercent > 0) {
            drawSummaryRow(`Discount (${discountPercent}%)`, `-${formatNepaliNumber(discountAmount)}`);
        }

        if (overheadPercent > 0) {
            drawSummaryRow(`Overhead (${overheadPercent}%)`, formatNepaliNumber(overheadAmount));
        }

        if (transportationCost > 0) {
            drawSummaryRow("Transportation Cost", formatNepaliNumber(transportationCost));
        }

        if (vatPercent > 0) {
            drawSummaryRow(`VAT (${vatPercent}%)`, formatNepaliNumber(vatAmount));
        }

        checkNewPage(15);
        yPosition -= 1.5; // Reduce space above with subtotal
        drawSummaryRow("GRAND TOTAL", `NRS ${formatNepaliNumber(finalGrandTotal)}`, true);
        yPosition += 3; // Add space below GRAND TOTAL

        // Amount in Words
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(80, 80, 80);
        const words = numberToWords(finalGrandTotal);
        doc.text(`In Words: ${words}`, pageWidth - marginRight, yPosition, { align: "right" });
        yPosition += 10;

        // --- 5. CLOSING STATEMENT ---
        // Move BEFORE Scope/Terms as requested
        checkNewPage(20);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 45, 77);
        doc.text("We will be happy to supply any further information you may need and trust that you call on us to fill your order, which will receive our prompt and careful attention.", marginLeft, yPosition, { maxWidth: pageWidth - marginLeft - marginRight });
        yPosition += 6; // Reduced from 12 to 6

        // --- 6. SCOPE & TERMS (2 Columns, Small Font) ---
        // We put them side-by-side to save space
        // --- 6. SCOPE & TERMS (2 Columns, Small Font) ---
        // We put them side-by-side to save space

        // Calculate needed space: Scope/Terms (35) + Gap (5) + Signature (30) = 70
        // We want them to stay together.
        checkNewPage(70);

        const twoColYStart = yPosition;
        const colGap = 5;
        const colW = (pageWidth - marginLeft - marginRight - colGap) / 2;

        // Left Col: Client's Scope
        doc.setFillColor(245, 245, 250);
        doc.roundedRect(marginLeft, twoColYStart, colW, 35, 2, 2, "F");

        doc.setFontSize(8);
        doc.setTextColor(30, 45, 77);
        doc.setFont("helvetica", "bold");
        doc.text("Client's Scope", marginLeft + 3, twoColYStart + 5);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(6); // Small font

        const clientScopeText = [
            "1. Warranty: 2 Yrs Maintenance with material and wage due to construction and material defect. It does not cover the warranty due to negligence of client and due to natural disasters.",
            "2. All materials will be delivered to the site; however, if they need to be transported to another location, additional handling charges will apply and must be borne by the client.",
            "3. The estimated cost is based on the specific scope of work. Any additional work beyond what has been provided will incur extra charges.",
        ];

        let scopeY = twoColYStart + 9;
        clientScopeText.forEach((line) => {
            const wrappedLine = doc.splitTextToSize(line, colW - 6);
            doc.text(wrappedLine, marginLeft + 3, scopeY);
            scopeY += wrappedLine.length * 2.5 + 2;
        });

        // Right Col: Terms & Conditions
        const rightColX = marginLeft + colW + colGap;
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(rightColX, twoColYStart, colW, 35, 2, 2, "F");

        doc.setFontSize(8);
        doc.setTextColor(30, 45, 77);
        doc.setFont("helvetica", "bold");
        doc.text("Terms & Conditions", rightColX + 3, twoColYStart + 5);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(6);

        const termsText = [
            "• All prices are subject to change without notice.",
            "• Validity: 30 days from date of quotation.",
            "• Payment terms as per agreement.",
            "• For any queries, please contact: 01-5922974 | 057-591888"
        ];

        let termY = twoColYStart + 9;
        termsText.forEach((line) => {
            doc.text(line, rightColX + 3, termY);
            termY += 4;
        });

        // Stick Signature immediately after
        yPosition = twoColYStart + 35 + 5; // Height of box (35) + Gap (5)

        const sigY = yPosition;

        // Date Box
        doc.rect(marginLeft, sigY, 60, 10);
        doc.setFontSize(8);
        doc.text("Date: " + (quoteData.quotationDate || ""), marginLeft + 2, sigY + 6);

        // Signature Line
        doc.line(pageWidth - 80, sigY + 8, pageWidth - marginRight, sigY + 8);
        doc.text("Authorized Signature", pageWidth - 40, sigY + 13, { align: "center" });

        // --- ADD WATERMARK ---
        const createFadedLogoDataUrl = async (
            dataUrl: string,
            alpha = 0.03,
            scale = 1
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
                const wmW = 70;
                const wmH = 60;
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

        // --- ADD FOOTER (Page X of Y) ---
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            const pageText = `Page ${i} of ${totalPages}`;
            doc.text(pageText, pageWidth - marginRight, pageHeight - 10, { align: "right" });

            doc.setDrawColor(239, 126, 30);
            doc.setLineWidth(0.5);
            doc.line(marginLeft, pageHeight - 15, pageWidth - marginRight, pageHeight - 15);
            doc.text("Visit us at www.belanepal.com.np", marginLeft, pageHeight - 10);
            doc.text("Email us: info@belanepal.com.np", pageWidth / 2, pageHeight - 10, { align: "center" });
        }

        // Save
        doc.save(`Quotation_${quoteData.quotationNumber || "Draft"}.pdf`);

    } catch (e) {
        console.error("PDF Gen Error", e);
        throw e;
    }
}
