import PDFDocument from 'pdfkit';

/**
 * Helper to determine score badge color.
 */
const getScoreColor = (score = 0) => {
  if (score >= 80) return '#059669'; // Emerald
  if (score >= 60) return '#2563EB'; // Blue
  if (score >= 40) return '#D97706'; // Amber
  return '#DC2626'; // Red
};

/**
 * Draw section header in PDF.
 */
const drawSectionHeader = (doc, title) => {
  // Add space if needed
  if (doc.y > 680) {
    doc.addPage();
  } else {
    doc.moveDown(1.2);
  }

  const startY = doc.y;

  // Header background pill line
  doc
    .rect(50, startY, 4, 18)
    .fill('#4F46E5');

  doc
    .fillColor('#0F172A')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(title, 62, startY + 1);

  doc.moveDown(0.8);
};

/**
 * Draw bullet points list.
 */
const drawBulletList = (doc, items = [], bulletColor = '#4F46E5') => {
  if (!items || items.length === 0) {
    doc
      .fillColor('#64748B')
      .fontSize(10)
      .font('Helvetica-Oblique')
      .text('No items specified.', 60);
    return;
  }

  items.forEach((item) => {
    if (doc.y > 720) {
      doc.addPage();
    }

    const startY = doc.y;

    // Bullet circle
    doc
      .circle(65, startY + 5, 3)
      .fill(bulletColor);

    // Text
    doc
      .fillColor('#334155')
      .fontSize(10)
      .font('Helvetica')
      .text(item, 76, startY, { width: 480, lineGap: 3 });

    doc.moveDown(0.3);
  });
};

/**
 * Generates a professional PDF report buffer for a completed analysis.
 *
 * @param {Object} analysisDoc - Complete Mongoose Analysis document
 * @returns {Promise<Buffer>} PDF file buffer
 */
