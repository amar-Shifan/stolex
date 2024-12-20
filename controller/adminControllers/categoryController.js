//Category Controllers
const Category = require('../../model/categorySchema');
const Brand = require('../../model/brandSchema');

const categoryController = {
        // Create Category Controller
        createCategory: async (req, res) => {
            try {
                const { name, description, parentCategory, status, type } = req.body;
                
                const existingCategory = await Category.findOne({name});
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
                
                if (type === 'subcategory') {
                    console.log("entered sub");
                    
                    if (!parentCategory) {
                        return res.status(400).json({
                            success: false,
                            message: 'Parent category is required for subcategories'
                        });
                    }
                    console.log('working');
                    
                    const parentCategoryDoc = await Category.findOne({_id:parentCategory})
                    console.log('verify parent',parentCategoryDoc);
                    
                    if (!parentCategoryDoc) {
                        return res.status(400).json({
                            success: false,
                            message: 'Parent category not found'
                        });
                    }

                    
                    if (parentCategoryDoc.level !== 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Cannot create subcategory under another subcategory'
                        });
                    }

                    categoryData.parentCategory = parentCategoryDoc.name;
                }

                
                const newCategory = new Category(categoryData);
            
                await newCategory.save();

                res.status(201).json({
                    success: true,
                    message: `${type === 'subcategory' ? 'Subcategory' : 'Category'} created successfully`,
                    category: newCategory
                });
                

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

        // Update Category Controller
        updateCategory: async (req, res) => {
            try {
                const { categoryId, name, description, status, isListed } = req.body;
        
                const category = await Category.findById(categoryId);
                if (!category) {
                    return res.status(404).json({
                        success: false,
                        message: 'Category not found'
                    });
                }
        
                if (name && name !== category.name) {
                    const existingCategory = await Category.findOne({ name });
                    if (existingCategory) {
                        return res.status(400).json({
                            success: false,
                            message: 'Category with this name already exists'
                        });
                    }
                }
        
                const updates = { name, description, status };
                if (typeof isListed !== 'undefined') {
                    updates.isListed = isListed; 
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
        
        //Add Brand Controller 
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
                    const existBrandInCategory = await Category.findOne({
                        _id: category,
                        brands: existingBrand._id, 
                    });

                    if (existBrandInCategory) {
                        return res.status(400).json({ 
                            success: false, 
                            message: "This brand name already exists in the category." 
                        });
                    }

                    await Category.findByIdAndUpdate(
                        category,
                        { $push: { brands: existingBrand._id } },
                        { new: true }
                    );

                    return res.status(200).json({ success: true, message: "Brand added to the category successfully." });
                }

                const brand = new Brand({ name, description });
                await brand.save();

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