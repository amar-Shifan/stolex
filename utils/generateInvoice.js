const PDFDocument = require('pdfkit');
const fs = require('fs');

const generateInvoice = (order, res) => {
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);

    doc.pipe(res); // Stream the PDF directly to the response

    // Add Invoice Header with Styling
    doc.fontSize(26).font('Helvetica-Bold').text('Invoice', { align: 'center' });
    doc.moveDown(2);

    // Horizontal Line
    doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke('#cccccc');
    doc.moveDown(1.5);

    // Order Details Section
    doc.fontSize(12).font('Helvetica-Bold').text('Order Details:', { underline: true });
    doc.font('Helvetica').text(`Order ID: ${order.orderId}`);
    doc.text(`Order Date: ${order.createdAt.toDateString()}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text(`Total Amount: ₹${order.totalAmount.toFixed(2)}`);
    doc.moveDown(1.5);

    // Calculate total discount for the order
    let totalDiscount = 0;
    order.items.forEach(item => {
        totalDiscount += item.discountApplied;
    });

    doc.text(`Total Discount Applied: ₹${totalDiscount.toFixed(2)}`);
    doc.moveDown(1.5);

    // Shipping Address Section
    doc.fontSize(12).font('Helvetica-Bold').text('Shipping Address:', { underline: true });
    doc.font('Helvetica').text(`Name: ${order.shippingAddress.fullName || 'Not Provided'}`);
    doc.text(`Address: ${order.shippingAddress.address || 'Not Provided'}`);
    doc.text(`City: ${order.shippingAddress.city || 'Not Provided'}`);
    doc.text(`State: ${order.shippingAddress.state || 'Not Provided'}`);
    doc.text(`Pincode: ${order.shippingAddress.pincode || 'Not Provided'}`);
    doc.moveDown(1.5);

    // Horizontal Line
    doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke('#cccccc');
    doc.moveDown(1.5);

    // Order Items Section
    doc.fontSize(12).font('Helvetica-Bold').text('Order Items:', { underline: true });
    order.items.forEach((item, index) => {
        doc
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${item.productId.name}`, { continued: true })
            .font('Helvetica')
            .text(` -- Quantity: ${item.quantity}, Size: ${item.size}, Price: ₹${item.price}, Total: ₹${item.total.toFixed(2)}, Discount: ₹${item.discountApplied.toFixed(2)}`);
    });
    doc.moveDown(2);

    // Footer Section
    doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#333333')
        .text('Thank you for shopping with us!', { align: 'center' });

    // Finalize the PDF and end the stream
    doc.end();
};



module.exports = generateInvoice;
