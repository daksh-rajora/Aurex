import PDFDocument from 'pdfkit';

/**
 * Helper to clean raw markdown characters for PDF text rendering.
 */
const cleanMarkdown = (text = '') => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .trim();
};

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
  if (doc.y > 670) {
    doc.addPage();
  } else {
    doc.moveDown(1.2);
  }

  const startY = doc.y;

  // Header background bar accent
  doc
    .rect(50, startY, 4, 18)
    .fill('#4F46E5');

  doc
    .fillColor('#0F172A')
    .fontSize(13)
    .font('Helvetica-Bold')
    .text(title, 62, startY + 1);

  doc.moveDown(0.8);
};

/**
 * Draw bullet points list safely with multi-page handling.
 */
const drawBulletList = (doc, items = [], bulletColor = '#4F46E5') => {
  if (!items || items.length === 0) {
    doc
      .fillColor('#64748B')
      .fontSize(9.5)
      .font('Helvetica-Oblique')
      .text('None specified.', 60);
    return;
  }

  items.forEach((item) => {
    if (doc.y > 720) {
      doc.addPage();
    }

    const startY = doc.y;

    // Bullet icon
    doc
      .circle(62, startY + 4, 2.5)
      .fill(bulletColor);

    doc
      .fillColor('#334155')
      .fontSize(9.5)
      .font('Helvetica')
      .text(cleanMarkdown(item), 72, startY, { width: 470, lineGap: 3 });

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

      const repoName = repo.name || 'Repository';
      const repoOwner = repo.owner || 'owner';
      const fullName = repo.fullName || `${repoOwner}/${repoName}`;
      const githubUrl = repo.htmlUrl || github.htmlUrl || `https://github.com/${fullName}`;
      const overallScore = ai.overallScore ?? 0;
      const scoreColor = getScoreColor(overallScore);

      const isPublicSource =
        (repo.visibility || '').toLowerCase() === 'public' ||
        Boolean(analysisDoc.isPublicRepo) ||
        !analysisDoc.user;

      const aiModel = analysisDoc.aiModel || process.env.OPENROUTER_MODEL || 'qwen/qwen3-coder-next';

      // ==========================================
      // COVER PAGE
      // ==========================================

      // Brand Top Banner
      doc
        .rect(0, 0, 595.28, 130)
        .fill('#0F172A');

      doc
        .fillColor('#818CF8')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('AUREX AI', 50, 35, { characterSpacing: 2 });

      doc
        .fillColor('#94A3B8')
        .fontSize(9.5)
        .font('Helvetica')
        .text('Developer Intelligence & Automated Code Auditing', 50, 56);

      doc
        .fillColor('#FFFFFF')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('REPOSITORY INTELLIGENCE REPORT', 50, 80);

      // Repository Title Section
      doc.y = 150;

      doc
        .fillColor('#0F172A')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(fullName, 50, 155, { width: 495 });

      if (repo.description) {
        doc
          .fillColor('#475569')
          .fontSize(9.5)
          .font('Helvetica')
          .text(cleanMarkdown(repo.description), 50, doc.y + 5, { width: 495, maxLines: 2 });
      }

      // Score Hero Card
      const scoreBoxY = doc.y + 15;
      doc
        .roundedRect(50, scoreBoxY, 495, 85, 8)
        .fillAndStroke('#F8FAFC', '#E2E8F0');

      doc
        .fillColor('#475569')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('OVERALL AI QUALITY SCORE', 70, scoreBoxY + 18);

      doc
        .fillColor(scoreColor)
        .fontSize(34)
        .font('Helvetica-Bold')
        .text(`${overallScore}`, 70, scoreBoxY + 36);

      doc
        .fillColor('#94A3B8')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('/ 100', 130, scoreBoxY + 50);

      let scoreBadgeText = 'EXCELLENT';
      if (overallScore < 60) scoreBadgeText = 'NEEDS WORK';
      else if (overallScore < 80) scoreBadgeText = 'GOOD';

      doc
        .roundedRect(390, scoreBoxY + 26, 135, 32, 4)
        .fill(scoreColor);

      doc
        .fillColor('#FFFFFF')
        .fontSize(9.5)
        .font('Helvetica-Bold')
        .text(scoreBadgeText, 390, scoreBoxY + 36, { width: 135, align: 'center' });

      // Key Metadata Box
      const metaY = scoreBoxY + 100;
      doc
        .roundedRect(50, metaY, 495, 145, 8)
        .fillAndStroke('#FFFFFF', '#CBD5E1');

      const col1X = 70;
      const col2X = 310;
      let currY = metaY + 15;

      const metadataFields = [
        { label: 'Repository Name', val: repoName },
        { label: 'Primary Language', val: github.language || repo.language || 'Unknown' },
        { label: 'Owner', val: repoOwner },
        { label: 'Visibility', val: (repo.visibility || 'public').toUpperCase() },
        { label: 'GitHub URL', val: githubUrl },
        { label: 'Stars / Forks', val: `${github.stars || 0} Stars / ${github.forks || 0} Forks` },
        { label: 'Analysis Source', val: isPublicSource ? 'Public GitHub Repository' : 'Connected GitHub' },
        { label: 'AI Provider', val: analysisDoc.aiProvider || 'OpenRouter' },
        { label: 'AI Model', val: aiModel },
        {
          label: 'Analyzed Date',
          val: new Date(analysisDoc.completedAt || analysisDoc.createdAt || Date.now()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
        },
        { label: 'Default Branch', val: repo.defaultBranch || 'main' },
      ];

      for (let i = 0; i < metadataFields.length; i += 2) {
        const item1 = metadataFields[i];
        const item2 = metadataFields[i + 1];

        if (item1) {
          doc.fillColor('#64748B').fontSize(8.5).font('Helvetica-Bold').text(`${item1.label}:`, col1X, currY);
          doc.fillColor('#1E293B').fontSize(8.5).font('Helvetica').text(String(item1.val), col1X + 90, currY, { width: 135, truncate: true });
        }
        if (item2) {
          doc.fillColor('#64748B').fontSize(8.5).font('Helvetica-Bold').text(`${item2.label}:`, col2X, currY);
          doc.fillColor('#1E293B').fontSize(8.5).font('Helvetica').text(String(item2.val), col2X + 90, currY, { width: 135, truncate: true });
        }

        currY += 21;
      }

      // ==========================================
      // PAGE 2: EXECUTIVE SUMMARY & SCORE BREAKDOWN
      // ==========================================
      doc.addPage();

      // Executive Summary
      drawSectionHeader(doc, '1. Executive Summary');

      const summaryText = cleanMarkdown(ai.summary) || 'No executive summary provided for this analysis.';
      doc
        .fillColor('#334155')
        .fontSize(9.5)
        .font('Helvetica')
        .text(summaryText, 50, doc.y, { width: 495, lineGap: 3, align: 'justify' });

      doc.moveDown(1);

      // Quality Metrics Breakdown
      drawSectionHeader(doc, '2. Detailed Quality Scores (Out of 100)');

      const scores = [
        { label: 'Overall Score', score: ai.overallScore ?? 0 },
        { label: 'Code Quality Score', score: ai.codeQuality ?? 0 },
        { label: 'Architecture Score', score: ai.architecture ?? 0 },
        { label: 'Security Score', score: ai.security ?? 0 },
        { label: 'Performance Score', score: ai.performance ?? 0 },
        { label: 'Documentation Score', score: ai.documentation ?? 0 },
        { label: 'Maintainability Score', score: ai.maintainability ?? 0 },
        { label: 'Best Practices Score', score: ai.bestPractices ?? 0 },
      ];

      scores.forEach((s) => {
        if (doc.y > 700) {
          doc.addPage();
        }

        const yPos = doc.y;
        const color = getScoreColor(s.score);

        // Label
        doc
          .fillColor('#1E293B')
          .fontSize(9.5)
          .font('Helvetica-Bold')
          .text(s.label, 50, yPos, { width: 140 });

        // Progress bar background track
        doc
          .roundedRect(190, yPos + 1, 230, 10, 3)
          .fill('#E2E8F0');

        // Progress bar fill
        const fillWidth = Math.max(4, (s.score / 100) * 230);
        doc
          .roundedRect(190, yPos + 1, fillWidth, 10, 3)
          .fill(color);

        // Score text
        doc
          .fillColor(color)
          .fontSize(9.5)
          .font('Helvetica-Bold')
          .text(`${s.score} / 100`, 435, yPos, { width: 110, align: 'right' });

        doc.moveDown(0.75);
      });

      // Tech Stack
      if ((ai.techStack && ai.techStack.length > 0) || (github.topics && github.topics.length > 0)) {
        drawSectionHeader(doc, '3. Technology Stack');

        if (ai.techStack && ai.techStack.length > 0) {
          doc.fillColor('#475569').fontSize(9.5).font('Helvetica-Bold').text('Detected Stack:', 50);
          doc.fillColor('#1E293B').fontSize(9.5).font('Helvetica').text(ai.techStack.join(', '), 140, doc.y - 11);
          doc.moveDown(0.5);
        }

        if (github.topics && github.topics.length > 0) {
          doc.fillColor('#475569').fontSize(9.5).font('Helvetica-Bold').text('Topics:', 50);
          doc.fillColor('#1E293B').fontSize(9.5).font('Helvetica').text(github.topics.join(', '), 140, doc.y - 11);
          doc.moveDown(0.5);
        }
      }

      // ==========================================
      // PAGE 3+: REVIEWS & DETAILED FINDINGS
      // ==========================================

      drawSectionHeader(doc, '4. Detailed Category Reviews');

      const reviews = [
        { title: 'Architecture Review', text: ai.architectureReview },
        { title: 'Code Quality Review', text: ai.codeQualityReview },
        { title: 'Documentation Review', text: ai.documentationReview },
        { title: 'Security Review', text: ai.securityReview },
        { title: 'Performance Review', text: ai.performanceReview },
        { title: 'Maintainability Review', text: ai.maintainabilityReview },
        { title: 'Best Practices Review', text: ai.bestPracticesReview },
      ];

      reviews.forEach((r) => {
        const cleanedText = cleanMarkdown(r.text);
        if (doc.y > 670) doc.addPage();

        doc
          .fillColor('#4F46E5')
          .fontSize(10.5)
          .font('Helvetica-Bold')
          .text(r.title, 50);

        doc.moveDown(0.3);

        doc
          .fillColor('#334155')
          .fontSize(9)
          .font('Helvetica')
          .text(cleanedText || 'No review details provided for this section.', 50, doc.y, { width: 495, lineGap: 3, align: 'justify' });

        doc.moveDown(0.8);
      });

      // Strengths
      drawSectionHeader(doc, '5. Strengths');
      drawBulletList(doc, ai.strengths || [], '#059669');

      // Weaknesses
      drawSectionHeader(doc, '6. Weaknesses');
      drawBulletList(doc, ai.weaknesses || [], '#DC2626');

      // Suggestions
      drawSectionHeader(doc, '7. Suggestions');
      drawBulletList(doc, ai.suggestions || [], '#D97706');

      // Recommendations
      drawSectionHeader(doc, '8. Recommendations');
      drawBulletList(doc, ai.recommendations || [], '#4F46E5');

      // ==========================================
      // GLOBAL HEADER & FOOTER WITH PAGE NUMBERS
      // ==========================================
      const range = doc.bufferedPageRange();
      const totalPages = range.count;

      for (let i = range.start; i < range.start + totalPages; i++) {
        doc.switchToPage(i);

        // Header on pages 2+
        if (i > 0) {
          doc
            .fillColor('#94A3B8')
            .fontSize(8)
            .font('Helvetica')
            .text('AUREX AI  |  Repository Intelligence Report', 50, 25);

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
        }

        // Running Footer on ALL pages
        doc
          .moveTo(50, 805)
          .lineTo(545, 805)
          .strokeColor('#E2E8F0')
          .stroke();

        doc
          .fillColor('#94A3B8')
          .fontSize(8)
          .font('Helvetica')
          .text('Confidential - Generated by Aurex AI', 50, 812);

        doc
          .fillColor('#94A3B8')
          .fontSize(8)
          .font('Helvetica')
          .text(`Page ${i + 1} of ${totalPages}`, 350, 812, { width: 195, align: 'right' });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export default generateAnalysisPdf;


