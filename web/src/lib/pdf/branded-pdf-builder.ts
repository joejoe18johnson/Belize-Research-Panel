import {
  PDFDocument,
  StandardFonts,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import { BRP_PDF_COLORS, BRP_PDF_PAGE } from "./brand-colors";

export interface BrandedPdfMeta {
  documentTitle: string;
  documentSubtitle?: string;
  referenceId?: string;
  generatedAt?: string;
  confidential?: boolean;
}

export class BrandedPdfBuilder {
  private doc!: PDFDocument;
  private page!: PDFPage;
  private regular!: PDFFont;
  private bold!: PDFFont;
  private y = 0;
  private pageNumber = 0;
  private readonly meta: BrandedPdfMeta;

  private constructor(meta: BrandedPdfMeta) {
    this.meta = meta;
  }

  static async create(meta: BrandedPdfMeta): Promise<BrandedPdfBuilder> {
    const builder = new BrandedPdfBuilder(meta);
    await builder.init();
    return builder;
  }

  private async init(): Promise<void> {
    this.doc = await PDFDocument.create();
    this.doc.setTitle(this.meta.documentTitle);
    this.doc.setProducer("Belize Research Panel");
    this.doc.setCreator("Belize Research Panel Admin Portal");
    this.regular = await this.doc.embedFont(StandardFonts.Helvetica);
    this.bold = await this.doc.embedFont(StandardFonts.HelveticaBold);

    this.addPage();
  }

  private contentWidth(): number {
    return BRP_PDF_PAGE.width - BRP_PDF_PAGE.marginX * 2;
  }

  private addPage(): void {
    this.page = this.doc.addPage([BRP_PDF_PAGE.width, BRP_PDF_PAGE.height]);
    this.pageNumber += 1;
    this.drawPageChrome();
    this.y = BRP_PDF_PAGE.height - BRP_PDF_PAGE.marginTop;
  }

  private drawPageChrome(): void {
    const { width, height } = BRP_PDF_PAGE;

    this.page.drawRectangle({
      x: 0,
      y: height - BRP_PDF_PAGE.headerHeight,
      width,
      height: BRP_PDF_PAGE.headerHeight,
      color: BRP_PDF_COLORS.teal950,
    });

    this.page.drawRectangle({
      x: 0,
      y: height - BRP_PDF_PAGE.headerHeight,
      width,
      height: 4,
      color: BRP_PDF_COLORS.teal500,
    });

    const headerX = BRP_PDF_PAGE.marginX;

    this.drawText(this.bold, "Belize Research Panel", headerX, height - 34, 14, BRP_PDF_COLORS.white);
    this.drawText(this.bold, this.meta.documentTitle, headerX, height - 50, 12, BRP_PDF_COLORS.teal100);

    if (this.meta.documentSubtitle) {
      this.drawText(
        this.regular,
        this.meta.documentSubtitle,
        headerX,
        height - 64,
        9,
        BRP_PDF_COLORS.teal100
      );
    }

    if (this.meta.referenceId) {
      this.drawText(
        this.regular,
        `Ref ${this.meta.referenceId}`,
        width - BRP_PDF_PAGE.marginX - 120,
        height - 38,
        9,
        BRP_PDF_COLORS.teal100,
        { align: "right", maxWidth: 120 }
      );
    }

    const footerY = 28;
    this.page.drawLine({
      start: { x: BRP_PDF_PAGE.marginX, y: footerY + 14 },
      end: { x: width - BRP_PDF_PAGE.marginX, y: footerY + 14 },
      thickness: 0.75,
      color: BRP_PDF_COLORS.zinc200,
    });

    const generated = this.meta.generatedAt
      ? `Generated ${this.meta.generatedAt}`
      : `Generated ${new Date().toLocaleString("en-BZ", { dateStyle: "medium", timeStyle: "short" })}`;

    this.drawText(this.regular, generated, BRP_PDF_PAGE.marginX, footerY, 8, BRP_PDF_COLORS.zinc500);
    this.drawText(
      this.regular,
      `Page ${this.pageNumber}`,
      width - BRP_PDF_PAGE.marginX,
      footerY,
      8,
      BRP_PDF_COLORS.zinc500,
      { align: "right", maxWidth: 80 }
    );

    if (this.meta.confidential !== false) {
      this.drawText(
        this.regular,
        "Confidential — Belize Research Panel",
        width / 2,
        footerY,
        7.5,
        BRP_PDF_COLORS.zinc500,
        { align: "center", maxWidth: 220 }
      );
    }
  }

  private drawText(
    font: PDFFont,
    text: string,
    x: number,
    y: number,
    size: number,
    color: RGB,
    options?: { align?: "left" | "center" | "right"; maxWidth?: number }
  ): void {
    let drawX = x;
    const maxWidth = options?.maxWidth;
    const width = font.widthOfTextAtSize(text, size);

    if (options?.align === "right" && maxWidth) drawX = x + maxWidth - width;
    if (options?.align === "center" && maxWidth) drawX = x + (maxWidth - width) / 2;

    this.page.drawText(text, { x: drawX, y, size, font, color });
  }

  private wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return [""];

    const lines: string[] = [];
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  private ensureSpace(heightNeeded: number): void {
    if (this.y - heightNeeded >= BRP_PDF_PAGE.marginBottom) return;
    this.addPage();
  }

  addSpacer(points = 12): void {
    this.y -= points;
  }

  addSectionTitle(title: string): void {
    this.ensureSpace(44);
    const titleSize = 12;
    const barHeight = titleSize + 8;
    const barBottom = this.y - titleSize + 1;

    this.page.drawRectangle({
      x: BRP_PDF_PAGE.marginX,
      y: barBottom,
      width: 4,
      height: barHeight,
      color: BRP_PDF_COLORS.teal700,
    });
    this.drawText(
      this.bold,
      title,
      BRP_PDF_PAGE.marginX + 14,
      this.y,
      titleSize,
      BRP_PDF_COLORS.teal900
    );
    this.y -= 34;
  }

  addParagraph(text: string, options?: { size?: number; color?: RGB; muted?: boolean }): void {
    const size = options?.size ?? 10;
    const color = options?.color ?? (options?.muted ? BRP_PDF_COLORS.zinc500 : BRP_PDF_COLORS.zinc700);
    const lines = this.wrapText(text, this.regular, size, this.contentWidth());

    for (const line of lines) {
      this.ensureSpace(size + 6);
      this.drawText(this.regular, line, BRP_PDF_PAGE.marginX, this.y, size, color);
      this.y -= size + 5;
    }
  }

  addKeyValueGrid(rows: Array<{ label: string; value: string }>, columns = 2): void {
    const gap = 16;
    const colWidth = (this.contentWidth() - gap * (columns - 1)) / columns;
    let column = 0;
    let rowY = this.y;

    for (const row of rows) {
      const valueLines = this.wrapText(row.value || "—", this.regular, 10, colWidth - 4);
      const blockHeight = 14 + valueLines.length * 13 + 8;
      this.ensureSpace(blockHeight + 4);

      const x = BRP_PDF_PAGE.marginX + column * (colWidth + gap);
      if (column === 0) rowY = this.y;

      this.drawText(this.bold, row.label, x, rowY, 8.5, BRP_PDF_COLORS.zinc500);
      let valueY = rowY - 13;
      for (const line of valueLines) {
        this.drawText(this.regular, line, x, valueY, 10, BRP_PDF_COLORS.zinc900);
        valueY -= 13;
      }

      column += 1;
      if (column >= columns) {
        column = 0;
        this.y = Math.min(this.y, valueY - 8);
        rowY = this.y;
      } else {
        this.y = Math.min(this.y, valueY - 8);
      }
    }

    if (column !== 0) this.y -= 8;
    this.addSpacer(6);
  }

  addHighlightCard(title: string, value: string, subtitle?: string): void {
    const cardHeight = 76;
    const gapAfter = 28;
    this.ensureSpace(cardHeight + gapAfter);

    const cardBottom = this.y - cardHeight;
    const padX = 18;
    const cardTop = cardBottom + cardHeight;

    this.page.drawRectangle({
      x: BRP_PDF_PAGE.marginX,
      y: cardBottom,
      width: this.contentWidth(),
      height: cardHeight,
      color: BRP_PDF_COLORS.teal100,
      borderColor: BRP_PDF_COLORS.teal500,
      borderWidth: 0.75,
    });

    this.drawText(this.bold, title, BRP_PDF_PAGE.marginX + padX, cardTop - 18, 9, BRP_PDF_COLORS.teal900);
    this.drawText(this.bold, value, BRP_PDF_PAGE.marginX + padX, cardTop - 40, 18, BRP_PDF_COLORS.teal950);
    if (subtitle) {
      this.drawText(this.regular, subtitle, BRP_PDF_PAGE.marginX + padX, cardBottom + 14, 8.5, BRP_PDF_COLORS.zinc700);
    }

    this.y = cardBottom - gapAfter;
  }

  addTable(headers: string[], rows: string[][], columnWidths?: number[]): void {
    const widths =
      columnWidths ??
      headers.map(() => this.contentWidth() / headers.length);
    const rowHeight = 22;
    const headerHeight = 24;

    this.ensureSpace(headerHeight + rowHeight);
    let x = BRP_PDF_PAGE.marginX;
    let tableTop = this.y;

    this.page.drawRectangle({
      x: BRP_PDF_PAGE.marginX,
      y: tableTop - headerHeight + 6,
      width: this.contentWidth(),
      height: headerHeight,
      color: BRP_PDF_COLORS.teal900,
    });

    for (let i = 0; i < headers.length; i += 1) {
      this.drawText(this.bold, headers[i], x + 8, tableTop - 12, 8.5, BRP_PDF_COLORS.white, {
        maxWidth: widths[i] - 12,
      });
      x += widths[i];
    }

    this.y = tableTop - headerHeight - 4;

    for (const row of rows) {
      this.ensureSpace(rowHeight);
      x = BRP_PDF_PAGE.marginX;
      const rowTop = this.y;

      this.page.drawRectangle({
        x: BRP_PDF_PAGE.marginX,
        y: rowTop - rowHeight + 8,
        width: this.contentWidth(),
        height: rowHeight,
        color: BRP_PDF_COLORS.zinc50,
        borderColor: BRP_PDF_COLORS.zinc200,
        borderWidth: 0.5,
      });

      for (let i = 0; i < headers.length; i += 1) {
        const cell = row[i] ?? "—";
        const clipped =
          this.regular.widthOfTextAtSize(cell, 9) > widths[i] - 12
            ? `${cell.slice(0, Math.max(0, Math.floor((widths[i] - 12) / 5)))}…`
            : cell;
        this.drawText(this.regular, clipped, x + 8, rowTop - 10, 9, BRP_PDF_COLORS.zinc900, {
          maxWidth: widths[i] - 12,
        });
        x += widths[i];
      }

      this.y -= rowHeight;
    }

    this.addSpacer(10);
  }

  addStatusBadge(label: string, tone: "success" | "warning" | "info" | "neutral" = "info"): void {
    const colors = {
      success: BRP_PDF_COLORS.emerald700,
      warning: BRP_PDF_COLORS.amber700,
      info: BRP_PDF_COLORS.teal700,
      neutral: BRP_PDF_COLORS.zinc700,
    } as const;

    const badgeHeight = 22;
    const gapAfter = 18;
    this.ensureSpace(badgeHeight + gapAfter);

    const badgeWidth = Math.min(this.bold.widthOfTextAtSize(label, 9) + 24, this.contentWidth());
    const badgeBottom = this.y - badgeHeight;

    this.page.drawRectangle({
      x: BRP_PDF_PAGE.marginX,
      y: badgeBottom,
      width: badgeWidth,
      height: badgeHeight,
      color: BRP_PDF_COLORS.white,
      borderColor: colors[tone],
      borderWidth: 1,
    });

    this.drawText(this.bold, label, BRP_PDF_PAGE.marginX + 12, badgeBottom + 7, 9, colors[tone]);
    this.y = badgeBottom - gapAfter;
  }

  addDivider(): void {
    this.ensureSpace(12);
    this.page.drawLine({
      start: { x: BRP_PDF_PAGE.marginX, y: this.y },
      end: { x: BRP_PDF_PAGE.width - BRP_PDF_PAGE.marginX, y: this.y },
      thickness: 0.75,
      color: BRP_PDF_COLORS.zinc200,
    });
    this.y -= 16;
  }

  async toBytes(): Promise<Uint8Array> {
    return this.doc.save();
  }
}
