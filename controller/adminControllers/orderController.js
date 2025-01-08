// Order Controllers 
const Order = require('../../model/ordersSchema');
const Wallet = require('../../model/walletSchema');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');


const getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query; // Get page and limit from query params

        const ordersCount = await Order.countDocuments(); // Get total number of orders
        const orders = await Order.find({})
            .populate('items.productId')
            .populate('userId')
            .sort({ createdAt: -1 }) // Sort by most recent
            .skip((page - 1) * limit) // Skip documents for previous pages
            .limit(Number(limit)); // Limit results for the current page

        const totalPages = Math.ceil(ordersCount / limit);

        res.render('admin/orders', {
            orders,
            currentPage: Number(page),
            totalPages,
            limit: Number(limit),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Something went wrong!' });
    }
};


// Render Order Details page Controller
const getOrderDetails = async(req,res)=>{
    try {
        const id = req.params.id;
        if(!id) return res.status(400).json({success:false , message:'Order id not found'});

        const order = await Order.findOne({ _id: id })
                            .populate('items.productId')
                            .populate('shippingAddress');

        if(!order) return res.status(400).json({success:false , message:'Order not found'});

        res.render('admin/order-view' ,{order});

    } catch (error) {
        res.status(500).json({success:true , message : 'Something went wrong!'})
    }
}

// Change OrderStatus Controller
const changeStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { orderStatus } = req.body;
    
        if (!orderStatus) {
            return res.status(400).json({ success: false, message: "Order status is required" });
        }
    
        if (!id) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }
    
        const order = await Order.findById(id);
    
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
    
        order.orderStatus = orderStatus;
    
        if (orderStatus === 'delivered') {
            order.paymentStatus = 'success';
        }
    
        await order.save();
    
        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Something went wrong!" });
    }
};

