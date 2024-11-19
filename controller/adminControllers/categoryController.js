const Category = require('../../model/categorySchema');

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
                console.log("working ......")
                const { categoryId , name, description, status } = req.body;
                

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

                const updatedCategory = await Category.findByIdAndUpdate(
                    categoryId,
                    { name, description, status },
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

    };

    module.exports = categoryController;