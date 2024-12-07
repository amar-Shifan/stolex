const Category = require('../../model/categorySchema');
const Brand = require('../../model/brandSchema');

    const categoryController = {
        createCategory: async (req, res) => {
            try {
                console.log("entered in controller .......")

                const { name, description, parentCategory, status, type } = req.body;
                console.log('name',name,'des',description,'parent',parentCategory,'stat',status,type)
                console.log('working');
                
                // Check if category with same name exists
                const existingCategory = await Category.findOne({name});
                console.log("existingCategory",existingCategory)
                if (existingCategory) {
                    return res.status(400).json({
                        success: false,
                        message: 'Category with this name already exists'
                    });
                }

                let categoryData = {
                    name,
                    description,
                    status: status || 'Active',
                    level: type === 'subcategory' ? 1 : 0
                };
                console.log('categorydata',categoryData);
                

                // If it's a subcategory, validate and add parent category
                if (type === 'subcategory') {
                    console.log("entered sub");
                    
                    if (!parentCategory) {
                        return res.status(400).json({
                            success: false,
                            message: 'Parent category is required for subcategories'
                        });
                    }
                    console.log('working');
                    

                    // Verify parent category exists
                    const parentCategoryDoc = await Category.findOne({_id:parentCategory})
                    console.log('verify parent',parentCategoryDoc);
                    
                    if (!parentCategoryDoc) {
                        return res.status(400).json({
                            success: false,
                            message: 'Parent category not found'
                        });
                    }

                    console.log('still working ');
                    
                    if (parentCategoryDoc.level !== 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Cannot create subcategory under another subcategory'
                        });
                    }

                    categoryData.parentCategory = parentCategoryDoc.name;
                    console.log('saved' ,categoryData);
                }

                console.log('working',categoryData);
                
                const newCategory = new Category(categoryData);
            
                console.log('saved' ,newCategory);
                await newCategory.save();
                console.log('saved');
                
                

                res.status(201).json({
                    success: true,
                    message: `${type === 'subcategory' ? 'Subcategory' : 'Category'} created successfully`,
                    category: newCategory
                });
                console.log('working');
                

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Error creating category',
                    error: error.message
                });
            }
        },

        // Get all main categories
        getMainCategories: async (req, res) => {
            try {
                const { search, status } = req.query; 
        
                let filter = {}; 
        
             
                if (search) {
                    filter.name = { $regex: search, $options: 'i' }; 
                }
        
             
                if (status) {
                    filter.status = status;
                }
        
                const categories = await Category.find(filter)
                    .select('name description status parentCategory level');
        
                res.render('admin/category', {
                    success: true,
                    categories
                });
            } catch (error) {
                res.render('admin/category', {
                    success: false,
                    message: 'Error fetching categories',
                    error: error.message
                });
            }
        }
        ,

         
        updateCategory: async (req, res) => {
            try {
                console.log("Working ......");
                const { categoryId, name, description, status, isListed } = req.body;
        
                // Check if category exists
                const category = await Category.findById(categoryId);
                if (!category) {
                    return res.status(404).json({
                        success: false,
                        message: 'Category not found'
                    });
                }
        
                // If name is being updated, check for duplicates
                if (name && name !== category.name) {
                    const existingCategory = await Category.findOne({ name });
                    if (existingCategory) {
                        return res.status(400).json({
                            success: false,
                            message: 'Category with this name already exists'
                        });
                    }
                }
        
                // Update the category fields
                const updates = { name, description, status };
                if (typeof isListed !== 'undefined') {
                    updates.isListed = isListed; // Update isListed if provided
                }
        
                const updatedCategory = await Category.findByIdAndUpdate(
                    categoryId,
                    updates,
                    { new: true, runValidators: true }
                );
        
                res.status(200).json({
                    success: true,
                    message: 'Category updated successfully',
                    category: updatedCategory
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: 'Error updating category',
                    error: error.message
                });
            }
        },
        
        addBrand: async (req,res)=>{
            try {
                const { name, description, category } = req.body;
        
                if (!name || !category) {
                    return res.status(400).json({
                        success: false,
                        message: 'Name and category are required fields.',
                    });
                }
                
                const existingBrand = await Brand.findOne({ name });

                if (existingBrand) {
                    // Check if this brand is already associated with the given category
                    const existBrandInCategory = await Category.findOne({
                        _id: category,
                        brands: existingBrand._id, // Check if the brand ID exists in the category
                    });

                    if (existBrandInCategory) {
                        return res.status(400).json({ 
                            success: false, 
                            message: "This brand name already exists in the category." 
                        });
                    }

                    // If the brand exists but is not associated with the category, add it
                    await Category.findByIdAndUpdate(
                        category,
                        { $push: { brands: existingBrand._id } },
                        { new: true }
                    );

                    return res.status(200).json({ success: true, message: "Brand added to the category successfully." });
                }

                // If the brand does not exist, create it
                const brand = new Brand({ name, description });
                await brand.save();

                // Add the new brand to the category
                await Category.findByIdAndUpdate(
                    category,
                    { $push: { brands: brand._id } },
                    { new: true }
                );

                return res.status(200).json({ success: true, message: "Brand created and added to the category successfully." });
            } catch (error) {
                console.error('Error in addBrand:', error);
                res.status(500).json({
                    success: false,
                    message: 'Server error occurred while adding the brand.',
                });
            }
        }

    };

    module.exports = categoryController;