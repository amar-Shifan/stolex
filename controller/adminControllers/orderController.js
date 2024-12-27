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
        console.log(error);
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
        console.log(error);
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

            description = `Refund for Order #${orderId}`;
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

const approveCancel = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (itemId) {
            // Approve cancel request for a specific item
            const item = order.items.find(item => item._id.toString() === itemId);
            if (!item) {
                return res.status(404).json({ success: false, message: 'Item not found' });
            }

            if (item.status !== 'cancel-request') {
                return res.status(400).json({ success: false, message: 'No cancel request for this item' });
            }

            item.status = 'Cancelled'; // Update item status
        } else {
            // Approve cancel request for the entire order
            if (order.orderStatus !== 'cancel-request') {
                return res.status(400).json({ success: false, message: 'No cancel request for this order' });
            }

            order.orderStatus = 'cancelled';
            order.items.forEach(item => {
                if (item.status === 'cancel-request') {
                    item.status = 'Cancelled';
                }
            });
        }

        await order.save();
        return res.status(200).json({ success: true, message: 'Cancel request approved successfully', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const rejectCancel = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;

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

            item.status = 'Processing'; // Reset status or leave it unchanged
        } else {
            // Reject cancel request for the entire order
            if (order.orderStatus !== 'cancel-request') {
                return res.status(400).json({ success: false, message: 'No cancel request for this order' });
            }

            order.orderStatus = 'Processing'; // Reset status or leave it unchanged
            order.items.forEach(item => {
                if (item.status === 'cancel-request') {
                    item.status = 'Processing';
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
  
      let filter = {};
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

        let query = {};
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

        const tableTop = 220; 
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

        // Draw Cell 
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

            // Calculate total discount for each order
            const totalDiscountApplied = order.items.reduce((sum, item) => {
                return sum + (item.discountApplied || 0);
            }, 0);

            const rowData = [
                index + 1,
                order._id,
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

            // Page Break
            if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                y = tableTop;

                // Redraw headers
                x = doc.page.margins.left;
                headers.forEach((header) => {
                    drawCell(x, y, columnWidth, defaultRowHeight, header, { bold: true });
                    x += columnWidth;
                });
                y += defaultRowHeight;
            }
        });

        // Footer Section with Total Information
        doc.moveDown(2);
        doc.font('Helvetica-Bold').fontSize(14).text('Report Summary:', { underline: true });
        doc.font('Helvetica').fontSize(12).text(`Total Orders: ${totalOrders}`, { align: 'left' });
        doc.font('Helvetica').fontSize(12).text(`Total Revenue: $${totalRevenue.toFixed(2)}`, { align: 'left' });
        doc.font('Helvetica').fontSize(12).text(`Total Discount Given: $${totalDiscount.toFixed(2)}`, { align: 'left' });

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

        let query = {};
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
        let totalOrders = orders.length;
        let totalRevenue = 0;
        let totalDiscount = 0;

        orders.forEach((order) => {
            totalRevenue += order.totalAmount || 0;
            const totalDiscountApplied = order.items.reduce((sum, item) => {
                return sum + (item.discountApplied || 0);
            }, 0);
            totalDiscount += totalDiscountApplied;
        });

        // Add Summary First (Above the Table Header)
        worksheet.addRow([]);
        worksheet.addRow(['Total Orders', totalOrders, 'Total Revenue', `$${totalRevenue.toFixed(2)}`, 'Total Discount Given', `$${totalDiscount.toFixed(2)}`]);
        worksheet.getRow(2).font = { bold: true };
        worksheet.getRow(2).alignment = { horizontal: 'center' };

        // Add a blank row after the summary
        worksheet.addRow([]);

        // Add Headers for the Detailed Report
        worksheet.columns = [
            { header: '#', key: 'index', width: 5 },
            { header: 'Order ID', key: 'orderId', width: 30 },
            { header: 'User', key: 'user', width: 15 },
            { header: 'Order Status', key: 'orderStatus', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 15 },
            { header: 'Payment Status', key: 'paymentStatus', width: 15 },
            { header: 'Total Amount', key: 'totalAmount', width: 15 },
            { header: 'Discount', key: 'discount', width: 15 },
        ];

        // Add Rows for Detailed Orders
        orders.forEach((order, index) => {
            const totalDiscountApplied = order.items.reduce((sum, item) => {
                return sum + (item.discountApplied || 0);
            }, 0);

            worksheet.addRow({
                index: index + 1,
                orderId: order._id.toString(),
                user: order.userId?.username || 'N/A',
                orderStatus: order.orderStatus || 'N/A',
                paymentMethod: order.paymentMethod || 'N/A',
                paymentStatus: order.paymentStatus || 'N/A',
                totalAmount: `$${order.totalAmount?.toFixed(2) || '0.00'}`,
                discount: `$${totalDiscountApplied.toFixed(2) || '0.00'}`,
            });
        });

        // Style Headers
        worksheet.getRow(1).font = { bold: true };

        // Set response headers for Excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');

        // Write Excel to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to generate Excel report');
    }
};

module.exports ={ getOrders ,getOrderDetails ,changeStatus ,approveReturn ,rejectReturn ,getSalesReport 
                ,generateSalesReportPDF ,generateSalesReportExcel , approveCancel,
                rejectCancel};