export const generateAnalysisPdf = (analysisDoc) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const repo = analysisDoc.repository || {};
      const github = analysisDoc.github || {};
      const ai = analysisDoc.analysis || {};

      const fullName = repo.fullName || `${repo.owner || 'Unknown'}/${repo.name || 'Repository'}`;
      const overallScore = ai.overallScore ?? 0;
      const scoreColor = getScoreColor(overallScore);

      // ==========================================
      // COVER PAGE
      // ==========================================

      // Brand Header Bar
      doc
        .rect(0, 0, 595.28, 140)
        .fill('#1E293B');

      doc
        .fillColor('#818CF8')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('AUREX', 50, 40, { characterSpacing: 2 });

      doc
        .fillColor('#94A3B8')
        .fontSize(10)
        .font('Helvetica')
        .text('AI Repository Intelligence & Quality Analyzer', 110, 41);

      // Report Title
      doc
        .fillColor('#FFFFFF')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('REPOSITORY ANALYSIS REPORT', 50, 75);

      // Main Content Box on Cover
      doc.y = 160;

      // Repository Name Banner
      doc
        .fillColor('#0F172A')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(fullName, 50, 170);

      if (repo.description) {
        doc
          .fillColor('#475569')
          .fontSize(10)
          .font('Helvetica')
          .text(repo.description, 50, 195, { width: 495, maxLines: 2 });
      }

      // Overall Score Card
      const scoreBoxY = 240;
      doc
        .roundedRect(50, scoreBoxY, 495, 90, 8)
        .fillAndStroke('#F8FAFC', '#E2E8F0');

      doc
        .fillColor('#475569')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('OVERALL AI QUALITY SCORE', 70, scoreBoxY + 20);

      doc
        .fillColor(scoreColor)
        .fontSize(36)
        .font('Helvetica-Bold')
        .text(`${overallScore}`, 70, scoreBoxY + 40);

      doc
        .fillColor('#94A3B8')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('/ 100', 130, scoreBoxY + 54);

      // Score status badge text
      let scoreBadgeText = 'EXCELLENT';
      if (overallScore < 60) scoreBadgeText = 'NEEDS IMPROVEMENT';
      else if (overallScore < 80) scoreBadgeText = 'GOOD';

      doc
        .roundedRect(390, scoreBoxY + 28, 135, 34, 4)
        .fill(scoreColor);

      doc
        .fillColor('#FFFFFF')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(scoreBadgeText, 390, scoreBoxY + 40, { width: 135, align: 'center' });

      // Metadata Key-Value Details Box
      const metaY = 355;
      doc
        .roundedRect(50, metaY, 495, 120, 8)
        .fillAndStroke('#FFFFFF', '#CBD5E1');

      const col1X = 70;
      const col2X = 310;
      let currY = metaY + 15;

      const metadataFields = [
        { label: 'Owner', val: repo.owner || 'N/A', col: 1 },
        { label: 'Primary Language', val: github.language || 'Not specified', col: 2 },
        { label: 'Visibility', val: (repo.visibility || 'public').toUpperCase(), col: 1 },
        { label: 'Stars / Forks', val: `${github.stars || 0} ⭐ / ${github.forks || 0} 🍴`, col: 2 },
        { label: 'Default Branch', val: repo.defaultBranch || 'main', col: 1 },
        { label: 'Open Issues', val: `${github.openIssues || 0}`, col: 2 },
        {
          label: 'Generated Date',
          val: new Date(analysisDoc.createdAt || Date.now()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          col: 1,
        },
        { label: 'AI Engine', val: analysisDoc.aiProvider || 'Aurex AI', col: 2 },
      ];

      for (let i = 0; i < metadataFields.length; i += 2) {
        const item1 = metadataFields[i];
        const item2 = metadataFields[i + 1];

        if (item1) {
          doc.fillColor('#64748B').fontSize(9).font('Helvetica-Bold').text(`${item1.label}:`, col1X, currY);
          doc.fillColor('#1E293B').fontSize(9).font('Helvetica').text(item1.val, col1X + 90, currY);
        }
        if (item2) {
          doc.fillColor('#64748B').fontSize(9).font('Helvetica-Bold').text(`${item2.label}:`, col2X, currY);
          doc.fillColor('#1E293B').fontSize(9).font('Helvetica').text(item2.val, col2X + 90, currY);
        }

        currY += 22;
      }

      // Cover Page Footer Note
      doc
        .fillColor('#94A3B8')
        .fontSize(9)
        .font('Helvetica-Oblique')
        .text(
          'This document contains an automated AI architectural review & quality assessment generated by Aurex.',
          50,
          720,
          { width: 495, align: 'center' }
        );

      // ==========================================
      // PAGE 2: EXECUTIVE SUMMARY & SCORE BREAKDOWN
      // ==========================================
      doc.addPage();

      // Section 1: Executive Summary
      drawSectionHeader(doc, '1. Executive Summary');

      const summaryText = ai.summary || 'No executive summary provided for this analysis.';
      doc
        .roundedRect(50, doc.y, 495, 0, 0); // Spacer anchor

      doc
        .fillColor('#334155')
        .fontSize(10)
        .font('Helvetica')
        .text(summaryText, 50, doc.y, { width: 495, lineGap: 4, align: 'justify' });

      doc.moveDown(1);

      // Section 2: AI Category Scores
      drawSectionHeader(doc, '2. Quality Metrics Breakdown');

      const scores = [
        { label: 'Code Quality', score: ai.codeQuality ?? 0 },
        { label: 'Architecture', score: ai.architecture ?? 0 },
        { label: 'Security', score: ai.security ?? 0 },
        { label: 'Performance', score: ai.performance ?? 0 },
        { label: 'Maintainability', score: ai.maintainability ?? 0 },
        { label: 'Documentation', score: ai.documentation ?? 0 },
        { label: 'Best Practices', score: ai.bestPractices ?? 0 },
      ];

      let scoreGridY = doc.y;

      scores.forEach((s, idx) => {
        if (doc.y > 700) {
          doc.addPage();
          scoreGridY = doc.y;
        }

        const yPos = doc.y;
        const color = getScoreColor(s.score);

        // Label
        doc
          .fillColor('#1E293B')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(s.label, 50, yPos, { width: 140 });

        // Background progress bar track
        doc
          .roundedRect(190, yPos + 2, 240, 10, 3)
          .fill('#E2E8F0');

        // Filled progress bar
        const fillWidth = Math.max(4, (s.score / 100) * 240);
        doc
          .roundedRect(190, yPos + 2, fillWidth, 10, 3)
          .fill(color);

        // Numeric score text
        doc
          .fillColor(color)
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`${s.score} / 100`, 445, yPos, { width: 100, align: 'right' });

        doc.moveDown(0.75);
      });

      // Section 3: Tech Stack & Topics
      if ((ai.techStack && ai.techStack.length > 0) || (github.topics && github.topics.length > 0)) {
        drawSectionHeader(doc, '3. Technology Stack & Topics');

        if (ai.techStack && ai.techStack.length > 0) {
          doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold').text('Tech Stack:', 50);
          doc.fillColor('#1E293B').fontSize(10).font('Helvetica').text(ai.techStack.join(', '), 120, doc.y - 12);
          doc.moveDown(0.5);
        }

        if (github.topics && github.topics.length > 0) {
          doc.fillColor('#475569').fontSize(10).font('Helvetica-Bold').text('Topics:', 50);
          doc.fillColor('#1E293B').fontSize(10).font('Helvetica').text(github.topics.join(', '), 120, doc.y - 12);
          doc.moveDown(0.5);
        }
      }

      // ==========================================
      // PAGE 3+: REVIEWS & DETAILED FINDINGS
      // ==========================================

      // Detailed Reviews Section
      drawSectionHeader(doc, '4. Detailed Architectural & Code Reviews');

      const reviews = [
        { title: 'Architecture Review', text: ai.architectureReview },
        { title: 'Code Quality Review', text: ai.codeQualityReview },
        { title: 'Security Review', text: ai.securityReview },
        { title: 'Performance Review', text: ai.performanceReview },
        { title: 'Maintainability Review', text: ai.maintainabilityReview },
        { title: 'Documentation Review', text: ai.documentationReview },
        { title: 'Best Practices Review', text: ai.bestPracticesReview },
      ];

      reviews.forEach((r) => {
        if (r.text && r.text.trim()) {
          if (doc.y > 680) doc.addPage();

          doc
            .fillColor('#4F46E5')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text(r.title, 50);

          doc.moveDown(0.3);

          doc
            .fillColor('#334155')
            .fontSize(9.5)
            .font('Helvetica')
            .text(r.text, 50, doc.y, { width: 495, lineGap: 3, align: 'justify' });

          doc.moveDown(0.8);
        }
      });

      // Section 5: Strengths
      drawSectionHeader(doc, '5. Identified Strengths');
      drawBulletList(doc, ai.strengths, '#059669');

      // Section 6: Weaknesses & Risks
      drawSectionHeader(doc, '6. Weaknesses & Potential Risks');
      drawBulletList(doc, ai.weaknesses, '#DC2626');

      // Section 7: Improvement Recommendations
      drawSectionHeader(doc, '7. Key Improvement Recommendations');
      drawBulletList(doc, ai.suggestions, '#4F46E5');

      // ==========================================
      // GLOBAL HEADER & FOOTER WITH PAGE NUMBERS
      // ==========================================
      const range = doc.bufferedPageRange();
      const totalPages = range.count;

      for (let i = range.start; i < range.start + totalPages; i++) {
        doc.switchToPage(i);

        // Skip headers/footers on cover page
        if (i > 0) {
          // Top Running Header
          doc
            .fillColor('#94A3B8')
            .fontSize(8)
            .font('Helvetica')
            .text('AUREX  |  Repository Intelligence Report', 50, 25);

          doc
            .fillColor('#94A3B8')
            .fontSize(8)
            .font('Helvetica')
            .text(fullName, 350, 25, { width: 195, align: 'right' });

          doc
            .moveTo(50, 36)
            .lineTo(545, 36)
            .strokeColor('#E2E8F0')
            .stroke();

          // Bottom Running Footer
          doc
            .moveTo(50, 805)
            .lineTo(545, 805)
            .strokeColor('#E2E8F0')
            .stroke();

          doc
            .fillColor('#94A3B8')
            .fontSize(8)
            .font('Helvetica')
            .text('Confidential - Generated by Aurex Engine', 50, 812);

          doc
            .fillColor('#94A3B8')
            .fontSize(8)
            .font('Helvetica')
            .text(`Page ${i + 1} of ${totalPages}`, 350, 812, { width: 195, align: 'right' });
        }
      }

      // End PDF stream
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export default generateAnalysisPdf;
