import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const quotationData = await request.json();
    
    console.log('📄 Generating quotation document for:', quotationData.quotationNo);

    // Generate professional HTML quotation document
    const htmlContent = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>Quotation ${quotationData.quotationNo}</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm 2cm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Calibri', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
    }
    .container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #0066cc;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .company-name {
      font-size: 20pt;
      font-weight: bold;
      color: #0066cc;
      letter-spacing: 1px;
      margin-bottom: 5px;
    }
    .company-tagline {
      font-size: 9pt;
      color: #666;
      font-style: italic;
      margin-bottom: 10px;
    }
    .doc-title {
      font-size: 16pt;
      font-weight: bold;
      background: #0066cc;
      color: white;
      padding: 8px;
      margin-top: 10px;
      letter-spacing: 2px;
    }
    .quotation-info {
      display: table;
      width: 100%;
      margin: 20px 0;
    }
    .quotation-info-left, .quotation-info-right {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      padding: 10px;
    }
    .info-label {
      font-weight: bold;
      display: inline-block;
      width: 120px;
    }
    .addresses {
      display: table;
      width: 100%;
      margin: 20px 0;
    }
    .address-box {
      display: table-cell;
      width: 48%;
      border: 1px solid #333;
      padding: 15px;
      vertical-align: top;
    }
    .address-box + .address-box {
      margin-left: 4%;
    }
    .address-title {
      font-weight: bold;
      font-size: 11pt;
      background: #f0f0f0;
      padding: 5px;
      margin: -15px -15px 10px -15px;
      border-bottom: 2px solid #0066cc;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 10pt;
    }
    .items-table th {
      background-color: #0066cc;
      color: white;
      font-weight: bold;
      padding: 10px 8px;
      text-align: left;
      border: 1px solid #0066cc;
    }
    .items-table td {
      border: 1px solid #ccc;
      padding: 8px;
      vertical-align: top;
    }
    .items-table tbody tr:nth-child(odd) {
      background-color: #f9f9f9;
    }
    .items-table .text-right {
      text-align: right;
    }
    .items-table .text-center {
      text-align: center;
    }
    .totals-section {
      margin-top: 20px;
      float: right;
      width: 50%;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
    }
    .totals-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #eee;
    }
    .totals-table .label {
      font-weight: bold;
      text-align: left;
      width: 60%;
    }
    .totals-table .amount {
      text-align: right;
      width: 40%;
      font-weight: bold;
    }
    .totals-table .grand-total {
      background: #0066cc;
      color: white;
      font-size: 12pt;
      font-weight: bold;
      border: none;
    }
    .amount-words {
      clear: both;
      margin-top: 15px;
      padding: 10px;
      background: #f0f0f0;
      border-left: 4px solid #0066cc;
      font-weight: bold;
      font-size: 10pt;
    }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      background: #f0f0f0;
      padding: 8px;
      margin: 25px 0 10px 0;
      border-left: 4px solid #0066cc;
    }
    .terms-box {
      border: 1px solid #ccc;
      padding: 15px;
      background: #fafafa;
      font-size: 9pt;
      line-height: 1.6;
      white-space: pre-line;
    }
    .bank-details {
      border: 1px solid #ccc;
      padding: 15px;
      background: #f9f9f9;
      margin: 15px 0;
    }
    .bank-row {
      display: table;
      width: 100%;
      margin: 5px 0;
    }
    .bank-label {
      display: table-cell;
      width: 40%;
      font-weight: bold;
    }
    .bank-value {
      display: table-cell;
      width: 60%;
    }
    .signature-section {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
    }
    .signature-box {
      display: table;
      width: 100%;
    }
    .signature-left, .signature-right {
      display: table-cell;
      width: 50%;
      vertical-align: bottom;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #333;
      width: 200px;
      margin: 60px auto 5px auto;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 2px solid #0066cc;
      text-align: center;
      font-size: 9pt;
      color: #666;
    }
    .clearfix::after {
      content: "";
      display: table;
      clear: both;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="company-name">ENVIROCARE ENVIRONMENTAL SERVICES</div>
      <div class="company-tagline">NABL Accredited Environmental Testing Laboratory</div>
      <div class="doc-title">QUOTATION</div>
    </div>

    <!-- Quotation Information -->
    <div class="quotation-info">
      <div class="quotation-info-left">
        <p><span class="info-label">Quotation No:</span> ${quotationData.quotationNo || ''}</p>
        <p><span class="info-label">Date:</span> ${quotationData.date || new Date().toLocaleDateString('en-IN')}</p>
        <p><span class="info-label">Customer ID:</span> ${quotationData.customerId || 'N/A'}</p>
      </div>
      <div class="quotation-info-right">
        <p><span class="info-label">Valid Until:</span> ${(() => {
          const validDate = new Date(quotationData.date || new Date());
          validDate.setDate(validDate.getDate() + 30);
          return validDate.toLocaleDateString('en-IN');
        })()}</p>
        <p><span class="info-label">Vendor ID:</span> ${quotationData.vendorId || 'ENV-2024'}</p>
      </div>
    </div>

    <!-- Contact Person -->
    <div style="margin: 20px 0; padding: 10px; background: #f9f9f9; border: 1px solid #ddd;">
      <strong>Attention:</strong> ${quotationData.contact?.salutation || 'Mr./Ms.'} ${quotationData.contact?.name || ''}<br>
      <strong>Contact:</strong> ${quotationData.contact?.phone || ''} | ${quotationData.contact?.email || ''}
    </div>

    <!-- Addresses Side by Side -->
    <div class="addresses">
      <div class="address-box">
        <div class="address-title">BILL TO</div>
        <p><strong>${quotationData.billTo?.name || ''}</strong></p>
        <p>${quotationData.billTo?.address1 || ''}</p>
        ${quotationData.billTo?.address2 ? `<p>${quotationData.billTo.address2}</p>` : ''}
        <p>${quotationData.billTo?.city || ''}, ${quotationData.billTo?.state || ''} - ${quotationData.billTo?.pin || ''}</p>
        ${quotationData.billTo?.gstin ? `<p><strong>GSTIN:</strong> ${quotationData.billTo.gstin}</p>` : ''}
      </div>
      <div class="address-box">
        <div class="address-title">SHIP TO</div>
        <p><strong>${quotationData.shipTo?.name || quotationData.billTo?.name || ''}</strong></p>
        <p>${quotationData.shipTo?.address1 || quotationData.billTo?.address1 || ''}</p>
        ${(quotationData.shipTo?.address2 || quotationData.billTo?.address2) ? `<p>${quotationData.shipTo?.address2 || quotationData.billTo?.address2}</p>` : ''}
        <p>${quotationData.shipTo?.city || quotationData.billTo?.city || ''}, ${quotationData.shipTo?.state || quotationData.billTo?.state || ''} - ${quotationData.shipTo?.pin || quotationData.billTo?.pin || ''}</p>
        ${(quotationData.shipTo?.gstin || quotationData.billTo?.gstin) ? `<p><strong>GSTIN:</strong> ${quotationData.shipTo?.gstin || quotationData.billTo?.gstin}</p>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="text-center" style="width: 6%;">Sr.<br>No.</th>
          <th style="width: 44%;">Description of Services / Tests</th>
          <th class="text-center" style="width: 12%;">No. of<br>Samples</th>
          <th class="text-right" style="width: 18%;">Unit Price<br>(₹)</th>
          <th class="text-right" style="width: 20%;">Total Amount<br>(₹)</th>
        </tr>
      </thead>
      <tbody>
        ${(quotationData.items || []).map((item: any, index: number) => `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td>${item.description || ''}</td>
          <td class="text-center">${item.noOfSamples || 0}</td>
          <td class="text-right">${(item.unitPrice || 0).toFixed(2)}</td>
          <td class="text-right"><strong>${(item.total || 0).toFixed(2)}</strong></td>
        </tr>
        `).join('')}
        
        ${(quotationData.additionalCharges || []).length > 0 ? 
          quotationData.additionalCharges.map((charge: any, index: number) => `
        <tr>
          <td class="text-center">${(quotationData.items?.length || 0) + index + 1}</td>
          <td colspan="3">${charge.description || ''}</td>
          <td class="text-right"><strong>${(charge.amount || 0).toFixed(2)}</strong></td>
        </tr>
          `).join('') : ''}
      </tbody>
    </table>

    <!-- Totals Section -->
    <div class="clearfix">
      <div class="totals-section">
        <table class="totals-table">
          <tr>
            <td class="label">Subtotal:</td>
            <td class="amount">₹ ${(quotationData.subtotal || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td class="label">CGST @ ${quotationData.taxes?.cgstRate || 9}%:</td>
            <td class="amount">₹ ${(quotationData.taxes?.cgstAmount || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td class="label">SGST @ ${quotationData.taxes?.sgstRate || 9}%:</td>
            <td class="amount">₹ ${(quotationData.taxes?.sgstAmount || 0).toFixed(2)}</td>
          </tr>
          <tr class="grand-total">
            <td class="label">GRAND TOTAL:</td>
            <td class="amount">₹ ${(quotationData.grandTotal || 0).toFixed(2)}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="amount-words">
      <strong>Amount in Words:</strong> ${quotationData.amountInWords || 'Zero Rupees Only'}
    </div>

    <!-- Terms and Conditions -->
    <div class="section-title">TERMS & CONDITIONS</div>
    <div class="terms-box">${quotationData.terms || `1. This quotation is valid for 30 days from the date of issue.
2. Payment terms: 50% advance, 50% on completion.
3. All prices are exclusive of applicable taxes.
4. Sampling charges as per standard rates.
5. NABL accredited laboratory services.`}</div>

    <!-- Bank Details -->
    <div class="section-title">BANK DETAILS FOR PAYMENT</div>
    <div class="bank-details">
      <div class="bank-row">
        <div class="bank-label">Account Name:</div>
        <div class="bank-value">${quotationData.bankDetails?.accountName || 'Envirocare Environmental Services'}</div>
      </div>
      <div class="bank-row">
        <div class="bank-label">Account Number:</div>
        <div class="bank-value">${quotationData.bankDetails?.accountNumber || ''}</div>
      </div>
      <div class="bank-row">
        <div class="bank-label">Bank Name:</div>
        <div class="bank-value">${quotationData.bankDetails?.bankName || ''}</div>
      </div>
      <div class="bank-row">
        <div class="bank-label">Branch:</div>
        <div class="bank-value">${quotationData.bankDetails?.branch || ''}</div>
      </div>
      <div class="bank-row">
        <div class="bank-label">IFSC Code:</div>
        <div class="bank-value">${quotationData.bankDetails?.ifscCode || ''}</div>
      </div>
    </div>

    <!-- Signature Section -->
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-left">
          <div style="margin-bottom: 10px;"><strong>Prepared By:</strong></div>
          <div>${quotationData.preparedBy?.name || ''}</div>
          <div style="font-size: 9pt; color: #666;">${quotationData.preparedBy?.phone || ''}</div>
          <div style="font-size: 9pt; color: #666;">${quotationData.preparedBy?.email || ''}</div>
        </div>
        <div class="signature-right">
          <div class="signature-line"></div>
          <div style="margin-top: 5px;"><strong>Authorized Signature</strong></div>
          <div style="font-size: 9pt; color: #666;">Envirocare Environmental Services</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Envirocare Environmental Services</strong></p>
      <p>NABL Accredited Laboratory | ISO 17025:2017 Certified</p>
      <p style="margin-top: 10px; font-size: 8pt;">
        Thank you for your business. For any queries, please contact us at the details provided above.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Convert HTML to buffer for DOCX download
    const buffer = Buffer.from(htmlContent, 'utf-8');
    
    // Create filename
    const filename = `Quotation_${quotationData.quotationNo}_${new Date().toISOString().split('T')[0]}.doc`;
    
    console.log('✅ Document generated successfully:', filename);

    // Return file as response - using .doc format which Word can open
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/msword',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating DOCX:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate quotation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