// Approve Return Controller
const approveReturn = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        let refundAmount = 0;
        let description = '';

        if (itemId) {
            const itemIndex = order.items.findIndex((item) => item._id.toString() === itemId);
            if (itemIndex === -1) {
                return res.status(404).json({ success: false, message: 'Item not found in the order' });
            }

            const item = order.items[itemIndex];
            if (item.status === 'Cancelled' || item.status === 'Returned') {
                return res.status(400).json({ success: false, message: 'Item is already canceled or returned' });
            }

            refundAmount = item.refundAmount; 
            description = `Refund for item in Order #${orderId}`;

            order.items[itemIndex].status = 'Returned';
            order.items[itemIndex].refundAmount = refundAmount;

            const allReturned = order.items.every((item) => item.status === 'Returned');
            if (allReturned) {
                order.orderStatus = 'returned';
            }

        } else {
            order.items.forEach((item) => {
                if (item.status !== 'Cancelled' && item.status !== 'Returned') {
                    refundAmount += item.refundAmount; 
                    item.status = 'Returned';
                }
            });

            description = `Refund for Order #${order.orderId}`;
            order.orderStatus = 'returned';
        }

        await order.save();

        let wallet = await Wallet.findOne({ userId: order.userId });
        if (!wallet) {
            wallet = new Wallet({
                userId: order.userId,
                amount: 0,
                transactionHistory: [],
            });
        }

        wallet.amount += refundAmount; 
        wallet.transactionHistory.push({
            type: 'credit',
            amount: refundAmount,
            description,
            date: new Date(),
        });

        await wallet.save();

        res.json({
            success: true,
            message: `Refund of ${refundAmount} processed successfully.`,
            refundAmount,
        });
    } catch (error) {
        console.error('Error processing return:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Reject Return Controller
const rejectReturn = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;

        if (itemId) {
            await Order.updateOne(
                { _id: orderId, "items._id": itemId },
                {
                    $set: {
                        "items.$.status": "delivered",
                        "items.$.returnReason": "", 
                    },
                }
            );
        } else {
            
            await Order.updateOne(
                { _id: orderId },
                {
                    $set: {
                        orderStatus: "delivered",
                        "items.$[].status": "delivered", 
                        "items.$[].returnReason": "", 
                    },
                }
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Cancel Controllers
// Approve Cancel Controller
const approveCancel = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;

        // Find the order by ID
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        let refundAmount = 0;
        let description = '';

        if (itemId) {
            // Approve cancel request for a specific item
            const itemIndex = order.items.findIndex(item => item._id.toString() === itemId);
            if (itemIndex === -1) {
                return res.status(404).json({ success: false, message: 'Item not found' });
            }

            const item = order.items[itemIndex];
            if (item.status !== 'cancel-request') {
                return res.status(400).json({ success: false, message: 'No cancel request for this item' });
            }

            refundAmount = item.refundAmount; // Get the refund amount stored in the item
            description = `Refund for item in Order #${orderId}`;

            order.items[itemIndex].status = 'Cancelled'; // Update item status
            order.items[itemIndex].refundAmount = refundAmount; // Store the refund amount

            const allCancelled = order.items.every(item => item.status === 'Cancelled');
            if (allCancelled) {
                order.orderStatus = 'cancelled';
            }

        } else {
            // Approve cancel request for the entire order
            if (order.orderStatus !== 'cancel-request') {
                return res.status(400).json({ success: false, message: 'No cancel request for this order' });
            }

            order.items.forEach(item => {
                if (item.status === 'cancel-request') {
                    refundAmount += item.refundAmount; // Add refund amount for each canceled item
                    item.status = 'Cancelled';
                    item.refundAmount = item.refundAmount; // Store the refund amount
                }
            });

            description = `Refund for Order #${order.orderId}`;
            order.orderStatus = 'cancelled';
        }

        // Save the updated order
        await order.save();

        // Only process the refund if the payment was successful
        if (order.paymentStatus === 'success' && refundAmount > 0) {
            let wallet = await Wallet.findOne({ userId: order.userId });
            if (!wallet) {
                wallet = new Wallet({
                    userId: order.userId,
                    amount: 0,
                    transactionHistory: [],
                });
            }

            wallet.amount += refundAmount; // Add refund to wallet
            wallet.transactionHistory.push({
                type: 'credit',
                amount: refundAmount,
                description,
                date: new Date(),
            });

            // Save the updated wallet
            await wallet.save();
        }

        return res.status(200).json({
            success: true,
            message: `Cancel request approved successfully. Refund of ${refundAmount} processed.`,
            refundAmount,
            order,
        });

    } catch (error) {
        console.error('Error approving cancel request:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Reject Cancel Cotroller
const rejectCancel = async (req, res) => {
    try {
        const { orderId , itemId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (itemId) {
            // Reject cancel request for a specific item
            const item = order.items.find(item => item._id.toString() === itemId);
            if (!item) {
                return res.status(404).json({ success: false, message: 'Item not found' });
            }

            if (item.status !== 'cancel-request') {
                return res.status(400).json({ success: false, message: 'No cancel request for this item' });
            }

            item.status = 'Pending'; // Reset status or leave it unchanged
        } else {
            // Reject cancel request for the entire order
            if (order.orderStatus !== 'cancel-request') {
                return res.status(400).json({ success: false, message: 'No cancel request for this order' });
            }

            order.orderStatus = 'pending'; // Reset status or leave it unchanged
            order.items.forEach(item => {
                if (item.status === 'cancel-request') {
                    item.status = 'Pending';
                }
            });
        }

        await order.save();
        return res.status(200).json({ success: true, message: 'Cancel request rejected successfully', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Render Sales Report page Controller
const getSalesReport = async (req, res) => {
    try {
      const { timeRange, startDate, endDate, page = 1, limit = 10 } = req.query;
  
      let filter = {paymentStatus: 'success'};
      const now = new Date();
  
      // Filter logic
      if (timeRange === '1_day') {
        const oneDayAgo = new Date(now);
        oneDayAgo.setDate(now.getDate() - 1);
        filter.createdAt = { $gte: oneDayAgo, $lte: now };
      } else if (timeRange === '1_week') {
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        filter.createdAt = { $gte: oneWeekAgo, $lte: now };
      } else if (timeRange === '1_month') {
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(now.getMonth() - 1);
        filter.createdAt = { $gte: oneMonthAgo, $lte: now };
      } else if (timeRange === 'custom') {
        if (startDate && endDate) {
          filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
      }
  
      const pageInt = parseInt(page, 10);
      const limitInt = parseInt(limit, 10);
      
      const orderLength = await Order.find(filter);

       // Fetch total amount and total refund amount using aggregation
    const totalAmounts = await Order.aggregate([
        { $match: filter },
        {
            $project: {
                items: 1, // Include only the items array
            }
        },
        {
            $unwind: '$items'  // Flatten the items array
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$items.total" },
                totalRefundAmount: { $sum: "$items.refundAmount" },
                totalDiscount: { $sum: "$items.discountApplied" }  // Sum of all discountApplied values
            }
        }
    ]);

    const totalAmount = totalAmounts.length > 0 ? totalAmounts[0].totalAmount : 0;
    const totalDiscount = totalAmounts.length > 0 ? totalAmounts[0].totalDiscount : 0;

      // Fetch paginated results
      const orders = await Order.find(filter)
        .populate('userId')
        .populate('items.productId')
        .skip((pageInt - 1) * limitInt)
        .limit(limitInt);
  
      const totalOrders = await Order.countDocuments(filter);
  
      const totalPages = Math.ceil(totalOrders / limitInt);
  
      res.render('admin/sales-report', {
        orders,
        timeRange,
        startDate,
        endDate,
        currentPage: pageInt,
        totalPages,
        limit: limitInt,
        orderLength,
        totalAmount,  
        totalDiscount
      });
    } catch (error) {
      console.error('Error fetching sales report:', error);
      res.render('user/error', { message: 'Error fetching sales report!' });
    }
  };
  

// Generate SalesReport PDF Controller 
const generateSalesReportPDF = async (req, res) => {
    try {
        const { timeRange, startDate, endDate } = req.query;

        let query = { paymentStatus: 'success' };
        if (timeRange === 'custom' && startDate && endDate) {
            query = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            };
        } else if (timeRange === '1_day') {
            query = { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } };
        }

        const orders = await Order.find(query).populate('userId');

        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');

        doc.pipe(res);

        // Title and Time Range Section
        doc.font('Helvetica-Bold').fontSize(18).text('Detailed Sales Report', { align: 'center' });
        doc.moveDown(1.5);

        const timeRangeText = timeRange === 'custom' ? `From ${startDate} to ${endDate}` : timeRange === '1_day' ? 'Last 24 hours' : 'All Time';
        doc.font('Helvetica').fontSize(12).text(`Time Range: ${timeRangeText}`, { align: 'center' });
        doc.moveDown(1.5);

        // Summary of Sales Report
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const totalDiscount = orders.reduce((sum, order) => {
            return sum + order.items.reduce((itemSum, item) => itemSum + (item.discountApplied || 0), 0);
        }, 0);

        doc.font('Helvetica-Bold').fontSize(14).text('Sales Summary', { underline: true });
        doc.font('Helvetica').fontSize(12).text(`Total Orders: ${totalOrders}`, { align: 'left' });
        doc.font('Helvetica').fontSize(12).text(`Total Revenue: $${totalRevenue.toFixed(2)}`, { align: 'left' });
        doc.font('Helvetica').fontSize(12).text(`Total Discount Given: $${totalDiscount.toFixed(2)}`, { align: 'left' });
        doc.moveDown(2);

        // Table Header and Content
        const tableTop = doc.y; // Updated to follow after summary
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const columnCount = 8;
        const columnWidth = pageWidth / columnCount;
        const defaultRowHeight = 30;

        const headers = [
            '#',
            'Order ID',
            'User',
            'Order Status',
            'Payment Method',
            'Payment Status',
            'Total Amount',
            'Discount',
        ];

        let y = tableTop;

        const calculateRowHeight = (rowData) => {
            let maxHeight = defaultRowHeight;
            rowData.forEach((text) => {
                const textHeight = doc.heightOfString(text, { width: columnWidth - 10 });
                if (textHeight > maxHeight) maxHeight = textHeight + 10;
            });
            return maxHeight;
        };

        const drawCell = (x, y, width, height, text, options = {}) => {
            doc.rect(x, y, width, height).stroke();
            doc.font(options.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
            doc.text(text, x + 5, y + 5, {
                width: width - 10,
                align: 'center',
            });
        };

        // Draw Headers
        let x = doc.page.margins.left;
        headers.forEach((header) => {
            drawCell(x, y, columnWidth, defaultRowHeight, header, { bold: true });
            x += columnWidth;
        });
        y += defaultRowHeight;

        // Draw Rows
        orders.forEach((order, index) => {
            x = doc.page.margins.left;

            const totalDiscountApplied = order.items.reduce((sum, item) => {
                return sum + (item.discountApplied || 0);
            }, 0);

            const rowData = [
                index + 1,
                order.orderId,
                order.userId?.username || 'N/A',
                order.orderStatus || 'N/A',
                order.paymentMethod || 'N/A',
                order.paymentStatus || 'N/A',
                `$${order.totalAmount?.toFixed(2) || '0.00'}`,
                `$${totalDiscountApplied.toFixed(2) || '0.00'}`,
            ];

            const rowHeight = calculateRowHeight(rowData);

            rowData.forEach((data) => {
                drawCell(x, y, columnWidth, rowHeight, data);
                x += columnWidth;
            });

            y += rowHeight;

            if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                y = tableTop;

                x = doc.page.margins.left;
                headers.forEach((header) => {
                    drawCell(x, y, columnWidth, defaultRowHeight, header, { bold: true });
                    x += columnWidth;
                });
                y += defaultRowHeight;
            }
        });

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to generate report');
    }
};



// Generate SalesReport Excel Controller 
const generateSalesReportExcel = async (req, res) => {
    try {
        const { timeRange, startDate, endDate } = req.query;

        let query = { paymentStatus: 'success' };
        if (timeRange === 'custom' && startDate && endDate) {
            query = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            };
        } else if (timeRange === '1_day') {
            query = { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } };
        }

        const orders = await Order.find(query).populate('userId');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Calculate Summary Data
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const totalDiscount = orders.reduce((sum, order) => {
            return sum + order.items.reduce((itemSum, item) => itemSum + (item.discountApplied || 0), 0);
        }, 0);

        // Add Title
        worksheet.mergeCells('A1', 'H1');
        worksheet.getCell('A1').value = 'Sales Report';
        worksheet.getCell('A1').font = { bold: true, size: 16 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        // Add Summary Section
        worksheet.addRow([]); // Blank row for spacing
        const summaryRow = worksheet.addRow([
            'Summary:', 
            '', '', 
            'Total Orders:', totalOrders, 
            '', 
            'Total Revenue:', `₹${totalRevenue.toFixed(2)}`
        ]);
        summaryRow.font = { bold: true };
        summaryRow.alignment = { vertical: 'middle' };
        
        const discountRow = worksheet.addRow([
            '', '', '', 
            'Total Discount Given:', `₹${totalDiscount.toFixed(2)}`
        ]);
        discountRow.font = { bold: true };

        worksheet.addRow([]); // Blank row for spacing

        // Add Headers
        worksheet.columns = [
            { header: '#', key: 'index', width: 5 },
            { header: 'Order ID', key: 'orderId', width: 25 },
            { header: 'User', key: 'user', width: 20 },
            { header: 'Order Status', key: 'orderStatus', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 15 },
            { header: 'Payment Status', key: 'paymentStatus', width: 15 },
            { header: 'Total Amount', key: 'totalAmount', width: 15 },
            { header: 'Discount', key: 'discount', width: 15 },
        ];

        const headerRow = worksheet.getRow(worksheet.lastRow.number);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

        // Add Rows for Orders
        orders.forEach((order, index) => {
            const totalDiscountApplied = order.items.reduce((sum, item) => sum + (item.discountApplied || 0), 0);

            worksheet.addRow({
                index: index + 1,
                orderId: order.orderId,
                user: order.userId?.username || 'N/A',
                orderStatus: order.orderStatus || 'N/A',
                paymentMethod: order.paymentMethod || 'N/A',
                paymentStatus: order.paymentStatus || 'N/A',
                totalAmount: `₹${order.totalAmount?.toFixed(2) || '0.00'}`,
                discount: `₹${totalDiscountApplied.toFixed(2) || '0.00'}`,
            });
        });

        // Align all columns
        worksheet.eachRow((row, rowNumber) => {
            row.alignment = { vertical: 'middle', horizontal: 'left' };
            if (rowNumber > 1 && rowNumber <= worksheet.lastRow.number) {
                row.font = { bold: rowNumber === 3 || rowNumber === 4 }; // Bold for summary rows
            }
        });

        // Ensure column widths are proper and visible
        worksheet.columns.forEach((column) => {
            const maxLength = column.values.reduce((acc, cur) => {
                return Math.max(acc, cur ? cur.toString().length : 10);
            }, column.width);
            column.width = maxLength + 2; // Add padding for visibility
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');

        // Write Excel file to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).send('Failed to generate Excel report');
    }
};


module.exports ={ getOrders ,getOrderDetails ,changeStatus ,approveReturn ,rejectReturn ,getSalesReport 
                ,generateSalesReportPDF ,generateSalesReportExcel , approveCancel,
                rejectCancel};